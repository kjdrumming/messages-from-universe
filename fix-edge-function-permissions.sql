-- Apply the RLS policy fix for edge functions
-- This script fixes the permission issue preventing edge functions from inserting history records

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert history" ON user_message_history;
DROP POLICY IF EXISTS "Service role can read history" ON user_message_history;

-- Step 2: Create policies for service role (used by edge functions)
CREATE POLICY "Service role can insert history" ON user_message_history
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can read history" ON user_message_history
    FOR SELECT TO service_role
    USING (true);

-- Step 3: Also create a policy for authenticated users to insert their own history
-- (This allows the edge function running with user context to also work)
DROP POLICY IF EXISTS "Users can insert own history" ON user_message_history;
CREATE POLICY "Users can insert own history" ON user_message_history
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM customer_users 
            WHERE id = customer_id AND auth_user_id = auth.uid()
        )
    );

-- Step 4: Ensure RLS is enabled
ALTER TABLE user_message_history ENABLE ROW LEVEL SECURITY;

-- Step 5: Test the fix with a sample insert
DO $$
DECLARE
    test_customer_id UUID;
    test_message_id UUID;
BEGIN
    -- Get test data
    SELECT id INTO test_customer_id FROM customer_users LIMIT 1;
    SELECT id INTO test_message_id FROM motivational_messages WHERE status = 'active' LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_message_id IS NOT NULL THEN
        INSERT INTO user_message_history (customer_id, message_id, sent_at)
        VALUES (test_customer_id, test_message_id, NOW());
        RAISE NOTICE 'RLS fix successful - test record inserted!';
    ELSE
        RAISE NOTICE 'No test data available';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

-- Step 6: Verify the policies are in place
SELECT 'Updated RLS policies:' as result;
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'user_message_history';

SELECT 'Current record count:' as result;
SELECT COUNT(*) FROM user_message_history;
