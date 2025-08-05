ALTER TABLE instructor_rates DROP CONSTRAINT IF EXISTS instructor_rates_schedule_type_check;

ALTER TABLE instructor_rates ADD COLUMN IF NOT EXISTS class_type_id UUID REFERENCES class_types(id);

ALTER TABLE instructor_rates ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES class_packages(id);

ALTER TABLE instructor_rates ADD CONSTRAINT rates_type_or_package_check 
CHECK (
  (class_type_id IS NOT NULL AND package_id IS NULL) OR 
  (class_type_id IS NULL AND package_id IS NOT NULL)
);

ALTER TABLE instructor_rates DROP CONSTRAINT IF EXISTS instructor_rates_schedule_category_unique;

ALTER TABLE instructor_rates ADD CONSTRAINT instructor_rates_unique_per_type 
UNIQUE (class_type_id, package_id, category, schedule_type);