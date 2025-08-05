-- Update the schedule_type constraint to include more types
-- Drop the existing constraint
ALTER TABLE instructor_rates DROP CONSTRAINT IF EXISTS instructor_rates_schedule_type_check;

-- Add new constraint with more schedule types
ALTER TABLE instructor_rates ADD CONSTRAINT instructor_rates_schedule_type_check 
CHECK (schedule_type = ANY (ARRAY['adhoc'::text, 'weekly'::text, 'monthly'::text, 'crash'::text, 'package'::text]));