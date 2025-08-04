-- Test if duplicate prevention is blocking inserts
-- First, check what records exist for today
SELECT 
    customer_id,
    DATE(sent_at) as sent_date,
    COUNT(*) as records_today
FROM user_message_history 
WHERE DATE(sent_at) = CURRENT_DATE
GROUP BY customer_id, DATE(sent_at);

-- Check all recent records
SELECT 
    umh.*,
    cu.email
FROM user_message_history umh
JOIN customer_users cu ON umh.customer_id = cu.id
WHERE DATE(umh.sent_at) = CURRENT_DATE
ORDER BY umh.sent_at DESC;
