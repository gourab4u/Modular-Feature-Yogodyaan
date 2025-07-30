-- Add package_id column to class_assignments table
-- This column will reference the class_packages table for package-based assignments

-- Add the package_id column as UUID, nullable (since not all assignments are package-based)
ALTER TABLE class_assignments 
ADD COLUMN package_id UUID REFERENCES class_packages(id);

-- Create index for performance on package_id lookups
CREATE INDEX IF NOT EXISTS idx_class_assignments_package_id 
ON class_assignments(package_id);

-- Add a check constraint to ensure either class_type_id OR package_id is present
-- (but not both for clarity, though technically both could be allowed)
ALTER TABLE class_assignments 
ADD CONSTRAINT chk_class_assignments_type_or_package 
CHECK (
  (class_type_id IS NOT NULL AND package_id IS NULL) OR 
  (class_type_id IS NULL AND package_id IS NOT NULL)
);

-- Update existing records to ensure they have class_type_id set
-- (this is just to make sure we don't have records that violate the new constraint)
UPDATE class_assignments 
SET class_type_id = COALESCE(class_type_id, (SELECT id FROM class_types LIMIT 1))
WHERE class_type_id IS NULL AND package_id IS NULL;