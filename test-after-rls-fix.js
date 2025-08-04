// Test edge function after applying RLS policy fix
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function testEdgeFunctionCall() {
  console.log('🧪 Testing edge function after RLS policy fix...\n');
  
  try {
    console.log('1️⃣ Calling send-scheduled-notifications edge function...');
    
    const functionResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-scheduled-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: true, // Add test flag if your function supports it
        force: true // Force execution regardless of time
      })
    });
    
    console.log('📡 Function response status:', functionResponse.status);
    
    if (functionResponse.ok) {
      const result = await functionResponse.json();
      console.log('✅ Function executed successfully!');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
      
      // Check if any history records were created
      if (result.results && result.results.length > 0) {
        const successfulNotifications = result.results.filter(r => r.success && r.historyRecorded);
        console.log(`\n📝 History records that should have been created: ${successfulNotifications.length}`);
        successfulNotifications.forEach((record, index) => {
          console.log(`   ${index + 1}. User: ${record.userEmail}, Success: ${record.success}, History: ${record.historyRecorded}`);
        });
      }
    } else {
      const errorText = await functionResponse.text();
      console.log('❌ Function call failed:', errorText);
    }
    
    // Check current history count
    console.log('\n2️⃣ Checking current history records...');
    const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=*`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      console.log(`📊 Total history records in database: ${history.length}`);
      
      if (history.length > 0) {
        console.log('📋 Recent records:');
        history.slice(-3).forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record.id}, Customer: ${record.customer_id}, Sent: ${record.sent_at}`);
        });
      }
    } else {
      console.log('❌ Could not fetch history records');
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Alternative: Test the log-notification-history function directly
async function testHistoryLoggingFunction() {
  console.log('\n🧪 Testing log-notification-history function directly...\n');
  
  try {
    // Get test data first
    const customerResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=id&limit=1`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    const messageResponse = await fetch(`${SUPABASE_URL}/rest/v1/motivational_messages?select=id&status=eq.active&limit=1`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (customerResponse.ok && messageResponse.ok) {
      const customers = await customerResponse.json();
      const messages = await messageResponse.json();
      
      if (customers.length > 0 && messages.length > 0) {
        const testData = {
          customer_id: customers[0].id,
          message_id: messages[0].id,
          notification_id: 'test-' + Date.now(),
          delivery_method: 'web_push',
          success: true
        };
        
        console.log('📤 Calling log-notification-history with data:', testData);
        
        const logResponse = await fetch(`${SUPABASE_URL}/functions/v1/log-notification-history`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testData)
        });
        
        console.log('📡 History logging response status:', logResponse.status);
        
        if (logResponse.ok) {
          const result = await logResponse.json();
          console.log('✅ History logging successful:', result);
        } else {
          const errorText = await logResponse.text();
          console.log('❌ History logging failed:', errorText);
        }
      } else {
        console.log('❌ No test data available (customers or messages)');
      }
    }
    
  } catch (error) {
    console.error('💥 History logging test failed:', error);
  }
}

console.log('🚀 Running edge function tests...');
testEdgeFunctionCall().then(() => {
  return testHistoryLoggingFunction();
}).then(() => {
  console.log('\n✅ Testing complete!');
});
