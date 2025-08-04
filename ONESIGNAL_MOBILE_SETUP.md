# 🚀 OneSignal Setup for Mobile App Push Notifications

## ✅ Perfect Choice for Mobile Apps!

**OneSignal** is the best option for your installed mobile app because:
- ✅ **Free forever** - unlimited notifications
- ✅ **No Firebase needed** - their own reliable service  
- ✅ **10-minute setup** vs hours with Firebase
- ✅ **React Native SDK** - easy integration
- ✅ **Works iOS & Android** - one setup for both

## 📱 Step 1: OneSignal Account Setup (3 minutes)

1. **Go to https://onesignal.com** → Sign up (free)
2. **Click "New App/Website"**
3. **Name your app**: "Zen Prompt Pal"
4. **Select platforms**: 
   - ☑️ Apple iOS
   - ☑️ Google Android
5. **Click "Next"**

## 🔧 Step 2: Get Your Credentials (2 minutes)

1. **In OneSignal Dashboard** → Settings → Keys & IDs
2. **Copy these values**:
   - **App ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **REST API Key**: `Basic xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🔑 Step 3: Add to Supabase (1 minute)

1. **Supabase Dashboard** → Settings → Environment Variables
2. **Add these variables**:
   ```
   ONESIGNAL_APP_ID = your-app-id-from-step-2
   ONESIGNAL_REST_API_KEY = your-rest-api-key-from-step-2
   ```
3. **Click Save**

## 📱 Step 4: Mobile App Integration (5 minutes)

### Install OneSignal SDK:
```bash
npm install react-native-onesignal
# For iOS (if using React Native CLI)
cd ios && pod install
```

### Initialize in your App.js/tsx:
```javascript
import OneSignal from 'react-native-onesignal';

// Initialize OneSignal
OneSignal.initialize('your-onesignal-app-id'); // From Step 2

// Request notification permission
OneSignal.Notifications.requestPermission(true);

// Set external user ID (your database user ID)
const setUserForNotifications = (userId) => {
  OneSignal.login(userId); // This links the device to your user
};

// Handle notification clicks
OneSignal.Notifications.addEventListener('click', (event) => {
  console.log('Notification clicked:', event);
  // Navigate to specific screen if needed
});

// Handle notification received while app is open
OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
  console.log('Notification received in foreground:', event);
  event.getNotification().display(); // Show the notification
});
```

### Update your User Registration/Login:
```javascript
// When user logs in, link them to OneSignal
const handleUserLogin = async (userId) => {
  // Your existing login logic...
  
  // Link user to OneSignal for notifications
  OneSignal.login(userId);
  
  console.log('User linked to OneSignal:', userId);
};
```

## 🧪 Step 5: Test Your Setup (2 minutes)

### Test from OneSignal Dashboard:
1. **OneSignal Dashboard** → Messages → New Push
2. **Select "Send to Particular Users"**
3. **External User IDs**: Enter a test user ID
4. **Write test message** → Send

### Test from your Edge Function:
```bash
# Run the test script
./test-notifications.sh
```

## 📊 Step 6: Production Setup

### Update your cron trigger to use the OneSignal function:
Update your cron-trigger to call the new function:
```typescript
const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-scheduled-notifications-onesignal`
```

## 🔄 Migration from Current System

1. **Deploy the new OneSignal function**
2. **Add OneSignal credentials to Supabase**
3. **Update mobile app with OneSignal SDK**
4. **Test with a few users**
5. **Switch cron job to use new function**

## 📱 Platform-Specific Setup

### iOS Setup:
1. **In OneSignal** → Settings → Platforms → iOS
2. **Upload your iOS push certificate** or **Team ID + Bundle ID**
3. **Enable iOS push notifications** in your app capabilities

### Android Setup:
1. **In OneSignal** → Settings → Platforms → Android
2. **Add your Firebase server key** (or let OneSignal handle it)
3. **No additional setup needed**

## ✅ Success Criteria

When everything works:
- ✅ Users can enable notifications in your app
- ✅ OneSignal dashboard shows registered devices
- ✅ Test notifications arrive on devices
- ✅ Automatic daily notifications work
- ✅ Users receive notifications even when app is closed

## 🔍 Debugging

### Check OneSignal Dashboard:
- **Delivery**: See if notifications were sent
- **Users**: Check if your test users are registered
- **Messages**: View delivery reports

### Check Supabase Logs:
- Look for "OneSignal push notification sent"
- Check for credential errors
- Verify user processing

## 🎯 Benefits You'll Get

- **Instant delivery** - notifications arrive immediately
- **Rich notifications** - with icons, actions, etc.
- **Analytics** - see open rates, delivery stats
- **Targeting** - send to specific users or segments
- **A/B testing** - built into OneSignal dashboard

Ready to set up OneSignal? It's much simpler than Firebase and designed specifically for mobile apps! 🚀
