-- Drop and recreate user_message_history table
-- WARNING: This will delete all existing data!

-- First, drop the existing table
DROP TABLE IF EXISTS user_message_history CASCADE;

-- Create the new table with a clean structure
CREATE TABLE user_message_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customer_users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES motivational_messages(id) ON DELETE CASCADE,
    notification_method TEXT NOT NULL DEFAULT 'app_notification',
    status TEXT NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_user_message_history_customer_id ON user_message_history(customer_id);
CREATE INDEX idx_user_message_history_sent_at ON user_message_history(sent_at);
CREATE INDEX idx_user_message_history_status ON user_message_history(status);

-- Enable RLS (Row Level Security)
ALTER TABLE user_message_history ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for service role
-- This ensures edge functions can insert records
CREATE POLICY "Allow all operations for service role" ON user_message_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Optional: Create a policy for authenticated users to see their own records
CREATE POLICY "Users can view own history" ON user_message_history
    FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid()::uuid);

-- Grant necessary permissions
GRANT ALL ON user_message_history TO service_role;
GRANT SELECT ON user_message_history TO authenticated;
GRANT SELECT ON user_message_history TO anon;

-- Verify the table was created successfully
SELECT 'Table created successfully' as status;

-- Show the new table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_message_history'
ORDER BY ordinal_position;
