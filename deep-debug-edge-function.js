// Test edge function behavior WITHOUT RLS - deeper debugging
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function deepDebugEdgeFunction() {
  console.log('🔍 DEEP DEBUGGING: Edge function issues (RLS disabled)...\n');
  
  try {
    // First, check existing data (don't create any)
    console.log('1️⃣ Checking existing data...');
    
    const customersResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=id,email,notification_enabled&notification_enabled=eq.true`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/motivational_messages?select=id,content&status=eq.active`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=*&order=sent_at.desc`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    const customers = await customersResponse.json();
    const messages = await messagesResponse.json();
    const history = await historyResponse.json();
    
    console.log(`📊 Existing data: ${customers.length} enabled customers, ${messages.length} active messages, ${history.length} history records`);
    
    if (customers.length > 0) {
      console.log(`   Sample customer: ${customers[0].email} (ID: ${customers[0].id})`);
    }
    if (messages.length > 0) {
      console.log(`   Sample message: "${messages[0].content.substring(0, 50)}..." (ID: ${messages[0].id})`);
    }
    if (history.length > 0) {
      console.log(`   Latest history: ${history[0].sent_at} (ID: ${history[0].id})`);
    }
    
    if (customers.length === 0 || messages.length === 0) {
      console.log('❌ Missing required data! Edge function needs customers with notification_enabled=true and active messages.');
      return;
    }
    
    // Store initial history count for comparison
    const initialHistoryCount = history.length;
    
    // Test edge function call with detailed logging
    console.log('\n2️⃣ Calling edge function with debug parameters...');
    console.log('   📝 Note: This will test the ACTUAL edge function behavior');
    
    const functionResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-scheduled-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        debug: true,
        force: true,
        testMode: true
      })
    });
    
    console.log(`📡 Edge function response: ${functionResponse.status} ${functionResponse.statusText}`);
    
    if (functionResponse.ok) {
      const result = await functionResponse.json();
      console.log('✅ Edge function executed successfully!');
      console.log('📝 Full response:', JSON.stringify(result, null, 2));
      
      // Analyze the results
      if (result.results && Array.isArray(result.results)) {
        console.log(`\n📊 Notification attempts: ${result.results.length}`);
        
        result.results.forEach((res, index) => {
          console.log(`\n   ${index + 1}. User: ${res.userEmail}`);
          console.log(`      Success: ${res.success}`);
          console.log(`      Recipients: ${res.recipients || 0}`);
          console.log(`      History Recorded: ${res.historyRecorded || false}`);
          if (res.error) {
            console.log(`      Error: ${res.error}`);
          }
        });
        
        const successfulWithHistory = result.results.filter(r => r.success && r.historyRecorded);
        const successfulWithoutHistory = result.results.filter(r => r.success && !r.historyRecorded);
        
        console.log(`\n📈 Summary:`);
        console.log(`   Successful with history: ${successfulWithHistory.length}`);
        console.log(`   Successful without history: ${successfulWithoutHistory.length}`);
        
        if (successfulWithoutHistory.length > 0) {
          console.log(`\n🔍 Issue found: Notifications succeed but history fails!`);
          console.log(`   This suggests the problem is in the history recording logic, not RLS.`);
        }
      }
    } else {
      const errorText = await functionResponse.text();
      console.log('❌ Edge function failed:', errorText);
      
      // Check if it's a function deployment issue
      if (functionResponse.status === 404) {
        console.log('💡 Function not found - check if it\'s deployed');
      } else if (functionResponse.status === 500) {
        console.log('💡 Internal server error - check function logs');
      }
    }
    
    // Check history table after function call
    console.log('\n3️⃣ Checking history table after function call...');
    const newHistoryResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=*&order=sent_at.desc`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    const newHistory = await newHistoryResponse.json();
    console.log(`📊 History records after function call: ${newHistory.length} (was ${initialHistoryCount})`);
    
    if (newHistory.length > initialHistoryCount) {
      const newRecordsCount = newHistory.length - initialHistoryCount;
      console.log(`✅ SUCCESS! ${newRecordsCount} new history record(s) were created!`);
      const newRecords = newHistory.slice(0, newRecordsCount);
      newRecords.forEach((record, index) => {
        console.log(`   New record ${index + 1}: Customer ${record.customer_id}, Message ${record.message_id}, Time: ${record.sent_at}`);
      });
    } else {
      console.log('❌ PROBLEM CONFIRMED: No new history records created despite edge function execution!');
      console.log('🔍 This means the issue is in the edge function\'s history recording logic.');
    }
    
    // Check edge function logs if available
    console.log('\n4️⃣ Potential issues to investigate:');
    console.log('   - Edge function logic error in history recording');
    console.log('   - Database connection issues in edge function');
    console.log('   - Data type mismatches (UUID vs string)');
    console.log('   - Edge function timeout before history recording');
    console.log('   - Missing error handling in edge function');
    
  } catch (error) {
    console.error('💥 Deep debug failed:', error);
  }
}

// Run the deep debug
deepDebugEdgeFunction();
