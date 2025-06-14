/*
  # Fix Profile Creation RLS Policies

  1. Problem
    - The existing RLS policies are too restrictive for the auth trigger
    - The trigger runs as the service role but policies are blocking profile creation

  2. Solution
    - Update RLS policies to allow the trigger function to work properly
    - Ensure the handle_new_user() function can create profiles during signup
    - Keep security intact for normal operations

  3. Changes
    - Drop conflicting policies
    - Create proper policies that work with Supabase auth triggers
    - Ensure the trigger function has the right permissions
*/

-- Drop all existing policies to start fresh
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable profile creation for authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profiles" ON profiles;
    DROP POLICY IF EXISTS "Allow anon to read basic profile info" ON profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
    DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
    DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore if policies don't exist
END $$;

-- Create policies that work with Supabase's auth system

-- Allow service role to manage all profiles (needed for triggers)
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

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile (backup for manual creation)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the handle_new_user function exists and is properly configured
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
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
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;