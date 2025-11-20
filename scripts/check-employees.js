const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmployees() {
  try {
    // Get the test store
    const { data: store } = await supabase
      .from('stores')
      .select('id, store_name, title')
      .eq('store_name', 'test-salon')
      .single();

    console.log('Store:', store.title);
    console.log('Store ID:', store.id);

    // Check all users for this store
    const { data: employees, error } = await supabase
      .from('users')
      .select('*')
      .eq('id_store', store.id);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n Found ${employees.length} employees:`);
    console.table(employees.map(e => ({
      email: e.email,
      role: e.role,
      category: e.category,
      phone: e.phone
    })));

    // If no employees or wrong categories, update them
    if (employees.length > 0) {
      console.log('\nUpdating employee categories...');

      const updates = [
        { id: employees[0].id, category: 'Hairstylist' },
        { id: employees[1]?.id, category: 'Nail Technician' }
      ].filter(u => u.id);

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ category: update.category })
          .eq('id', update.id);

        if (!updateError) {
          console.log(`✓ Updated employee to ${update.category}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkEmployees();
