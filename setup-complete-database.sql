-- =====================================================
-- COMPLETE DATABASE SETUP FOR ZANE CENTER
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  reviews DECIMAL(2,1) DEFAULT 0,
  photos TEXT[],
  store_name TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  work_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories TEXT[] NOT NULL DEFAULT '{}',
  blocked_dates TEXT[] DEFAULT '{}',
  whitelist TEXT[] DEFAULT '{}',
  theme_colors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW())
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  category TEXT,
  store_name TEXT,
  id_store UUID REFERENCES stores(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW())
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_store UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  profession TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW()),
  UNIQUE(id_store, index)
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  note TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  service_duration INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  id_store UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  employee TEXT,
  profession TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW())
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_id_store ON users(id_store);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_services_id_store ON services(id_store);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_reservations_id_store ON reservations(id_store);
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(date_time);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(email);
CREATE INDEX IF NOT EXISTS idx_stores_store_name ON stores(store_name);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public stores are viewable by everyone" ON stores;
DROP POLICY IF EXISTS "Store owners can update their own store" ON stores;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Store owners can view users in their store" ON users;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "Store owners can manage services" ON services;
DROP POLICY IF EXISTS "Anyone can create reservations" ON reservations;
DROP POLICY IF EXISTS "Store owners can view reservations for their store" ON reservations;
DROP POLICY IF EXISTS "Store owners can update reservations for their store" ON reservations;
DROP POLICY IF EXISTS "Store owners can delete reservations for their store" ON reservations;

-- Stores policies
CREATE POLICY "Public stores are viewable by everyone"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "Store owners can update their own store"
  ON stores FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = stores.id));

-- Users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Store owners can view users in their store"
  ON users FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = users.id_store AND role IN ('owner', 'admin')));

-- Services policies
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage services"
  ON services FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = services.id_store AND role IN ('owner', 'admin')));

-- Reservations policies
CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Store owners can view reservations for their store"
  ON reservations FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = reservations.id_store));

CREATE POLICY "Store owners can update reservations for their store"
  ON reservations FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = reservations.id_store));

CREATE POLICY "Store owners can delete reservations for their store"
  ON reservations FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = reservations.id_store));

-- =====================================================
-- CREATE TRIGGER FUNCTION
-- =====================================================

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to automatically create user record after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INSERT TEST STORE DATA
-- =====================================================

-- Insert test salon (only if it doesn't exist)
INSERT INTO stores (store_name, title, address, work_days, categories, whitelist, theme_colors, reviews)
SELECT
  'test-salon',
  'Test Beauty Salon',
  '456 Test Street, Athens, Greece',
  '[
    {"day": "Monday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Tuesday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Wednesday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Thursday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Friday", "startTime": "09:00", "endTime": "20:00", "enabled": true},
    {"day": "Saturday", "startTime": "10:00", "endTime": "16:00", "enabled": true},
    {"day": "Sunday", "startTime": "00:00", "endTime": "00:00", "enabled": false}
  ]'::jsonb,
  ARRAY['Beauty', 'Haircut', 'Spa', 'Nails'],
  ARRAY['test@example.com', 'owner@test.com'],
  '{"primary": "#3b82f6", "primaryHover": "#2563eb", "primaryLight": "#93c5fd", "secondary": "#64748b", "accent": "#f59e0b"}'::jsonb,
  4.8
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_name = 'test-salon');

-- Insert test services
DO $$
DECLARE
  test_store_id UUID;
BEGIN
  -- Get the test store ID
  SELECT id INTO test_store_id FROM stores WHERE store_name = 'test-salon';

  -- Only insert if services don't exist for this store
  IF NOT EXISTS (SELECT 1 FROM services WHERE id_store = test_store_id) THEN
    INSERT INTO services (id_store, index, service_name, duration, price, description, profession, category)
    VALUES
      (test_store_id, 0, 'Women''s Haircut', 60, 35.00, 'Professional haircut with styling', 'Hairstylist', 'Haircut'),
      (test_store_id, 1, 'Men''s Haircut', 30, 20.00, 'Classic men''s haircut', 'Barber', 'Haircut'),
      (test_store_id, 2, 'Hair Coloring', 120, 80.00, 'Full hair coloring service', 'Hairstylist', 'Haircut'),
      (test_store_id, 3, 'Manicure', 45, 25.00, 'Classic manicure with polish', 'Nail Technician', 'Nails'),
      (test_store_id, 4, 'Pedicure', 60, 35.00, 'Relaxing pedicure treatment', 'Nail Technician', 'Nails'),
      (test_store_id, 5, 'Gel Nails', 90, 45.00, 'Long-lasting gel nail application', 'Nail Technician', 'Nails'),
      (test_store_id, 6, 'Facial Treatment', 60, 50.00, 'Deep cleansing facial', 'Beautician', 'Beauty'),
      (test_store_id, 7, 'Massage - 30min', 30, 30.00, 'Relaxing massage session', 'Massage Therapist', 'Spa'),
      (test_store_id, 8, 'Massage - 60min', 60, 55.00, 'Full body massage', 'Massage Therapist', 'Spa'),
      (test_store_id, 9, 'Eyebrow Shaping', 20, 15.00, 'Professional eyebrow shaping', 'Beautician', 'Beauty');
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT store_name, title, array_length(categories, 1) as num_categories FROM stores;
SELECT COUNT(*) as total_services FROM services WHERE id_store = (SELECT id FROM stores WHERE store_name = 'test-salon');

-- =====================================================
-- NEXT STEPS
-- =====================================================

/*
✅ Database is now set up!

📍 Next steps:
1. Visit your site: http://localhost:3000/test-salon
2. Sign up at: http://localhost:3000/test-salon/dashboard/signup
3. Use one of these emails: test@example.com or owner@test.com
4. After signup, run this SQL to become an owner:

   UPDATE users
   SET role = 'owner', id_store = (SELECT id FROM stores WHERE store_name = 'test-salon')
   WHERE email = 'YOUR_EMAIL@example.com';

Whitelisted emails for test-salon: test@example.com, owner@test.com
*/
