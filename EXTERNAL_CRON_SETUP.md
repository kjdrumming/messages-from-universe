# 🕒 External Cron Service Setup

Since Supabase's pg_cron doesn't have HTTP extensions enabled, use an external service:

## Option 1: cron-job.org (Free, Easy)

1. Go to https://cron-job.org/en/
2. Sign up for a free account
3. Create a new cron job with these settings:
   - **URL**: `https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/cron-trigger`
   - **Schedule**: `* * * * *` (every minute)
   - **HTTP Method**: POST
   - **Headers**: 
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJremhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4
     Content-Type: application/json
     ```

## Option 2: UptimeRobot (Free)

1. Go to https://uptimerobot.com/
2. Create a "HTTP(s)" monitor
3. Set URL: `https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/cron-trigger`
4. Set interval to 1 minute
5. Add custom HTTP headers (same as above)

## Option 3: EasyCron (Free tier)

1. Go to https://www.easycron.com/
2. Create account
3. Add cron job with the same URL and headers

## Testing Right Now

Before setting up the cron service, let's test if your function works at all.
Run this in your terminal:

```bash
# Test the cron-trigger function
curl -X POST 'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/cron-trigger' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJremhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4' \
  -H 'Content-Type: application/json'
```

If this gives a 401 error, the issue is authentication, not the cron setup.
