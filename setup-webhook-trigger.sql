-- Database webhook trigger approach
-- This creates a function that can be called by a database trigger or scheduler

-- First, create a function that calls your Edge Function
CREATE OR REPLACE FUNCTION trigger_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the Edge Function using HTTP
  PERFORM net.http_post(
    url := 'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Option A: Call this function every minute using pg_cron
SELECT cron.schedule(
  'notifications-cron',
  '* * * * *', -- every minute
  'SELECT trigger_notifications();'
);

-- Option B: Create a table-based scheduler (if pg_cron doesn't work)
CREATE TABLE IF NOT EXISTS notification_scheduler (
  id SERIAL PRIMARY KEY,
  last_run TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_run TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 minute'
);

-- Insert initial record
INSERT INTO notification_scheduler (last_run, next_run) 
VALUES (NOW(), NOW() + INTERVAL '1 minute')
ON CONFLICT DO NOTHING;
