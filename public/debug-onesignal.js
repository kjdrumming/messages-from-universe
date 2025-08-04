// Debug OneSignal status
console.log('🔍 OneSignal Debug Information:');
console.log('App ID from env:', '3bba2652-8fc8-4527-af54-25aa21651194');
console.log('Current URL:', window.location.href);
console.log('Browser notification permission:', Notification.permission);

// Wait for OneSignal to load
setTimeout(async () => {
  if (window.OneSignal) {
    console.log('✅ OneSignal loaded');
    
    try {
      const isOptedIn = await window.OneSignal.User.PushSubscription.optedIn;
      const userId = await window.OneSignal.User.onesignalId;
      const pushToken = await window.OneSignal.User.PushSubscription.token;
      
      console.log('🔍 OneSignal Status:');
      console.log('  - Opted In:', isOptedIn);
      console.log('  - User ID:', userId);
      console.log('  - Push Token:', pushToken ? 'Present' : 'None');
      console.log('  - Full Push Token:', pushToken);
      
      // Check tags
      const tags = await window.OneSignal.User.getTags();
      console.log('🏷️ User Tags:', tags);
      
    } catch (error) {
      console.error('❌ Error getting OneSignal status:', error);
    }
  } else {
    console.log('❌ OneSignal not loaded');
  }
}, 3000);

// Check if there's a service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('🔧 Service Workers:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`  ${index + 1}. ${reg.scope}`);
    });
  });
}
