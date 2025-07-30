-- Check what values are allowed in schedule_type column
-- Run this to see the current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%schedule_type%' AND conrelid = 'class_assignments'::regclass;