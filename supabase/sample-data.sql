-- Sample data for Zane Center
-- Run this after setting up the main schema

-- Create a demo store
INSERT INTO stores (store_name, title, address, work_days, categories, whitelist, theme_colors)
VALUES (
  'demo',
  'Demo Beauty Salon',
  '123 Main Street, Athens, Greece',
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
  ARRAY['demo@example.com', 'owner@example.com'],
  '{"primary": "#3b82f6", "primaryHover": "#2563eb", "primaryLight": "#93c5fd", "secondary": "#64748b", "accent": "#f59e0b"}'::jsonb
);

-- Get the store ID for reference
DO $$
DECLARE
  demo_store_id UUID;
BEGIN
  SELECT id INTO demo_store_id FROM stores WHERE store_name = 'demo';

  -- Create sample services
  INSERT INTO services (id_store, index, service_name, duration, price, description, profession, category)
  VALUES
    (demo_store_id, 0, 'Women''s Haircut', 60, 35.00, 'Professional haircut with styling', 'Hairstylist', 'Haircut'),
    (demo_store_id, 1, 'Men''s Haircut', 30, 20.00, 'Classic men''s haircut', 'Barber', 'Haircut'),
    (demo_store_id, 2, 'Hair Coloring', 120, 80.00, 'Full hair coloring service', 'Hairstylist', 'Haircut'),
    (demo_store_id, 3, 'Manicure', 45, 25.00, 'Classic manicure with polish', 'Nail Technician', 'Nails'),
    (demo_store_id, 4, 'Pedicure', 60, 35.00, 'Relaxing pedicure treatment', 'Nail Technician', 'Nails'),
    (demo_store_id, 5, 'Gel Nails', 90, 45.00, 'Long-lasting gel nail application', 'Nail Technician', 'Nails'),
    (demo_store_id, 6, 'Facial Treatment', 60, 50.00, 'Deep cleansing facial', 'Beautician', 'Beauty'),
    (demo_store_id, 7, 'Massage - 30min', 30, 30.00, 'Relaxing massage session', 'Massage Therapist', 'Spa'),
    (demo_store_id, 8, 'Massage - 60min', 60, 55.00, 'Full body massage', 'Massage Therapist', 'Spa'),
    (demo_store_id, 9, 'Eyebrow Shaping', 20, 15.00, 'Professional eyebrow shaping', 'Beautician', 'Beauty'),
    (demo_store_id, 10, 'Makeup Application', 45, 40.00, 'Professional makeup for events', 'Makeup Artist', 'Beauty'),
    (demo_store_id, 11, 'Beard Trim', 20, 15.00, 'Professional beard trimming and styling', 'Barber', 'Haircut');

  -- Create sample reservations (for testing)
  INSERT INTO reservations (name, email, phone, date_time, service_duration, service_name, id_store, profession, note)
  VALUES
    (
      'John Doe',
      'john@example.com',
      '+30 123 456 7890',
      TIMEZONE('Europe/Athens', NOW() + INTERVAL '2 days'),
      60,
      'Women''s Haircut',
      demo_store_id,
      'Hairstylist',
      'Please use organic products'
    ),
    (
      'Maria Smith',
      'maria@example.com',
      '+30 098 765 4321',
      TIMEZONE('Europe/Athens', NOW() + INTERVAL '3 days'),
      45,
      'Manicure',
      demo_store_id,
      'Nail Technician',
      NULL
    ),
    (
      'George Brown',
      'george@example.com',
      '+30 111 222 3333',
      TIMEZONE('Europe/Athens', NOW() + INTERVAL '1 day'),
      30,
      'Men''s Haircut',
      demo_store_id,
      'Barber',
      'Short on the sides'
    );

END $$;

-- Note: To create a store owner account, you'll need to:
-- 1. Sign up through the app using one of the whitelisted emails above
-- 2. The trigger will automatically create a user record
-- 3. Then update the user role to 'owner':
--
-- UPDATE users
-- SET role = 'owner', id_store = (SELECT id FROM stores WHERE store_name = 'demo')
-- WHERE email = 'your-email@example.com';
