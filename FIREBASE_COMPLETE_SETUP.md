# 🚀 Complete Firebase Push Notifications Setup

## Quick Setup Summary

### 1. Firebase Project Setup (5 minutes)

1. **Go to https://console.firebase.google.com/**
2. **Click "Add project"** → Name: "zen-prompt-pal"
3. **Disable Google Analytics** → Click "Create project"
4. **In Project Settings** → Cloud Messaging tab
5. **Copy the "Server key"** (starts with "AAAA...")

### 2. Add Server Key to Supabase (1 minute)

1. **Supabase Dashboard** → Settings → Environment Variables
2. **Add variable**: 
   - Name: `FCM_SERVER_KEY`
   - Value: (paste your Firebase server key)
3. **Save**

### 3. Install Firebase in Your App (2 minutes)

```bash
cd "/Users/keithjones/Desktop/VSCode App Dev/zen-prompt-pal-main 2"
npm install firebase
```

### 4. Get Your Web App Config (3 minutes)

1. **Firebase Console** → Project Settings → General tab
2. **Scroll to "Your apps"** → Click **"Web" (</>)**
3. **App nickname**: "zen-prompt-pal-web"
4. **Copy the config object**

### 5. Update Firebase Config Files

Update these files with your actual Firebase config:

**1. Update `src/lib/firebase-notifications.ts`:**
```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

**2. Get VAPID Key:**
- Firebase Console → Project Settings → Cloud Messaging
- Under "Web configuration" → **Generate key pair**
- Copy the VAPID key and update:
```typescript
vapidKey: 'your-actual-vapid-key'
```

**3. Update `public/firebase-messaging-sw.js`:**
```javascript
const firebaseConfig = {
  // Same config as above
};
```

### 6. Run Database Migration (1 minute)

```bash
# Apply the push token migration
supabase db push
```

Or run this SQL in Supabase dashboard:
```sql
ALTER TABLE public.customer_users 
ADD COLUMN IF NOT EXISTS push_token TEXT;

CREATE INDEX IF NOT EXISTS idx_customer_users_push_token 
ON public.customer_users(push_token);
```

### 7. Test the Complete System

```bash
# Test the notification system
./test-notifications.sh
```

## 📱 How It Works Now

1. **User Registration/Login**:
   - Firebase message listener is set up automatically
   - User can enable notifications in their profile

2. **When User Enables Notifications**:
   - Browser asks for notification permission
   - FCM token is generated and saved to user profile
   - User's `notification_enabled` is set to true

3. **Automatic Notifications**:
   - Cron job runs every minute
   - Checks users whose local time matches their preferred notification time
   - Sends push notifications via Firebase to their devices
   - Records sent messages to prevent duplicates

4. **Receiving Notifications**:
   - **Foreground**: Shows notification manually
   - **Background**: Service worker handles it automatically
   - **Clicked**: Opens the app

## 🔧 Production Deployment Steps

### 1. Set Up Cron Job
Choose one method:

**Option A: Supabase Cron (Recommended)**
```sql
-- In Supabase Dashboard → Database → Cron
SELECT cron.schedule(
  'send-scheduled-notifications',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/cron-trigger',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**Option B: GitHub Actions**
```yaml
# .github/workflows/notifications.yml
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
            https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/cron-trigger
```

### 2. Deploy Updated App
```bash
# Build and deploy your app with Firebase integration
npm run build
```

### 3. Test with Real Users
1. Have users register and enable notifications
2. Check they get FCM tokens saved
3. Set notification time to current time + 2 minutes
4. Wait for notification to arrive

## 🐛 Troubleshooting

### No Notifications Received
1. **Check FCM server key** in Supabase environment variables
2. **Verify user granted permission** in browser
3. **Check push token exists** in customer_users table
4. **Look at function logs** in Supabase dashboard
5. **Test notification manually** in Firebase Console

### Permission Issues
1. **HTTPS required** for push notifications
2. **User must click "Allow"** for notifications
3. **Some browsers block** notifications by default

### Token Issues
1. **Tokens expire** - handle refresh in your app
2. **Tokens are device-specific** - users need new tokens on new devices
3. **Clear browser data** removes tokens

## ✅ Success Criteria

When everything is working:
- ✅ User can enable notifications without errors
- ✅ FCM token appears in their customer profile
- ✅ Test script shows successful notifications
- ✅ User receives actual push notifications at their preferred time
- ✅ Notifications work when app is closed/in background
- ✅ Only one notification per day per user

The system is now ready for automatic push notifications! 🎉
