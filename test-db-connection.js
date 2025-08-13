const { createClient } = require('@supabase/supabase-js');

// Use the same environment variables as the app
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iddvvefpwgwmgpyelzcv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkZHZ2ZWZwd2d3bWdweWVsemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDEwMTUsImV4cCI6MjA2NjY3NzAxNX0.99ldPgMS8CZHCtudjT5sAR2J7S9OsLj0kx8O8VJmJiM';

console.log('Connecting to Supabase at:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        console.log('Testing database connection...');

        // Test a simple query to see if we can access the class_assignments table
        const { data, error, count } = await supabase
            .from('class_assignments')
            .select('*', { count: 'exact' })
            .limit(1);

        if (error) {
            console.error('Error querying class_assignments:', error);
            return;
        }

        console.log('Successfully connected to database');
        console.log('Total class assignments:', count);
        console.log('Sample data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Connection test failed:', err);
    }
}

testConnection();
