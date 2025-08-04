-- COMPLETE FIX: RLS Policies for Edge Function History Logging
-- This script fixes the permission issues preventing edge functions from logging history

-- =====================================================
-- 1. FIX USER_MESSAGE_HISTORY TABLE PERMISSIONS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert history" ON user_message_history;
DROP POLICY IF EXISTS "Service role can read history" ON user_message_history;
DROP POLICY IF EXISTS "Service role can update history" ON user_message_history;

-- Create comprehensive service role policies
CREATE POLICY "Service role can insert history" ON user_message_history
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can read history" ON user_message_history
    FOR SELECT TO service_role
    USING (true);

CREATE POLICY "Service role can update history" ON user_message_history
    FOR UPDATE TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 2. FIX OTHER TABLES THAT EDGE FUNCTIONS NEED ACCESS TO
-- =====================================================

-- Fix customer_users table (edge functions need to read users)
DROP POLICY IF EXISTS "Service role can read customers" ON customer_users;
CREATE POLICY "Service role can read customers" ON customer_users
    FOR SELECT TO service_role
    USING (true);

-- Fix motivational_messages table (edge functions need to read messages)
DROP POLICY IF EXISTS "Service role can read messages" ON motivational_messages;
CREATE POLICY "Service role can read messages" ON motivational_messages
    FOR SELECT TO service_role
    USING (true);

-- Allow service role to insert motivational_messages (for setup scripts)
DROP POLICY IF EXISTS "Service role can insert messages" ON motivational_messages;
CREATE POLICY "Service role can insert messages" ON motivational_messages
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Allow service role to insert customer_users (for setup scripts)
DROP POLICY IF EXISTS "Service role can insert customers" ON customer_users;
CREATE POLICY "Service role can insert customers" ON customer_users
    FOR INSERT TO service_role
    WITH CHECK (true);

-- =====================================================
-- 3. VERIFY THE FIX WITH TEST DATA
-- =====================================================

-- Insert test motivational messages if none exist
INSERT INTO motivational_messages (content, category, status, created_by) 
SELECT 
    'Every great achievement starts with the decision to try.',
    'Motivation',
    'active',
    NULL
WHERE NOT EXISTS (SELECT 1 FROM motivational_messages WHERE status = 'active');

INSERT INTO motivational_messages (content, category, status, created_by) 
SELECT 
    'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    'Perseverance',
    'active',
    NULL
WHERE NOT EXISTS (SELECT 1 FROM motivational_messages WHERE content LIKE '%courage to continue%');

-- Insert test customer user if none exist
INSERT INTO customer_users (email, name, notification_enabled, notification_time, timezone) 
SELECT 
    'test@example.com',
    'Test User',
    true,
    '09:00:00',
    'America/New_York'
WHERE NOT EXISTS (SELECT 1 FROM customer_users WHERE email = 'test@example.com');

-- Test the fix: Insert a history record
DO $$
DECLARE
    test_customer_id UUID;
    test_message_id UUID;
    history_record RECORD;
BEGIN
    -- Get test IDs
    SELECT id INTO test_customer_id FROM customer_users WHERE email = 'test@example.com';
    SELECT id INTO test_message_id FROM motivational_messages WHERE status = 'active' LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_message_id IS NOT NULL THEN
        -- Test insert (this should now work)
        INSERT INTO user_message_history (customer_id, message_id, sent_at)
        VALUES (test_customer_id, test_message_id, NOW())
        RETURNING * INTO history_record;
        
        RAISE NOTICE '✅ SUCCESS! Test history record inserted with ID: %', history_record.id;
    ELSE
        RAISE NOTICE '❌ Missing test data - cannot verify fix';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ INSERT still failing: % (SQL State: %)', SQLERRM, SQLSTATE;
END $$;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

SELECT '=== VERIFICATION RESULTS ===' as status;

SELECT 'RLS Policies Created:' as info;
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('user_message_history', 'customer_users', 'motivational_messages')
  AND roles @> '{service_role}'
ORDER BY tablename, cmd;

SELECT 'Sample Data Available:' as info;
SELECT 
    (SELECT COUNT(*) FROM customer_users) as customers,
    (SELECT COUNT(*) FROM motivational_messages WHERE status = 'active') as active_messages,
    (SELECT COUNT(*) FROM user_message_history) as history_records;

SELECT 'Recent History Records:' as info;
SELECT 
    h.id,
    c.email,
    SUBSTRING(m.content, 1, 50) || '...' as message_preview,
    h.sent_at
FROM user_message_history h
JOIN customer_users c ON h.customer_id = c.id
JOIN motivational_messages m ON h.message_id = m.id
ORDER BY h.sent_at DESC
LIMIT 3;

SELECT '=== FIX COMPLETE ===' as status;
