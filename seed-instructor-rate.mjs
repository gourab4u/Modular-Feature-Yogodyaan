import { createClient } from '@supabase/supabase-js';

// Use the same environment variables as the app
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iddvvefpwgwmgpyelzcv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHZ2ZWZwd2d3bWdweWVsemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDEwMTUsImV4cCI6MjA2NjY3NzAxNX0.99ldPgMS8CZHCtudjT5sAR2J7S9OsLj0kx8O8VJmJiM';

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
    try {
        console.log('Seeding instructor rate...');

        // --- 1. Define Data ---
        const createdById = 'ec93a28b-5698-49cf-ad9e-ed4c83870094'; // Gourab Chakraborty (super_admin)

        const rateData = {
            schedule_type: 'adhoc',
            category: 'individual',
            rate_amount: 1000.00,
            created_by: createdById,
            is_active: true,
            effective_from: new Date().toISOString().split('T')[0]
        };

        console.log('Creating instructor rate with the following data:');
        console.log(JSON.stringify(rateData, null, 2));

        // --- 2. Insert the rate ---
        const { data: insertedRate, error } = await supabase
            .from('instructor_rates')
            .insert([rateData])
            .select()
            .single();

        if (error) {
            console.error('Error inserting instructor rate:', error);
            throw new Error(`Failed to seed instructor rate: ${error.message}`);
        }

        console.log('Successfully seeded instructor rate:');
        console.log(JSON.stringify(insertedRate, null, 2));

    } catch (err) {
        console.error('Seeding script failed:', err);
    }
}

seedData();
