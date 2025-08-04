-- Add number_sent column to customer_users table with automatic counting
-- This will track the total number of messages sent to each customer

-- Step 1: Add the new column
ALTER TABLE public.customer_users 
ADD COLUMN IF NOT EXISTS number_sent INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Initialize the column with current counts
UPDATE public.customer_users 
SET number_sent = (
    SELECT COUNT(*) 
    FROM public.user_message_history 
    WHERE customer_id = customer_users.id
);

-- Step 3: Create function to update the count
CREATE OR REPLACE FUNCTION update_customer_message_count()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations
    IF TG_OP = 'INSERT' THEN
        UPDATE public.customer_users 
        SET number_sent = number_sent + 1,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
        RETURN NEW;
    END IF;
    
    -- For DELETE operations
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

-- Step 4: Create trigger to automatically update the count
DROP TRIGGER IF EXISTS trigger_update_customer_message_count ON public.user_message_history;

CREATE TRIGGER trigger_update_customer_message_count
    AFTER INSERT OR DELETE ON public.user_message_history
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_message_count();

-- Step 5: Add index for better performance on the new column
CREATE INDEX IF NOT EXISTS idx_customer_users_number_sent ON public.customer_users(number_sent);

-- Step 6: Verify the setup
SELECT 
    'Setup verification:' as info,
    cu.email,
    cu.number_sent as counted_by_column,
    (SELECT COUNT(*) FROM user_message_history WHERE customer_id = cu.id) as actual_count
FROM public.customer_users cu
ORDER BY cu.email
LIMIT 5;

-- Show the trigger was created
SELECT 
    'Trigger created:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_customer_message_count';
