-- Test the SQL function directly
SELECT record_user_message_history(
    'b20afc77-eb65-463c-827e-bd62ae6b48c4',  -- Replace with actual customer_id
    '1',  -- Replace with actual message_id  
    'test_method',
    'test'
);

-- Check if it created a record
SELECT * FROM user_message_history 
WHERE customer_id = 'b20afc77-eb65-463c-827e-bd62ae6b48c4'
ORDER BY created_at DESC
LIMIT 1;
