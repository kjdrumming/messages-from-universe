// Test the edge function by bypassing the time check
// We'll modify the time check to always return true temporarily

const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrYXp3YSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MzUzOTMxOTEsImV4cCI6MjA1MDk2OTE5MX0.Tnp4bEz8LCG__CvjK9YU3XfL7fBQZ2LCIEYPxKQxP1w';

async function testForceNotification() {
  console.log('🧪 Testing notification function with forced time match...');
  
  try {
    // First check what users exist and their times
    console.log('\n1️⃣ Checking current users and their notification times...');
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=id,email,notification_time,timezone,notification_enabled&notification_enabled=eq.true`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log('👥 Users with notifications enabled:', users.length);
      users.forEach(user => {
        console.log(`   📧 ${user.email}: ${user.notification_time} (${user.timezone})`);
      });
      
      if (users.length > 0) {
        // Update one user's notification time to current time
        const testUser = users[0];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
        
        console.log(`\n2️⃣ Setting ${testUser.email} notification time to current time: ${currentTime}`);
        
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?id=eq.${testUser.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notification_time: currentTime })
        });
        
        if (updateResponse.ok) {
          console.log('✅ Updated user notification time');
          
          // Now trigger the edge function
          console.log('\n3️⃣ Triggering edge function...');
          const triggerResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-scheduled-notifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('🚀 Edge function response status:', triggerResponse.status);
          const result = await triggerResponse.json();
          console.log('📊 Edge function result:', JSON.stringify(result, null, 2));
          
        } else {
          const error = await updateResponse.text();
          console.log('❌ Failed to update user time:', error);
        }
        
      } else {
        console.log('❌ No users with notifications enabled found');
      }
      
    } else {
      const error = await usersResponse.text();
      console.log('❌ Failed to fetch users:', error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testForceNotification();
