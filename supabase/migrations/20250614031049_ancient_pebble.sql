/*
  # Fix RLS policies for profiles table

  1. Changes
    - Drop existing RLS policies that use `uid()` function
    - Create new RLS policies using `auth.uid()` function
    - Ensure authenticated users can create, read, and update their own profiles

  2. Security
    - Maintain RLS protection while fixing the authentication function reference
    - Users can only access their own profile data
*/

-- Drop existing policies that use the incorrect uid() function
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies using the correct auth.uid() function
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);