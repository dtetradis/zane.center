require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestStore() {
  console.log('Creating test store...');

  // Create the test store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      store_name: 'test-salon',
      title: 'Test Beauty Salon',
      address: '456 Test Street, Athens, Greece',
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
      whitelist: ['test@example.com', 'owner@test.com'],
      theme_colors: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryLight: '#93c5fd',
        secondary: '#64748b',
        accent: '#f59e0b'
      },
      reviews: 4.8
    })
    .select()
    .single();

  if (storeError) {
    console.error('Error creating store:', storeError);
    return;
  }

  console.log('✓ Store created:', store.store_name);
  console.log('  Store ID:', store.id);

  // Create sample services
  const services = [
    { index: 0, service_name: "Women's Haircut", duration: 60, price: 35.00, description: 'Professional haircut with styling', profession: 'Hairstylist', category: 'Haircut' },
    { index: 1, service_name: "Men's Haircut", duration: 30, price: 20.00, description: "Classic men's haircut", profession: 'Barber', category: 'Haircut' },
    { index: 2, service_name: 'Hair Coloring', duration: 120, price: 80.00, description: 'Full hair coloring service', profession: 'Hairstylist', category: 'Haircut' },
    { index: 3, service_name: 'Manicure', duration: 45, price: 25.00, description: 'Classic manicure with polish', profession: 'Nail Technician', category: 'Nails' },
    { index: 4, service_name: 'Pedicure', duration: 60, price: 35.00, description: 'Relaxing pedicure treatment', profession: 'Nail Technician', category: 'Nails' },
    { index: 5, service_name: 'Gel Nails', duration: 90, price: 45.00, description: 'Long-lasting gel nail application', profession: 'Nail Technician', category: 'Nails' },
    { index: 6, service_name: 'Facial Treatment', duration: 60, price: 50.00, description: 'Deep cleansing facial', profession: 'Beautician', category: 'Beauty' },
    { index: 7, service_name: 'Massage - 30min', duration: 30, price: 30.00, description: 'Relaxing massage session', profession: 'Massage Therapist', category: 'Spa' },
    { index: 8, service_name: 'Massage - 60min', duration: 60, price: 55.00, description: 'Full body massage', profession: 'Massage Therapist', category: 'Spa' }
  ];

  const servicesWithStoreId = services.map(service => ({
    ...service,
    id_store: store.id
  }));

  const { error: servicesError } = await supabase
    .from('services')
    .insert(servicesWithStoreId);

  if (servicesError) {
    console.error('Error creating services:', servicesError);
    return;
  }

  console.log('✓ Created', services.length, 'services');

  console.log('\n=== Test Store Created Successfully! ===');
  console.log('Store URL: http://localhost:3000/test-salon');
  console.log('Whitelisted emails: test@example.com, owner@test.com');
  console.log('\nTo access the dashboard:');
  console.log('1. Sign up at: http://localhost:3000/test-salon/dashboard/signup');
  console.log('2. Use one of the whitelisted emails above');
  console.log('3. After signup, run the grant-owner script to become an owner');
}

createTestStore().catch(console.error);
