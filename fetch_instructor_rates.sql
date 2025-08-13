-- SQL query to fetch instructor rates from the Supabase database
SELECT *
FROM class_assignments
WHERE schedule_type = 'monthly'
  AND booking_type = 'individual'
  AND (class_type_id IS NULL OR class_type_id = '00000000-0000-0000-0000-000000000000')
  AND (package_id IS NULL OR package_id = '4f9bce84-8816-40bb-a907-1f3efc391ba2')
  AND date >= '2025-08-13'
ORDER BY date ASC
LIMIT 1;
