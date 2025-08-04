📋 **Quick Steps to Fix cron-job.org:**

## 🔑 **Step 1: Get Fresh API Key**
1. Go to: https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/settings/api
2. Copy the **"anon public"** key (should start with "eyJ...")

## 🔧 **Step 2: Update cron-job.org**
1. Log into cron-job.org
2. Find your "Zen Prompt Notifications" cron job
3. Click "Edit"
4. Update the Authorization header:
   ```
   Authorization: Bearer [PASTE_NEW_KEY_HERE]
   ```
5. Save and test

## 🎯 **Step 3: Test Settings**
Make sure your cron job has:
- **URL**: `https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/cron-trigger`
- **Method**: POST
- **Schedule**: `* * * * *` (every minute)
- **Headers**:
  - `Authorization: Bearer [YOUR_FRESH_KEY]`
  - `Content-Type: application/json`
- **Body**: `{}`

## 🆘 **If Still Failing**
Try changing the URL to:
`https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron`

And remove ALL headers (this endpoint should work without auth).

## 🔍 **Test Locally First**
After getting the fresh key, test it by updating debug-edge-function.sh and running:
```bash
./debug-edge-function.sh
```

If you see a successful response (not 401), then use that same key in cron-job.org.
