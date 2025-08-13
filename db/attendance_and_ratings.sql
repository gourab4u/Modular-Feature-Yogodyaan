-- ================================================
-- Attendance, Ratings, Payout Support Schema (Supabase/Postgres)
-- ================================================
-- Assumptions:
-- 1. Existing enum payment_status already includes 'pending' and 'paid' (extend if needed).
-- 2. Roles infrastructure: user_roles(role, user_id) or similar. Adjust is_admin() / is_super_admin() as needed.
-- 3. class_assignments currently exists (DDL provided by user). We add supplemental columns (non-breaking).
-- 4. Manual payout override required: add override_payment_amount. Final amount resolved in views.
-- 5. Attendance lock: 30 minutes after scheduled end (computed using date + end_time + timezone).
-- 6. No-show payout rule (initial recommendation):
--    - If class_status = 'not_conducted' => payout 0 unless override_payment_amount set.
--    - Otherwise full payout (instructor prepared) irrespective of individual attendance.
--    - Fine-grained rules can later be encoded in a payout calculation function.
-- 7. Makeup / reschedule support via reference columns inside attendance & assignments.
-- 8. Ratings 1-5, member may update (last value kept).
-- 9. Members can only rate if their attendance status in ('present','late','makeup_completed') and class already ended.
-- 10. This script is idempotent where possible (IF NOT EXISTS).

-- ================================================
-- Helper: Admin role detection (Adjust logic to your schema)
-- ================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin','super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'super_admin'
  );
$$;

-- ================================================
-- ENUMS
-- ================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN
    CREATE TYPE public.attendance_status_enum AS ENUM (
      'present',
      'late',
      'absent_excused',
      'absent_unexcused',
      'no_show',
      'canceled_by_student',
      'canceled_by_instructor',
      'makeup_scheduled',
      'makeup_completed'
    );
  END IF;
END$$;

-- (Optional) Extend payment_status enum if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    -- Add values if they do not exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='approved' AND enumtypid = 'payment_status'::regtype) THEN
      ALTER TYPE public.payment_status ADD VALUE 'approved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='reversed' AND enumtypid = 'payment_status'::regtype) THEN
      ALTER TYPE public.payment_status ADD VALUE 'reversed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='withheld' AND enumtypid = 'payment_status'::regtype) THEN
      ALTER TYPE public.payment_status ADD VALUE 'withheld';
    END IF;
  END IF;
END$$;

-- ================================================
-- Schema Changes to class_assignments
-- ================================================
ALTER TABLE public.class_assignments
  ADD COLUMN IF NOT EXISTS override_payment_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS attendance_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS actual_start_time timestamptz,
  ADD COLUMN IF NOT EXISTS actual_end_time timestamptz,
  ADD COLUMN IF NOT EXISTS rescheduled_to_id uuid NULL,
  ADD COLUMN IF NOT EXISTS rescheduled_from_id uuid NULL;

-- Self-referencing FK for reschedules (deferred so both rows can be created)
ALTER TABLE public.class_assignments
  ADD CONSTRAINT class_assignments_rescheduled_to_fk
    FOREIGN KEY (rescheduled_to_id)
    REFERENCES public.class_assignments(id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.class_assignments
  ADD CONSTRAINT class_assignments_rescheduled_from_fk
    FOREIGN KEY (rescheduled_from_id)
    REFERENCES public.class_assignments(id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS idx_class_assignments_reschedule_chain
  ON public.class_assignments (rescheduled_from_id, rescheduled_to_id);

-- ================================================
-- Attendance Table
-- ================================================
CREATE TABLE IF NOT EXISTS public.class_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.class_assignments(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.attendance_status_enum NOT NULL,
  notes text,
  marked_by uuid NOT NULL DEFAULT auth.uid(),
  marked_at timestamptz NOT NULL DEFAULT now(),
  makeup_of_assignment_id uuid NULL REFERENCES public.class_assignments(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_class_attendance_assignment ON public.class_attendance(assignment_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_member ON public.class_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_status ON public.class_attendance(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_class_attendance_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_class_attendance_updated_at ON public.class_attendance;
CREATE TRIGGER trg_class_attendance_updated_at
BEFORE UPDATE ON public.class_attendance
FOR EACH ROW
EXECUTE FUNCTION public.set_class_attendance_updated_at();

-- ================================================
-- Ratings Table (Assignment-scoped)
-- ================================================
CREATE TABLE IF NOT EXISTS public.class_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.class_assignments(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_class_ratings_assignment ON public.class_ratings(assignment_id);
CREATE INDEX IF NOT EXISTS idx_class_ratings_member ON public.class_ratings(member_id);
CREATE INDEX IF NOT EXISTS idx_class_ratings_rating ON public.class_ratings(rating);

CREATE OR REPLACE FUNCTION public.set_class_ratings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_class_ratings_updated_at ON public.class_ratings;
CREATE TRIGGER trg_class_ratings_updated_at
BEFORE UPDATE ON public.class_ratings
FOR EACH ROW
EXECUTE FUNCTION public.set_class_ratings_updated_at();

-- ================================================
-- Payout Calculation View
-- ================================================
-- final_payment_amount chooses override if present, else payment_amount.
CREATE OR REPLACE VIEW public.class_assignment_financials AS
SELECT
  ca.id,
  ca.instructor_id,
  ca.date,
  ca.start_time,
  ca.end_time,
  ca.schedule_type,
  ca.class_status,
  ca.payment_status,
  ca.payment_amount,
  ca.override_payment_amount,
  COALESCE(ca.override_payment_amount, ca.payment_amount) AS final_payment_amount
FROM public.class_assignments ca;

-- ================================================
-- Instructor Upcoming Classes (next 60 days) View
-- ================================================
CREATE OR REPLACE VIEW public.instructor_upcoming_classes_v AS
SELECT
  ca.id AS assignment_id,
  ca.instructor_id,
  ca.date,
  ca.start_time,
  ca.end_time,
  ca.schedule_type,
  ca.class_status,
  ca.payment_status,
  ca.payment_amount,
  ca.override_payment_amount,
  COALESCE(ca.override_payment_amount, ca.payment_amount) AS final_payment_amount,
  ca.timezone,
  ca.attendance_locked,
  COALESCE(SUM( (att.status IN ('present','late','makeup_completed'))::int ), 0) AS present_count,
  COALESCE(SUM( (att.status = 'no_show')::int ), 0) AS no_show_count,
  COALESCE(AVG(NULLIF(cr.rating,0)), 0) AS avg_rating,
  COUNT(cr.id) AS rating_count
FROM public.class_assignments ca
LEFT JOIN public.class_attendance att ON att.assignment_id = ca.id
LEFT JOIN public.class_ratings cr ON cr.assignment_id = ca.id
WHERE ca.date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days')
GROUP BY ca.id;

-- ================================================
-- Admin Class Overview View
-- ================================================
CREATE OR REPLACE VIEW public.admin_class_overview_v AS
SELECT
  ca.id AS assignment_id,
  ca.instructor_id,
  ca.date,
  ca.start_time,
  ca.end_time,
  ca.class_status,
  ca.payment_status,
  COALESCE(ca.override_payment_amount, ca.payment_amount) AS final_payment_amount,
  COUNT(att.id) FILTER (WHERE att.status IN ('present','late','makeup_completed')) AS attended_count,
  COUNT(att.id) FILTER (WHERE att.status = 'no_show') AS no_show_count,
  COUNT(att.id) FILTER (WHERE att.status IN ('absent_excused','absent_unexcused')) AS absent_count,
  AVG(cr.rating) AS avg_rating,
  COUNT(cr.id) AS ratings_submitted
FROM public.class_assignments ca
LEFT JOIN public.class_attendance att ON att.assignment_id = ca.id
LEFT JOIN public.class_ratings cr ON cr.assignment_id = ca.id
GROUP BY ca.id;

-- ================================================
-- Attendance Locking Function & Scheduled Process
-- ================================================
CREATE OR REPLACE FUNCTION public.lock_past_class_attendance()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.class_assignments ca
  SET attendance_locked = true
  WHERE attendance_locked = false
    AND (
      (
        -- Construct naive timestamp (date + end_time) then interpret in stored timezone
        ((ca.date::text || ' ' || ca.end_time::text)::timestamp AT TIME ZONE ca.timezone)
        + INTERVAL '30 minutes'
      ) < now()
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- (Optional) pg_cron scheduling (requires pg_cron extension installed by Supabase)
-- SELECT cron.schedule(
--   'lock_attendance_every_10_min',
--   '*/10 * * * *',
--   $$ SELECT public.lock_past_class_attendance(); $$
-- );

-- ================================================
-- RLS Enablement
-- ================================================
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_ratings ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies: class_attendance
-- ================================================

-- Instructors: read attendance for their classes
DROP POLICY IF EXISTS sel_attendance_instructor ON public.class_attendance;
CREATE POLICY sel_attendance_instructor
ON public.class_attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.class_assignments ca
    WHERE ca.id = class_attendance.assignment_id
      AND ca.instructor_id = auth.uid()
  )
  OR public.is_admin()
);

-- Members: read their own attendance rows
DROP POLICY IF EXISTS sel_attendance_member ON public.class_attendance;
CREATE POLICY sel_attendance_member
ON public.class_attendance
FOR SELECT
USING (member_id = auth.uid());

-- Instructors: insert/update attendance for their classes before lock
DROP POLICY IF EXISTS ins_attendance_instructor ON public.class_attendance;
DROP POLICY IF EXISTS upd_attendance_instructor ON public.class_attendance;

-- Separate policies for INSERT and UPDATE (PostgreSQL does not allow two command clauses in one CREATE POLICY)
CREATE POLICY ins_attendance_instructor
ON public.class_attendance
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_assignments ca
    WHERE ca.id = class_attendance.assignment_id
      AND ca.instructor_id = auth.uid()
      AND ca.attendance_locked = false
  ) OR public.is_admin()
);

CREATE POLICY upd_attendance_instructor
ON public.class_attendance
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.class_assignments ca
    WHERE ca.id = class_attendance.assignment_id
      AND ca.instructor_id = auth.uid()
      AND ca.attendance_locked = false
  ) OR public.is_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_assignments ca
    WHERE ca.id = class_attendance.assignment_id
      AND ca.instructor_id = auth.uid()
      AND ca.attendance_locked = false
  ) OR public.is_admin()
);

-- Prevent delete except admin
DROP POLICY IF EXISTS del_attendance_admin ON public.class_attendance;
CREATE POLICY del_attendance_admin
ON public.class_attendance
FOR DELETE USING (public.is_admin());

-- ================================================
-- RLS Policies: class_ratings
-- ================================================
-- Members can insert/update their rating if:
-- 1. They attended (present/late/makeup_completed), and
-- 2. Class has ended (end time + date < now()).
DROP POLICY IF EXISTS ins_upd_ratings_member ON public.class_ratings;
DROP POLICY IF EXISTS ins_class_ratings_member ON public.class_ratings;
DROP POLICY IF EXISTS upd_class_ratings_member ON public.class_ratings;

CREATE POLICY ins_class_ratings_member
ON public.class_ratings
FOR INSERT
WITH CHECK (
  member_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.class_assignments ca
    WHERE ca.id = class_ratings.assignment_id
      AND (
        ( ( (ca.date::text || ' ' || ca.end_time::text)::timestamp AT TIME ZONE ca.timezone) <= now() )
      )
  )
  AND EXISTS (
    SELECT 1 FROM public.class_attendance att
    WHERE att.assignment_id = class_ratings.assignment_id
      AND att.member_id = auth.uid()
      AND att.status IN ('present','late','makeup_completed')
  )
);

CREATE POLICY upd_class_ratings_member
ON public.class_ratings
FOR UPDATE
USING (
  member_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.class_attendance att
    WHERE att.assignment_id = class_ratings.assignment_id
      AND att.member_id = auth.uid()
      AND att.status IN ('present','late','makeup_completed')
  )
)
WITH CHECK (
  member_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.class_attendance att
    WHERE att.assignment_id = class_ratings.assignment_id
      AND att.member_id = auth.uid()
      AND att.status IN ('present','late','makeup_completed')
  )
);

-- Instructors and admins read ratings of their classes
DROP POLICY IF EXISTS sel_ratings_instructor ON public.class_ratings;
CREATE POLICY sel_ratings_instructor
ON public.class_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.class_assignments ca
    WHERE ca.id = class_ratings.assignment_id
      AND ca.instructor_id = auth.uid()
  ) OR public.is_admin()
  OR member_id = auth.uid()
);

-- Admins full modify (optional)
DROP POLICY IF EXISTS mod_ratings_admin ON public.class_ratings;
CREATE POLICY mod_ratings_admin
ON public.class_ratings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ================================================
-- Secure Function: Upsert Attendance (Edge safely calls RPC)
-- ================================================
CREATE OR REPLACE FUNCTION public.upsert_attendance(
  p_assignment_id uuid,
  p_member_id uuid,
  p_status public.attendance_status_enum,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Authorization: instructor of class OR admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.class_assignments ca
      WHERE ca.id = p_assignment_id
        AND ca.instructor_id = auth.uid()
        AND ca.attendance_locked = false
    ) OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Not authorized to modify attendance for this class';
  END IF;

  INSERT INTO public.class_attendance (assignment_id, member_id, status, notes, marked_by)
  VALUES (p_assignment_id, p_member_id, p_status, p_notes, auth.uid())
  ON CONFLICT (assignment_id, member_id)
  DO UPDATE SET status = EXCLUDED.status,
                notes = COALESCE(EXCLUDED.notes, public.class_attendance.notes),
                marked_by = auth.uid(),
                marked_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ================================================
-- Secure Function: Upsert Rating
-- ================================================
CREATE OR REPLACE FUNCTION public.upsert_class_rating(
  p_assignment_id uuid,
  p_rating smallint,
  p_comment text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT (auth.role() = 'authenticated') THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Ensure user attended & class ended
  IF NOT EXISTS (
    SELECT 1
    FROM public.class_assignments ca
    JOIN public.class_attendance att ON att.assignment_id = ca.id
    WHERE ca.id = p_assignment_id
      AND att.member_id = auth.uid()
      AND att.status IN ('present','late','makeup_completed')
      AND ( ( (ca.date::text || ' ' || ca.end_time::text)::timestamp AT TIME ZONE ca.timezone ) <= now() )
  ) THEN
    RAISE EXCEPTION 'Cannot rate class: attendance requirement not met or class not finished';
  END IF;

  INSERT INTO public.class_ratings (assignment_id, member_id, rating, comment)
  VALUES (p_assignment_id, auth.uid(), p_rating, p_comment)
  ON CONFLICT (assignment_id, member_id)
  DO UPDATE SET rating = EXCLUDED.rating,
                comment = COALESCE(EXCLUDED.comment, public.class_ratings.comment),
                updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ================================================
-- OPTIONAL: Materialized View (if performance needed) for Admin Overview
-- ================================================
CREATE MATERIALIZED VIEW public.admin_class_overview_mv AS
SELECT * FROM public.admin_class_overview_v;
-- (Schedule refresh as needed)

-- ================================================
-- Notes:
-- - Frontend to use instructor_upcoming_classes_v for teaching dashboard.
-- - For attendee roster: SELECT * FROM class_attendance WHERE assignment_id = ? ORDER BY status, member_id;
-- - Payment summary (paid vs pending): sum(final_payment_amount) filtered by payment_status.
-- - To mark a class conducted/completed: update class_assignments set class_status='completed' where id=? and instructor_id=auth.uid().
-- ================================================
