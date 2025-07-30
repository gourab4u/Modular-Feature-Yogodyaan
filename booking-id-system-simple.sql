-- Simplified Booking ID System Implementation
-- Run this if you encounter policy errors with the main file

-- 1. Add booking_id column to bookings table with auto-generation
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_id text UNIQUE;

-- 2. Create a function to generate unique booking IDs
CREATE OR REPLACE FUNCTION generate_booking_id() 
RETURNS text AS $$
DECLARE
    new_id text;
    exists boolean;
BEGIN
    LOOP
        -- Generate booking ID: YOG-YYYYMMDD-XXXX format
        new_id := 'YOG-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');
        
        -- Check if this ID already exists
        SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_id = new_id) INTO exists;
        
        -- If unique, exit loop
        IF NOT exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to auto-generate booking_id for new bookings
CREATE OR REPLACE FUNCTION set_booking_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_id IS NULL THEN
        NEW.booking_id := generate_booking_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS booking_id_trigger ON bookings;

-- Create the trigger
CREATE TRIGGER booking_id_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_id();

-- 4. Update existing bookings to have booking IDs (if they don't have them)
UPDATE bookings 
SET booking_id = generate_booking_id() 
WHERE booking_id IS NULL;

-- 5. Add booking_id foreign key to class_assignments table
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS booking_id text;

-- Add foreign key constraint (with safety check)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'class_assignments_booking_id_fkey'
    ) THEN
        ALTER TABLE class_assignments 
        ADD CONSTRAINT class_assignments_booking_id_fkey 
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id);
    END IF;
END $$;

-- 6. Add client info columns to class_assignments
ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS client_name text;

ALTER TABLE class_assignments 
ADD COLUMN IF NOT EXISTS client_email text;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_booking_id ON class_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- 8. Create a view for easy booking-assignment relationship
CREATE OR REPLACE VIEW booking_assignments AS
SELECT 
    b.booking_id,
    b.first_name,
    b.last_name,
    b.email,
    b.phone,
    b.class_name as requested_class,
    b.class_date as requested_date,
    b.class_time as requested_time,
    b.instructor as requested_instructor,
    b.experience_level,
    b.special_requests,
    b.status as booking_status,
    b.created_at as booking_created_at,
    ca.id as assignment_id,
    ca.date as assigned_date,
    ca.start_time as assigned_start_time,
    ca.end_time as assigned_end_time,
    ca.class_status as assignment_status,
    ct.name as assigned_class_type,
    p.full_name as assigned_instructor_name
FROM bookings b
LEFT JOIN class_assignments ca ON b.booking_id = ca.booking_id
LEFT JOIN class_types ct ON ca.class_type_id = ct.id
LEFT JOIN profiles p ON ca.instructor_id = p.user_id;

-- 9. Function to get booking details by booking_id
CREATE OR REPLACE FUNCTION get_booking_details(booking_id_param text)
RETURNS TABLE(
    booking_id text,
    client_name text,
    client_email text,
    client_phone text,
    requested_class text,
    requested_date text,
    requested_time text,
    experience_level text,
    special_requests text,
    booking_status text,
    has_assignment boolean,
    assignment_date text,
    assignment_time text,
    assigned_instructor text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ba.booking_id,
        (ba.first_name || ' ' || ba.last_name) as client_name,
        ba.email as client_email,
        ba.phone as client_phone,
        ba.requested_class,
        ba.requested_date,
        ba.requested_time,
        ba.experience_level,
        ba.special_requests,
        ba.booking_status,
        (ba.assignment_id IS NOT NULL) as has_assignment,
        ba.assigned_date as assignment_date,
        (ba.assigned_start_time || ' - ' || ba.assigned_end_time) as assignment_time,
        ba.assigned_instructor_name as assigned_instructor
    FROM booking_assignments ba
    WHERE ba.booking_id = booking_id_param;
END;
$$ LANGUAGE plpgsql;

-- 10. Comments for documentation
COMMENT ON COLUMN bookings.booking_id IS 'Unique booking ID in format YOG-YYYYMMDD-XXXX';
COMMENT ON COLUMN class_assignments.booking_id IS 'References the original booking request';
COMMENT ON COLUMN class_assignments.client_name IS 'Client name from the booking for easy display';
COMMENT ON COLUMN class_assignments.client_email IS 'Client email from the booking for reference';
COMMENT ON FUNCTION generate_booking_id() IS 'Generates unique booking IDs in YOG-YYYYMMDD-XXXX format';
COMMENT ON VIEW booking_assignments IS 'Combined view of bookings and their corresponding class assignments';

-- Success message
SELECT 'Booking ID system successfully installed! 🎉' as result;