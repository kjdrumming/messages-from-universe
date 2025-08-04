-- Fix RLS policies for user_message_history to allow service role access
-- First check current policies
SELECT 'Current RLS policies:' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_message_history';

-- Add policy to allow service role to insert
DROP POLICY IF EXISTS "Service role can insert history" ON user_message_history;
CREATE POLICY "Service role can insert history" ON user_message_history
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Also allow service role to select (for debugging)
DROP POLICY IF EXISTS "Service role can read history" ON user_message_history;
CREATE POLICY "Service role can read history" ON user_message_history
    FOR SELECT TO service_role
    USING (true);

-- Enable RLS if not already enabled
ALTER TABLE user_message_history ENABLE ROW LEVEL SECURITY;

-- Test insert to verify it works
INSERT INTO user_message_history (customer_id, message_id, sent_at)
VALUES (
    (SELECT id FROM customer_users LIMIT 1),
    (SELECT id FROM motivational_messages WHERE status = 'active' LIMIT 1),
    NOW()
);

SELECT 'Test successful - records now:' as result;
SELECT COUNT(*) FROM user_message_history;
