-- Add created_by column to class_schedules table
-- This column is required by the application for tracking who created the schedule

ALTER TABLE class_schedules 
ADD COLUMN created_by UUID;

-- Add foreign key constraint to reference the auth.users table
ALTER TABLE class_schedules 
ADD CONSTRAINT fk_class_schedules_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Create an index for better performance on created_by queries
CREATE INDEX idx_class_schedules_created_by ON class_schedules(created_by);

-- Optional: Update existing records to set a default created_by value
-- You may want to set this to a specific admin user ID
-- UPDATE class_schedules SET created_by = 'your-admin-user-id' WHERE created_by IS NULL;