// OneSignal integration using CDN approach
declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

// Load OneSignal SDK from CDN
const loadOneSignalSDK = () => {
  return new Promise((resolve) => {
    if (window.OneSignal) {
      resolve(window.OneSignal);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    
    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(function(OneSignal: any) {
        window.OneSignal = OneSignal;
        resolve(OneSignal);
      });
    };
    
    document.head.appendChild(script);
  });
};

export const initializeOneSignal = async () => {
  try {
    if (!ONESIGNAL_APP_ID) {
      console.warn('⚠️ OneSignal App ID not configured. Please add VITE_ONESIGNAL_APP_ID to your .env file');
      return;
    }

    console.log('🔔 Initializing OneSignal...');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OneSignal initialization timeout')), 10000);
    });
    
    const initPromise = (async () => {
      const OneSignal: any = await loadOneSignalSDK();

      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: `web.onesignal.auto.${ONESIGNAL_APP_ID}`,
        allowLocalhostAsSecureOrigin: true, // For development
      });
      
      return OneSignal;
    })();
    
    const OneSignal = await Promise.race([initPromise, timeoutPromise]);

    console.log('✅ OneSignal initialized successfully');
    
    // Set up subscription change listener
    OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
      console.log('OneSignal subscription changed:', event);
    });

  } catch (error) {
    console.error('❌ OneSignal initialization error:', error);
    // Don't throw - app should still work without OneSignal
  }
};

// Call this when user logs in to link their account
export const setOneSignalUserId = async (userId: string) => {
  try {
    if (window.OneSignal) {
      // OneSignal v16 approach - set external user id
      await window.OneSignal.login(userId);
      
      // Also set as external user ID tag for targeting
      await window.OneSignal.User.addTag('external_user_id', userId);
      
      console.log('OneSignal user ID set:', userId);
      
      // Verify the user ID was set
      const currentUserId = await window.OneSignal.User.onesignalId;
      console.log('OneSignal current user ID:', currentUserId);
    }
  } catch (error) {
    console.error('Error setting OneSignal user ID:', error);
  }
};

// Check if user is subscribed
export const getOneSignalSubscription = async () => {
  try {
    if (!window.OneSignal) {
      console.warn('OneSignal not initialized');
      return { isSubscribed: false, userId: null, playerId: null };
    }

    // Check both OneSignal subscription AND browser permission
    const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
    const userId = await window.OneSignal.User.onesignalId;
    const pushToken = await window.OneSignal.User.PushSubscription.token;
    const browserPermission = Notification.permission;
    
    console.log('🔍 OneSignal subscription check:');
    console.log('  - OptedIn:', isOptedIn);
    console.log('  - Browser permission:', browserPermission);
    console.log('  - Push token:', pushToken ? 'Present' : 'None');
    
    // User is truly subscribed only if they have browser permission AND a push token
    const isSubscribed = isOptedIn && browserPermission === 'granted' && pushToken;
    
    return {
      isSubscribed,
      userId,
      playerId: pushToken // In v16, token is used instead of playerId
    };
  } catch (error) {
    console.error('Error getting OneSignal subscription:', error);
    return { isSubscribed: false, userId: null, playerId: null };
  }
};

// Manually prompt for notification permission
export const promptForPushNotifications = async () => {
  try {
    console.log('🔔 Triggering notification permission popup...');
    
    if (!window.OneSignal) {
      console.log('⏳ OneSignal not ready, initializing...');
      await initializeOneSignal();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (window.OneSignal) {
      // Method 1: Use OneSignal's permission request
      const permission = await window.OneSignal.Notifications.requestPermission();
      console.log('🔍 OneSignal permission result:', permission);
      return permission;
    } else {
      // Method 2: Fallback to native browser API
      console.log('🔔 Using native browser notification API...');
      const permission = await Notification.requestPermission();
      console.log('🔍 Native permission result:', permission);
      return permission === 'granted';
    }
  } catch (error) {
    console.error('Error prompting for push notifications:', error);
    
    // Method 3: Last resort - native API
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (nativeError) {
      console.error('Native notification request also failed:', nativeError);
      return false;
    }
  }
};

// Simple function to show notification popup immediately
export const showNotificationPopup = async () => {
  try {
    console.log('🚨 Showing notification permission popup...');
    
    // Check current permission status
    const currentPermission = Notification.permission;
    console.log('Current permission status:', currentPermission);
    
    if (currentPermission === 'granted') {
      console.log('✅ Notifications already granted');
      return { success: true, alreadyGranted: true };
    }
    
    if (currentPermission === 'denied') {
      console.log('❌ Notifications previously denied');
      return { success: false, error: 'Previously denied - check browser settings' };
    }
    
    // Request permission
    const permission = await promptForPushNotifications();
    
    if (permission) {
      console.log('✅ Notification permission granted!');
      return { success: true, justGranted: true };
    } else {
      console.log('❌ Notification permission denied');
      return { success: false, error: 'Permission denied' };
    }
    
  } catch (error) {
    console.error('Error showing notification popup:', error);
    return { success: false, error: error.message };
  }
};

// Send a tag to OneSignal for user segmentation
export const setOneSignalUserTag = async (key: string, value: string) => {
  try {
    if (window.OneSignal) {
      await window.OneSignal.User.addTag(key, value);
      console.log(`OneSignal tag set: ${key} = ${value}`);
    }
  } catch (error) {
    console.error('Error setting OneSignal tag:', error);
  }
};

// Switch active user on the same device (for user aliasing)
export const switchOneSignalUser = async (newUserId: string, newUserEmail: string) => {
  try {
    console.log('🔄 Switching OneSignal user to:', newUserEmail);
    
    if (!window.OneSignal) {
      console.warn('❌ OneSignal not initialized for user switch');
      return { success: false, error: 'OneSignal not initialized' };
    }

    // 1. Switch to new user (maintains same device subscription)
    await setOneSignalUserId(newUserId);
    console.log('✅ OneSignal user ID switched to:', newUserId);

    // 2. Update user tags for new active user
    await setOneSignalUserTag('user_id', newUserId);
    await setOneSignalUserTag('email', newUserEmail);
    await setOneSignalUserTag('active_user', 'true');
    console.log('✅ OneSignal user tags updated for new user');

    // 3. Verify the device still has subscription
    const subscription = await getOneSignalSubscription();
    if (subscription.isSubscribed) {
      console.log('🎯 User switch successful - device subscription maintained');
      return { 
        success: true, 
        oneSignalUserId: subscription.userId,
        sharedSubscription: true 
      };
    } else {
      console.warn('⚠️ User switched but device subscription lost');
      return { success: false, error: 'Device subscription lost during switch' };
    }

  } catch (error) {
    console.error('❌ Error switching OneSignal user:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe user to OneSignal during signup/login
export const subscribeUserToOneSignal = async (userId: string, userEmail: string) => {
  try {
    console.log('🔔 Starting OneSignal subscription for user:', userEmail);
    
    // Ensure OneSignal is initialized before proceeding
    if (!window.OneSignal) {
      console.log('⏳ OneSignal not ready, initializing...');
      await initializeOneSignal();
      
      // Wait a bit more for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!window.OneSignal) {
        console.warn('❌ OneSignal failed to initialize');
        return { success: false, error: 'OneSignal failed to initialize' };
      }
    }

    console.log('✅ OneSignal is ready, proceeding with subscription...');

    // 1. Link the user account (creates new user identity or switches to existing)
    await setOneSignalUserId(userId);
    console.log('✅ OneSignal user ID set:', userId);

    // 2. Set user tags for segmentation
    await setOneSignalUserTag('user_id', userId);
    await setOneSignalUserTag('email', userEmail);
    await setOneSignalUserTag('signup_source', 'webapp');
    await setOneSignalUserTag('active_user', 'true'); // Mark as active user on this device
    console.log('✅ OneSignal user tags set');

    // 3. Check if device has a VALID push subscription
    const subscription = await getOneSignalSubscription();
    const hasValidSubscription = subscription.isSubscribed && subscription.playerId;
    
    console.log('🔍 Device subscription status:', hasValidSubscription);
    console.log('🔍 Push token present:', subscription.playerId ? 'Yes' : 'No');
    
    if (!hasValidSubscription) {
      // 4. Force browser permission request (even if previously granted)
      console.log('🔍 Current browser notification permission:', Notification.permission);
      console.log('🔔 Requesting fresh notification permission...');
      
      // Force a fresh permission request
      const permission = await window.OneSignal.Notifications.requestPermission();
      
      console.log('🔍 Permission request result:', permission);
      console.log('🔍 Browser permission after request:', Notification.permission);
      
      if (!permission) {
        console.log('❌ User denied notification permission');
        return { success: false, error: 'Permission denied' };
      }
      
      // Wait a bit for subscription to be established
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Fresh device subscription requested');
    } else {
      console.log('✅ Valid device subscription found - linking user to existing subscription');
    }
    
    // 5. Verify final subscription status
    const finalSubscription = await getOneSignalSubscription();
    if (finalSubscription.isSubscribed) {
      console.log('🎯 User successfully linked to device subscription');
      console.log('🎯 OneSignal User ID:', finalSubscription.userId);
      console.log('🎯 Push Token:', finalSubscription.playerId ? 'Present' : 'None');
      return { 
        success: true, 
        isNewSubscription: !hasValidSubscription,
        oneSignalUserId: finalSubscription.userId
      };
    } else {
      console.warn('⚠️ User linked but device subscription not confirmed');
      return { success: false, error: 'Device subscription not confirmed' };
    }

  } catch (error) {
    console.error('❌ Error subscribing user to OneSignal:', error);
    return { success: false, error: error.message };
  }
};
