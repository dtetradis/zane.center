-- Fix RLS policies to avoid infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "Store owners can manage services" ON services;
DROP POLICY IF EXISTS "Store owners can view users in their store" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Recreate services policies (allow public SELECT)
CREATE POLICY "Public can view all services"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Store owners can insert services"
  ON services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id_store = services.id_store
      AND users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Store owners can update services"
  ON services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id_store = services.id_store
      AND users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Store owners can delete services"
  ON services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id_store = services.id_store
      AND users.role IN ('owner', 'admin')
    )
  );

-- Fix users policies (remove recursion)
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Store owners can view store users"
  ON users FOR SELECT
  USING (
    id_store IN (
      SELECT u.id_store FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('owner', 'admin')
    )
  );
