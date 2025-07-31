-- Simple migration to add 'assigned' status to bookings table constraint

-- Drop the existing check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_status;

-- Add the new constraint that includes 'assigned' status
ALTER TABLE bookings ADD CONSTRAINT check_status 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled', 'assigned'));