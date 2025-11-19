-- Create test store with sample data
-- Run this in Supabase SQL Editor

-- Create the test store
INSERT INTO stores (store_name, title, address, work_days, categories, whitelist, theme_colors, reviews)
VALUES (
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
);

-- Get the store ID and create services
DO $$
DECLARE
  test_store_id UUID;
BEGIN
  SELECT id INTO test_store_id FROM stores WHERE store_name = 'test-salon';

  -- Create sample services
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

END $$;

SELECT 'Test store created successfully!' as message;
SELECT 'Store URL: /test-salon' as url;
SELECT 'Whitelisted emails: test@example.com, owner@test.com' as whitelist;
