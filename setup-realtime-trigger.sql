-- Realtime trigger approach using a heartbeat table
-- This creates a table that updates every minute and triggers your function

-- Create a heartbeat table
CREATE TABLE IF NOT EXISTS notification_heartbeat (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_beat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the single row
INSERT INTO notification_heartbeat (id, last_beat) 
VALUES (1, NOW()) 
ON CONFLICT (id) DO UPDATE SET last_beat = NOW();

-- Create a function to update the heartbeat and trigger notifications
CREATE OR REPLACE FUNCTION update_notification_heartbeat()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the heartbeat
  UPDATE notification_heartbeat 
  SET last_beat = NOW() 
  WHERE id = 1;
  
  -- Trigger the notification function
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

-- Schedule the heartbeat update every minute
SELECT cron.schedule(
  'notification-heartbeat',
  '* * * * *',
  'SELECT update_notification_heartbeat();'
);
