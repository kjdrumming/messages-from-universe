-- Set your notification time to right now for immediate testing
-- Run this in Supabase SQL Editor

-- Get current time in your timezone and set notification time to 2 minutes from now
UPDATE customer_users 
SET notification_time = TO_CHAR((timezone('America/New_York', NOW()) + INTERVAL '2 minutes'), 'HH24:MI:00')
WHERE email = 'kjdrumming@gmail.com';

-- Verify the setting
SELECT 
    email,
    notification_time,
    timezone,
    notification_enabled,
    TO_CHAR(timezone('America/New_York', NOW()), 'HH24:MI:SS') as current_local_time,
    TO_CHAR((timezone('America/New_York', NOW()) + INTERVAL '2 minutes'), 'HH24:MI:SS') as notification_will_trigger_at
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';
