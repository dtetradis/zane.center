const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDemoStore() {
  console.log('🚀 Setting up demo store...\n');

  try {
    // Check if demo store already exists
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('store_name', 'demo')
      .single();

    if (existingStore) {
      console.log('ℹ️  Demo store already exists!');
      console.log(`   Store ID: ${existingStore.id}\n`);
      return existingStore.id;
    }

    // Create demo store
    console.log('📍 Creating demo store...');
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        store_name: 'demo',
        title: 'Demo Beauty Salon',
        address: '123 Main Street, Athens, Greece',
        work_days: [
          { day: 'Monday', startTime: '09:00', endTime: '18:00', enabled: true },
          { day: 'Tuesday', startTime: '09:00', endTime: '18:00', enabled: true },
          { day: 'Wednesday', startTime: '09:00', endTime: '18:00', enabled: true },
          { day: 'Thursday', startTime: '09:00', endTime: '18:00', enabled: true },
          { day: 'Friday', startTime: '09:00', endTime: '20:00', enabled: true },
          { day: 'Saturday', startTime: '10:00', endTime: '16:00', enabled: true },
          { day: 'Sunday', startTime: '00:00', endTime: '00:00', enabled: false }
        ],
        categories: ['Beauty', 'Haircut', 'Spa', 'Nails'],
        whitelist: ['demo@example.com', 'owner@example.com'],
        theme_colors: {
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          primaryLight: '#93c5fd',
          secondary: '#64748b',
          accent: '#f59e0b'
        }
      })
      .select()
      .single();

    if (storeError) throw storeError;

    console.log('✅ Demo store created!');
    console.log(`   Store ID: ${store.id}\n`);

    // Create sample services
    console.log('💅 Adding sample services...');
    const services = [
      { index: 0, service_name: "Women's Haircut", duration: 60, price: 35.00, description: 'Professional haircut with styling', profession: 'Hairstylist', category: 'Haircut' },
      { index: 1, service_name: "Men's Haircut", duration: 30, price: 20.00, description: "Classic men's haircut", profession: 'Barber', category: 'Haircut' },
      { index: 2, service_name: 'Hair Coloring', duration: 120, price: 80.00, description: 'Full hair coloring service', profession: 'Hairstylist', category: 'Haircut' },
      { index: 3, service_name: 'Manicure', duration: 45, price: 25.00, description: 'Classic manicure with polish', profession: 'Nail Technician', category: 'Nails' },
      { index: 4, service_name: 'Pedicure', duration: 60, price: 35.00, description: 'Relaxing pedicure treatment', profession: 'Nail Technician', category: 'Nails' },
      { index: 5, service_name: 'Gel Nails', duration: 90, price: 45.00, description: 'Long-lasting gel nail application', profession: 'Nail Technician', category: 'Nails' },
      { index: 6, service_name: 'Facial Treatment', duration: 60, price: 50.00, description: 'Deep cleansing facial', profession: 'Beautician', category: 'Beauty' },
      { index: 7, service_name: 'Massage - 30min', duration: 30, price: 30.00, description: 'Relaxing massage session', profession: 'Massage Therapist', category: 'Spa' },
      { index: 8, service_name: 'Massage - 60min', duration: 60, price: 55.00, description: 'Full body massage', profession: 'Massage Therapist', category: 'Spa' },
      { index: 9, service_name: 'Eyebrow Shaping', duration: 20, price: 15.00, description: 'Professional eyebrow shaping', profession: 'Beautician', category: 'Beauty' },
      { index: 10, service_name: 'Makeup Application', duration: 45, price: 40.00, description: 'Professional makeup for events', profession: 'Makeup Artist', category: 'Beauty' },
      { index: 11, service_name: 'Beard Trim', duration: 20, price: 15.00, description: 'Professional beard trimming and styling', profession: 'Barber', category: 'Haircut' }
    ];

    const servicesWithStoreId = services.map(s => ({ ...s, id_store: store.id }));

    const { error: servicesError } = await supabase
      .from('services')
      .insert(servicesWithStoreId);

    if (servicesError) throw servicesError;

    console.log(`✅ Added ${services.length} sample services!\n`);

    console.log('🎉 Setup complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Visit http://localhost:3002/demo to see the store');
    console.log('   2. Browse services and add to cart');
    console.log('   3. Sign up at http://localhost:3002/demo/dashboard/signup');
    console.log('   4. Use email: demo@example.com or owner@example.com\n');
    console.log('💡 After signup, update your role in Supabase to "owner" to access dashboard features');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) console.error('   Details:', error.details);
    if (error.hint) console.error('   Hint:', error.hint);
    process.exit(1);
  }
}

setupDemoStore();
