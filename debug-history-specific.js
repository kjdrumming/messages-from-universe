// Debug the specific history recording issue - focus on the database insert
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function debugHistoryInsertion() {
  console.log('🔍 Debugging history record insertion specifically...');
  
  try {
    // 1. Check the user_message_history table structure
    console.log('\n📋 Checking user_message_history table structure...');
    const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/?select=*`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    // 2. Try a simple manual insert to see if permissions work
    console.log('\n🧪 Testing manual history insert...');
    const testInsert = {
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      message_id: 1,
      sent_at: new Date().toISOString()
    };
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testInsert)
    });
    
    if (insertResponse.ok) {
      const result = await insertResponse.json();
      console.log('✅ Manual insert worked:', JSON.stringify(result, null, 2));
      
      // Clean up test record
      if (result && result[0] && result[0].id) {
        await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?id=eq.${result[0].id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
          }
        });
        console.log('🗑️ Cleaned up test record');
      }
    } else {
      const error = await insertResponse.text();
      console.error('❌ Manual insert failed:', insertResponse.status, error);
      console.log('🔍 This might be the same issue the edge function is hitting!');
    }
    
    // 3. Check what the edge function is actually trying to insert
    console.log('\n📊 Now let\'s see the actual edge function execution...');
    const edgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-scheduled-notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    if (edgeResponse.ok) {
      const result = await edgeResponse.json();
      console.log('📋 Edge function result:', JSON.stringify(result, null, 2));
      
      // Look for specific error patterns
      if (result.results && result.results.length > 0) {
        result.results.forEach((r, i) => {
          console.log(`\n📝 Result ${i + 1}:`);
          console.log(`  - Success: ${r.success}`);
          console.log(`  - Recipients: ${r.recipients}`);
          console.log(`  - History Recorded: ${r.historyRecorded}`);
          
          if (r.success && r.recipients > 0 && !r.historyRecorded) {
            console.log(`❌ FOUND THE ISSUE: Notification succeeded but history failed!`);
            console.log(`  - Error: ${r.error}`);
          }
        });
      }
    } else {
      console.error('❌ Edge function failed:', await edgeResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugHistoryInsertion();
