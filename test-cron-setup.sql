-- Test SQL to update your notification time to right now for testing
-- Run this after setting up pg_cron to test immediately

-- Update your notification time to the current time (22:15 for testing)
UPDATE customer_users 
SET notification_time = '22:15:00'
WHERE email = 'kjdrumming@gmail.com';

-- Verify the update
SELECT 
    email,
    notification_time,
    timezone,
    notification_enabled
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';

-- Check if there are any cron jobs running
SELECT 
    jobid,
    jobname, 
    schedule,
    command,
    active,
    last_run,
    next_run
FROM cron.job;
