require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReservations() {
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('store_name', 'test-salon')
    .single();

  console.log('Store ID:', store.id);

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('id_store', store.id)
    .order('date_time', { ascending: true });

  console.log('\nTotal reservations:', reservations?.length || 0);

  if (reservations && reservations.length > 0) {
    console.log('\nReservations:');
    reservations.forEach(r => {
      console.log(JSON.stringify(r, null, 2));
    });
  }

  const { data: employees } = await supabase
    .from('users')
    .select('id, email, category, role')
    .eq('id_store', store.id)
    .in('role', ['employee', 'admin', 'owner']);

  console.log('\nEmployees:', employees?.length || 0);
  if (employees && employees.length > 0) {
    employees.forEach(e => {
      console.log('  -', e.email, '(' + e.role + ')');
    });
  }
}

checkReservations().catch(console.error);
