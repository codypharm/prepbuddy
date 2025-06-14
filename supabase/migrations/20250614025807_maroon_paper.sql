/*
  # Fix profiles table INSERT policy

  1. Security Changes
    - Add INSERT policy for profiles table to allow authenticated users to create their own profile
    - This resolves the "new row violates row-level security policy" error during sign-up

  The policy ensures users can only insert a profile where the id matches their authenticated user ID.
*/

-- Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy that allows users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);