require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDelete() {
  // Get a reservation
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .limit(1);

  if (!reservations || reservations.length === 0) {
    console.log('No reservations to test delete');
    return;
  }

  const testRes = reservations[0];
  console.log('Test reservation:', testRes.id, testRes.name);

  // Try to delete it
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', testRes.id);

  if (error) {
    console.log('Delete error:', error);
  } else {
    console.log('Delete successful');

    // Verify it's gone
    const { data: check } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', testRes.id);

    console.log('Verification - found:', check?.length || 0, 'records');
  }
}

testDelete().catch(console.error);
