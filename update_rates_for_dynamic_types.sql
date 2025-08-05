-- Update instructor_rates table to support dynamic class types and packages

-- Step 1: Drop the restrictive schedule_type constraint
ALTER TABLE instructor_rates DROP CONSTRAINT IF EXISTS instructor_rates_schedule_type_check;

-- Step 2: Add new columns for linking to class types and packages
ALTER TABLE instructor_rates ADD COLUMN IF NOT EXISTS class_type_id UUID REFERENCES class_types(id);
ALTER TABLE instructor_rates ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES class_packages(id);

-- Step 3: Update the table structure
-- Change schedule_type to be more flexible (allow any text)
-- Keep category for different pricing models

-- Step 4: Add constraint that rate must be linked to either class_type OR package (not both)
ALTER TABLE instructor_rates ADD CONSTRAINT rates_type_or_package_check 
CHECK (
  (class_type_id IS NOT NULL AND package_id IS NULL) OR 
  (class_type_id IS NULL AND package_id IS NOT NULL)
);

-- Step 5: Update unique constraint to include class_type_id and package_id
ALTER TABLE instructor_rates DROP CONSTRAINT IF EXISTS instructor_rates_schedule_category_unique;
ALTER TABLE instructor_rates ADD CONSTRAINT instructor_rates_unique_per_type 
UNIQUE (class_type_id, package_id, category, schedule_type);