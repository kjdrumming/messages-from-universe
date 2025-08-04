-- Fix RLS policies for customer_users table
-- This resolves the issue where customers can only make one update

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own customer profile" ON public.customer_users;
DROP POLICY IF EXISTS "Users can update own customer profile" ON public.customer_users;
DROP POLICY IF EXISTS "Users can insert own customer profile" ON public.customer_users;

-- Create more robust RLS policies
CREATE POLICY "customer_users_select_policy" ON public.customer_users
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = auth_user_id);

CREATE POLICY "customer_users_insert_policy" ON public.customer_users
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "customer_users_update_policy" ON public.customer_users
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "customer_users_delete_policy" ON public.customer_users
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = auth_user_id);

-- Test the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'customer_users' 
ORDER BY policyname;
