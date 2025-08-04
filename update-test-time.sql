-- Get current time and update test user notification time to current time + 1 minute
-- First check current time
SELECT 
    NOW() as current_utc,
    NOW() AT TIME ZONE 'America/New_York' as current_est;

-- Update test user to have notification time in 1 minute
UPDATE customer_users 
SET notification_time = TO_CHAR((NOW() AT TIME ZONE 'America/New_York' + INTERVAL '1 minute'), 'HH24:MI:SS')
WHERE email = 'kjdrumming@gmail.com';

-- Verify the update
SELECT 
    email,
    notification_time,
    timezone,
    notification_enabled
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';
