-- Timezone enhancements for class assignments
-- These updates add timezone support and improve the assignment structure

-- 1. Add timezone support to class_assignments table
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata';

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS created_in_timezone text DEFAULT 'Asia/Kolkata';

-- 2. Add assignment method tracking for improved monthly logic
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS assignment_method text DEFAULT 'manual' 
CHECK (assignment_method = ANY (ARRAY['manual', 'weekly_recurrence', 'auto_distribute']));

-- 3. Add recurrence pattern tracking
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS recurrence_days integer[] DEFAULT NULL; -- [1,3,5] for Mon,Wed,Fri

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS parent_assignment_id uuid DEFAULT NULL;
-- References the "parent" assignment for bulk/recurring assignments

-- 4. Create class_assignment_templates table for weekly recurrence patterns
CREATE TABLE IF NOT EXISTS public.class_assignment_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  package_id uuid,
  class_type_id uuid,
  instructor_id uuid NOT NULL,
  
  -- Recurrence pattern
  weekdays integer[] NOT NULL, -- [1,3,5] for Monday, Wednesday, Friday (0=Sunday, 6=Saturday)
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  
  -- Assignment details
  payment_amount numeric DEFAULT 0,
  payment_type text DEFAULT 'per_class',
  notes text,
  
  -- Metadata
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  
  CONSTRAINT class_assignment_templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_instructor_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id),
  CONSTRAINT templates_package_fkey FOREIGN KEY (package_id) REFERENCES public.class_packages(id),
  CONSTRAINT templates_class_type_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id),
  CONSTRAINT templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- 5. Create manual_class_selections table for calendar-based selections
CREATE TABLE IF NOT EXISTS public.manual_class_selections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_batch_id uuid NOT NULL, -- Groups selections made together
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  
  -- Assignment details (copied from parent selection)
  package_id uuid,
  class_type_id uuid,
  instructor_id uuid NOT NULL,
  payment_amount numeric DEFAULT 0,
  notes text,
  
  -- Metadata
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT manual_class_selections_pkey PRIMARY KEY (id),
  CONSTRAINT manual_selections_instructor_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id),
  CONSTRAINT manual_selections_package_fkey FOREIGN KEY (package_id) REFERENCES public.class_packages(id),
  CONSTRAINT manual_selections_class_type_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id),
  CONSTRAINT manual_selections_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_assignments_timezone ON class_assignments(timezone);
CREATE INDEX IF NOT EXISTS idx_class_assignments_assignment_method ON class_assignments(assignment_method);
CREATE INDEX IF NOT EXISTS idx_class_assignments_parent_id ON class_assignments(parent_assignment_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_recurrence_days ON class_assignments USING gin(recurrence_days);

CREATE INDEX IF NOT EXISTS idx_templates_instructor_id ON class_assignment_templates(instructor_id);
CREATE INDEX IF NOT EXISTS idx_templates_weekdays ON class_assignment_templates USING gin(weekdays);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON class_assignment_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_manual_selections_batch_id ON manual_class_selections(assignment_batch_id);
CREATE INDEX IF NOT EXISTS idx_manual_selections_date ON manual_class_selections(date);
CREATE INDEX IF NOT EXISTS idx_manual_selections_instructor_id ON manual_class_selections(instructor_id);

-- 7. Function to convert stored time to user's timezone
CREATE OR REPLACE FUNCTION convert_assignment_to_timezone(
  assignment_date date,
  assignment_time time,
  stored_timezone text,
  target_timezone text
) RETURNS timestamptz AS $$
BEGIN
  -- Combine date and time in stored timezone, then convert to target timezone
  RETURN (assignment_date + assignment_time) AT TIME ZONE stored_timezone AT TIME ZONE target_timezone;
END;
$$ LANGUAGE plpgsql;

-- 8. View for timezone-aware assignment display
CREATE OR REPLACE VIEW public.assignments_with_timezone AS
SELECT 
  ca.*,
  -- Convert to UTC for easy timezone conversion in frontend
  (ca.date + ca.start_time) AT TIME ZONE ca.timezone AS start_datetime_utc,
  (ca.date + ca.end_time) AT TIME ZONE ca.timezone AS end_datetime_utc,
  -- Include related data
  ct.name as class_type_name,
  cp.name as package_name,
  cp.class_count as package_class_count,
  p.full_name as instructor_name
FROM class_assignments ca
LEFT JOIN class_types ct ON ca.class_type_id = ct.id
LEFT JOIN class_packages cp ON ca.package_id = cp.id
LEFT JOIN profiles p ON ca.instructor_id = p.user_id;

-- 9. RLS policies for new tables
ALTER TABLE class_assignment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_class_selections ENABLE ROW LEVEL SECURITY;

-- Templates: instructors see own, admins see all
CREATE POLICY "Instructors can view own templates" ON class_assignment_templates
  FOR SELECT USING (instructor_id = auth.uid());

CREATE POLICY "Admins can manage all templates" ON class_assignment_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('admin', 'yoga_acharya')
    )
  );

-- Manual selections: creators and admins can see
CREATE POLICY "Users can view own manual selections" ON manual_class_selections
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can view all manual selections" ON manual_class_selections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('admin', 'yoga_acharya')
    )
  );

-- Comments for documentation
COMMENT ON COLUMN class_assignments.timezone IS 'Timezone in which the class was scheduled (e.g., Asia/Kolkata)';
COMMENT ON COLUMN class_assignments.created_in_timezone IS 'Timezone of the user who created this assignment';
COMMENT ON COLUMN class_assignments.assignment_method IS 'How this assignment was created: manual, weekly_recurrence, or auto_distribute';
COMMENT ON COLUMN class_assignments.recurrence_days IS 'Array of weekdays (0=Sunday, 6=Saturday) for recurring assignments';
COMMENT ON COLUMN class_assignments.parent_assignment_id IS 'References parent assignment for bulk operations';

COMMENT ON TABLE class_assignment_templates IS 'Templates for weekly recurring assignment patterns';
COMMENT ON TABLE manual_class_selections IS 'Individual manual selections for calendar-based assignment creation';
COMMENT ON VIEW assignments_with_timezone IS 'View showing assignments with timezone-converted datetime fields';