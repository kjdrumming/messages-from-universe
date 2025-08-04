-- Test the timezone fix by setting notification time to current time + 2 minutes
-- This will help us verify the Edge Function is working correctly

-- 1. First, check current time in your timezone
SELECT 
    NOW() as utc_now,
    timezone('America/New_York', NOW()) as est_now,
    TO_CHAR(timezone('America/New_York', NOW()), 'HH24:MI') as current_est_time,
    TO_CHAR(timezone('America/New_York', NOW()) + interval '2 minutes', 'HH24:MI') as test_time_plus_2min;

-- 2. Update your notification time to current time + 2 minutes (for testing)
-- UNCOMMENT AND RUN THIS AFTER CHECKING THE TIME ABOVE:
/*
UPDATE customer_users 
SET notification_time = (timezone('America/New_York', NOW()) + interval '2 minutes')::time
WHERE email = 'kjdrumming@gmail.com';
*/

-- 3. Verify the update
SELECT 
    email,
    notification_time,
    timezone,
    notification_enabled
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';

-- 4. Check if there are any active messages
SELECT count(*) as active_message_count FROM motivational_messages WHERE status = 'active';

-- 5. After waiting 2+ minutes, check if notification was sent
-- RUN THIS AFTER THE TEST:
/*
SELECT 
    h.*,
    m.content as message_content,
    u.email
FROM user_message_history h
JOIN customer_users u ON h.customer_id = u.id
JOIN motivational_messages m ON h.message_id = m.id
WHERE u.email = 'kjdrumming@gmail.com'
ORDER BY h.sent_at DESC
LIMIT 5;
*/
