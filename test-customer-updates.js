// Test customer updates behavior - simulate UI issue
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function testCustomerUpdates() {
  console.log('🧪 Testing customer update behavior...\n');
  
  const testEmail = 'kjdrumming@gmail.com';
  
  try {
    // Step 1: Get current customer data
    console.log('1️⃣ Getting current customer data...');
    const getUserResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?email=eq.${testEmail}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getUserResponse.ok) {
      console.error('❌ Failed to get user:', await getUserResponse.text());
      return;
    }
    
    const users = await getUserResponse.json();
    if (users.length === 0) {
      console.error('❌ No user found with email:', testEmail);
      return;
    }
    
    const user = users[0];
    console.log('✅ Found user:', {
      id: user.id,
      email: user.email,
      auth_user_id: user.auth_user_id,
      notification_enabled: user.notification_enabled,
      notification_time: user.notification_time,
      timezone: user.timezone
    });
    
    // Step 2: Test first update (toggle notifications)
    console.log('\n2️⃣ Testing first update (toggle notifications)...');
    const newNotificationState = !user.notification_enabled;
    
    const firstUpdateResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ 
        notification_enabled: newNotificationState 
      })
    });
    
    if (firstUpdateResponse.ok) {
      const firstResult = await firstUpdateResponse.json();
      console.log('✅ First update successful:', firstResult);
    } else {
      console.error('❌ First update failed:', await firstUpdateResponse.text());
      return;
    }
    
    // Step 3: Wait a moment, then test second update (change time)
    console.log('\n3️⃣ Testing second update immediately (change time)...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const newTime = user.notification_time === '09:00:00' ? '10:00:00' : '09:00:00';
    
    const secondUpdateResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ 
        notification_time: newTime 
      })
    });
    
    if (secondUpdateResponse.ok) {
      const secondResult = await secondUpdateResponse.json();
      console.log('✅ Second update successful:', secondResult);
    } else {
      console.error('❌ Second update failed:', await secondUpdateResponse.text());
      console.log('Response status:', secondUpdateResponse.status);
      console.log('Response headers:', Object.fromEntries(secondUpdateResponse.headers.entries()));
    }
    
    // Step 4: Test third update (change timezone)
    console.log('\n4️⃣ Testing third update (change timezone)...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const newTimezone = user.timezone === 'America/New_York' ? 'America/Los_Angeles' : 'America/New_York';
    
    const thirdUpdateResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ 
        timezone: newTimezone 
      })
    });
    
    if (thirdUpdateResponse.ok) {
      const thirdResult = await thirdUpdateResponse.json();
      console.log('✅ Third update successful:', thirdResult);
    } else {
      console.error('❌ Third update failed:', await thirdUpdateResponse.text());
      console.log('Response status:', thirdUpdateResponse.status);
    }
    
    // Step 5: Check final state
    console.log('\n5️⃣ Checking final state...');
    const finalStateResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?email=eq.${testEmail}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (finalStateResponse.ok) {
      const finalUsers = await finalStateResponse.json();
      console.log('📊 Final state:', finalUsers[0]);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testCustomerUpdates();
