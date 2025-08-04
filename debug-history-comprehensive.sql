-- Comprehensive troubleshooting for user_message_history INSERT issues
-- Run this script to diagnose the problem

-- Step 1: Check current RLS policies
SELECT 'Current RLS policies for user_message_history:' as step;
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_message_history';

-- Step 2: Check if RLS is enabled
SELECT 'RLS status:' as step;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_message_history';

-- Step 3: Check current role
SELECT 'Current role:' as step;
SELECT current_user, current_role;

-- Step 4: Check if there are any records
SELECT 'Current record count:' as step;
SELECT COUNT(*) as total_records FROM user_message_history;

-- Step 5: Check available test data
SELECT 'Available customer_users:' as step;
SELECT id, email FROM customer_users LIMIT 3;

SELECT 'Available motivational_messages:' as step;
SELECT id, content FROM motivational_messages WHERE status = 'active' LIMIT 3;

-- Step 6: Test direct INSERT (this might fail due to RLS)
SELECT 'Testing direct INSERT:' as step;
DO $$
DECLARE
    test_customer_id UUID;
    test_message_id UUID;
BEGIN
    -- Get test IDs
    SELECT id INTO test_customer_id FROM customer_users LIMIT 1;
    SELECT id INTO test_message_id FROM motivational_messages WHERE status = 'active' LIMIT 1;
    
    RAISE NOTICE 'Test customer_id: %', test_customer_id;
    RAISE NOTICE 'Test message_id: %', test_message_id;
    
    IF test_customer_id IS NOT NULL AND test_message_id IS NOT NULL THEN
        INSERT INTO user_message_history (customer_id, message_id, sent_at)
        VALUES (test_customer_id, test_message_id, NOW());
        RAISE NOTICE 'INSERT successful!';
    ELSE
        RAISE NOTICE 'Missing test data - customer_id: %, message_id: %', test_customer_id, test_message_id;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'INSERT failed: %', SQLERRM;
END $$;

-- Step 7: Final count check
SELECT 'Final record count:' as step;
SELECT COUNT(*) as total_records FROM user_message_history;
