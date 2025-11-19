-- Grant owner role to a user after they sign up
-- Replace 'test@example.com' with the actual email you used to sign up

-- Step 1: View all users (to find your user ID)
SELECT id, email, role, id_store FROM users;

-- Step 2: Get the test-salon store ID
SELECT id, store_name, title FROM stores WHERE store_name = 'test-salon';

-- Step 3: Grant owner role (replace the email with your actual signup email)
UPDATE users
SET
  role = 'owner',
  id_store = (SELECT id FROM stores WHERE store_name = 'test-salon')
WHERE email = 'test@example.com';  -- CHANGE THIS TO YOUR EMAIL

-- Step 4: Verify the update
SELECT id, email, role, id_store FROM users WHERE email = 'test@example.com';  -- CHANGE THIS TO YOUR EMAIL
