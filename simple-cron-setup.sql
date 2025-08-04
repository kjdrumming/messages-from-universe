-- Simplified approach without net.http_post
-- Run this in Supabase SQL Editor

-- First, check what extensions are available
SELECT extname FROM pg_extension WHERE extname IN ('pg_cron', 'http', 'net');

-- Create a simple trigger table approach
CREATE TABLE IF NOT EXISTS notification_trigger (
    id SERIAL PRIMARY KEY,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

-- Create a function that gets called when we want to trigger notifications
CREATE OR REPLACE FUNCTION mark_notification_trigger()
RETURNS void
LANGUAGE sql
AS $$
    INSERT INTO notification_trigger (triggered_at, processed) VALUES (NOW(), FALSE);
$$;

-- Simple cron job that just marks the trigger (no HTTP calls)
SELECT cron.schedule(
    'mark-notifications',
    '* * * * *',  -- every minute
    'SELECT mark_notification_trigger();'
);

-- Check if the cron job was created
SELECT jobid, jobname, schedule, command, active FROM cron.job WHERE jobname = 'mark-notifications';
