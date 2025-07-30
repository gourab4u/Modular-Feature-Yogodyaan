-- Add class_status column to class_schedules table
-- This column is required by the application for weekly schedule creation

ALTER TABLE class_schedules 
ADD COLUMN class_status VARCHAR(20) DEFAULT 'active';

-- Add a check constraint to ensure valid values
ALTER TABLE class_schedules 
ADD CONSTRAINT class_schedules_status_check 
CHECK (class_status IN ('active', 'inactive', 'cancelled', 'completed'));

-- Create an index for better performance on status queries
CREATE INDEX idx_class_schedules_status ON class_schedules(class_status);

-- Update existing records to have 'active' status where is_active is true
UPDATE class_schedules 
SET class_status = 'active' 
WHERE is_active = true;

-- Update existing records to have 'inactive' status where is_active is false
UPDATE class_schedules 
SET class_status = 'inactive' 
WHERE is_active = false;