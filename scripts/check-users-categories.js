const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hhywaddenwmiktdtnxtz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTA4MjEsImV4cCI6MjA3OTEyNjgyMX0.Sle1McJ5I7DhHxrZ31eDqIuXLHgeBwHfZKAgf2vL31w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersAndCategories() {
  // Get all users/employees
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, category, role, id_store')
    .in('role', ['employee', 'admin', 'owner'])
    .order('category');

  if (usersError) {
    console.log('Error fetching users:', usersError);
    return;
  }

  console.log('\n=== USERS/EMPLOYEES ===');
  users.forEach(user => {
    console.log(`Email: ${user.email}, Category: ${user.category}, Role: ${user.role}, Store ID: ${user.id_store}`);
  });

  // Get all stores
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, store_name, title');

  if (!storesError) {
    console.log('\n=== STORES ===');
    stores.forEach(store => {
      console.log(`ID: ${store.id}, Name: ${store.store_name}, Title: ${store.title}`);
    });
  }

  // Get existing services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, service_name, profession, category, id_store')
    .order('profession');

  if (!servicesError) {
    console.log('\n=== EXISTING SERVICES ===');
    services.forEach(service => {
      console.log(`Service: ${service.service_name}, Profession: ${service.profession}, Category: ${service.category}`);
    });
  }

  // Group users by category
  const categoryCounts = {};
  users.forEach(user => {
    if (user.category) {
      categoryCounts[user.category] = (categoryCounts[user.category] || 0) + 1;
    }
  });

  console.log('\n=== CATEGORIES SUMMARY ===');
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`${category}: ${count} employee(s)`);
  });
}

checkUsersAndCategories();
