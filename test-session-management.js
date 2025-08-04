// Session Management Test Script
// Run this in the browser console to test extended sessions

async function testSessionPersistence() {
  console.log('🧪 Testing Session Persistence...');
  
  // Check if SessionManager is available
  if (typeof window.SessionManager === 'undefined') {
    console.error('❌ SessionManager not found. Make sure you are on the app page.');
    return;
  }
  
  // Test 1: Check current session
  console.log('🔍 Test 1: Checking current session...');
  const isValid = await window.SessionManager.checkSession();
  console.log('Session valid:', isValid);
  
  // Test 2: Get session details
  if (typeof window.supabase !== 'undefined') {
    const { data: { session }, error } = await window.supabase.auth.getSession();
    if (session) {
      console.log('📅 Session expires at:', new Date(session.expires_at * 1000));
      console.log('⏰ Time until expiry:', Math.round((session.expires_at * 1000 - Date.now()) / 1000 / 60), 'minutes');
    } else {
      console.log('❌ No session found');
    }
  }
  
  // Test 3: Force refresh
  console.log('🔄 Test 3: Testing manual refresh...');
  const refreshed = await window.SessionManager.refreshSession();
  console.log('Refresh successful:', refreshed);
  
  // Test 4: Test database operation with session check
  console.log('💾 Test 4: Testing database operation...');
  try {
    if (typeof window.supabase !== 'undefined') {
      const { data, error } = await window.supabase
        .from('customer_users')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('Database operation failed:', error);
      } else {
        console.log('✅ Database operation successful');
      }
    }
  } catch (error) {
    console.error('Database operation error:', error);
  }
  
  return {
    sessionValid: isValid,
    refreshWorking: refreshed,
    timestamp: new Date().toISOString()
  };
}

// Test localStorage persistence
function testLocalStoragePersistence() {
  console.log('🧪 Testing localStorage Persistence...');
  
  // Check if auth data is in localStorage
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth')
  );
  
  console.log('🔍 Auth-related localStorage keys:', authKeys);
  
  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`📝 ${key}:`, value ? 'Present' : 'Missing');
  });
  
  return authKeys;
}

// Instructions for testing
console.log('🚀 Session Management Test Functions Loaded!');
console.log('Run these commands to test:');
console.log('1. testSessionPersistence() - Test session management');
console.log('2. testLocalStoragePersistence() - Check localStorage');

// Make functions available globally
window.testSessionPersistence = testSessionPersistence;
window.testLocalStoragePersistence = testLocalStoragePersistence;
