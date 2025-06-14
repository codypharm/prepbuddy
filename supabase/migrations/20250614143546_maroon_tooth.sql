/*
  # Auth Error Handling Improvements

  This migration adds support for handling email verification errors and other auth-related issues.
  
  1. Creates auth_errors table to track authentication issues
  2. Adds policies to control access to the auth_errors table
  3. Creates helper functions for logging and resolving auth errors
  4. Adds indexes for better performance
*/

-- Create auth_errors table to track verification issues
CREATE TABLE IF NOT EXISTS auth_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- Enable RLS on auth_errors
ALTER TABLE auth_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for auth_errors - users can view their own errors
CREATE POLICY "Users can view their own auth errors"
  ON auth_errors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for service role to manage all auth errors
CREATE POLICY "Service role can manage auth errors"
  ON auth_errors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to log auth errors (can be called from edge functions)
CREATE OR REPLACE FUNCTION log_auth_error(
  p_user_id UUID,
  p_error_type TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  error_id UUID;
BEGIN
  INSERT INTO auth_errors (user_id, error_type, error_message)
  VALUES (p_user_id, p_error_type, p_error_message)
  RETURNING id INTO error_id;
  
  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to resolve auth errors
CREATE OR REPLACE FUNCTION resolve_auth_error(p_error_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth_errors 
  SET resolved = true, resolved_at = now()
  WHERE id = p_error_id 
    AND (auth.uid() = user_id OR auth.role() = 'service_role');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_errors_user_id ON auth_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_errors_created_at ON auth_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_errors_resolved ON auth_errors(resolved) WHERE NOT resolved;