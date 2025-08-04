-- Supabase Auth Configuration for Extended Sessions
-- Run this in your Supabase SQL editor to extend session timeouts

-- Check current auth configuration
SELECT 
  setting_name,
  setting_value
FROM auth.config 
WHERE setting_name IN ('jwt_exp', 'refresh_token_rotation_enabled', 'security_refresh_token_reuse_interval');

-- Update JWT expiration to 24 hours (86400 seconds)
UPDATE auth.config 
SET setting_value = '86400' 
WHERE setting_name = 'jwt_exp';

-- Enable refresh token rotation for better security
UPDATE auth.config 
SET setting_value = 'true' 
WHERE setting_name = 'refresh_token_rotation_enabled';

-- Set refresh token reuse interval to 10 seconds
UPDATE auth.config 
SET setting_value = '10' 
WHERE setting_name = 'security_refresh_token_reuse_interval';

-- Verify the changes
SELECT 
  setting_name,
  setting_value,
  CASE 
    WHEN setting_name = 'jwt_exp' THEN setting_value::int / 3600 || ' hours'
    WHEN setting_name = 'security_refresh_token_reuse_interval' THEN setting_value || ' seconds'
    ELSE setting_value
  END as human_readable
FROM auth.config 
WHERE setting_name IN ('jwt_exp', 'refresh_token_rotation_enabled', 'security_refresh_token_reuse_interval')
ORDER BY setting_name;
