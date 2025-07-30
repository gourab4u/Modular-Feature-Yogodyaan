-- Safely add missing columns to class_schedules table
-- Using IF NOT EXISTS or DO blocks to avoid errors if columns already exist

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'class_schedules' 
        AND column_name = 'end_date'
    ) THEN
        ALTER TABLE class_schedules ADD COLUMN end_date DATE;
    END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'class_schedules' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE class_schedules ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add check constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_schedules_date_check'
        AND table_name = 'class_schedules'
    ) THEN
        ALTER TABLE class_schedules 
        ADD CONSTRAINT class_schedules_date_check 
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_class_schedules_start_date ON class_schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_class_schedules_end_date ON class_schedules(end_date);