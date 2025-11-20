-- Add test employees to the test-salon store
-- Run this in Supabase SQL Editor

-- Get the test store ID
DO $$
DECLARE
  test_store_id UUID;
  employee1_id UUID := gen_random_uuid();
  employee2_id UUID := gen_random_uuid();
BEGIN
  -- Get store ID
  SELECT id INTO test_store_id FROM stores WHERE store_name = 'test-salon';

  -- Create fake auth users first (needed for foreign key constraint)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES
    (employee1_id, 'maria.hairstylist@test-salon.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (employee2_id, 'john.nails@test-salon.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Insert employees into users table
  INSERT INTO users (id, role, category, store_name, id_store, email, phone)
  VALUES
    (
      employee1_id,
      'employee',
      'Hairstylist',
      'test-salon',
      test_store_id,
      'maria.hairstylist@test-salon.com',
      '+30 210 123 4567'
    ),
    (
      employee2_id,
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

  RAISE NOTICE 'Employees added successfully!';
END $$;

-- Verify employees were created
SELECT
  u.email,
  u.role,
  u.category,
  u.store_name,
  s.title as store_title
FROM users u
JOIN stores s ON u.id_store = s.id
WHERE s.store_name = 'test-salon';
