-- ========================================
-- NEXT MESSAGE TIME IMPLEMENTATION
-- ========================================
-- This script adds a next_message_time column to customer_users
-- and creates a function to calculate the next scheduled message time
-- based on each customer's notification_schedules

-- Step 1: Add the next_message_time column to customer_users table
-- ========================================
ALTER TABLE customer_users 
ADD COLUMN IF NOT EXISTS next_message_time TIMESTAMP WITH TIME ZONE;

-- Add index for performance when querying next message times
CREATE INDEX IF NOT EXISTS idx_customer_users_next_message_time 
ON customer_users(next_message_time);

-- Step 2: Create function to calculate next message time for a customer
-- ========================================
CREATE OR REPLACE FUNCTION calculate_next_message_time(customer_user_id UUID)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
    customer_timezone TEXT;
    next_time TIMESTAMP WITH TIME ZONE := NULL;
    current_time_in_tz TIMESTAMP WITH TIME ZONE;
    today_date DATE;
    schedule_record RECORD;
    candidate_time TIMESTAMP WITH TIME ZONE;
    local_datetime_str TEXT;
BEGIN
    -- Get customer's timezone from customer_users table
    SELECT timezone INTO customer_timezone 
    FROM customer_users 
    WHERE id = customer_user_id;
    
    -- If no timezone found, return NULL
    IF customer_timezone IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get current time in customer's timezone
    current_time_in_tz := NOW() AT TIME ZONE customer_timezone;
    today_date := current_time_in_tz::DATE;
    
    -- Loop through all active notification schedules for this customer
    FOR schedule_record IN 
        SELECT notification_time, timezone
        FROM notification_schedules 
        WHERE customer_id = customer_user_id 
        AND is_active = true
        ORDER BY notification_time
    LOOP
        -- Use the schedule's timezone or fall back to customer timezone
        DECLARE
            effective_timezone TEXT := COALESCE(schedule_record.timezone, customer_timezone);
        BEGIN
            -- Create candidate time for today in local timezone
            -- Format: "2025-08-04 09:00:00 America/New_York"
            local_datetime_str := today_date::TEXT || ' ' || schedule_record.notification_time::TEXT || ' ' || effective_timezone;
            candidate_time := local_datetime_str::TIMESTAMPTZ;
            
            -- If today's time hasn't passed yet, use it
            IF candidate_time > NOW() THEN
                IF next_time IS NULL OR candidate_time < next_time THEN
                    next_time := candidate_time;
                END IF;
            ELSE
                -- Use tomorrow's time
                local_datetime_str := (today_date + INTERVAL '1 day')::DATE::TEXT || ' ' || schedule_record.notification_time::TEXT || ' ' || effective_timezone;
                candidate_time := local_datetime_str::TIMESTAMPTZ;
                IF next_time IS NULL OR candidate_time < next_time THEN
                    next_time := candidate_time;
                END IF;
            END IF;
        END;
    END LOOP;
    
    RETURN next_time;
END;
$$;

-- Step 3: Create function to update all customers' next message times
-- ========================================
CREATE OR REPLACE FUNCTION update_all_next_message_times()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER := 0;
    customer_record RECORD;
    calculated_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through all customers who have notifications enabled
    FOR customer_record IN 
        SELECT id 
        FROM customer_users 
        WHERE notification_enabled = true
    LOOP
        -- Calculate next message time for this customer
        calculated_time := calculate_next_message_time(customer_record.id);
        
        -- Update the customer's next_message_time
        UPDATE customer_users 
        SET next_message_time = calculated_time,
            updated_at = NOW()
        WHERE id = customer_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    -- Clear next_message_time for customers with notifications disabled
    UPDATE customer_users 
    SET next_message_time = NULL,
        updated_at = NOW()
    WHERE notification_enabled = false 
    AND next_message_time IS NOT NULL;
    
    RETURN updated_count;
END;
$$;

-- Step 4: Create trigger function to update next message time when schedules change
-- ========================================
CREATE OR REPLACE FUNCTION trigger_update_customer_next_message_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    calculated_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Handle INSERT and UPDATE operations
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        calculated_time := calculate_next_message_time(NEW.customer_id);
        
        UPDATE customer_users 
        SET next_message_time = calculated_time,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE operations
    IF TG_OP = 'DELETE' THEN
        calculated_time := calculate_next_message_time(OLD.customer_id);
        
        UPDATE customer_users 
        SET next_message_time = calculated_time,
            updated_at = NOW()
        WHERE id = OLD.customer_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Step 5: Create trigger on notification_schedules table
-- ========================================
DROP TRIGGER IF EXISTS update_next_message_time_trigger ON notification_schedules;

CREATE TRIGGER update_next_message_time_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notification_schedules
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_customer_next_message_time();

-- Step 6: Create trigger function for customer_users changes
-- ========================================
CREATE OR REPLACE FUNCTION trigger_update_customer_notification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    calculated_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Only proceed if notification_enabled or timezone changed
    IF OLD.notification_enabled != NEW.notification_enabled OR 
       OLD.timezone != NEW.timezone THEN
        
        IF NEW.notification_enabled = true THEN
            calculated_time := calculate_next_message_time(NEW.id);
        ELSE
            calculated_time := NULL;
        END IF;
        
        -- Update next_message_time without causing infinite recursion
        UPDATE customer_users 
        SET next_message_time = calculated_time
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 7: Create trigger on customer_users table
-- ========================================
DROP TRIGGER IF EXISTS update_customer_notification_change_trigger ON customer_users;

CREATE TRIGGER update_customer_notification_change_trigger
    AFTER UPDATE ON customer_users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_customer_notification_change();

-- Step 8: Initial population of next_message_time for existing customers
-- ========================================
SELECT update_all_next_message_times() as customers_updated;

-- Step 9: Create helper function to get formatted next message time
-- ========================================
CREATE OR REPLACE FUNCTION get_formatted_next_message_time(customer_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    customer_timezone TEXT;
    next_time TIMESTAMP WITH TIME ZONE;
    formatted_time TEXT;
BEGIN
    -- Get customer's timezone and next message time
    SELECT timezone, next_message_time 
    INTO customer_timezone, next_time
    FROM customer_users 
    WHERE id = customer_user_id;
    
    -- If no next time scheduled, return appropriate message
    IF next_time IS NULL THEN
        RETURN 'No messages scheduled';
    END IF;
    
    -- Format the time in customer's timezone with 12-hour format
    formatted_time := TO_CHAR(next_time AT TIME ZONE customer_timezone, 'HH12:MI AM');
    
    RETURN formatted_time;
END;
$$;

-- ========================================
-- DEBUGGING QUERIES
-- ========================================

-- Debug: Check what the function calculates vs what's stored
SELECT 
    cu.email,
    cu.timezone,
    cu.next_message_time as stored_utc,
    calculate_next_message_time(cu.id) as calculated_utc,
    cu.next_message_time AT TIME ZONE cu.timezone as stored_local,
    calculate_next_message_time(cu.id) AT TIME ZONE cu.timezone as calculated_local
FROM customer_users cu 
WHERE cu.notification_enabled = true
LIMIT 5;

-- Debug: See all notification schedules and their calculated times
SELECT 
    cu.email,
    cu.timezone as customer_tz,
    ns.notification_time,
    ns.timezone as schedule_tz,
    COALESCE(ns.timezone, cu.timezone) as effective_tz,
    
    -- Show how the time gets calculated for today
    ((NOW() AT TIME ZONE cu.timezone)::DATE + ns.notification_time) AT TIME ZONE COALESCE(ns.timezone, cu.timezone) as today_utc,
    
    -- Show in local time
    ((NOW() AT TIME ZONE cu.timezone)::DATE + ns.notification_time) AT TIME ZONE COALESCE(ns.timezone, cu.timezone) AT TIME ZONE cu.timezone as today_local
    
FROM customer_users cu
JOIN notification_schedules ns ON cu.id = ns.customer_id
WHERE cu.notification_enabled = true AND ns.is_active = true
ORDER BY cu.email, ns.notification_time;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check the new column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customer_users' 
AND column_name = 'next_message_time';

-- View next message times for all customers
SELECT 
    cu.email,
    cu.notification_enabled,
    cu.timezone,
    cu.next_message_time,
    cu.next_message_time AT TIME ZONE cu.timezone as local_next_time,
    get_formatted_next_message_time(cu.id) as formatted_time
FROM customer_users cu
ORDER BY cu.next_message_time;

-- Count of customers by next message status
SELECT 
    CASE 
        WHEN next_message_time IS NULL THEN 'No messages scheduled'
        WHEN next_message_time > NOW() THEN 'Message scheduled'
        ELSE 'Past due'
    END as status,
    COUNT(*) as count
FROM customer_users
GROUP BY 
    CASE 
        WHEN next_message_time IS NULL THEN 'No messages scheduled'
        WHEN next_message_time > NOW() THEN 'Message scheduled'
        ELSE 'Past due'
    END;

-- Step 10: Create function to update expired next message times
-- ========================================
CREATE OR REPLACE FUNCTION update_expired_next_message_times()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER := 0;
    customer_record RECORD;
    calculated_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through all customers whose next_message_time has passed
    FOR customer_record IN 
        SELECT id 
        FROM customer_users 
        WHERE notification_enabled = true 
        AND next_message_time IS NOT NULL 
        AND next_message_time <= NOW()
    LOOP
        -- Calculate new next message time for this customer
        calculated_time := calculate_next_message_time(customer_record.id);
        
        -- Update the customer's next_message_time
        UPDATE customer_users 
        SET next_message_time = calculated_time,
            updated_at = NOW()
        WHERE id = customer_record.id;
        
        updated_count := updated_count + 1;
        
        -- Log the update for debugging
        RAISE NOTICE 'Updated expired next_message_time for customer %, new time: %', 
                     customer_record.id, calculated_time;
    END LOOP;
    
    RETURN updated_count;
END;
$$;

-- Step 11: Create function to check and update all next message times (comprehensive update)
-- ========================================
CREATE OR REPLACE FUNCTION refresh_all_next_message_times()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    updated_count INTEGER := 0;
    customer_record RECORD;
    calculated_time TIMESTAMP WITH TIME ZONE;
    current_stored_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through all customers with notifications enabled
    FOR customer_record IN 
        SELECT id, next_message_time 
        FROM customer_users 
        WHERE notification_enabled = true
    LOOP
        -- Get current stored time
        current_stored_time := customer_record.next_message_time;
        
        -- Calculate what the next message time should be
        calculated_time := calculate_next_message_time(customer_record.id);
        
        -- Update if the calculated time is different from stored time
        -- or if the stored time has passed
        IF (current_stored_time IS NULL AND calculated_time IS NOT NULL) OR
           (current_stored_time IS NOT NULL AND calculated_time IS NULL) OR
           (current_stored_time != calculated_time) OR
           (current_stored_time IS NOT NULL AND current_stored_time <= NOW()) THEN
            
            UPDATE customer_users 
            SET next_message_time = calculated_time,
                updated_at = NOW()
            WHERE id = customer_record.id;
            
            updated_count := updated_count + 1;
            
            RAISE NOTICE 'Refreshed next_message_time for customer %: % -> %', 
                         customer_record.id, current_stored_time, calculated_time;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$;

-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- To manually update a specific customer's next message time:
-- SELECT calculate_next_message_time('customer-uuid-here');

-- To update all customers' next message times:
-- SELECT update_all_next_message_times();

-- To update only expired next message times:
-- SELECT update_expired_next_message_times();

-- To refresh/check all next message times (comprehensive):
-- SELECT refresh_all_next_message_times();

-- Step 12: Set up automatic cleanup of expired next message times
-- ========================================
-- This creates a cron job to run every 5 minutes to update expired next message times
-- Requires pg_cron extension to be enabled

-- Enable pg_cron extension (may require superuser privileges)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run every 5 minutes
-- This will automatically update next_message_time for customers whose scheduled time has passed
SELECT cron.schedule(
    'update-expired-next-message-times',  -- job name
    '*/5 * * * *',                        -- every 5 minutes
    'SELECT update_expired_next_message_times();'
);

-- Alternative: Schedule a comprehensive refresh every hour
-- This ensures all next_message_times are accurate
SELECT cron.schedule(
    'refresh-all-next-message-times',     -- job name
    '0 * * * *',                          -- every hour at minute 0
    'SELECT refresh_all_next_message_times();'
);

-- To view scheduled cron jobs:
-- SELECT * FROM cron.job;

-- To remove a cron job if needed:
-- SELECT cron.unschedule('update-expired-next-message-times');
-- SELECT cron.unschedule('refresh-all-next-message-times');

-- ========================================
-- MANUAL TESTING QUERIES
-- ========================================

-- Test: See customers with expired next_message_times
SELECT 
    cu.email,
    cu.next_message_time,
    cu.next_message_time <= NOW() as is_expired,
    NOW() as current_time
FROM customer_users cu 
WHERE cu.notification_enabled = true 
AND cu.next_message_time IS NOT NULL
ORDER BY cu.next_message_time;

-- Test: Run the expired update function manually
-- SELECT update_expired_next_message_times();

-- Test: Run the comprehensive refresh function manually
-- SELECT refresh_all_next_message_times();
