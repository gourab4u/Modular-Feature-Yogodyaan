-- Migration: Add Multiple Booking Support
-- This migration creates a junction table for many-to-many relationship between assignments and bookings

-- Step 1: Create the junction table
CREATE TABLE assignment_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES class_assignments(id) ON DELETE CASCADE,
    booking_id TEXT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(assignment_id, booking_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_assignment_bookings_assignment_id ON assignment_bookings(assignment_id);
CREATE INDEX idx_assignment_bookings_booking_id ON assignment_bookings(booking_id);

-- Step 3: Migrate existing data from class_assignments.booking_id to junction table
INSERT INTO assignment_bookings (assignment_id, booking_id)
SELECT id, booking_id 
FROM class_assignments 
WHERE booking_id IS NOT NULL AND booking_id != '';

-- Step 4: Remove the old booking_id column and its foreign key constraint
ALTER TABLE class_assignments DROP CONSTRAINT IF EXISTS class_assignments_booking_id_fkey;
ALTER TABLE class_assignments DROP COLUMN booking_id;

-- Step 5: Remove client_name and client_email columns (will get from bookings)
ALTER TABLE class_assignments DROP COLUMN IF EXISTS client_name;
ALTER TABLE class_assignments DROP COLUMN IF EXISTS client_email;

-- Verification query (run after migration to confirm data moved correctly)
-- SELECT 
--     ca.id as assignment_id,
--     ca.date,
--     ca.start_time,
--     STRING_AGG(ab.booking_id, ', ') as linked_bookings,
--     COUNT(ab.booking_id) as booking_count
-- FROM class_assignments ca
-- LEFT JOIN assignment_bookings ab ON ca.id = ab.assignment_id
-- GROUP BY ca.id, ca.date, ca.start_time
-- ORDER BY ca.date DESC, ca.start_time;