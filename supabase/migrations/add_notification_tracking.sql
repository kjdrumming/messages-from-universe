-- Add additional tracking columns to user_message_history table
ALTER TABLE public.user_message_history 
ADD COLUMN IF NOT EXISTS notification_id TEXT,
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'OneSignal',
ADD COLUMN IF NOT EXISTS recipients_count INTEGER DEFAULT 1;

-- Add index for notification_id lookups
CREATE INDEX IF NOT EXISTS idx_user_message_history_notification_id ON public.user_message_history(notification_id);

-- Add index for delivery_method filtering
CREATE INDEX IF NOT EXISTS idx_user_message_history_delivery_method ON public.user_message_history(delivery_method);

-- Add comment to document the new columns
COMMENT ON COLUMN public.user_message_history.notification_id IS 'OneSignal notification ID for tracking delivery status';
COMMENT ON COLUMN public.user_message_history.delivery_method IS 'Method used to deliver notification (OneSignal, email, etc.)';
COMMENT ON COLUMN public.user_message_history.recipients_count IS 'Number of recipients who received this notification';
