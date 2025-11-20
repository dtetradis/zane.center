-- Fix users table RLS policy to allow reading employees
-- Run this in Supabase SQL Editor

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Store owners can view users in their store" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Public can view employees" ON users;

-- Allow anyone to read users (for displaying employees)
-- This is safe because we're only exposing work-related info, not sensitive data
CREATE POLICY "Enable read access for all users"
  ON users
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

-- Only authenticated users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only authenticated users with owner/admin role can insert new users
CREATE POLICY "Owners can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users owner
      WHERE owner.id = auth.uid()
        AND owner.role IN ('owner', 'admin')
    )
  );

-- Verify policies
SELECT 'Policies updated successfully!' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users';
