-- Check what constraints exist on the instructor_rates table (PostgreSQL 12+)
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'instructor_rates'::regclass 
AND contype = 'c';

-- Also check the column definition
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'instructor_rates' 
AND column_name IN ('schedule_type', 'category');