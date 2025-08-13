import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('Testing class_assignments table...');

  try {
    // Test basic query
    const { data, error, count } = await supabase
      .from('class_assignments')
      .select('*', { count: 'exact' })
      .limit(5);

    console.log('Query result:');
    console.log('- Count:', count);
    console.log('- Error:', error);
    console.log('- Data length:', data?.length || 0);

    if (error) {
      console.log('- Error details:', JSON.stringify(error, null, 2));
    }

    if (data && data.length > 0) {
      console.log('- First assignment:', JSON.stringify(data[0], null, 2));
    }

    // Test table existence
    const { data: tableData, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'class_assignments' })
      .single();

    if (tableError && tableError.code !== '42883') { // Function doesn't exist is OK
      console.log('Table check error:', tableError);
    }

  } catch (err) {
    console.error('Connection error:', err.message);
  }
}

testDatabase();
