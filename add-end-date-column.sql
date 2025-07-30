-- Simply add the end_date column to class_schedules table
-- If it fails because it already exists, that's okay - just ignore the error

ALTER TABLE class_schedules ADD COLUMN end_date DATE;

-- Add notes column 
ALTER TABLE class_schedules ADD COLUMN notes TEXT;

-- Create indexes for better performance
CREATE INDEX idx_class_schedules_end_date ON class_schedules(end_date);