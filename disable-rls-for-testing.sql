-- Temporarily disable RLS for debugging
-- This will help us determine if RLS policies are the issue

-- Step 1: Disable RLS on all tables
ALTER TABLE user_message_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE motivational_messages DISABLE ROW LEVEL SECURITY;

-- Step 2: Insert some test data to ensure tables work
INSERT INTO motivational_messages (content, category, status, created_by) 
VALUES 
    ('Test message 1: Every great achievement starts with the decision to try.', 'Motivation', 'active', NULL),
    ('Test message 2: Success is not final, failure is not fatal.', 'Perseverance', 'active', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO customer_users (email, name, notification_enabled, notification_time, timezone) 
VALUES 
    ('test@example.com', 'Test User', true, '09:00:00', 'America/New_York'),
    ('test2@example.com', 'Test User 2', true, '10:00:00', 'America/Los_Angeles')
ON CONFLICT (email) DO NOTHING;

-- Step 3: Test direct insert into history table
INSERT INTO user_message_history (customer_id, message_id, sent_at)
SELECT 
    c.id,
    m.id,
    NOW()
FROM customer_users c
CROSS JOIN motivational_messages m
WHERE c.email = 'test@example.com'
  AND m.status = 'active'
LIMIT 1;

-- Step 4: Verify the insert worked
SELECT 'RLS DISABLED - Test Results:' as status;

SELECT 'Available Data:' as info;
SELECT 
    (SELECT COUNT(*) FROM customer_users) as customers,
    (SELECT COUNT(*) FROM motivational_messages WHERE status = 'active') as active_messages,
    (SELECT COUNT(*) FROM user_message_history) as history_records;

SELECT 'Sample Records:' as info;
SELECT 
    h.id,
    c.email as customer_email,
    SUBSTRING(m.content, 1, 50) || '...' as message_preview,
    h.sent_at
FROM user_message_history h
JOIN customer_users c ON h.customer_id = c.id
JOIN motivational_messages m ON h.message_id = m.id
ORDER BY h.sent_at DESC
LIMIT 3;

SELECT 'RLS Status (should be false):' as info;
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('user_message_history', 'customer_users', 'motivational_messages')
ORDER BY tablename;
