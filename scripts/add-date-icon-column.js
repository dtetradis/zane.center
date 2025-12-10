const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addDateIconColumn() {
  try {
    console.log('Adding date_icon column to stores table...');

    // Add the date_icon column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE stores
        ADD COLUMN IF NOT EXISTS date_icon TEXT DEFAULT 'calendar';
      `
    });

    if (error) {
      console.error('Error adding column:', error);
      console.log('\nTrying alternative method...');

      // Alternative: Update via a dummy update to test if column exists
      const { error: testError } = await supabase
        .from('stores')
        .update({ date_icon: 'calendar' })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID

      if (testError && testError.message.includes('column')) {
        console.error('Column does not exist. Please add it manually in Supabase:');
        console.log('ALTER TABLE stores ADD COLUMN date_icon TEXT DEFAULT \'calendar\';');
      } else {
        console.log('Column already exists or was added successfully!');
      }
    } else {
      console.log('Column added successfully!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    console.log('\nPlease add the column manually in Supabase SQL Editor:');
    console.log('ALTER TABLE stores ADD COLUMN date_icon TEXT DEFAULT \'calendar\';');
  }
}

addDateIconColumn();
