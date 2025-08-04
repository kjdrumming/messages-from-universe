# Automatic Notifications Setup Guide

## Overview
The notification system is now updated to send push notifications to users' mobile devices based on their preferred notification time and timezone.

## What's Fixed
1. ✅ **Push Notifications Only**: Removed SMS functionality, focusing only on push notifications
2. ✅ **Better Time Window**: Increased time matching window from 1 minute to 5 minutes
3. ✅ **Simplified Logic**: Streamlined notification logic to only handle push notifications
4. ✅ **Database Schema**: Added push_token field to customer_users table

## Required Environment Variables
You need to set these in your Supabase project:

```bash
FCM_SERVER_KEY=your_firebase_cloud_messaging_server_key
```

## How It Works
1. **Edge Function**: `send-scheduled-notifications` checks users' local times against their preferred notification times
2. **Time Matching**: If a user's local time is within 5 minutes of their preferred time, they get a notification
3. **Push Notification**: Uses Firebase Cloud Messaging (FCM) to send notifications to their device
4. **One Per Day**: Each user only receives one notification per day

## Setting Up Automatic Trigger

### Option 1: Supabase Cron (Recommended)
Add this to your Supabase Dashboard → Database → Cron:

```sql
-- Run every minute to check for notifications
SELECT cron.schedule(
  'send-scheduled-notifications',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/cron-trigger',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Option 2: External Cron Service
Use a service like cron-job.org or GitHub Actions to call:
```
POST https://your-project-ref.supabase.co/functions/v1/cron-trigger
Headers: Authorization: Bearer YOUR_ANON_KEY
```

### Option 3: GitHub Actions
Create `.github/workflows/notifications.yml`:

```yaml
name: Send Notifications
on:
  schedule:
    - cron: '* * * * *'  # Every minute
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notifications
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://your-project-ref.supabase.co/functions/v1/cron-trigger
```

## Testing the System

### Test Notifications Function
Call this to test without waiting for cron:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"forceAll": true}' \
  https://your-project-ref.supabase.co/functions/v1/test-notifications
```

### Check Logs
Monitor your Supabase Functions logs to see:
- Which users are being processed
- Time matching logic
- Push notification success/failures

## User Setup Requirements

For users to receive notifications, they need:
1. `notification_enabled = true`
2. `notification_time` set to their preferred time (e.g., '09:00:00')
3. `timezone` set correctly (e.g., 'America/New_York')
4. `push_token` set with their device's FCM token

## Push Token Integration

You'll need to integrate Firebase/FCM in your frontend app to:
1. Request notification permission
2. Get the FCM token
3. Save the token to the user's `push_token` field
4. Handle token refresh

Example frontend code:
```javascript
// Get FCM token and save to user profile
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging();
getToken(messaging, { vapidKey: 'your-vapid-key' }).then((currentToken) => {
  if (currentToken) {
    // Save to user profile
    supabase.from('customer_users')
      .update({ push_token: currentToken })
      .eq('id', userId);
  }
});
```

## Troubleshooting

### No Notifications Being Sent
1. Check if users have `notification_enabled = true`
2. Verify FCM_SERVER_KEY is set correctly
3. Check timezone format (use IANA timezone names)
4. Verify push tokens are valid and not expired
5. Check function logs for errors

### Notifications Not Received
1. Verify user has granted notification permission
2. Check if push token is still valid
3. Ensure FCM project is configured correctly
4. Check device notification settings

### Time Zone Issues
- Use IANA timezone names: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
- Examples: 'America/New_York', 'Europe/London', 'Asia/Tokyo'
