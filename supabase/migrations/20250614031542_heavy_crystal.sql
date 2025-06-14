/*
  # Fix Profile RLS Policies for Sign-up

  1. Security Updates
    - Drop existing problematic INSERT policy
    - Create new INSERT policy that works during sign-up
    - Add policy for service role to insert profiles during auth triggers
    - Ensure authenticated users can insert their own profiles

  2. Changes
    - Updated INSERT policies to handle sign-up flow properly
    - Added service role policy for automated profile creation
    - Maintained security while allowing proper profile creation
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Create a new INSERT policy that works properly during sign-up
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add a policy for service role to insert profiles (for auth triggers if needed)
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

-- Keep the anon policy for basic profile info (already exists but ensure it's correct)
DROP POLICY IF EXISTS "Allow anon to read basic profile info" ON profiles;
CREATE POLICY "Allow anon to read basic profile info"
  ON profiles
  FOR SELECT
  TO anon
  USING (false); -- This policy exists but doesn't allow access, keeping for consistency