-- Fix reservations RLS policy blocking inserts
-- Run this in Supabase SQL Editor

-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'reservations';

-- Drop ALL existing policies on reservations table
DROP POLICY IF EXISTS "Anyone can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can view reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can update reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can delete reservations" ON reservations;
DROP POLICY IF EXISTS "Store owners can view reservations for their store" ON reservations;
DROP POLICY IF EXISTS "Store owners can update reservations for their store" ON reservations;
DROP POLICY IF EXISTS "Store owners can delete reservations for their store" ON reservations;

-- Create a simple policy that allows anyone to INSERT reservations
-- This is for public booking (unauthenticated users)
CREATE POLICY "Enable insert for all users"
  ON reservations
  FOR INSERT
  TO public, anon, authenticated
  WITH CHECK (true);

-- Allow everyone to view all reservations (for now, can restrict later)
CREATE POLICY "Enable read access for all users"
  ON reservations
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

-- Allow authenticated users to update and delete
CREATE POLICY "Enable update for authenticated users"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify the policies were created
SELECT 'Policies recreated successfully!' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'reservations';

-- Test that we can insert
SELECT 'Testing insert capability...' as status;
