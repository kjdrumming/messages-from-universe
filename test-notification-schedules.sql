-- Test the notification schedules setup
-- Run this after applying the migration

-- Check the notification_schedules table structure
\d notification_schedules;

-- Check if any notification schedules were migrated
SELECT 
    ns.*,
    cu.email,
    cu.name,
    cu.notification_enabled
FROM notification_schedules ns
JOIN customer_users cu ON ns.customer_id = cu.id
ORDER BY cu.email, ns.notification_time;

-- Check the view
SELECT * FROM user_notification_schedules;

-- Test inserting a new schedule (replace with actual customer_id)
-- INSERT INTO notification_schedules (customer_id, notification_time, timezone, label, is_active)
-- VALUES ('your-customer-id-here', '14:30:00', 'America/Los_Angeles', 'Afternoon boost', true);

-- Count schedules per user
SELECT 
    cu.email,
    cu.notification_enabled,
    COUNT(ns.id) as schedule_count,
    ARRAY_AGG(ns.notification_time ORDER BY ns.notification_time) as notification_times
FROM customer_users cu
LEFT JOIN notification_schedules ns ON cu.id = ns.customer_id AND ns.is_active = true
GROUP BY cu.id, cu.email, cu.notification_enabled
ORDER BY cu.email;
