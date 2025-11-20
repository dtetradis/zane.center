require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addWorkHours() {
  console.log('Adding work hours to test-salon...');

  const workDays = [
    { day: 'Monday', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 'Tuesday', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 'Wednesday', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 'Thursday', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 'Friday', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 'Saturday', startTime: '10:00', endTime: '16:00', enabled: true },
    { day: 'Sunday', startTime: '10:00', endTime: '16:00', enabled: false },
  ];

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id')
    .eq('store_name', 'test-salon')
    .single();

  if (storeError) {
    console.error('Error finding store:', storeError);
    return;
  }

  console.log('Found store:', store.id);

  const { data, error } = await supabase
    .from('stores')
    .update({ work_days: workDays })
    .eq('id', store.id)
    .select();

  if (error) {
    console.error('Error updating work hours:', error);
  } else {
    console.log('Work hours updated successfully!');
    console.log(JSON.stringify(data, null, 2));
  }
}

addWorkHours().catch(console.error);
