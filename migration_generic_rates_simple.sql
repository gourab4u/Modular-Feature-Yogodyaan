-- Migration to convert instructor_rates to generic rates
-- Simple version without complex DO blocks

-- Step 1: Drop the instructor_id column if it exists
ALTER TABLE instructor_rates DROP COLUMN IF EXISTS instructor_id;

-- Step 2: Add unique constraint on schedule_type, category combination
-- Drop existing constraint first if it exists
ALTER TABLE instructor_rates DROP CONSTRAINT IF EXISTS instructor_rates_schedule_category_unique;
ALTER TABLE instructor_rates ADD CONSTRAINT instructor_rates_schedule_category_unique UNIQUE (schedule_type, category);

-- Step 3: Add class_type_id column if it doesn't exist
ALTER TABLE instructor_rates ADD COLUMN IF NOT EXISTS class_type_id UUID REFERENCES class_types(id);