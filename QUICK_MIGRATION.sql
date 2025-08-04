-- 🚀 QUICK MIGRATION: Add number_sent column with automatic counting
-- Copy and paste this entire script into your Supabase SQL Editor

-- Step 1: Add the number_sent column
ALTER TABLE public.customer_users 
ADD COLUMN IF NOT EXISTS number_sent INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Initialize with current counts
UPDATE public.customer_users 
SET number_sent = (
    SELECT COUNT(*) 
    FROM public.user_message_history 
    WHERE customer_id = customer_users.id
);

-- Step 3: Create the trigger function
CREATE OR REPLACE FUNCTION update_customer_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.customer_users 
        SET number_sent = number_sent + 1,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE public.customer_users 
        SET number_sent = GREATEST(number_sent - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS trigger_update_customer_message_count ON public.user_message_history;
CREATE TRIGGER trigger_update_customer_message_count
    AFTER INSERT OR DELETE ON public.user_message_history
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_message_count();

-- Step 5: Add performance index
CREATE INDEX IF NOT EXISTS idx_customer_users_number_sent ON public.customer_users(number_sent);

-- Step 6: Verify the setup
SELECT 
    'Migration complete! Verification:' as status,
    cu.email,
    cu.number_sent as column_count,
    (SELECT COUNT(*) FROM user_message_history WHERE customer_id = cu.id) as actual_count
FROM public.customer_users cu
ORDER BY cu.number_sent DESC
LIMIT 5;
