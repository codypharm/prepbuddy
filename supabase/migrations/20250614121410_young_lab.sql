-- Create user_usage table for tracking feature usage
CREATE TABLE IF NOT EXISTS user_usage (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  study_plans_created INT DEFAULT 0,
  ai_requests INT DEFAULT 0,
  file_uploads INT DEFAULT 0,
  study_groups_created INT DEFAULT 0,
  storage_used BIGINT DEFAULT 0, -- in bytes
  PRIMARY KEY (user_id, month)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_usage
CREATE POLICY "Users can read own usage"
  ON user_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON user_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON user_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to increment usage metrics
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_metric TEXT,
  p_amount INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month VARCHAR(7);
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  
  -- Insert or update usage record
  INSERT INTO user_usage (user_id, month, study_plans_created, ai_requests, file_uploads, study_groups_created, storage_used)
  VALUES (
    p_user_id,
    current_month,
    CASE WHEN p_metric = 'study_plans_created' THEN p_amount ELSE 0 END,
    CASE WHEN p_metric = 'ai_requests' THEN p_amount ELSE 0 END,
    CASE WHEN p_metric = 'file_uploads' THEN p_amount ELSE 0 END,
    CASE WHEN p_metric = 'study_groups_created' THEN p_amount ELSE 0 END,
    CASE WHEN p_metric = 'storage_used' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id, month) 
  DO UPDATE SET
    study_plans_created = CASE 
      WHEN p_metric = 'study_plans_created' 
      THEN user_usage.study_plans_created + p_amount 
      ELSE user_usage.study_plans_created 
    END,
    ai_requests = CASE 
      WHEN p_metric = 'ai_requests' 
      THEN user_usage.ai_requests + p_amount 
      ELSE user_usage.ai_requests 
    END,
    file_uploads = CASE 
      WHEN p_metric = 'file_uploads' 
      THEN user_usage.file_uploads + p_amount 
      ELSE user_usage.file_uploads 
    END,
    study_groups_created = CASE 
      WHEN p_metric = 'study_groups_created' 
      THEN user_usage.study_groups_created + p_amount 
      ELSE user_usage.study_groups_created 
    END,
    storage_used = CASE 
      WHEN p_metric = 'storage_used' 
      THEN user_usage.storage_used + p_amount 
      ELSE user_usage.storage_used 
    END;
END;
$$;

-- Create function to get current usage
CREATE OR REPLACE FUNCTION get_current_usage(
  p_user_id UUID
)
RETURNS TABLE (
  study_plans_created INT,
  ai_requests INT,
  file_uploads INT,
  study_groups_created INT,
  storage_used BIGINT,
  month VARCHAR(7)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month VARCHAR(7);
BEGIN
  -- Get current month in YYYY-MM format
  current_month := to_char(CURRENT_DATE, 'YYYY-MM');
  
  RETURN QUERY
  SELECT 
    COALESCE(u.study_plans_created, 0) as study_plans_created,
    COALESCE(u.ai_requests, 0) as ai_requests,
    COALESCE(u.file_uploads, 0) as file_uploads,
    COALESCE(u.study_groups_created, 0) as study_groups_created,
    COALESCE(u.storage_used, 0) as storage_used,
    current_month as month
  FROM (
    SELECT * FROM user_usage 
    WHERE user_id = p_user_id AND month = current_month
  ) u
  UNION ALL
  SELECT 0, 0, 0, 0, 0, current_month
  WHERE NOT EXISTS (
    SELECT 1 FROM user_usage 
    WHERE user_id = p_user_id AND month = current_month
  )
  LIMIT 1;
END;
$$;

-- Create API for incrementing usage
CREATE OR REPLACE FUNCTION api_increment_usage(
  p_metric TEXT,
  p_amount INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate metric
  IF p_metric NOT IN ('study_plans_created', 'ai_requests', 'file_uploads', 'study_groups_created', 'storage_used') THEN
    RAISE EXCEPTION 'Invalid metric: %', p_metric;
  END IF;
  
  -- Call increment function
  PERFORM increment_usage(auth.uid(), p_metric, p_amount);
  
  RETURN TRUE;
END;
$$;

-- Create API for getting usage
CREATE OR REPLACE FUNCTION api_get_usage()
RETURNS TABLE (
  study_plans_created INT,
  ai_requests INT,
  file_uploads INT,
  study_groups_created INT,
  storage_used BIGINT,
  month VARCHAR(7)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT * FROM get_current_usage(auth.uid());
END;
$$;