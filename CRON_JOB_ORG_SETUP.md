# Cron-job.org Setup Guide for Zen Prompt Pal

## ✅ Updated Edge Functions

Your edge functions have been successfully updated and deployed to work with external cron services like cron-job.org:

### 1. **send-scheduled-notifications** Function
- ✅ Updated with your improved notification logic
- ✅ Better timezone handling using `Intl.DateTimeFormat`
- ✅ OneSignal push notifications + email fallback
- ✅ 5-minute time window for notification matching
- ✅ Duplicate message prevention (one per day)

### 2. **public-cron** Function
- ✅ Public endpoint for external cron services
- ✅ No authentication required (perfect for cron-job.org)
- ✅ Automatically calls the internal notification function
- ✅ Proper error handling and logging

## 🔗 Your Edge Function URLs

**Public Cron Endpoint (for cron-job.org):**
```
https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron
```

**Internal Notifications Function:**
```
https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications
```

## 🕐 Setting Up Cron-job.org

### Step 1: Create Account
1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for a free account
3. Verify your email

### Step 2: Create New Cron Job
1. Click "Create cronjob"
2. Fill out the form:

**Basic Settings:**
- **Title:** `Zen Prompt Pal - Daily Notifications`
- **URL:** `https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron`
- **Request method:** `POST`

**Schedule Settings:**
- **Minutes:** `*/5` (every 5 minutes)
- **Hours:** `*` (every hour)
- **Days:** `*` (every day)
- **Months:** `*` (every month)
- **Weekdays:** `*` (every day of week)

**Advanced Settings:**
- **Request timeout:** `30` seconds
- **Execution timeout:** `30` seconds
- **Failures:** Allow up to `3` failures
- **Success codes:** `200-299`

### Step 3: Optional Request Headers
You can add these headers for better tracking:

```
Content-Type: application/json
User-Agent: cron-job.org-scheduler
X-Cron-Source: cron-job.org
```

### Step 4: Test the Cron Job
1. Save the cron job
2. Click "Execute now" to test
3. Check the execution log for success

## 📊 How It Works

```mermaid
sequenceDiagram
    participant C as cron-job.org
    participant P as public-cron
    participant N as send-scheduled-notifications
    participant S as Supabase DB
    participant O as OneSignal
    participant E as Email Service

    C->>P: POST /public-cron (every 5 min)
    P->>N: Call internal function
    N->>S: Get users & messages
    N->>N: Check user timezones
    N->>O: Send push notifications
    N->>E: Send email fallbacks
    N->>S: Record message history
    N->>P: Return results
    P->>C: Return success response
```

## ⚙️ Environment Variables Required

Make sure these are set in your Supabase project:

### Required:
- `SUPABASE_URL` ✅ (automatically set)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (automatically set)

### Optional (for notifications):
- `ONESIGNAL_APP_ID` - For push notifications
- `ONESIGNAL_REST_API_KEY` - For push notifications  
- `RESEND_API_KEY` - For email notifications
- `EMAIL_API_KEY` - Alternative email service

## 🔍 Monitoring & Debugging

### Cron-job.org Dashboard
- View execution history
- See success/failure rates
- Check response times
- View error logs

### Supabase Logs
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/functions)
2. Click on "Functions"
3. Select "public-cron" or "send-scheduled-notifications"
4. View the "Logs" tab for detailed execution logs

### Test URLs
You can manually test your functions:

**Test public cron:**
```bash
curl -X POST https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron
```

**Test internal function:**
```bash
curl -X POST https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## 🚀 Benefits of cron-job.org

1. **Reliability:** Professional cron service with 99.9% uptime
2. **No Server Required:** No need to manage your own cron server
3. **Free Tier:** Up to 2 cron jobs for free
4. **Monitoring:** Built-in monitoring and alerting
5. **Global:** Runs from multiple locations worldwide
6. **Simple:** Easy web interface, no command line required

## 🔧 Troubleshooting

### Common Issues:

**1. Function not responding:**
- Check if the URL is correct
- Verify the function is deployed
- Check Supabase function logs

**2. Notifications not sending:**
- Verify users have `notification_enabled = true`
- Check user timezone settings
- Ensure time window logic (5-minute window)
- Verify OneSignal/Email API keys

**3. Cron job failing:**
- Check execution logs in cron-job.org
- Verify timeout settings (30 seconds)
- Check response codes in logs

### Debug Commands:
```bash
# Check if functions are responding
curl -I https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron

# Test with verbose output
curl -v -X POST https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron
```

## 📈 Next Steps

1. ✅ Set up your cron-job.org account and cron job
2. ✅ Configure your notification API keys (OneSignal, Resend)
3. ✅ Test with a few users
4. ✅ Monitor the logs for the first few executions
5. ✅ Scale up as needed

Your notification system is now ready to run reliably with cron-job.org! 🎉
