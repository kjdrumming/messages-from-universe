// Test the actual edge function with personalized messages
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function testEdgeFunctionPersonalized() {
  console.log('🧪 Testing edge function with personalized messages...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-scheduled-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true, // Add test parameter if needed
        force: true // Force sending regardless of time
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Edge function executed:');
      console.log(`📊 Processed: ${result.processed || 0} notifications`);
      console.log('📊 Results:', JSON.stringify(result.results || [], null, 2));
      
      if (result.processed > 0) {
        console.log('🎯 SUCCESS: Edge function sent personalized notifications!');
        console.log('📱 Check your browser/device for notifications starting with "Hello, [email]!"');
      } else {
        console.log('⚠️  No notifications were sent. Check if users have notification_enabled=true and correct notification_time.');
      }
    } else {
      const error = await response.text();
      console.error('❌ Edge function failed:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Error calling edge function:', error);
  }
}

// Run the test
testEdgeFunctionPersonalized();
