-- Add 'assigned' status to bookings table constraint
-- This migration adds 'assigned' as a valid status option

-- First, drop the existing check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_status;

-- Add the new constraint that includes 'assigned' status
ALTER TABLE bookings ADD CONSTRAINT check_status 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled', 'assigned'));

-- Optional: Add index on status column for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Update any existing bookings that should be marked as assigned
-- (This checks if there are any bookings with booking_id that exists in class_assignments)
UPDATE bookings 
SET status = 'assigned' 
WHERE booking_id IN (
    SELECT DISTINCT booking_id 
    FROM class_assignments 
    WHERE booking_id IS NOT NULL
) 
AND status NOT IN ('cancelled', 'completed');