-- Alternative pg_cron setup using a different HTTP method
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call your Edge Function
CREATE OR REPLACE FUNCTION call_notification_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    response_status integer;
BEGIN
    -- Call your Edge Function
    SELECT status INTO response_status
    FROM http((
        'POST',
        'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications',
        ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{}'
    ));
    
    -- Log the result
    RAISE NOTICE 'Notification function called, status: %', response_status;
END;
$$;

-- Schedule the function to run every minute
SELECT cron.schedule(
    'send-notifications',
    '* * * * *',
    'SELECT call_notification_function();'
);

-- Verify the cron job was created
SELECT jobid, jobname, schedule, command, active 
FROM cron.job 
WHERE jobname = 'send-notifications';
