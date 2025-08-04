-- Get actual customer and message IDs for testing
SELECT 
    'Customer IDs:' as info,
    id as customer_id,
    email
FROM customer_users 
WHERE notification_enabled = true
LIMIT 3;

SELECT 
    'Message IDs:' as info,
    id as message_id,
    LEFT(content, 50) as content_preview
FROM motivational_messages 
WHERE status = 'active'
LIMIT 3;
