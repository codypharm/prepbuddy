/*
  # Fix Profile RLS Policies for Sign-up

  1. Security Updates
    - Drop existing problematic policies
    - Create new policies that work correctly during sign-up
    - Add policy for service role to handle edge cases
    - Ensure proper auth context handling

  2. Changes
    - Updated INSERT policy to handle sign-up flow
    - Added service role policy for system operations
    - Improved policy conditions for better reliability
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Enable profile creation for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON profiles;
DROP POLICY IF EXISTS "Allow anon to read basic profile info" ON profiles;

-- Create a more permissive INSERT policy for sign-up
CREATE POLICY "Enable profile creation during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if the user ID matches the authenticated user
    auth.uid() = id
    OR
    -- Allow if this is during the sign-up process (within 5 minutes of user creation)
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = profiles.id 
      AND auth.users.created_at > NOW() - INTERVAL '5 minutes'
    )
  );

-- Keep existing SELECT policy for own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Keep existing UPDATE policy
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add service role policy for system operations
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to handle profile creation during sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar_url,
    bio,
    learning_goals,
    preferred_study_time,
    study_level,
    timezone,
    preferences,
    stats,
    created_at,
    updated_at,
    last_login_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || encode(NEW.id::text::bytea, 'base64'),
    NULL,
    ARRAY['Improve my skills', 'Learn new technologies', 'Advance my career'],
    'evening'::study_time,
    'intermediate'::study_difficulty,
    'UTC',
    jsonb_build_object(
      'theme', 'light',
      'notifications', true,
      'studyReminders', true,
      'weeklyReports', true
    ),
    jsonb_build_object(
      'level', 1,
      'totalXP', 0,
      'currentStreak', 0,
      'longestStreak', 0,
      'plansCompleted', 0,
      'totalStudyTime', 0
    ),
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();