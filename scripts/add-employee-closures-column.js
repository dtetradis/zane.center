const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hhywaddenwmiktdtnxtz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU1MDgyMSwiZXhwIjoyMDc5MTI2ODIxfQ._TGs-UQDzaCAvLj3__CU--sbNc1Yrv3brs2Lb-pKbKs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addEmployeeClosuresColumn() {
  console.log('Adding employee_closures column to stores table...');

  // First, let's check the current structure of the stores table
  const { data: stores, error: fetchError } = await supabase
    .from('stores')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('Error fetching stores:', fetchError);
    return;
  }

  console.log('Current store columns:', stores.length > 0 ? Object.keys(stores[0]) : 'No stores found');

  // Check if employee_closures column already exists
  if (stores.length > 0 && 'employee_closures' in stores[0]) {
    console.log('employee_closures column already exists!');
    return;
  }

  // Try to add the column using RPC or direct SQL
  // Since we can't run ALTER TABLE directly, we'll use the SQL editor approach
  // through the REST API

  // For now, let's try updating with a default value to see if we can add the column
  console.log('\nTrying to add column via Supabase...');
  console.log('Note: You may need to add this column manually in Supabase Dashboard.');
  console.log('\nRun this SQL in Supabase SQL Editor:');
  console.log('----------------------------------------');
  console.log(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS employee_closures jsonb DEFAULT '[]'::jsonb;`);
  console.log('----------------------------------------');

  // Alternative: Try using postgres function if available
  const { data, error } = await supabase.rpc('add_column_if_not_exists', {
    table_name: 'stores',
    column_name: 'employee_closures',
    column_type: 'jsonb',
    default_value: "'[]'::jsonb"
  });

  if (error) {
    console.log('\nRPC not available (expected):', error.message);
    console.log('\nPlease add the column manually in Supabase Dashboard SQL Editor.');
  } else {
    console.log('Column added successfully!');
  }
}

addEmployeeClosuresColumn().catch(console.error);
