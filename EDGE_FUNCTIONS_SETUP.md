# Edge Functions Setup for Messages from the Universe

This document explains how to set up Supabase Edge Functions for scheduled notifications.

## Overview

The notification system consists of two edge functions:

1. **send-scheduled-notifications**: Processes users and sends notifications based on their preferred times
2. **cron-trigger**: A scheduled function that triggers the notification processor

## Prerequisites

1. Supabase CLI installed
2. Supabase project with the required tables (customer_users, motivational_messages, user_message_history)
3. Environment variables configured

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link your project

```bash
cd /path/to/your/project
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Deploy Edge Functions

```bash
# Deploy the notification function
supabase functions deploy send-scheduled-notifications

# Deploy the cron trigger function
supabase functions deploy cron-trigger
```

### 5. Set Environment Variables

In your Supabase dashboard, go to Settings > Edge Functions and set:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 6. Setup Cron Job (Option A: External Service)

Use a service like GitHub Actions, Vercel Cron, or Cron-job.org to call your cron-trigger function every minute:

```
URL: https://your-project.supabase.co/functions/v1/cron-trigger
Method: POST
Headers: 
  - Authorization: Bearer YOUR_ANON_KEY
  - Content-Type: application/json
```

### 6. Setup Cron Job (Option B: Supabase Cron - if available)

If your Supabase plan supports cron jobs, you can set up a scheduled function in the Supabase dashboard.

## Testing

### Test the notification function manually:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-scheduled-notifications' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Test the cron trigger:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/cron-trigger' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## How It Works

1. **Every minute**, the cron trigger runs
2. The trigger calls the **send-scheduled-notifications** function
3. The function:
   - Fetches all users with notifications enabled
   - Converts current UTC time to each user's local timezone
   - Checks if current local time matches their preferred notification time
   - Selects a random active message
   - Records the sent message in user_message_history
   - Prevents duplicate messages on the same day

## Notification Flow

```
Cron Trigger (every minute)
    ↓
Send Scheduled Notifications Function
    ↓
Check User Times & Preferences
    ↓
Select Random Message
    ↓
Record Message History
    ↓ 
[Future: Send Email/Push Notification]
```

## Adding Email/Push Notifications

To extend this system with actual notifications, you can:

1. **Email**: Integrate with SendGrid, Resend, or Supabase Auth emails
2. **Push**: Integrate with Firebase Cloud Messaging or OneSignal
3. **SMS**: Integrate with Twilio or similar service

Example email integration:

```typescript
// Add to send-scheduled-notifications/index.ts
async function sendEmailNotification(email: string, message: string) {
  const response = await fetch('https://api.sendgrid.v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: 'Your Message from the Universe ✨'
      }],
      from: { email: 'universe@yourdomain.com', name: 'Messages from the Universe' },
      content: [{
        type: 'text/html',
        value: `<h2>Your Daily Message from the Universe</h2><p>${message}</p>`
      }]
    })
  })
  return response.json()
}
```

## Monitoring

Check the Supabase Functions logs in your dashboard to monitor:
- Function execution times
- Users processed
- Notifications sent
- Any errors

## Troubleshooting

1. **Functions not deploying**: Check Supabase CLI is logged in and project is linked
2. **No notifications sent**: Verify users have notification_enabled=true and correct timezone
3. **Duplicate notifications**: Check user_message_history table for proper deduplication
4. **Timezone issues**: Ensure timezone values are valid IANA timezone names

## Security

- Use service role key for database operations in edge functions
- Validate all inputs
- Implement rate limiting if needed
- Monitor function usage and costs
