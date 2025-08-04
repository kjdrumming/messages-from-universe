# 🔥 Firebase Setup for Push Notifications

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Project name: `zen-prompt-pal` (or your preferred name)
4. **Disable Google Analytics** (not needed for notifications)
5. Click **"Create project"**

## Step 2: Get FCM Server Key

1. In Firebase Console, click **Project Settings** (gear icon)
2. Go to **"Cloud Messaging"** tab
3. Find **"Server key"** section
4. **Copy the server key** (starts with "AAAA...")

## Step 3: Add Server Key to Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `FCM_SERVER_KEY`
   - **Value**: (paste your Firebase server key)
4. Click **Save**

## Step 4: Configure Firebase for Your App

### For Web/React App:

1. In Firebase Console, click **"Add app"** → **Web** (</> icon)
2. App nickname: "zen-prompt-pal-web"
3. **Copy the config object**
4. Install Firebase SDK:
   ```bash
   npm install firebase
   ```

5. Create `src/lib/firebase.ts`:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getMessaging, getToken, onMessage } from 'firebase/messaging';

   const firebaseConfig = {
     // Paste your config here from step 2
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };

   const app = initializeApp(firebaseConfig);
   export const messaging = getMessaging(app);

   // Request permission and get token
   export async function requestNotificationPermission() {
     try {
       const permission = await Notification.requestPermission();
       if (permission === 'granted') {
         const token = await getToken(messaging, {
           vapidKey: 'your-vapid-key' // Get this from Firebase Console
         });
         return token;
       }
       return null;
     } catch (error) {
       console.error('Error getting notification permission:', error);
       return null;
     }
   }

   // Listen for foreground messages
   export function onMessageListener() {
     return new Promise((resolve) => {
       onMessage(messaging, (payload) => {
         resolve(payload);
       });
     });
   }
   ```

6. Get VAPID Key:
   - In Firebase Console → Project Settings → Cloud Messaging
   - Under "Web configuration" click **"Generate key pair"**
   - Copy the VAPID key

### For Mobile App (React Native):

1. In Firebase Console, add your mobile apps:
   - **Android**: Click "Add app" → Android
   - **iOS**: Click "Add app" → iOS

2. Follow platform-specific setup:
   - **Android**: Download `google-services.json`
   - **iOS**: Download `GoogleService-Info.plist`

3. Install React Native Firebase:
   ```bash
   npm install @react-native-firebase/app @react-native-firebase/messaging
   ```

## Step 5: Integrate in Your App

### Save FCM Token to User Profile:

```typescript
// In your user registration/login flow
import { requestNotificationPermission } from './lib/firebase';
import { supabase } from './lib/supabase';

async function setupNotifications(userId: string) {
  const token = await requestNotificationPermission();
  
  if (token) {
    // Save token to user profile
    await supabase
      .from('customer_users')
      .update({ push_token: token })
      .eq('id', userId);
    
    console.log('Push token saved:', token);
  }
}
```

### Handle Token Refresh:

```typescript
// Token can change, so listen for updates
import { messaging } from './lib/firebase';
import { onTokenRefresh } from 'firebase/messaging';

onTokenRefresh(messaging, async (newToken) => {
  // Update user's push token in database
  await supabase
    .from('customer_users')
    .update({ push_token: newToken })
    .eq('id', currentUserId);
});
```

## Step 6: Test Your Setup

1. **Run the test script**:
   ```bash
   ./test-notifications.sh
   ```

2. **Check logs** in Supabase Functions dashboard

3. **Test with a real user**:
   - User registers and gets FCM token
   - Token is saved to their profile
   - Set notification_enabled = true
   - Set notification_time to current time + 1 minute
   - Wait for notification

## Step 7: Production Checklist

- ✅ FCM server key added to Supabase
- ✅ Web push certificates configured (for web)
- ✅ Mobile app certificates configured (for mobile)
- ✅ Users can grant notification permission
- ✅ FCM tokens are saved to user profiles
- ✅ Token refresh is handled
- ✅ Cron job is set up to trigger notifications

## Troubleshooting

### No Notifications Received:
1. Check FCM server key is correct
2. Verify user granted notification permission
3. Ensure push token is valid and saved
4. Check device notification settings
5. Look at Supabase function logs for errors

### Token Issues:
1. Tokens can expire - handle refresh
2. Tokens are device-specific
3. Users need to re-register tokens on new devices

### Testing:
- Use Firebase Console → Cloud Messaging → "Send your first message" to test tokens
- Check browser developer tools for FCM errors
- Test on different devices and browsers
