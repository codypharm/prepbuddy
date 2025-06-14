/*
  # Fix Profile Creation RLS Policy

  1. Security Updates
    - Add policy to allow users to insert their own profile during sign-up
    - Ensure the policy works with Supabase Auth's user creation flow
    - Maintain security by only allowing users to create profiles for themselves

  2. Changes
    - Add INSERT policy that allows authenticated users to create profiles with their own user ID
    - This policy will work during the sign-up process when auth.uid() is available
*/

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Create a comprehensive INSERT policy for profiles
CREATE POLICY "Enable profile creation for authenticated users"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure we have a policy for service role (for any admin operations)
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure the profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;