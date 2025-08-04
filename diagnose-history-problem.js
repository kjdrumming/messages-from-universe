// Comprehensive troubleshooting for user_message_history INSERT issues
// Using current working credentials from .env

const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function diagnoseProblem() {
  console.log('🔍 Comprehensive troubleshooting for user_message_history INSERT issues...\n');
  
  try {
    // Test 1: Check if we can access the tables with anon key
    console.log('1️⃣ Testing basic table access with anon key...');
    
    const customerResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=id,email&limit=2`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (customerResponse.ok) {
      const customers = await customerResponse.json();
      console.log('✅ Customer users access OK. Found:', customers.length, 'customers');
      if (customers.length > 0) {
        console.log('   Sample customer:', customers[0]);
      }
    } else {
      const errorText = await customerResponse.text();
      console.log('❌ Customer users access failed:', customerResponse.status, errorText);
    }
    
    // Test 2: Check messages table
    const messageResponse = await fetch(`${SUPABASE_URL}/rest/v1/motivational_messages?select=id,content&status=eq.active&limit=2`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (messageResponse.ok) {
      const messages = await messageResponse.json();
      console.log('✅ Messages access OK. Found:', messages.length, 'active messages');
      if (messages.length > 0) {
        console.log('   Sample message:', { id: messages[0].id, content: messages[0].content.substring(0, 50) + '...' });
      }
    } else {
      const errorText = await messageResponse.text();
      console.log('❌ Messages access failed:', messageResponse.status, errorText);
    }
    
    // Test 3: Check current history records
    console.log('\n2️⃣ Checking current user_message_history records...');
    const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=*&limit=5`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      console.log('✅ History table access OK. Current records:', history.length);
      history.forEach((record, index) => {
        console.log(`   Record ${index + 1}:`, {
          id: record.id,
          customer_id: record.customer_id,
          message_id: record.message_id,
          sent_at: record.sent_at
        });
      });
    } else {
      const errorText = await historyResponse.text();
      console.log('❌ History table access failed:', historyResponse.status, errorText);
    }
    
    // Test 4: Try INSERT with anon key (should fail due to RLS)
    console.log('\n3️⃣ Testing INSERT with anon key (expecting failure due to RLS)...');
    
    const customerResponse2 = await customerResponse.json();
    const messageResponse2 = await messageResponse.json();
    
    if (customerResponse2.length > 0 && messageResponse2.length > 0) {
      const testRecord = {
        customer_id: customerResponse2[0].id,
        message_id: messageResponse2[0].id,
        sent_at: new Date().toISOString()
      };
      
      console.log('📋 Test record to insert:', testRecord);
      
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testRecord)
      });
      
      console.log('📤 INSERT Response Status:', insertResponse.status);
      
      if (insertResponse.ok) {
        const result = await insertResponse.json();
        console.log('✅ UNEXPECTED SUCCESS! Record inserted with anon key:', result);
      } else {
        const errorText = await insertResponse.text();
        console.log('❌ INSERT FAILED (expected):', errorText);
        
        if (insertResponse.status === 403) {
          console.log('💡 This confirms RLS is blocking anon inserts - which is correct!');
        }
      }
    }
    
    // Test 5: Check edge function logs if available
    console.log('\n4️⃣ Issue Summary:');
    console.log('🔍 The edge function likely fails to insert history records because:');
    console.log('   1. RLS is enabled on user_message_history (good for security)');
    console.log('   2. The service role needs explicit INSERT policy on user_message_history');
    console.log('   3. Edge functions run with service_role context, not anon context');
    console.log('\n💡 Solution: Apply the RLS policy fix for service_role INSERT permissions');
    console.log('📝 Run: fix-edge-function-permissions.sql in your database');
    
  } catch (error) {
    console.error('💥 Diagnostic failed with error:', error);
  }
}

// Run the diagnostic
diagnoseProblem();
