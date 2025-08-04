-- Test to see the current data in our tables
SELECT 'motivational_messages data:' as info;
SELECT id, content FROM motivational_messages LIMIT 3;

SELECT 'customer_users data:' as info;
SELECT id, email FROM customer_users LIMIT 3;

SELECT 'user_message_history data:' as info;
SELECT * FROM user_message_history LIMIT 5;

-- Check the exact data types
SELECT 'motivational_messages schema:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'motivational_messages' 
  AND column_name = 'id';

SELECT 'user_message_history schema:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_message_history' 
  AND column_name IN ('customer_id', 'message_id');
