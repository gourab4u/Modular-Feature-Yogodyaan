-- Quick fix: Add essential missing columns for class assignment improvements
-- Run this SQL in your Supabase SQL Editor or database client

-- Add timezone support to class_assignments table
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata';

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS created_in_timezone text DEFAULT 'Asia/Kolkata';

-- Add assignment method tracking for improved monthly logic
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS assignment_method text DEFAULT 'manual' 
CHECK (assignment_method = ANY (ARRAY['manual', 'weekly_recurrence', 'auto_distribute']));

-- Add recurrence pattern tracking
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS recurrence_days integer[] DEFAULT NULL;

-- Add parent assignment tracking for bulk operations
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS parent_assignment_id uuid DEFAULT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_assignments_timezone ON class_assignments(timezone);
CREATE INDEX IF NOT EXISTS idx_class_assignments_assignment_method ON class_assignments(assignment_method);
CREATE INDEX IF NOT EXISTS idx_class_assignments_recurrence_days ON class_assignments USING gin(recurrence_days);

-- Comments for documentation
COMMENT ON COLUMN class_assignments.timezone IS 'Timezone in which the class was scheduled (e.g., Asia/Kolkata)';
COMMENT ON COLUMN class_assignments.created_in_timezone IS 'Timezone of the user who created this assignment';
COMMENT ON COLUMN class_assignments.assignment_method IS 'How this assignment was created: manual, weekly_recurrence, or auto_distribute';
COMMENT ON COLUMN class_assignments.recurrence_days IS 'Array of weekdays (0=Sunday, 6=Saturday) for recurring assignments';
COMMENT ON COLUMN class_assignments.parent_assignment_id IS 'References parent assignment for bulk operations';