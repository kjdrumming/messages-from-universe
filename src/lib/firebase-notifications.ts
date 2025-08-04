// Firebase configuration for push notifications
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Your Firebase config (get this from Firebase Console)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'your-vapid-key-from-firebase-console'
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    return null;
  }
}

// Listen for foreground messages
export function setupForegroundMessageListener() {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground: ', payload);
    
    // Show notification manually for foreground messages
    if (payload.notification) {
      new Notification(payload.notification.title || 'New Message', {
        body: payload.notification.body,
        icon: payload.notification.icon || '/favicon.ico'
      });
    }
  });
}

// Save FCM token to user profile
export async function saveFCMTokenToProfile(userId: string, supabase: any) {
  const token = await requestNotificationPermission();
  
  if (token) {
    const { error } = await supabase
      .from('customer_users')
      .update({ push_token: token })
      .eq('id', userId);
    
    if (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
    
    console.log('FCM token saved to user profile');
    return true;
  }
  
  return false;
}
