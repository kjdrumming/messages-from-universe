-- Test script to verify the number_sent column and trigger functionality

-- Step 1: Check if the column was added
SELECT 
    'Column check:' as info,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer_users' 
    AND column_name = 'number_sent';

-- Step 2: Check current values
SELECT 
    'Current number_sent values:' as info,
    email,
    number_sent,
    (SELECT COUNT(*) FROM user_message_history WHERE customer_id = customer_users.id) as actual_count
FROM customer_users
ORDER BY email
LIMIT 5;

-- Step 3: Check if trigger exists
SELECT 
    'Trigger check:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_customer_message_count';

-- Step 4: Test the trigger by inserting a test record (if data exists)
DO $$
DECLARE
    test_customer_id UUID;
    test_message_id UUID;
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Get a test customer and message
    SELECT id INTO test_customer_id FROM customer_users LIMIT 1;
    SELECT id INTO test_message_id FROM motivational_messages WHERE status = 'active' LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_message_id IS NOT NULL THEN
        -- Get current count
        SELECT number_sent INTO old_count FROM customer_users WHERE id = test_customer_id;
        RAISE NOTICE 'Test customer current count: %', old_count;
        
        -- Insert test record
        INSERT INTO user_message_history (customer_id, message_id, sent_at)
        VALUES (test_customer_id, test_message_id, NOW());
        
        -- Check new count
        SELECT number_sent INTO new_count FROM customer_users WHERE id = test_customer_id;
        RAISE NOTICE 'Test customer new count: %', new_count;
        
        IF new_count = old_count + 1 THEN
            RAISE NOTICE '✅ Trigger working correctly! Count increased from % to %', old_count, new_count;
        ELSE
            RAISE NOTICE '❌ Trigger not working. Count should be % but is %', old_count + 1, new_count;
        END IF;
        
        -- Clean up test record
        DELETE FROM user_message_history 
        WHERE customer_id = test_customer_id 
            AND message_id = test_message_id 
            AND sent_at > NOW() - INTERVAL '1 minute';
            
        RAISE NOTICE 'Test record cleaned up';
    ELSE
        RAISE NOTICE 'No test data available - customer_id: %, message_id: %', test_customer_id, test_message_id;
    END IF;
END $$;
