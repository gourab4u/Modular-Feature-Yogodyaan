import { createClient } from '@supabase/supabase-js';

// Use the same environment variables as the app
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iddvvefpwgwmgpyelzcv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHZ2ZWZwd2d3bWdweWVsemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDEwMTUsImV4cCI6MjA2NjY3NzAxNX0.99ldPgMS8CZHCtudjT5sAR2J7S9OsLj0kx8O8VJmJiM';

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    try {
        console.log('Testing instructor_rates query...');

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('instructor_rates')
            .select('*')
            .eq('schedule_type', 'adhoc')
            .eq('category', 'individual')
            .lte('effective_from', today)
            .or(`effective_until.is.null,effective_until.gte.${today}`)
            .eq('is_active', true)
            .is('class_type_id', null)
            .is('package_id', null)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error querying instructor_rates:', JSON.stringify(error, null, 2));
        } else {
            console.log('Successfully queried instructor_rates:');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Query test failed:', err);
    }
}

testQuery();
