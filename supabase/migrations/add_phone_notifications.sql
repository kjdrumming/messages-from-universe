-- Add push token to customer_users table for push notifications
ALTER TABLE public.customer_users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for push token lookups
CREATE INDEX IF NOT EXISTS idx_customer_users_push_token ON public.customer_users(push_token);
