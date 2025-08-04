-- Check recent history records
SELECT 
    umh.*,
    cu.email as user_email,
    mm.content as message_content
FROM user_message_history umh
LEFT JOIN customer_users cu ON umh.customer_id = cu.id
LEFT JOIN motivational_messages mm ON umh.message_id = mm.id
ORDER BY umh.created_at DESC
LIMIT 10;

-- Also check if any records exist at all
SELECT COUNT(*) as total_records FROM user_message_history;

-- Check if the SQL function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'record_user_message_history';
