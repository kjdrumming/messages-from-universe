-- Supabase Setup SQL Scripts
-- Run these scripts in your Supabase SQL editor

-- 1. Create customer_users table
CREATE TABLE IF NOT EXISTS public.customer_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    notification_enabled BOOLEAN DEFAULT false,
    notification_time TIME DEFAULT '09:00:00',
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create motivational_messages table (for admin management)
CREATE TABLE IF NOT EXISTS public.motivational_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
    created_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_message_history table (track sent messages)
CREATE TABLE IF NOT EXISTS public.user_message_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customer_users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.motivational_messages(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_users_email ON public.customer_users(email);
CREATE INDEX IF NOT EXISTS idx_customer_users_auth_id ON public.customer_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_id ON public.admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.motivational_messages(status);
CREATE INDEX IF NOT EXISTS idx_user_history_customer ON public.user_message_history(customer_id);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
CREATE TRIGGER update_customer_users_updated_at 
    BEFORE UPDATE ON public.customer_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON public.admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motivational_messages_updated_at 
    BEFORE UPDATE ON public.motivational_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.customer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivational_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_message_history ENABLE ROW LEVEL SECURITY;

-- Customer users can only see/edit their own data
CREATE POLICY "Users can view own customer profile" ON public.customer_users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own customer profile" ON public.customer_users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own customer profile" ON public.customer_users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Admin users can only see/edit their own data
CREATE POLICY "Admins can view own admin profile" ON public.admin_users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can update own admin profile" ON public.admin_users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can insert own admin profile" ON public.admin_users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Motivational messages - admins can manage all
CREATE POLICY "Admins can manage messages" ON public.motivational_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Customers can only view active messages
CREATE POLICY "Customers can view active messages" ON public.motivational_messages
    FOR SELECT USING (
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM public.customer_users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- User message history - users can only see their own
CREATE POLICY "Users can view own message history" ON public.user_message_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.customer_users 
            WHERE id = customer_id AND auth_user_id = auth.uid()
        )
    );

-- 9. Insert some sample motivational messages (without created_by since no admins exist yet)
INSERT INTO public.motivational_messages (content, category, status, created_by) VALUES
('Every great achievement starts with the decision to try.', 'Motivation', 'active', NULL),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Perseverance', 'active', NULL),
('The future belongs to those who believe in the beauty of their dreams.', 'Dreams', 'active', NULL),
('Your potential is endless, and today is the perfect day to unleash it.', 'Potential', 'active', NULL),
('Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.', 'Self-Belief', 'active', NULL);
