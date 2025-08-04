-- Notification Schedules Migration
-- Run this script to add multiple notification times per user

-- 1. Create notification_schedules table
CREATE TABLE IF NOT EXISTS public.notification_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customer_users(id) ON DELETE CASCADE NOT NULL,
    notification_time TIME NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    is_active BOOLEAN DEFAULT true,
    label TEXT, -- Optional label like "Morning motivation", "Evening reflection"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_schedules_customer ON public.notification_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_active ON public.notification_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_time ON public.notification_schedules(notification_time);

-- 3. Add updated_at trigger
CREATE TRIGGER update_notification_schedules_updated_at 
    BEFORE UPDATE ON public.notification_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS and create policies
ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own notification schedules
CREATE POLICY "Users can view own notification schedules" ON public.notification_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.customer_users 
            WHERE id = customer_id AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own notification schedules" ON public.notification_schedules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.customer_users 
            WHERE id = customer_id AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own notification schedules" ON public.notification_schedules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.customer_users 
            WHERE id = customer_id AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own notification schedules" ON public.notification_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.customer_users 
            WHERE id = customer_id AND auth_user_id = auth.uid()
        )
    );

-- 5. Migrate existing notification settings
-- Create default notification schedule for existing users who have notifications enabled
INSERT INTO public.notification_schedules (customer_id, notification_time, timezone, is_active, label)
SELECT 
    id as customer_id,
    notification_time,
    timezone,
    notification_enabled as is_active,
    'Default notification' as label
FROM public.customer_users 
WHERE notification_enabled = true
ON CONFLICT DO NOTHING;

-- 6. Optional: Add constraints to prevent too many schedules per user
-- Uncomment if you want to limit users to a maximum number of schedules
-- ALTER TABLE public.notification_schedules ADD CONSTRAINT max_schedules_per_user 
--     CHECK ((SELECT COUNT(*) FROM public.notification_schedules WHERE customer_id = NEW.customer_id) <= 5);

-- 7. Create a view for easy querying of user schedules with customer info
CREATE OR REPLACE VIEW public.user_notification_schedules AS
SELECT 
    ns.id,
    ns.customer_id,
    cu.email,
    cu.name,
    ns.notification_time,
    ns.timezone,
    ns.is_active,
    ns.label,
    ns.created_at,
    ns.updated_at
FROM public.notification_schedules ns
JOIN public.customer_users cu ON ns.customer_id = cu.id
WHERE ns.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.user_notification_schedules TO authenticated;
