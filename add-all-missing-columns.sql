-- Add all potentially missing columns to class_schedules table
-- This script adds all columns that the application expects

-- Add columns one by one, ignoring errors if they already exist

-- Basic scheduling columns
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS end_date DATE;

-- Status and tracking columns  
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS class_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add foreign key constraint for created_by if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_class_schedules_created_by'
        AND table_name = 'class_schedules'
    ) THEN
        ALTER TABLE class_schedules 
        ADD CONSTRAINT fk_class_schedules_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
EXCEPTION WHEN others THEN
    -- Ignore error if constraint already exists or auth.users doesn't exist
    NULL;
END $$;

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_class_schedules_status ON class_schedules(class_status);
CREATE INDEX IF NOT EXISTS idx_class_schedules_created_by ON class_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_class_schedules_end_date ON class_schedules(end_date);
CREATE INDEX IF NOT EXISTS idx_class_schedules_end_time ON class_schedules(end_time);