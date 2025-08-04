// Reset OneSignal completely and force fresh subscription
async function resetOneSignal() {
  console.log('🔄 Resetting OneSignal completely...');
  
  // 1. Clear all OneSignal data
  if (window.OneSignal) {
    try {
      await window.OneSignal.logout();
      console.log('✅ OneSignal user logged out');
    } catch (e) {
      console.log('OneSignal logout error (expected):', e);
    }
  }
  
  // 2. Clear localStorage and sessionStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('OneSignal') || key.includes('onesignal')) {
      localStorage.removeItem(key);
      console.log('🗑️ Removed localStorage:', key);
    }
  });
  
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('OneSignal') || key.includes('onesignal')) {
      sessionStorage.removeItem(key);
      console.log('🗑️ Removed sessionStorage:', key);
    }
  });
  
  // 3. Unregister service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      if (registration.scope.includes('OneSignal') || registration.scope.includes('localhost')) {
        await registration.unregister();
        console.log('🗑️ Unregistered service worker:', registration.scope);
      }
    }
  }
  
  // 4. Clear IndexedDB OneSignal data
  if ('indexedDB' in window) {
    try {
      indexedDB.deleteDatabase('OneSignalSDK');
      console.log('🗑️ Cleared OneSignal IndexedDB');
    } catch (e) {
      console.log('IndexedDB clear error (expected):', e);
    }
  }
  
  console.log('✅ OneSignal reset complete. Please refresh the page and try signup again.');
  console.log('🔔 You should get a fresh browser permission popup on next signup.');
}

// Run the reset
resetOneSignal();
