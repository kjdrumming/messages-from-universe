// Check if there are auth users without customer_users records
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function checkUserCreation() {
  console.log('🔍 Checking user creation process...');
  
  try {
    // Check if we're currently authenticated
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Current auth user:', JSON.stringify(authData, null, 2));
    } else if (authResponse.status === 401) {
      console.log('ℹ️  No current auth session (expected in Node.js)');
    } else {
      console.error('❌ Auth check failed:', await authResponse.text());
    }
    
    // Let's manually create a test user record for testing
    console.log('\n🧪 Let\'s create a test user record for notification testing...');
    
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // UUID for testing
      auth_user_id: '550e8400-e29b-41d4-a716-446655440001', // Proper UUID
      email: 'test@example.com',
      name: 'Test User',
      notification_enabled: true,
      notification_time: '09:00',
      timezone: 'America/New_York',
      created_at: new Date().toISOString()
    };
    
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testUser)
    });
    
    if (createResponse.ok) {
      const createdUser = await createResponse.json();
      console.log('✅ Test user created:', JSON.stringify(createdUser, null, 2));
      console.log('\n🎯 Now notifications should work and create history records!');
    } else {
      const error = await createResponse.text();
      console.error('❌ Failed to create test user:', createResponse.status, error);
      
      if (createResponse.status === 409) {
        console.log('ℹ️  User might already exist. Let\'s check...');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkUserCreation();
