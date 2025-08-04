-- Create a version without duplicate prevention for testing
CREATE OR REPLACE FUNCTION record_user_message_history_no_dup_check(
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
SECURITY DEFINER
AS $$
DECLARE
    v_history_id UUID;
    v_error_message TEXT := NULL;
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

    -- Insert the history record (NO DUPLICATE CHECK)
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
