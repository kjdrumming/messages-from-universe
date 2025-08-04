-- Debug pg_cron setup - check what's actually available
-- Run this in Supabase SQL Editor

-- First, check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check what columns exist in cron.job table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'cron' AND table_name = 'job';

-- Check cron jobs with only available columns
SELECT 
    jobid,
    jobname, 
    schedule,
    command,
    active
FROM cron.job;

-- Check if there are any cron jobs at all
SELECT COUNT(*) as total_cron_jobs FROM cron.job;

-- Check your current user settings to see if the timing should work
SELECT 
    id,
    email,
    notification_time,
    timezone,
    notification_enabled
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';

-- Check current time in your timezone
SELECT 
    NOW() as current_utc,
    timezone('America/New_York', NOW()) as current_eastern_time;

-- Check recent message history
SELECT 
    customer_id,
    message_id,
    sent_at
FROM user_message_history 
ORDER BY sent_at DESC 
LIMIT 5;
