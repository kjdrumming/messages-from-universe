-- Advanced logging setup for user_message_history INSERT tracking
-- This creates audit logging to track all INSERT attempts (successful and failed)

-- =====================================================
-- 1. CREATE AUDIT LOG TABLE
-- =====================================================

-- Create audit log table to track all attempts
CREATE TABLE IF NOT EXISTS user_message_history_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    customer_id UUID,
    message_id UUID,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    user_role TEXT DEFAULT current_user,
    session_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_log_attempted_at ON user_message_history_audit_log(attempted_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON user_message_history_audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_success ON user_message_history_audit_log(success);

-- =====================================================
-- 2. CREATE AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_user_message_history_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log successful operations
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_message_history_audit_log (
            operation,
            success,
            customer_id,
            message_id,
            sent_at,
            user_role,
            session_info
        ) VALUES (
            TG_OP,
            TRUE,
            NEW.customer_id,
            NEW.message_id,
            NEW.sent_at,
            current_user,
            jsonb_build_object(
                'session_user', session_user,
                'current_user', current_user,
                'inet_client_addr', inet_client_addr(),
                'application_name', current_setting('application_name', true)
            )
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CREATE THE TRIGGER
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS user_message_history_audit_trigger ON user_message_history;

-- Create the trigger
CREATE TRIGGER user_message_history_audit_trigger
    AFTER INSERT ON user_message_history
    FOR EACH ROW
    EXECUTE FUNCTION log_user_message_history_activity();

-- =====================================================
-- 4. CREATE FUNCTION TO LOG FAILED ATTEMPTS
-- =====================================================

-- Function to manually log failed attempts (call this from edge function on error)
CREATE OR REPLACE FUNCTION log_failed_insert_attempt(
    p_customer_id UUID,
    p_message_id UUID,
    p_error_message TEXT
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO user_message_history_audit_log (
        operation,
        success,
        customer_id,
        message_id,
        error_message,
        user_role,
        session_info
    ) VALUES (
        'INSERT',
        FALSE,
        p_customer_id,
        p_message_id,
        p_error_message,
        current_user,
        jsonb_build_object(
            'session_user', session_user,
            'current_user', current_user,
            'inet_client_addr', inet_client_addr(),
            'application_name', current_setting('application_name', true),
            'timestamp', NOW()
        )
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. QUERIES TO MONITOR ACTIVITY
-- =====================================================

-- View recent audit log entries
SELECT 'Recent INSERT Activity (Last 24 hours):' as info;
SELECT 
    attempted_at,
    operation,
    success,
    customer_id,
    message_id,
    user_role,
    CASE 
        WHEN success THEN '✅ SUCCESS'
        ELSE '❌ FAILED: ' || COALESCE(error_message, 'Unknown error')
    END as result,
    session_info->'application_name' as app_name
FROM user_message_history_audit_log 
WHERE attempted_at > NOW() - INTERVAL '24 hours'
ORDER BY attempted_at DESC
LIMIT 20;

-- Summary of success/failure rates
SELECT 'Success/Failure Summary (Last 24 hours):' as info;
SELECT 
    success,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    MIN(attempted_at) as first_attempt,
    MAX(attempted_at) as last_attempt
FROM user_message_history_audit_log 
WHERE attempted_at > NOW() - INTERVAL '24 hours'
GROUP BY success
ORDER BY success DESC;

-- Show failed attempts with error details
SELECT 'Failed Attempts with Error Details:' as info;
SELECT 
    attempted_at,
    customer_id,
    message_id,
    error_message,
    user_role,
    session_info
FROM user_message_history_audit_log 
WHERE success = FALSE 
    AND attempted_at > NOW() - INTERVAL '24 hours'
ORDER BY attempted_at DESC
LIMIT 10;

-- =====================================================
-- 6. REAL-TIME MONITORING QUERIES
-- =====================================================

-- Query to run periodically to see new activity
SELECT 'Use this query to monitor real-time activity:' as info;
SELECT 'SELECT * FROM user_message_history_audit_log WHERE attempted_at > NOW() - INTERVAL ''5 minutes'' ORDER BY attempted_at DESC;' as monitoring_query;

-- Set up the audit table permissions
ALTER TABLE user_message_history_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert audit logs
DROP POLICY IF EXISTS "Service role can insert audit logs" ON user_message_history_audit_log;
CREATE POLICY "Service role can insert audit logs" ON user_message_history_audit_log
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Allow service role to read audit logs  
DROP POLICY IF EXISTS "Service role can read audit logs" ON user_message_history_audit_log;
CREATE POLICY "Service role can read audit logs" ON user_message_history_audit_log
    FOR SELECT TO service_role
    USING (true);

SELECT '✅ Audit logging setup complete!' as status;
SELECT 'The system will now log all INSERT attempts to user_message_history' as info;
SELECT 'Check the user_message_history_audit_log table for activity tracking' as instruction;
