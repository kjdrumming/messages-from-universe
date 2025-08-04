-- Debug timezone handling in your Edge Function
-- Run this in Supabase SQL Editor to understand the timezone issue

-- 1. Check your current user settings
SELECT 
    email,
    notification_time,
    timezone,
    notification_enabled
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';

-- 2. Check current time in different formats
SELECT 
    NOW() as utc_now,
    timezone('America/New_York', NOW()) as est_now,
    TO_CHAR(timezone('America/New_York', NOW()), 'HH24:MI:SS') as est_time_string,
    EXTRACT(HOUR FROM timezone('America/New_York', NOW())) as est_hour,
    EXTRACT(MINUTE FROM timezone('America/New_York', NOW())) as est_minute;

-- 3. Check what your Edge Function logic would see
WITH user_data AS (
    SELECT 
        email,
        notification_time,
        timezone,
        notification_enabled
    FROM customer_users 
    WHERE email = 'kjdrumming@gmail.com'
),
time_data AS (
    SELECT 
        -- This mimics what your Edge Function does
        TO_CHAR(timezone(u.timezone, NOW()), 'HH24:MI') as user_local_time,
        u.notification_time,
        -- Extract hours and minutes
        EXTRACT(HOUR FROM timezone(u.timezone, NOW())) as current_hour,
        EXTRACT(MINUTE FROM timezone(u.timezone, NOW())) as current_minute,
        SPLIT_PART(u.notification_time, ':', 1)::integer as pref_hour,
        SPLIT_PART(u.notification_time, ':', 2)::integer as pref_minute
    FROM user_data u
)
SELECT 
    *,
    -- Calculate time difference (this is what your Edge Function checks)
    ABS((current_hour * 60 + current_minute) - (pref_hour * 60 + pref_minute)) as time_diff_minutes,
    -- Should trigger if within 5 minutes
    CASE 
        WHEN ABS((current_hour * 60 + current_minute) - (pref_hour * 60 + pref_minute)) <= 5 
        THEN '✅ YES - Should trigger!' 
        ELSE '❌ NO - Outside 5-minute window' 
    END as should_trigger
FROM time_data;
