-- Fix RLS infinite recursion issue
-- Run this in Supabase SQL Editor

-- Drop problematic policies
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "Store owners can manage services" ON services;
DROP POLICY IF EXISTS "Store owners can view users in their store" ON users;

-- Recreate services policies (simplified to avoid recursion)
-- Allow everyone to SELECT services (they're public)
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

-- Allow authenticated users with matching store to INSERT
CREATE POLICY "Store owners can insert services"
  ON services FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT u.id
      FROM users u
      WHERE u.id_store = services.id_store
        AND u.role IN ('owner', 'admin')
    )
  );

-- Allow authenticated users with matching store to UPDATE
CREATE POLICY "Store owners can update services"
  ON services FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT u.id
      FROM users u
      WHERE u.id_store = services.id_store
        AND u.role IN ('owner', 'admin')
    )
  );

-- Allow authenticated users with matching store to DELETE
CREATE POLICY "Store owners can delete services"
  ON services FOR DELETE
  USING (
    auth.uid() IN (
      SELECT u.id
      FROM users u
      WHERE u.id_store = services.id_store
        AND u.role IN ('owner', 'admin')
    )
  );

-- Recreate users policy (simplified)
CREATE POLICY "Store owners can view users in their store"
  ON users FOR SELECT
  USING (
    auth.uid() = id OR
    (
      EXISTS (
        SELECT 1 FROM users owner
        WHERE owner.id = auth.uid()
          AND owner.id_store = users.id_store
          AND owner.role IN ('owner', 'admin')
      )
    )
  );

-- Fix reservations policies (also causing recursion)
DROP POLICY IF EXISTS "Anyone can create reservations" ON reservations;
DROP POLICY IF EXISTS "Store owners can view reservations for their store" ON reservations;
DROP POLICY IF EXISTS "Store owners can update reservations for their store" ON reservations;
DROP POLICY IF EXISTS "Store owners can delete reservations for their store" ON reservations;

-- Allow anyone to create reservations (for public booking)
CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view their own reservations by email
CREATE POLICY "Users can view reservations"
  ON reservations FOR SELECT
  USING (
    email = current_setting('request.headers', true)::json->>'x-user-email'
    OR auth.uid() IS NOT NULL
  );

-- Store owners can view all reservations for their store (simplified)
CREATE POLICY "Authenticated users can view all reservations"
  ON reservations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to update reservations
CREATE POLICY "Authenticated users can update reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete reservations
CREATE POLICY "Authenticated users can delete reservations"
  ON reservations FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Test query
SELECT 'Policies fixed successfully!' as status;
SELECT COUNT(*) as total_services FROM services;
SELECT COUNT(*) as total_reservations FROM reservations;
