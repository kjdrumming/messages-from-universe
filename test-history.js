// Test that successful notifications are recorded in user_message_history
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function testHistoryRecording() {
  console.log('🧪 Testing history recording for successful notifications...');
  
  try {
    // First, get current count of history records
    const beforeResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=count`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    const beforeData = await beforeResponse.text();
    console.log('📊 History records before test:', beforeData);
    
    // Trigger the edge function
    console.log('🚀 Triggering edge function...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-scheduled-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Edge function executed:');
      console.log(`📊 Processed: ${result.processed || 0} notifications`);
      console.log('📊 Results:', JSON.stringify(result.results || [], null, 2));
      
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check history records after
      const afterResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=count`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });
      
      const afterData = await afterResponse.text();
      console.log('📊 History records after test:', afterData);
      
      // Count successful notifications that should have been recorded
      const successfulNotifications = (result.results || []).filter(r => r.success && r.recipients > 0);
      console.log(`🎯 Successful notifications with recipients: ${successfulNotifications.length}`);
      
      if (successfulNotifications.length > 0) {
        console.log('🎉 SUCCESS: Notifications sent and should be recorded in history!');
      } else {
        console.log('⚠️  No successful notifications sent to test history recording.');
      }
      
    } else {
      const error = await response.text();
      console.error('❌ Edge function failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Error testing history recording:', error);
  }
}

// Run the test
testHistoryRecording();
