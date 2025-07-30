-- Add start_date and end_date columns to class_schedules table
-- These columns are required for weekly recurring schedules

ALTER TABLE class_schedules 
ADD COLUMN start_date DATE;

ALTER TABLE class_schedules 
ADD COLUMN end_date DATE;

-- Add check constraint to ensure end_date is after start_date
ALTER TABLE class_schedules 
ADD CONSTRAINT class_schedules_date_check 
CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Create indexes for better performance on date queries
CREATE INDEX idx_class_schedules_start_date ON class_schedules(start_date);
CREATE INDEX idx_class_schedules_end_date ON class_schedules(end_date);

-- Add notes column if it doesn't exist already
ALTER TABLE class_schedules 
ADD COLUMN IF NOT EXISTS notes TEXT;