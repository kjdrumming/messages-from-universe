# OneSignal Setup Guide for Zen Prompt Pal

## 🎯 What OneSignal Does

OneSignal enables **push notifications** for your users:
- **Web Push**: Browser notifications (Chrome, Firefox, Safari, Edge)
- **Mobile Push**: iOS and Android app notifications
- **Instant delivery**: Notifications appear immediately on users' devices
- **High engagement**: 90%+ open rates vs 20% for email

## 📋 Step-by-Step Setup

### Step 1: Create OneSignal Account

1. Go to [OneSignal.com](https://onesignal.com)
2. Click **"Get Started Free"**
3. Sign up with your email
4. Verify your email address

### Step 2: Create New App

1. In OneSignal dashboard, click **"New App/Website"**
2. Enter app details:
   - **App Name**: `Zen Prompt Pal`
   - **Category**: `Lifestyle` or `Productivity`
3. Click **"Create App"**

### Step 3: Configure Web Push (Browser Notifications)

#### Platform Selection:
1. Select **"Web Push"** platform
2. Choose **"Typical Site"** (not WordPress)

#### Site Configuration:
1. **Site Name**: `Zen Prompt Pal`
2. **Site URL**: For development, use `http://localhost:8080` (you can change this later for production)
3. **Default Icon URL**: Upload a 256x256 icon (you can use your favicon.ico for now)
4. **Default URL**: `http://localhost:8080` (your app's main page)

#### Permission Prompt Settings:
**Choose "Push Prompt" (not email/phone prompt)**

1. **Auto Prompt**: Enable (shows permission request automatically)
2. **Prompt Timing**: `After 30 seconds` or `On page load`  
3. **Welcome Notification**: Enable with message like "Welcome to Zen Prompt Pal! 🌟"

**Note**: Push Prompt asks for browser notification permissions. Email/Phone Prompt is for collecting contact info, which you don't need since users already have accounts.

**Additional OneSignal Settings:**
- **Webhooks**: Skip this - you don't need webhooks since your server sends TO OneSignal
- **Service Workers**: Don't manually enable - OneSignal SDK handles this automatically

### Step 4: Get Your API Keys

After setup, you'll see:

1. **App ID**: Copy this (looks like: `12345678-1234-1234-1234-123456789012`)
2. **REST API Key**: Go to Settings → Keys & IDs → REST API Key

**Save these for later - you'll need them!**

### Step 5: Install OneSignal in Your React App

#### Install OneSignal SDK:
```bash
npm install react-onesignal
```

#### Add OneSignal to your React app:

**Create `src/lib/oneSignal.ts`:**
```typescript
import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = 'YOUR_APP_ID_HERE'; // Replace with your App ID

export const initializeOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: 'web.onesignal.auto.YOUR_APP_ID', // Auto-generated
      notifyButton: {
        enable: true,
        size: 'medium',
        theme: 'default',
        position: 'bottom-right',
        showCredit: false,
        text: {
          'tip.state.unsubscribed': 'Get daily inspiration!',
          'tip.state.subscribed': "You're subscribed to daily messages!",
          'tip.state.blocked': "You've blocked notifications",
          'message.prenotify': 'Click to subscribe to daily zen messages',
          'message.action.subscribed': "Thanks! You'll receive daily inspiration.",
          'message.action.resubscribed': "You're re-subscribed to daily messages!",
          'message.action.unsubscribed': "You won't receive more notifications.",
        }
      },
      allowLocalhostAsSecureOrigin: true, // For development
    });

    console.log('OneSignal initialized successfully');
    
    // Set up user identification when they log in
    OneSignal.on('subscriptionChange', function(isSubscribed) {
      console.log('Subscription changed:', isSubscribed);
    });

  } catch (error) {
    console.error('OneSignal initialization error:', error);
  }
};

// Call this when user logs in to link their account
export const setOneSignalUserId = (userId: string) => {
  OneSignal.setExternalUserId(userId);
  console.log('OneSignal user ID set:', userId);
};

// Check if user is subscribed
export const getOneSignalSubscription = async () => {
  const isSubscribed = await OneSignal.isPushNotificationsEnabled();
  const userId = await OneSignal.getExternalUserId();
  const playerId = await OneSignal.getPlayerId();
  
  return {
    isSubscribed,
    userId,
    playerId
  };
};
```

#### Update your main App component:

**In `src/App.tsx` or `src/main.tsx`:**
```typescript
import { useEffect } from 'react';
import { initializeOneSignal } from './lib/oneSignal';

function App() {
  useEffect(() => {
    // Initialize OneSignal when app loads
    initializeOneSignal();
  }, []);

  // Your existing app code...
}
```

#### Connect OneSignal to user accounts:

**In your authentication code:**
```typescript
import { setOneSignalUserId } from './lib/oneSignal';

// After user logs in successfully
const handleUserLogin = (user) => {
  // Your existing login logic...
  
  // Link OneSignal to user account
  setOneSignalUserId(user.id);
};
```

### Step 6: Add Service Worker (Required for Web Push)

OneSignal needs a service worker file in your `public` folder.

**Create `public/OneSignalSDKWorker.js`:**
```javascript
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
```

**Update your `vite.config.ts`:**
```typescript
export default defineConfig({
  // ... your existing config
  publicDir: 'public', // Ensure this is set
});
```

### Step 7: Configure Environment Variables

Add your OneSignal credentials to your environment:

**In your `.env` file:**
```env
VITE_ONESIGNAL_APP_ID=your_app_id_here
```

**In Supabase Edge Functions environment:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/settings/functions)
2. Go to Settings → Edge Functions
3. Add environment variables:
   - `ONESIGNAL_APP_ID`: Your App ID
   - `ONESIGNAL_REST_API_KEY`: Your REST API Key

### Step 8: Update Your Database Schema

Add OneSignal player ID to user table:

```sql
-- Add OneSignal player ID to users table
ALTER TABLE customer_users 
ADD COLUMN onesignal_player_id TEXT;

-- Index for better performance
CREATE INDEX idx_customer_users_onesignal_player_id 
ON customer_users(onesignal_player_id);
```

### Step 9: Update User Profile to Store OneSignal ID

**In your user profile component:**
```typescript
import { getOneSignalSubscription } from './lib/oneSignal';

const saveUserNotificationSettings = async () => {
  const oneSignalData = await getOneSignalSubscription();
  
  // Save to your database
  const { error } = await supabase
    .from('customer_users')
    .update({
      notification_enabled: oneSignalData.isSubscribed,
      onesignal_player_id: oneSignalData.playerId,
    })
    .eq('id', user.id);
};
```

### Step 10: Test Your Setup

#### Test Web Push:
1. Open your app in a browser
2. Allow notification permissions when prompted
3. Check OneSignal dashboard → Audience → All Users
4. You should see your test user

#### Send Test Notification:
1. In OneSignal dashboard, go to Messages → New Push
2. Create a test message
3. Send to "All Users" or specific user
4. Check if notification appears

### Step 11: Mobile App Setup (Optional)

If you want to create mobile apps later:

#### React Native:
```bash
npm install react-native-onesignal
```

#### Expo:
```bash
expo install expo-notifications
```

## 🔧 Configuration for Your Edge Function

Your edge function is already configured! It will:

1. **Use OneSignal first** for push notifications
2. **Fall back to email** if push fails
3. **Use the user ID** from your database as the external user ID

The function uses these environment variables:
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`

## 📊 OneSignal Dashboard Features

### Analytics:
- **Delivery rates**: How many notifications were delivered
- **Click rates**: How many users clicked notifications
- **Conversion tracking**: User actions after notifications

### Segmentation:
- **User segments**: Group users by behavior, location, etc.
- **Targeted messaging**: Send different messages to different groups
- **A/B testing**: Test different notification styles

### Automation:
- **Triggered campaigns**: Send notifications based on user actions
- **Time zone delivery**: Send at optimal times for each user
- **Frequency capping**: Prevent notification fatigue

## 🎨 Customization Options

### Notification Appearance:
```typescript
// Custom notification options
OneSignal.sendTag("user_type", "premium");
OneSignal.sendTag("timezone", "America/New_York");

// Custom notification with image
const notificationData = {
  headings: { en: "Your Daily Zen Message 🌟" },
  contents: { en: message },
  big_picture: "https://yoursite.com/zen-image.jpg",
  chrome_web_icon: "https://yoursite.com/icon-192x192.png",
  url: "https://yourapp.com/today-message"
};
```

### Permission Prompt Customization:
```typescript
OneSignal.showSlidedownPrompt({
  text: {
    'slidedown.prompt.action.message': 'Get daily zen messages delivered to your device! 🧘‍♀️',
    'slidedown.prompt.action.accept': 'Yes, inspire me!',
    'slidedown.prompt.action.cancel': 'Not now'
  }
});
```

## 🚨 Troubleshooting

### Common Issues:

**1. Notifications not appearing:**
- Check browser permissions (chrome://settings/content/notifications)
- Verify service worker is loaded
- Check OneSignal dashboard for delivery status

**2. User not appearing in OneSignal:**
- Ensure `setExternalUserId()` is called after login
- Check network tab for OneSignal API calls
- Verify App ID is correct

**3. HTTPS requirement:**
- OneSignal requires HTTPS in production
- Use `allowLocalhostAsSecureOrigin: true` for development

### Debug Commands:
```javascript
// Check OneSignal status
OneSignal.isPushNotificationsEnabled().then(enabled => {
  console.log('Push enabled:', enabled);
});

// Get user subscription details
OneSignal.getUserId().then(userId => {
  console.log('OneSignal User ID:', userId);
});
```

## 📈 Best Practices

### 1. **Timing**:
- Don't ask for permissions immediately
- Wait for user engagement (after 30 seconds or user action)

### 2. **Content**:
- Keep messages under 40 characters for title
- Use emojis for visual appeal
- Include clear call-to-action

### 3. **Frequency**:
- Respect user preferences
- Don't spam (1-2 notifications per day max)
- Provide easy unsubscribe option

### 4. **Personalization**:
- Use user's name when possible
- Segment by user behavior
- Send relevant content based on preferences

## 🎉 You're All Set!

Once configured, your notification system will:

1. **Ask users for permission** when they visit your app
2. **Store their OneSignal ID** in your database
3. **Send push notifications** via your cron job
4. **Fall back to email** if push notifications fail
5. **Provide analytics** on delivery and engagement

Your users will receive beautiful, instant notifications that appear directly on their devices, leading to much higher engagement than email alone! 🚀

## 🔗 Helpful Links

- [OneSignal Documentation](https://documentation.onesignal.com/docs)
- [React OneSignal Guide](https://documentation.onesignal.com/docs/react-setup)
- [Web Push Best Practices](https://documentation.onesignal.com/docs/web-push-best-practices)
- [OneSignal REST API](https://documentation.onesignal.com/reference/create-notification)
