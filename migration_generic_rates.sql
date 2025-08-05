-- Migration to convert instructor_rates to generic rates
-- Remove instructor_id column and add unique constraint on schedule_type + category

BEGIN;

-- Step 1: Drop the instructor_id column (if it exists)
-- Note: Check if column exists first to handle cases where it might not exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'instructor_rates' 
               AND column_name = 'instructor_id') THEN
        ALTER TABLE instructor_rates DROP COLUMN instructor_id;
    END IF;
END $$;

-- Step 2: Add unique constraint on schedule_type and category combination
-- This ensures we can only have one rate per schedule type and category combination
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'instructor_rates_schedule_category_unique'
                   AND table_name = 'instructor_rates') THEN
        ALTER TABLE instructor_rates 
        ADD CONSTRAINT instructor_rates_schedule_category_unique 
        UNIQUE (schedule_type, category);
    END IF;
END $$;

-- Step 3: Add class_type_id column if it doesn't exist
-- This allows rates to be optionally linked to specific class types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'instructor_rates' 
                   AND column_name = 'class_type_id') THEN
        ALTER TABLE instructor_rates 
        ADD COLUMN class_type_id UUID REFERENCES class_types(id);
    END IF;
END $$;

COMMIT;