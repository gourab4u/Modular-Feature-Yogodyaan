-- Database enhancements for Teaching Dashboard
-- Run these SQL commands when ready to enhance the Teaching Dashboard functionality

-- 1. Add missing columns to class_assignments table for better instructor interaction
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS instructor_status text DEFAULT 'pending' 
CHECK (instructor_status = ANY (ARRAY['pending', 'accepted', 'rejected', 'rescheduled']));

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS instructor_response_at timestamp with time zone;

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS instructor_remarks text;

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS reschedule_requested_date date;

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS reschedule_requested_time time without time zone;

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS reschedule_reason text;

-- 2. Create instructor_rates table for variable payment rates
CREATE TABLE IF NOT EXISTS public.instructor_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  class_type_id uuid,
  schedule_type text NOT NULL CHECK (schedule_type = ANY (ARRAY['adhoc', 'weekly'])),
  rate_amount numeric NOT NULL,
  effective_from date DEFAULT CURRENT_DATE,
  effective_until date,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT instructor_rates_pkey PRIMARY KEY (id),
  CONSTRAINT instructor_rates_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id),
  CONSTRAINT instructor_rates_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES public.class_types(id),
  CONSTRAINT instructor_rates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- 3. Create earnings summary table for faster queries (optional)
CREATE TABLE IF NOT EXISTS public.instructor_earnings_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  total_classes integer DEFAULT 0,
  total_earnings numeric DEFAULT 0.00,
  paid_earnings numeric DEFAULT 0.00,
  pending_earnings numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT instructor_earnings_summary_pkey PRIMARY KEY (id),
  CONSTRAINT instructor_earnings_summary_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES auth.users(id),
  CONSTRAINT unique_instructor_month_year UNIQUE (instructor_id, month, year)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_assignments_instructor_id ON class_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_date ON class_assignments(date);
CREATE INDEX IF NOT EXISTS idx_class_assignments_instructor_status ON class_assignments(instructor_status);
CREATE INDEX IF NOT EXISTS idx_instructor_rates_instructor_id ON instructor_rates(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_earnings_summary_instructor_id ON instructor_earnings_summary(instructor_id);

-- 5. Sample data for testing (optional - replace with actual data)
/*
-- Sample instructor rates
INSERT INTO instructor_rates (instructor_id, class_type_id, schedule_type, rate_amount, created_by) VALUES
  ('instructor-uuid-here', 'class-type-uuid-here', 'adhoc', 500.00, 'admin-uuid-here'),
  ('instructor-uuid-here', 'class-type-uuid-here', 'weekly', 400.00, 'admin-uuid-here');
*/

-- 6. Function to automatically update earnings summary (optional)
CREATE OR REPLACE FUNCTION update_instructor_earnings_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert earnings summary when assignment changes
  INSERT INTO instructor_earnings_summary (
    instructor_id, 
    month, 
    year, 
    total_classes, 
    total_earnings, 
    paid_earnings, 
    pending_earnings
  )
  WITH earnings_data AS (
    SELECT 
      NEW.instructor_id,
      EXTRACT(MONTH FROM NEW.date) as month,
      EXTRACT(YEAR FROM NEW.date) as year,
      COUNT(*) as total_classes,
      SUM(payment_amount) as total_earnings,
      SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END) as paid_earnings,
      SUM(CASE WHEN payment_status != 'paid' THEN payment_amount ELSE 0 END) as pending_earnings
    FROM class_assignments 
    WHERE instructor_id = NEW.instructor_id 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NEW.date)
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NEW.date)
    GROUP BY instructor_id
  )
  SELECT * FROM earnings_data
  ON CONFLICT (instructor_id, month, year) 
  DO UPDATE SET
    total_classes = EXCLUDED.total_classes,
    total_earnings = EXCLUDED.total_earnings,
    paid_earnings = EXCLUDED.paid_earnings,
    pending_earnings = EXCLUDED.pending_earnings,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic earnings summary updates (optional)
DROP TRIGGER IF EXISTS update_earnings_summary_trigger ON class_assignments;
CREATE TRIGGER update_earnings_summary_trigger
  AFTER INSERT OR UPDATE OF payment_amount, payment_status ON class_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_earnings_summary();

-- 7. RLS Policies for security (optional but recommended)
-- Enable RLS on instructor_rates table
ALTER TABLE instructor_rates ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own rates
CREATE POLICY "Instructors can view own rates" ON instructor_rates
  FOR SELECT USING (instructor_id = auth.uid());

-- Admins can manage all rates
CREATE POLICY "Admins can manage all rates" ON instructor_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('admin', 'yoga_acharya')
    )
  );

-- Similar policies for earnings summary
ALTER TABLE instructor_earnings_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can view own earnings" ON instructor_earnings_summary
  FOR SELECT USING (instructor_id = auth.uid());

CREATE POLICY "Admins can view all earnings" ON instructor_earnings_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('admin', 'yoga_acharya')
    )
  );

-- Comments for documentation
COMMENT ON TABLE instructor_rates IS 'Stores variable payment rates for instructors based on class type and schedule type';
COMMENT ON TABLE instructor_earnings_summary IS 'Pre-calculated earnings summary for faster dashboard queries';
COMMENT ON COLUMN class_assignments.instructor_status IS 'Status from instructor perspective: pending, accepted, rejected, rescheduled';
COMMENT ON COLUMN class_assignments.instructor_remarks IS 'Remarks/notes added by the instructor';
COMMENT ON COLUMN class_assignments.rejection_reason IS 'Reason provided when instructor rejects an assignment';
COMMENT ON COLUMN class_assignments.reschedule_requested_date IS 'Date requested by instructor for rescheduling';
COMMENT ON COLUMN class_assignments.reschedule_requested_time IS 'Time requested by instructor for rescheduling';