// Direct test of inserting into user_message_history with correct credentials
// Let's use the anon key first to test basic connectivity

const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJremFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function testBasicConnectivity() {
  console.log('🔍 Testing basic connectivity and data access...');
  
  try {
    // Test 1: Can we fetch customers?
    console.log('\n1️⃣ Testing customer data access...');
    const customersResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=id,email&limit=3`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    console.log('👥 Customers response status:', customersResponse.status);
    if (customersResponse.ok) {
      const customers = await customersResponse.json();
      console.log('👥 Customers found:', customers.length);
      console.log('👥 Sample customer:', customers[0] ? { id: customers[0].id, email: customers[0].email } : 'none');
    } else {
      const error = await customersResponse.text();
      console.log('❌ Customers error:', error);
    }
    
    // Test 2: Can we fetch messages?
    console.log('\n2️⃣ Testing message data access...');
    const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/motivational_messages?select=id,content&status=eq.active&limit=3`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    console.log('📝 Messages response status:', messagesResponse.status);
    if (messagesResponse.ok) {
      const messages = await messagesResponse.json();
      console.log('📝 Active messages found:', messages.length);
      console.log('📝 Sample message:', messages[0] ? { id: messages[0].id, content: messages[0].content.substring(0, 50) + '...' } : 'none');
    } else {
      const error = await messagesResponse.text();
      console.log('❌ Messages error:', error);
    }
    
    // Test 3: Can we read history table?
    console.log('\n3️⃣ Testing history table access...');
    const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=*&limit=5`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    console.log('📊 History response status:', historyResponse.status);
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      console.log('📊 History records found:', history.length);
      console.log('📊 Sample record:', history[0] || 'none');
    } else {
      const error = await historyResponse.text();
      console.log('❌ History error:', error);
    }
    
    // Test 4: Try to insert a record (this should fail with anon key due to RLS)
    console.log('\n4️⃣ Testing history insert with anon key (should fail due to RLS)...');
    const testRecord = {
      customer_id: '550e8400-e29b-41d4-a716-446655440000', // dummy UUID
      message_id: '550e8400-e29b-41d4-a716-446655440001', // dummy UUID
      sent_at: new Date().toISOString()
    };
    
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
    
    console.log('📝 Insert response status:', insertResponse.status);
    if (insertResponse.ok) {
      const result = await insertResponse.json();
      console.log('✅ Insert successful (unexpected!):', result);
    } else {
      const error = await insertResponse.text();
      console.log('❌ Insert failed (expected):', error);
      
      if (insertResponse.status === 403) {
        console.log('🔒 This confirms RLS is working - anon key cannot insert');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testBasicConnectivity();
