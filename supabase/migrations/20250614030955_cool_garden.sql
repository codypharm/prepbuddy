/*
  # Fix profiles table RLS policies

  1. Security Updates
    - Drop existing inconsistent RLS policies on profiles table
    - Create new consistent RLS policies using auth.uid()
    - Ensure all policies use the same UUID casting approach
    
  2. Changes
    - Replace custom uid() function calls with standard auth.uid()
    - Use consistent UUID casting for all policies
    - Maintain same permissions (users can manage their own profiles)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new consistent policies using auth.uid()
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