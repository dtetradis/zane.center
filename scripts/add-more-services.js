require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMoreServices() {
  console.log('🎨 Adding more services to test-salon...\n');

  try {
    // Get the test-salon store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('store_name', 'test-salon')
      .single();

    if (storeError || !store) {
      console.error('❌ Could not find test-salon store:', storeError?.message);
      return;
    }

    console.log('✓ Found test-salon store:', store.id);

    // Get current service count to set proper indexes
    const { count } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('id_store', store.id);

    const startIndex = count || 0;
    console.log('Current services:', startIndex);

    // Additional services to add
    const newServices = [
      // More Hair Services
      { service_name: 'Blowdry & Style', duration: 45, price: 30.00, description: 'Professional blow dry and styling', profession: 'Hairstylist', category: 'Haircut' },
      { service_name: 'Hair Treatment', duration: 60, price: 45.00, description: 'Deep conditioning hair treatment', profession: 'Hairstylist', category: 'Haircut' },
      { service_name: 'Highlights', duration: 150, price: 120.00, description: 'Full or partial highlights', profession: 'Hair Colorist', category: 'Haircut' },
      { service_name: 'Balayage', duration: 180, price: 150.00, description: 'Natural-looking hair painting technique', profession: 'Hair Colorist', category: 'Haircut' },

      // Beauty Services
      { service_name: 'Makeup - Natural', duration: 30, price: 35.00, description: 'Natural everyday makeup', profession: 'Makeup Artist', category: 'Beauty' },
      { service_name: 'Makeup - Bridal', duration: 90, price: 100.00, description: 'Full bridal makeup with trial', profession: 'Makeup Artist', category: 'Beauty' },
      { service_name: 'Eyelash Extensions', duration: 120, price: 80.00, description: 'Classic or volume lash extensions', profession: 'Lash Technician', category: 'Beauty' },
      { service_name: 'Lash Lift & Tint', duration: 60, price: 55.00, description: 'Lash lift with tinting', profession: 'Lash Technician', category: 'Beauty' },
      { service_name: 'Brow Tinting', duration: 20, price: 18.00, description: 'Eyebrow tinting service', profession: 'Beautician', category: 'Beauty' },

      // Nail Services
      { service_name: 'Acrylic Nails - Full Set', duration: 120, price: 65.00, description: 'Full set of acrylic nails', profession: 'Nail Technician', category: 'Nails' },
      { service_name: 'Nail Art', duration: 30, price: 20.00, description: 'Custom nail art design', profession: 'Nail Technician', category: 'Nails' },
      { service_name: 'Gel Removal', duration: 30, price: 15.00, description: 'Safe gel polish removal', profession: 'Nail Technician', category: 'Nails' },

      // Spa & Wellness
      { service_name: 'Aromatherapy Massage', duration: 90, price: 75.00, description: 'Relaxing aromatherapy massage', profession: 'Massage Therapist', category: 'Spa' },
      { service_name: 'Hot Stone Massage', duration: 75, price: 85.00, description: 'Therapeutic hot stone massage', profession: 'Massage Therapist', category: 'Spa' },
      { service_name: 'Body Scrub', duration: 45, price: 60.00, description: 'Exfoliating body scrub treatment', profession: 'Spa Therapist', category: 'Spa' },
      { service_name: 'Deep Tissue Massage', duration: 60, price: 70.00, description: 'Intensive deep tissue massage', profession: 'Massage Therapist', category: 'Spa' },

      // Facial Treatments
      { service_name: 'Anti-Aging Facial', duration: 75, price: 80.00, description: 'Advanced anti-aging facial treatment', profession: 'Esthetician', category: 'Beauty' },
      { service_name: 'Acne Treatment Facial', duration: 60, price: 65.00, description: 'Specialized acne treatment', profession: 'Esthetician', category: 'Beauty' },
      { service_name: 'Hydrating Facial', duration: 60, price: 55.00, description: 'Deep hydration facial', profession: 'Beautician', category: 'Beauty' },

      // Waxing Services
      { service_name: 'Full Leg Wax', duration: 45, price: 40.00, description: 'Complete leg waxing', profession: 'Beautician', category: 'Beauty' },
      { service_name: 'Brazilian Wax', duration: 30, price: 45.00, description: 'Brazilian waxing service', profession: 'Waxing Specialist', category: 'Beauty' },
      { service_name: 'Upper Lip Wax', duration: 10, price: 10.00, description: 'Upper lip waxing', profession: 'Beautician', category: 'Beauty' },
    ];

    // Add indexes
    const servicesWithIndex = newServices.map((service, index) => ({
      ...service,
      index: startIndex + index,
      id_store: store.id
    }));

    const { data, error } = await supabase
      .from('services')
      .insert(servicesWithIndex)
      .select();

    if (error) {
      console.error('❌ Error adding services:', error.message);
      return;
    }

    console.log(`\n✅ Successfully added ${newServices.length} new services!`);
    console.log('\nNew services by category:');

    const byCategory = servicesWithIndex.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} services`);
    });

    console.log(`\n📊 Total services now: ${startIndex + newServices.length}`);
    console.log('\n🌐 Visit: http://localhost:3000/test-salon to see the new services!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

addMoreServices();
