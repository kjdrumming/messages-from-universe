// Check recent edge function logs to debug history recording issue
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function debugHistoryIssue() {
  console.log('🔍 Debugging history recording issue...');
  
  try {
    // 1. Check current history records
    console.log('\n📊 Checking user_message_history table...');
    const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=*&order=sent_at.desc&limit=10`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log(`📊 Recent history records (${historyData.length}):`, JSON.stringify(historyData, null, 2));
    } else {
      console.error('❌ Failed to fetch history records:', await historyResponse.text());
    }
    
    // 2. Check customer_users table for active users
    console.log('\n👥 Checking active users...');
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=*&notification_enabled=eq.true&limit=5`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`📊 Active users with notifications (${usersData.length}):`, JSON.stringify(usersData, null, 2));
    } else {
      console.error('❌ Failed to fetch users:', await usersResponse.text());
    }
    
    // 3. Trigger edge function manually to see live logs
    console.log('\n🚀 Triggering edge function to see live logs...');
    const triggerResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-scheduled-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ debug: true })
    });
    
    if (triggerResponse.ok) {
      const result = await triggerResponse.json();
      console.log('✅ Edge function response:', JSON.stringify(result, null, 2));
      
      // Check if any results show successful delivery but failed history
      const results = result.results || [];
      results.forEach((r, index) => {
        console.log(`\n📋 Result ${index + 1}:`);
        console.log(`  - User: ${r.userEmail}`);
        console.log(`  - Success: ${r.success}`);
        console.log(`  - Recipients: ${r.recipients}`);
        console.log(`  - History Recorded: ${r.historyRecorded}`);
        console.log(`  - Error: ${r.error || 'None'}`);
        
        if (r.success && r.recipients > 0 && !r.historyRecorded) {
          console.log(`⚠️  ISSUE FOUND: Successful delivery but history not recorded!`);
        }
      });
      
    } else {
      const error = await triggerResponse.text();
      console.error('❌ Edge function failed:', triggerResponse.status, error);
    }
    
  } catch (error) {
    console.error('❌ Error debugging history issue:', error);
  }
}

// Run the debug
debugHistoryIssue();
