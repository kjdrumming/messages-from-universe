-- Manual insert script for user_message_history table
-- This script will add a test record to the user_message_history table

-- First, let's see what data we have to work with
-- Uncomment these SELECT statements to see available data:

-- Check available users
-- SELECT id, email, name FROM customer_users WHERE notification_enabled = true;

-- Check available messages  
-- SELECT id, content, category FROM motivational_messages WHERE status = 'active';

-- Check current history records
-- SELECT * FROM user_message_history ORDER BY sent_at DESC LIMIT 5;

-- ==================================================
-- MANUAL INSERT - Replace the UUIDs with actual values
-- ==================================================

-- Method 1: Insert with specific UUIDs (replace with your actual UUIDs)
INSERT INTO user_message_history (
    customer_id,
    message_id,
    sent_at,
    notification_method,
    status
) VALUES (
    'ceb89ae4-b3b4-4468-be82-a84f25eb8eed',  -- Replace with actual customer_id from customer_users
    (SELECT id FROM motivational_messages WHERE status = 'active' LIMIT 1),  -- Gets first active message
    NOW(),
    'manual_test',
    'sent'
);

-- ==================================================
-- Alternative Method 2: Insert using email lookup
-- ==================================================

-- Insert using email to find customer_id automatically
INSERT INTO user_message_history (
    customer_id,
    message_id,
    sent_at,
    notification_method,
    status
) 
SELECT 
    cu.id as customer_id,
    mm.id as message_id,
    NOW() as sent_at,
    'manual_test' as notification_method,
    'sent' as status
FROM customer_users cu
CROSS JOIN motivational_messages mm
WHERE cu.email = 'kjdrumming@gmail.com'  -- Replace with your email
  AND mm.status = 'active'
LIMIT 1;

-- ==================================================
-- Method 3: Insert with current timestamp for testing
-- ==================================================

-- Insert a test record with current time (useful for testing time-based queries)
INSERT INTO user_message_history (
    customer_id,
    message_id,
    sent_at,
    notification_method,
    status
) 
SELECT 
    cu.id,
    mm.id,
    CURRENT_TIMESTAMP as sent_at,
    'edge_function_test' as notification_method,
    'sent' as status
FROM customer_users cu
CROSS JOIN motivational_messages mm  
WHERE cu.notification_enabled = true
  AND mm.status = 'active'
LIMIT 1;

-- ==================================================
-- Verification Query - Run this after insert
-- ==================================================

-- Check that the record was inserted successfully
SELECT 
    h.id,
    h.sent_at,
    h.notification_method,
    h.status,
    cu.email as user_email,
    mm.content as message_content
FROM user_message_history h
JOIN customer_users cu ON h.customer_id = cu.id
JOIN motivational_messages mm ON h.message_id = mm.id
ORDER BY h.sent_at DESC
LIMIT 5;
