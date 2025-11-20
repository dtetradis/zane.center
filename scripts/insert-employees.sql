-- Insert test employees into users table
-- Run this in Supabase SQL Editor

-- Get the store ID
DO $$
DECLARE
  test_store_id UUID;
BEGIN
  SELECT id INTO test_store_id FROM stores WHERE store_name = 'test-salon';

  -- Insert employees (using the auth user IDs that were created)
  INSERT INTO users (id, role, category, store_name, id_store, email, phone)
  VALUES
    (
      'eeb11e6f-6854-4dd7-99ed-a170bec39d43'::uuid,
      'employee',
      'Hairstylist',
      'test-salon',
      test_store_id,
      'maria.hairstylist@test-salon.com',
      '+30 210 123 4567'
    ),
    (
      '12e36636-c026-47c5-8c37-7ccc344e0d4c'::uuid,
      'employee',
      'Nail Technician',
      'test-salon',
      test_store_id,
      'john.nails@test-salon.com',
      '+30 210 123 4568'
    )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    category = EXCLUDED.category,
    store_name = EXCLUDED.store_name,
    id_store = EXCLUDED.id_store,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

END $$;

-- Verify employees
SELECT
  email,
  role,
  category,
  phone,
  store_name
FROM users
WHERE id_store = (SELECT id FROM stores WHERE store_name = 'test-salon');
