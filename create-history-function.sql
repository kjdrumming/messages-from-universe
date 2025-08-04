-- ============================================================
-- SQL FUNCTION: Record User Message History
-- ============================================================
-- This function centralizes all history recording logic
-- and can be called from edge functions, manual scripts, etc.

-- Create the function to record message history
CREATE OR REPLACE FUNCTION record_user_message_history(
    p_customer_id UUID,
    p_message_id UUID,
    p_notification_method TEXT DEFAULT 'app_notification',
    p_status TEXT DEFAULT 'sent'
)
RETURNS TABLE(
    success BOOLEAN,
    history_id UUID,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with creator's permissions (bypasses RLS if needed)
AS $$
DECLARE
    v_history_id UUID;
    v_error_message TEXT := NULL;
    v_today DATE;
BEGIN
    -- Validate inputs
    IF p_customer_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Customer ID cannot be null'::TEXT;
        RETURN;
    END IF;

    IF p_message_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Message ID cannot be null'::TEXT;
        RETURN;
    END IF;

    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM customer_users WHERE id = p_customer_id) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Customer not found'::TEXT;
        RETURN;
    END IF;

    -- Check if message exists
    IF NOT EXISTS (SELECT 1 FROM motivational_messages WHERE id = p_message_id) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Message not found'::TEXT;
        RETURN;
    END IF;

    -- Check if user already received a message today (optional duplicate prevention)
    v_today := CURRENT_DATE;
    IF EXISTS (
        SELECT 1 FROM user_message_history 
        WHERE customer_id = p_customer_id 
        AND DATE(sent_at) = v_today
    ) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'User already received a message today'::TEXT;
        RETURN;
    END IF;

    -- Insert the history record
    BEGIN
        INSERT INTO user_message_history (
            customer_id,
            message_id,
            sent_at,
            notification_method,
            status
        ) VALUES (
            p_customer_id,
            p_message_id,
            NOW(),
            p_notification_method,
            p_status
        )
        RETURNING id INTO v_history_id;

        -- Return success
        RETURN QUERY SELECT TRUE, v_history_id, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
        -- Capture any insertion errors
        v_error_message := SQLERRM;
        RETURN QUERY SELECT FALSE, NULL::UUID, v_error_message;
    END;
END;
$$;

-- ============================================================
-- OPTIONAL: Create a simpler version without duplicate checking
-- ============================================================

CREATE OR REPLACE FUNCTION record_user_message_history_simple(
    p_customer_id UUID,
    p_message_id UUID,
    p_notification_method TEXT DEFAULT 'app_notification'
)
RETURNS UUID  -- Returns the inserted history record ID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO user_message_history (
        customer_id,
        message_id,
        sent_at,
        notification_method,
        status
    ) VALUES (
        p_customer_id,
        p_message_id,
        NOW(),
        p_notification_method,
        'sent'
    )
    RETURNING id INTO v_history_id;

    RETURN v_history_id;
END;
$$;

-- ============================================================
-- TESTING THE FUNCTIONS
-- ============================================================

-- Test the main function (with validation and duplicate checking)
/*
SELECT * FROM record_user_message_history(
    'ceb89ae4-b3b4-4468-be82-a84f25eb8eed',  -- your customer_id
    (SELECT id FROM motivational_messages WHERE status = 'active' LIMIT 1),
    'sql_function_test',
    'sent'
);
*/

-- Test the simple function
/*
SELECT record_user_message_history_simple(
    'ceb89ae4-b3b4-4468-be82-a84f25eb8eed',  -- your customer_id
    (SELECT id FROM motivational_messages WHERE status = 'active' LIMIT 1),
    'sql_simple_test'
);
*/

-- Verify the results
/*
SELECT 
    h.id,
    h.sent_at,
    h.notification_method,
    h.status,
    cu.email,
    mm.content
FROM user_message_history h
JOIN customer_users cu ON h.customer_id = cu.id
JOIN motivational_messages mm ON h.message_id = mm.id
ORDER BY h.sent_at DESC
LIMIT 5;
*/
