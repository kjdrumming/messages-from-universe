-- Debug customer updates issue
-- Check current auth state and customer_users data

SELECT 'Current auth context:' as debug_info;
SELECT 
    auth.uid() as current_auth_uid,
    auth.role() as current_auth_role;

SELECT 'Customer users table data:' as debug_info;
SELECT 
    id,
    email,
    auth_user_id,
    notification_enabled,
    notification_time,
    timezone,
    created_at
FROM customer_users 
ORDER BY created_at DESC 
LIMIT 5;

-- Test update permissions
SELECT 'Testing update permissions:' as debug_info;
SELECT 
    id,
    email,
    auth_user_id,
    (auth.uid() = auth_user_id) as can_update,
    auth.uid() as current_auth_uid,
    auth_user_id as user_auth_id
FROM customer_users 
WHERE email = 'kjdrumming@gmail.com';

-- Check if there are any triggers that might be interfering
SELECT 'Checking triggers on customer_users:' as debug_info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'customer_users';
