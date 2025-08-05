-- Drop the problematic constraint
ALTER TABLE instructor_rates DROP CONSTRAINT IF EXISTS rates_type_or_package_check;

-- Add a more flexible constraint that allows both to be NULL (for existing generic rates)
ALTER TABLE instructor_rates ADD CONSTRAINT rates_type_or_package_check 
CHECK (
  (class_type_id IS NOT NULL AND package_id IS NULL) OR 
  (class_type_id IS NULL AND package_id IS NOT NULL) OR
  (class_type_id IS NULL AND package_id IS NULL)
);