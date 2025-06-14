/*
  # Fix RLS policies for profiles table

  1. Security Changes
    - Drop existing restrictive INSERT policy for authenticated users
    - Create new INSERT policy that allows users to create their own profile
    - Ensure the policy uses auth.uid() correctly for new user registration

  2. Policy Updates
    - "Users can insert own profile" policy updated to work during sign-up
    - Maintains security by ensuring users can only create profiles for themselves
*/

-- Drop the existing INSERT policy that might be too restrictive
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that allows authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the service role can also insert profiles (for admin operations)
-- This policy should already exist but let's make sure it's correct
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Verify other policies are still in place and correct
-- Update the SELECT policy to ensure it works correctly
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Update the UPDATE policy to ensure it works correctly
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Keep the anon policy as is (it's already restrictive)
-- This allows anonymous users to read basic profile info if needed
-- but it's currently set to false, which is secure