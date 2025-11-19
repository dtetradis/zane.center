const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking database...\n');

  // Check stores
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*');

  if (storesError) {
    console.error('❌ Error fetching stores:', storesError.message);
  } else {
    console.log(`✅ Stores: ${stores.length} found`);
    stores.forEach(s => console.log(`   - ${s.store_name} (ID: ${s.id})`));
  }

  // Check services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*');

  if (servicesError) {
    console.error('❌ Error fetching services:', servicesError.message);
  } else {
    console.log(`\n✅ Services: ${services.length} found`);
    if (services.length > 0) {
      services.slice(0, 5).forEach(s => console.log(`   - ${s.service_name} (€${s.price})`));
      if (services.length > 5) console.log(`   ... and ${services.length - 5} more`);
    }
  }

  console.log('\n');
}

checkData();
