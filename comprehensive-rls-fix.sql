-- Comprehensive RLS fix for customer update issues
-- This includes both policy fixes and debugging queries

-- 1. First, let's check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'customer_users';

-- 2. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own customer profile" ON public.customer_users;
DROP POLICY IF EXISTS "Users can update own customer profile" ON public.customer_users;
DROP POLICY IF EXISTS "Users can insert own customer profile" ON public.customer_users;

-- 3. Create new, more explicit policies
CREATE POLICY "customer_users_select" ON public.customer_users
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = auth_user_id
    );

CREATE POLICY "customer_users_insert" ON public.customer_users
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = auth_user_id
    );

CREATE POLICY "customer_users_update" ON public.customer_users
    FOR UPDATE 
    TO authenticated
    USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = auth_user_id
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        auth.uid() = auth_user_id
    );

-- 4. Alternative: Create a more permissive policy for debugging
-- Uncomment this if the above doesn't work
/*
DROP POLICY IF EXISTS "customer_users_select" ON public.customer_users;
DROP POLICY IF EXISTS "customer_users_update" ON public.customer_users;
DROP POLICY IF EXISTS "customer_users_insert" ON public.customer_users;

CREATE POLICY "customer_users_all_operations" ON public.customer_users
    FOR ALL
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);
*/

-- 5. Verification queries
-- Run these to check if the policies are working
SELECT 
    id,
    email,
    auth_user_id,
    notification_enabled,
    notification_time,
    timezone,
    created_at,
    updated_at
FROM customer_users 
WHERE auth_user_id = auth.uid();

-- 6. Test update query (replace with actual user ID)
-- UPDATE customer_users 
-- SET notification_time = '10:30:00', updated_at = NOW()
-- WHERE auth_user_id = auth.uid();

-- 7. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'customer_users';

-- 8. Check current auth context
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;
