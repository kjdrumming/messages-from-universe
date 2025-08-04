// Debug script for customer update issues
// Run this in the browser console after signing in

async function debugCustomerUpdates() {
  console.log('🔍 Debugging customer update issue...');
  
  // Check if we have Supabase available
  if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase not available. Make sure you are on the app page.');
    return;
  }
  
  const supabase = window.supabase;
  
  // Check current auth state
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('❌ Auth error:', userError);
    return;
  }
  
  if (!user) {
    console.error('❌ No user found. Please sign in first.');
    return;
  }
  
  console.log('✅ User authenticated:', user.email);
  console.log('👤 User ID:', user.id);
  
  // Get customer profile
  const { data: profile, error: profileError } = await supabase
    .from('customer_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();
    
  if (profileError) {
    console.error('❌ Profile fetch error:', profileError);
    return;
  }
  
  console.log('📋 Current profile:', profile);
  
  // Test first update
  console.log('🧪 Testing first update...');
  const { data: update1, error: error1 } = await supabase
    .from('customer_users')
    .update({ 
      notification_time: '10:00:00',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)
    .select();
    
  if (error1) {
    console.error('❌ First update failed:', error1);
  } else {
    console.log('✅ First update succeeded:', update1);
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test second update
  console.log('🧪 Testing second update...');
  const { data: update2, error: error2 } = await supabase
    .from('customer_users')
    .update({ 
      timezone: 'America/Los_Angeles',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)
    .select();
    
  if (error2) {
    console.error('❌ Second update failed:', error2);
    console.log('🔍 This confirms the bug - second update fails!');
  } else {
    console.log('✅ Second update succeeded:', update2);
  }
  
  // Check auth state again
  const { data: { user: user2 }, error: userError2 } = await supabase.auth.getUser();
  console.log('🔄 Auth state after updates:', user2 ? 'Still authenticated' : 'Lost authentication');
  
  return {
    user,
    profile,
    firstUpdate: { data: update1, error: error1 },
    secondUpdate: { data: update2, error: error2 }
  };
}

// Make it available globally
window.debugCustomerUpdates = debugCustomerUpdates;
console.log('🧪 Debug script loaded! Run debugCustomerUpdates() to test.');
