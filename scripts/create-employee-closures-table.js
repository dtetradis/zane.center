const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hhywaddenwmiktdtnxtz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU1MDgyMSwiZXhwIjoyMDc5MTI2ODIxfQ._TGs-UQDzaCAvLj3__CU--sbNc1Yrv3brs2Lb-pKbKs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createEmployeeClosuresTable() {
  console.log('Checking if employee_closures table exists...');

  // Try to query the table to see if it exists
  const { data, error } = await supabase
    .from('employee_closures')
    .select('*')
    .limit(1);

  if (!error) {
    console.log('Table employee_closures already exists!');
    return true;
  }

  if (error.code === '42P01' || error.message.includes('does not exist')) {
    console.log('Table does not exist. Need to create it.');
    console.log('\nPlease run the following SQL in Supabase Dashboard SQL Editor:');
    console.log('================================================================');
    console.log(`
CREATE TABLE IF NOT EXISTS employee_closures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  employee_email text NOT NULL,
  date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, employee_email, date)
);

-- Enable RLS
ALTER TABLE employee_closures ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role can manage employee_closures"
  ON employee_closures
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to read
CREATE POLICY "Anyone can read employee_closures"
  ON employee_closures
  FOR SELECT
  USING (true);
`);
    console.log('================================================================');
    return false;
  }

  console.log('Error checking table:', error);
  return false;
}

createEmployeeClosuresTable().catch(console.error);
