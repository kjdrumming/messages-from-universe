-- Test insert into the recreated user_message_history table
-- First, get a valid customer and message ID for testing

-- Get the first active customer
WITH test_customer AS (
    SELECT id, email FROM customer_users WHERE notification_enabled = true LIMIT 1
),
test_message AS (
    SELECT id, LEFT(content, 50) as content_preview FROM motivational_messages WHERE status = 'active' LIMIT 1
)
SELECT 
    'Test data:' as info,
    tc.id as customer_id,
    tc.email,
    tm.id as message_id,
    tm.content_preview
FROM test_customer tc, test_message tm;

-- Now try to insert a test record
-- Replace the UUIDs below with actual values from the query above
INSERT INTO user_message_history (
    customer_id,
    message_id,
    notification_method,
    status,
    sent_at
) VALUES (
    (SELECT id FROM customer_users WHERE notification_enabled = true LIMIT 1),
    (SELECT id FROM motivational_messages WHERE status = 'active' LIMIT 1),
    'test_insert',
    'sent',
    NOW()
);

-- Verify the insert worked
SELECT 
    id,
    customer_id,
    message_id,
    notification_method,
    status,
    sent_at
FROM user_message_history 
ORDER BY created_at DESC 
LIMIT 1;
