-- SQL script to diagnose user_message_history table activity
-- This will help track what's happening with INSERT requests

-- =====================================================
-- 1. CURRENT TABLE STATUS AND RECENT ACTIVITY
-- =====================================================

SELECT '=== USER_MESSAGE_HISTORY DIAGNOSTIC REPORT ===' as status;

-- Show current table stats
SELECT 'Table Statistics:' as info;
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as current_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename = 'user_message_history';

-- Show RLS status
SELECT 'Row Level Security Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS is ENABLED'
        ELSE 'RLS is DISABLED'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'user_message_history';

-- Show current RLS policies
SELECT 'Current RLS Policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN 'Allows INSERT operations'
        WHEN cmd = 'SELECT' THEN 'Allows SELECT operations'
        WHEN cmd = 'UPDATE' THEN 'Allows UPDATE operations'
        WHEN cmd = 'DELETE' THEN 'Allows DELETE operations'
        ELSE 'Other operation'
    END as description
FROM pg_policies 
WHERE tablename = 'user_message_history'
ORDER BY cmd, policyname;

-- =====================================================
-- 2. RECENT RECORDS ANALYSIS
-- =====================================================

SELECT 'Recent Records (Last 10):' as info;
SELECT 
    h.id,
    h.customer_id,
    c.email as customer_email,
    h.message_id,
    SUBSTRING(m.content, 1, 60) || '...' as message_preview,
    h.sent_at,
    EXTRACT(EPOCH FROM (NOW() - h.sent_at))/60 as minutes_ago
FROM user_message_history h
LEFT JOIN customer_users c ON h.customer_id = c.id
LEFT JOIN motivational_messages m ON h.message_id = m.id
ORDER BY h.sent_at DESC
LIMIT 10;

-- Show records created in the last hour
SELECT 'Records Created in Last Hour:' as info;
SELECT COUNT(*) as records_last_hour
FROM user_message_history 
WHERE sent_at > NOW() - INTERVAL '1 hour';

-- Show records created today
SELECT 'Records Created Today:' as info;
SELECT COUNT(*) as records_today
FROM user_message_history 
WHERE sent_at >= CURRENT_DATE;

-- =====================================================
-- 3. DATA INTEGRITY CHECKS
-- =====================================================

SELECT 'Data Integrity Checks:' as info;

-- Check for orphaned records (customer doesn't exist)
SELECT 'Orphaned Customer Records:' as check_type;
SELECT COUNT(*) as orphaned_customers
FROM user_message_history h
LEFT JOIN customer_users c ON h.customer_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned records (message doesn't exist)
SELECT 'Orphaned Message Records:' as check_type;
SELECT COUNT(*) as orphaned_messages
FROM user_message_history h
LEFT JOIN motivational_messages m ON h.message_id = m.id
WHERE m.id IS NULL;

-- Check for NULL values
SELECT 'Records with NULL values:' as check_type;
SELECT 
    COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as null_customer_id,
    COUNT(CASE WHEN message_id IS NULL THEN 1 END) as null_message_id,
    COUNT(CASE WHEN sent_at IS NULL THEN 1 END) as null_sent_at
FROM user_message_history;

-- =====================================================
-- 4. TABLE STRUCTURE AND CONSTRAINTS
-- =====================================================

SELECT 'Table Structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' THEN 'Required'
        ELSE 'Optional'
    END as requirement
FROM information_schema.columns 
WHERE table_name = 'user_message_history' 
ORDER BY ordinal_position;

-- Show foreign key constraints
SELECT 'Foreign Key Constraints:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'user_message_history';

-- =====================================================
-- 5. ROLE PERMISSIONS CHECK
-- =====================================================

SELECT 'Current Database Role:' as info;
SELECT 
    current_user as current_role,
    session_user as session_role,
    CASE 
        WHEN current_user = 'service_role' THEN 'Running as SERVICE_ROLE (edge functions)'
        WHEN current_user = 'anon' THEN 'Running as ANON (public access)'
        WHEN current_user = 'authenticated' THEN 'Running as AUTHENTICATED (logged-in users)'
        WHEN current_user = 'postgres' THEN 'Running as POSTGRES (superuser)'
        ELSE 'Running as ' || current_user
    END as role_description;

-- Check if current role can insert
SELECT 'INSERT Permission Test:' as info;
DO $$
BEGIN
    -- Try to check if we have insert permission by looking at policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_message_history' 
        AND cmd = 'INSERT' 
        AND (roles @> ARRAY[current_user] OR roles @> ARRAY['PUBLIC'])
    ) THEN
        RAISE NOTICE 'Current role (%) appears to have INSERT permission via RLS policy', current_user;
    ELSE
        RAISE NOTICE 'Current role (%) may NOT have INSERT permission via RLS policy', current_user;
    END IF;
END $$;

-- =====================================================
-- 6. ACTIVITY MONITORING SETUP
-- =====================================================

SELECT 'Monitoring Recommendations:' as info;
SELECT 'To monitor real-time INSERT activity, you can:' as recommendation
UNION ALL
SELECT '1. Enable PostgreSQL query logging in your Supabase dashboard'
UNION ALL  
SELECT '2. Use pg_stat_activity to see current connections and queries'
UNION ALL
SELECT '3. Create triggers on user_message_history for audit logging'
UNION ALL
SELECT '4. Monitor the edge function logs in Supabase dashboard';

-- Show current active connections
SELECT 'Current Active Database Connections:' as info;
SELECT 
    pid,
    usename as username,
    application_name,
    client_addr,
    state,
    SUBSTRING(query, 1, 100) || '...' as current_query,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE state = 'active' 
    AND pid != pg_backend_pid()  -- Exclude this query
ORDER BY query_start DESC
LIMIT 5;

SELECT '=== END OF DIAGNOSTIC REPORT ===' as status;
