-- Update schedule_type constraint to allow 'package' value
-- Run this SQL to extend the allowed values

-- First, drop the existing constraint
ALTER TABLE class_assignments DROP CONSTRAINT IF EXISTS class_assignments_schedule_type_check;

-- Add the new constraint with 'package' included
ALTER TABLE class_assignments 
ADD CONSTRAINT class_assignments_schedule_type_check 
CHECK (schedule_type = ANY (ARRAY['adhoc', 'weekly', 'monthly', 'package']));

-- Add comment
COMMENT ON COLUMN class_assignments.schedule_type IS 'Type of class schedule: adhoc (one-time), weekly (recurring weekly), monthly (recurring monthly), package (part of a package)';