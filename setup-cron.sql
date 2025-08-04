-- Enable pg_cron extension (run this in Supabase SQL Editor)
-- This allows you to schedule functions to run automatically

-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the notification function to run every minute
-- This will call your Edge Function automatically
SELECT cron.schedule(
    'send-notifications', -- job name
    '* * * * *', -- every minute (cron format)
    $$ 
    SELECT 
      net.http_post(
        url := 'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body := '{}'::jsonb
      );
    $$
);

-- Check if the cron job was created successfully
SELECT * FROM cron.job;
