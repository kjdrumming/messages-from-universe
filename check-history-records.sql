-- Check if any history records exist
SELECT 'History records count:' as info;
SELECT COUNT(*) as total_records FROM user_message_history;

SELECT 'Recent history records:' as info;
SELECT 
    h.id,
    h.customer_id,
    h.message_id,
    h.sent_at,
    u.email as user_email,
    m.content as message_content
FROM user_message_history h
LEFT JOIN customer_users u ON h.customer_id = u.id
LEFT JOIN motivational_messages m ON h.message_id = m.id
ORDER BY h.sent_at DESC
LIMIT 10;

SELECT 'All customer users:' as info;
SELECT id, email, notification_enabled, notification_time, timezone FROM customer_users;

SELECT 'All active messages:' as info;
SELECT id, content, status FROM motivational_messages WHERE status = 'active';
