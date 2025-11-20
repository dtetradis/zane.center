const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestEmployees() {
  try {
    // Get the test store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, store_name, title')
      .eq('store_name', 'test-salon')
      .single();

    if (storeError) {
      console.error('Error fetching store:', storeError);
      return;
    }

    console.log('Found store:', store.title);
    console.log('Store ID:', store.id);

    // Create auth users first
    const employees = [
      {
        email: 'maria.hairstylist@test-salon.com',
        password: 'password123',
        category: 'Hairstylist',
        phone: '+30 210 123 4567'
      },
      {
        email: 'john.nails@test-salon.com',
        password: 'password123',
        category: 'Nail Technician',
        phone: '+30 210 123 4568'
      }
    ];

    for (const emp of employees) {
      console.log(`\nCreating employee: ${emp.email}`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: emp.email,
        password: emp.password,
        email_confirm: true,
        user_metadata: {
          role: 'employee',
          category: emp.category
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        continue;
      }

      console.log('Auth user created:', authData.user.id);

      // Insert into users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          role: 'employee',
          category: emp.category,
          store_name: store.store_name,
          id_store: store.id,
          email: emp.email,
          phone: emp.phone
        })
        .select();

      if (userError) {
        console.error('Error creating user record:', userError);
      } else {
        console.log('✓ Employee created successfully!');
      }
    }

    // Verify employees were created
    console.log('\n--- Employees in test-salon ---');
    const { data: allEmployees } = await supabase
      .from('users')
      .select('email, role, category, phone')
      .eq('id_store', store.id);

    console.table(allEmployees);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addTestEmployees();
