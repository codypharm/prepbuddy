/*
  # Fix Profile RLS Policies for Sign-up

  1. Security Changes
    - Drop all existing conflicting policies safely
    - Create new policies that allow profile creation during sign-up
    - Add service role policy for system operations
    - Create automatic profile creation trigger

  2. New Policies
    - Enable profile creation during signup (more permissive INSERT)
    - Users can read own profile
    - Users can update own profile  
    - Service role can manage profiles

  3. Automation
    - Trigger function to auto-create profiles on user signup
    - Handles all required profile fields with sensible defaults
*/

-- Drop all existing policies safely
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Enable profile creation for authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow anon to read basic profile info" ON profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
    DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if policies don't exist
END $$;

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

-- Create SELECT policy for own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create UPDATE policy
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

-- Create or replace function to handle profile creation during sign-up
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
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();