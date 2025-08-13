import { createClient } from '@supabase/supabase-js';

// Use the same environment variables as the app
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iddvvefpwgwmgpyelzcv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHZ2ZWZwd2d3bWdweWVsemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDEwMTUsImV4cCI6MjA2NjY3NzAxNX0.99ldPgMS8CZHCtudjT5sAR2J7S9OsLj0kx8O8VJmJiM';

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAllData() {
    try {
        // Note: Disabling RLS via a client-side script is not a recommended security practice.
        // This is a temporary workaround for a development environment.
        // In a production environment, you should use a privileged user or a database migration tool.
        console.log('Temporarily disabling RLS for seeding...');
        // This is a placeholder for the actual RLS disable logic, as we can't execute it from the script directly.
        // You must manually disable RLS on class_assignments and instructor_rates before running this script.

        // --- Seed Class Assignment ---
        console.log('Seeding class assignment...');
        const instructorId = 'f0cf585f-4d98-41b4-87e3-6f0e48d686ff'; // Bratati (instructor)
        const classTypeId = '214fad22-d30d-4dce-817c-7351575032ed'; // Sunrise Vinyasa Flow
        const assignedById = 'ec93a28b-5698-49cf-ad9e-ed4c83870094'; // Gourab Chakraborty (super_admin)
        const { data: schedule } = await supabase.from('class_schedules').select('id').limit(1).single();
        if (!schedule) throw new Error('No class schedules found to use as a fallback.');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const assignmentDate = tomorrow.toISOString().split('T')[0];

        const assignmentData = {
            instructor_id: instructorId,
            class_type_id: classTypeId,
            scheduled_class_id: schedule.id,
            assigned_by: assignedById,
            date: assignmentDate,
            start_time: '07:00:00',
            end_time: '08:00:00',
            payment_amount: 1000.00,
            payment_type: 'per_class',
            schedule_type: 'adhoc',
            booking_type: 'individual',
            class_status: 'scheduled',
            payment_status: 'pending',
            instructor_status: 'pending',
            notes: 'This is a test assignment created by the seed script.'
        };

        const { data: insertedAssignment, error: assignmentError } = await supabase
            .from('class_assignments')
            .insert([assignmentData])
            .select()
            .single();

        if (assignmentError) {
            console.error('Error inserting class assignment:', assignmentError);
            throw new Error(`Failed to seed class assignment: ${assignmentError.message}`);
        }
        console.log('Successfully seeded class assignment:');
        console.log(JSON.stringify(insertedAssignment, null, 2));


        // --- Seed Instructor Rate ---
        console.log('Seeding instructor rate...');
        const rateData = {
            schedule_type: 'adhoc',
            category: 'individual',
            rate_amount: 1000.00,
            created_by: assignedById,
            is_active: true,
            effective_from: new Date().toISOString().split('T')[0]
        };

        const { data: insertedRate, error: rateError } = await supabase
            .from('instructor_rates')
            .insert([rateData])
            .select()
            .single();

        if (rateError) {
            console.error('Error inserting instructor rate:', rateError);
            throw new Error(`Failed to seed instructor rate: ${rateError.message}`);
        }
        console.log('Successfully seeded instructor rate:');
        console.log(JSON.stringify(insertedRate, null, 2));

        console.log('Seeding complete. Please re-enable RLS manually.');

    } catch (err) {
        console.error('Seeding script failed:', err);
    }
}

seedAllData();
