-- Test inserting a record into user_message_history
-- First let's see what we have in our tables

-- Check motivational_messages
SELECT 'Messages table:' as section;
SELECT id, substring(content, 1, 50) as content_preview 
FROM motivational_messages 
LIMIT 3;

-- Check customer_users  
SELECT 'Users table:' as section;
SELECT id, email 
FROM customer_users 
LIMIT 3;

-- Try to insert a test record
SELECT 'Attempting insert...' as section;

-- Get actual IDs from existing data
WITH sample_data AS (
  SELECT 
    (SELECT id FROM customer_users LIMIT 1) as user_id,
    (SELECT id FROM motivational_messages LIMIT 1) as msg_id
)
INSERT INTO user_message_history (customer_id, message_id, sent_at)
SELECT user_id, msg_id, NOW()
FROM sample_data;

-- Check if it worked
SELECT 'Final check:' as section;
SELECT * FROM user_message_history;
