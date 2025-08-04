-- Create test data for notifications
-- Add some motivational messages
INSERT INTO motivational_messages (content, category, status) VALUES
('🌟 Start your day with intention and purpose!', 'morning', 'active'),
('💪 You have the power to create positive change today!', 'motivation', 'active'),
('🎯 Focus on progress, not perfection!', 'success', 'active'),
('🌈 Every challenge is an opportunity to grow stronger!', 'resilience', 'active'),
('✨ Believe in yourself - you are capable of amazing things!', 'confidence', 'active');

-- Create a test user with notification in the next few minutes
DO $$
DECLARE
    current_time_plus_2 TEXT;
BEGIN
    -- Get current time + 2 minutes in HH:MM format
    current_time_plus_2 := TO_CHAR(NOW() + INTERVAL '2 minutes', 'HH24:MI');
    
    -- Insert test user
    INSERT INTO customer_users (
        email, 
        name, 
        notification_enabled, 
        notification_time, 
        timezone
    ) VALUES (
        'test@example.com',
        'Test User', 
        true, 
        current_time_plus_2,
        'America/New_York'
    ) ON CONFLICT (email) DO UPDATE SET
        notification_enabled = true,
        notification_time = EXCLUDED.notification_time,
        timezone = EXCLUDED.timezone;
        
    RAISE NOTICE 'Test user created with notification time: %', current_time_plus_2;
END $$;
