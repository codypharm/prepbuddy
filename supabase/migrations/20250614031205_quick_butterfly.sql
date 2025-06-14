/*
  # Fix Profile RLS Policies for Sign-up

  1. Security Updates
    - Update RLS policies to allow profile creation during sign-up
    - Add policy for service role to insert profiles
    - Ensure proper authentication flow

  2. Changes
    - Drop existing restrictive INSERT policy
    - Add new INSERT policy that allows users to create their own profile
    - Add policy for service role operations
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that allows users to create their own profile
-- This policy allows authenticated users to insert a profile with their own user ID
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow the service role to insert profiles (for server-side operations)
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Ensure the existing SELECT and UPDATE policies are correct
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a policy to allow anon users to read public profile data if needed
-- (This might be needed for some operations, but we'll keep it restrictive)
CREATE POLICY "Allow anon to read basic profile info"
  ON profiles
  FOR SELECT
  TO anon
  USING (false); -- Disabled for now, can be enabled if needed