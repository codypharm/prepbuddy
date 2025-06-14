/*
  # Reset Row Level Security for profiles table

  1. Security
    - Drop existing policies on profiles table
    - Enable RLS on profiles table
    - Add policies for authenticated users to manage their own profiles
    - Add policy for service role to manage all profiles
    - Add policy for trigger functions to create profiles

  2. Changes
    - Allow authenticated users to read, insert, and update their own profiles
    - Allow service role full access for administrative operations
    - Allow profile creation during user registration via triggers
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for administrative operations)
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow profile creation during user registration (for triggers)
CREATE POLICY "Allow profile creation during registration"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);