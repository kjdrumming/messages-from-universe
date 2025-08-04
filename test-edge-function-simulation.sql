-- Test edge function behavior with proper service role simulation
-- This mimics what the edge function does when trying to insert history

-- Set the role to service_role (this is what edge functions use)
SET ROLE service_role;

-- Test 1: Check if we can see the tables
SELECT 'Testing service_role access:' as test;
SELECT COUNT(*) as customer_count FROM customer_users;
SELECT COUNT(*) as message_count FROM motivational_messages WHERE status = 'active';

-- Test 2: Simulate the exact insert that the edge function performs
DO $$
DECLARE
    test_customer_id UUID;
    test_message_id UUID;
    history_record RECORD;
BEGIN
    -- Get test data (same way edge function does)
    SELECT id INTO test_customer_id FROM customer_users WHERE notification_enabled = true LIMIT 1;
    SELECT id INTO test_message_id FROM motivational_messages WHERE status = 'active' ORDER BY RANDOM() LIMIT 1;
    
    RAISE NOTICE 'Selected customer_id: % (type: %)', test_customer_id, pg_typeof(test_customer_id);
    RAISE NOTICE 'Selected message_id: % (type: %)', test_message_id, pg_typeof(test_message_id);
    
    IF test_customer_id IS NOT NULL AND test_message_id IS NOT NULL THEN
        -- This is the exact structure the edge function uses
        INSERT INTO user_message_history (customer_id, message_id, sent_at)
        VALUES (test_customer_id, test_message_id, NOW())
        RETURNING * INTO history_record;
        
        RAISE NOTICE 'INSERT successful! Record ID: %', history_record.id;
        RAISE NOTICE 'Record details: customer_id=%, message_id=%, sent_at=%', 
                     history_record.customer_id, history_record.message_id, history_record.sent_at;
    ELSE
        RAISE NOTICE 'Missing required data:';
        RAISE NOTICE 'customer_id found: %', (test_customer_id IS NOT NULL);
        RAISE NOTICE 'message_id found: %', (test_message_id IS NOT NULL);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'INSERT FAILED with error: %', SQLERRM;
        RAISE NOTICE 'SQL State: %', SQLSTATE;
END $$;

-- Test 3: Verify the insert worked
SELECT 'Records after test:' as result;
SELECT COUNT(*) as total_count FROM user_message_history;

-- Test 4: Show the most recent records
SELECT 'Most recent history records:' as result;
SELECT 
    h.id,
    h.customer_id,
    c.email as customer_email,
    h.message_id,
    SUBSTRING(m.content, 1, 50) || '...' as message_preview,
    h.sent_at
FROM user_message_history h
JOIN customer_users c ON h.customer_id = c.id
JOIN motivational_messages m ON h.message_id = m.id
ORDER BY h.sent_at DESC
LIMIT 5;

-- Reset role
RESET ROLE;
