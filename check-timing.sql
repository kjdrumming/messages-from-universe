-- Check current time in different timezones and user settings
SELECT 'Current UTC time:' as info, NOW() as utc_time;

SELECT 'User notification settings:' as info;
SELECT 
    email,
    notification_enabled,
    notification_time,
    timezone,
    -- Calculate what time it is now in user's timezone
    to_char(NOW() AT TIME ZONE timezone, 'HH24:MI') as current_time_in_user_tz,
    -- Show if it matches their notification time
    CASE 
        WHEN to_char(NOW() AT TIME ZONE timezone, 'HH24:MI') = notification_time::text 
        THEN 'MATCHES - Should send notification'
        ELSE 'No match - Will not send'
    END as timing_status
FROM customer_users 
WHERE notification_enabled = true;

-- Also check the exact time comparison
SELECT 'Time comparison details:' as info;
SELECT 
    email,
    timezone,
    notification_time,
    NOW() as utc_now,
    NOW() AT TIME ZONE timezone as user_local_time,
    to_char(NOW() AT TIME ZONE timezone, 'HH24:MI') as user_local_hhmm,
    notification_time::text as pref_time,
    (to_char(NOW() AT TIME ZONE timezone, 'HH24:MI') = notification_time::text) as exact_match
FROM customer_users 
WHERE notification_enabled = true;
