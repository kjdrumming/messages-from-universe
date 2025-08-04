-- Test if we can insert into user_message_history directly
-- First check RLS policies
SELECT 'RLS policies on user_message_history:' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_message_history';

-- Check if RLS is enabled
SELECT 'RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_message_history', 'customer_users', 'motivational_messages');

-- Try a test insert using service role
-- First get some sample data
SELECT 'Sample data for insert test:' as info;
SELECT 
    'customer_id: ' || (SELECT id FROM customer_users LIMIT 1) as customer_sample,
    'message_id: ' || (SELECT id FROM motivational_messages WHERE status = 'active' LIMIT 1) as message_sample;

-- Test insert (this might fail due to RLS)
INSERT INTO user_message_history (customer_id, message_id, sent_at)
VALUES (
    (SELECT id FROM customer_users LIMIT 1),
    (SELECT id FROM motivational_messages WHERE status = 'active' LIMIT 1),
    NOW()
);

-- Check if it worked
SELECT 'Records after insert:' as info;
SELECT COUNT(*) as total_records FROM user_message_history;
