-- Simple test to force send a notification right now
-- Run this in Supabase SQL Editor

-- First, temporarily set your notification time to right now
UPDATE customer_users 
SET notification_time = TO_CHAR(timezone('America/New_York', NOW()), 'HH24:MI:00')
WHERE email = 'kjdrumming@gmail.com';

-- Check what we just set
SELECT 
    email,
    notification_time,
    timezone,
    notification_enabled,
    TO_CHAR(timezone('America/New_York', NOW()), 'HH24:MI:SS') as current_local_time
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';

-- Check if there are any active messages
SELECT COUNT(*) as active_messages FROM motivational_messages WHERE status = 'active';

-- Check recent message history before test
SELECT COUNT(*) as messages_sent_today 
FROM user_message_history 
WHERE customer_id = (SELECT id FROM customer_users WHERE email = 'kjdrumming@gmail.com')
  AND DATE(sent_at) = CURRENT_DATE;
