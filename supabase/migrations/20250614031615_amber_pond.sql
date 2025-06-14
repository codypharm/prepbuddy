/*
  # Fix Profile RLS Policies for Sign-up

  1. Security Changes
    - Fix INSERT policy for profile creation during sign-up
    - Ensure service role can insert profiles if needed
    - Maintain proper RLS for SELECT and UPDATE operations
    - Keep anon policy consistent

  2. Changes Made
    - Replace problematic INSERT policy with working version
    - Add service role INSERT policy (if not exists)
    - Ensure all policies use consistent auth.uid() checks
    - Maintain security while fixing sign-up flow
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
-- Use DO block to avoid "already exists" error
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Service role can insert profiles'
  ) THEN
    CREATE POLICY "Service role can insert profiles"
      ON profiles
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

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