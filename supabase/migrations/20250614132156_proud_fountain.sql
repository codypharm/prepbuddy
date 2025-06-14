-- Disable email confirmation requirement
-- This makes the app more user-friendly while still allowing secure authentication
UPDATE auth.config
SET email_confirmation_required = false;

-- Create a function to handle email verification errors
CREATE OR REPLACE FUNCTION handle_auth_error()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a record in the auth_errors table
  INSERT INTO auth_errors (user_id, error_type, error_message, created_at)
  VALUES (
    NEW.id,
    NEW.error_code,
    NEW.error_description,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth_errors table to track verification issues
CREATE TABLE IF NOT EXISTS auth_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_type TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ
);

-- Enable RLS on auth_errors
ALTER TABLE auth_errors ENABLE ROW LEVEL SECURITY;

-- Create policy for auth_errors
CREATE POLICY "Users can view their own auth errors"
  ON auth_errors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for service role
CREATE POLICY "Service role can manage auth errors"
  ON auth_errors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);