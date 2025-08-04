// Check all users and their notification settings
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function checkAllUsers() {
  console.log('🔍 Checking ALL users and their notification settings...');
  
  try {
    // Get all customer_users
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=*&order=created_at.desc&limit=10`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`\n📊 Found ${users.length} total users:`);
      
      users.forEach((user, index) => {
        console.log(`\n👤 User ${index + 1}:`);
        console.log(`  - ID: ${user.id}`);
        console.log(`  - Email: ${user.email}`);
        console.log(`  - Name: ${user.name || 'Not set'}`);
        console.log(`  - Notifications Enabled: ${user.notification_enabled}`);
        console.log(`  - Notification Time: ${user.notification_time || 'Not set'}`);
        console.log(`  - Timezone: ${user.timezone || 'Not set'}`);
        console.log(`  - Created: ${user.created_at}`);
      });
      
      // Count notification settings
      const withNotifications = users.filter(u => u.notification_enabled === true);
      const withTime = users.filter(u => u.notification_time);
      const withTimezone = users.filter(u => u.timezone);
      
      console.log(`\n📊 Summary:`);
      console.log(`  - Total users: ${users.length}`);
      console.log(`  - With notifications enabled: ${withNotifications.length}`);
      console.log(`  - With notification time set: ${withTime.length}`);
      console.log(`  - With timezone set: ${withTimezone.length}`);
      
      if (withNotifications.length === 0) {
        console.log(`\n❗ ISSUE: No users have notification_enabled=true`);
        console.log(`This is why no history records are created - no notifications are being sent!`);
        
        if (users.length > 0) {
          console.log(`\n💡 SOLUTION: Enable notifications for a user. Example:`);
          console.log(`UPDATE customer_users SET notification_enabled = true, notification_time = '09:00', timezone = 'America/New_York' WHERE email = '${users[0].email}';`);
        }
      }
      
    } else {
      console.error('❌ Failed to fetch users:', await usersResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

// Run the check
checkAllUsers();
