// Test if service role can insert into user_message_history
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJremFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTE5NDM3MCwiZXhwIjoyMDUwNzcwMzcwfQ.cJhkJO7jwZkOwZr7kTkWPf7wGgpBXR3qk_x8hfG7xQg';

async function testServiceRoleInsert() {
  console.log('🧪 Testing service role INSERT permission on user_message_history...');
  
  try {
    // First, get a valid customer_id and message_id
    console.log('\n1️⃣ Getting valid customer and message IDs...');
    
    const customerResponse = await fetch(`${SUPABASE_URL}/rest/v1/customer_users?select=id&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    const customers = await customerResponse.json();
    console.log('👥 Customer response:', customerResponse.status, customers);
    
    const messageResponse = await fetch(`${SUPABASE_URL}/rest/v1/motivational_messages?select=id&status=eq.active&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    const messages = await messageResponse.json();
    console.log('📝 Message response:', messageResponse.status, messages);
    
    if (!customers || customers.length === 0 || !messages || messages.length === 0) {
      console.log('❌ No customers or messages found. Cannot test.');
      console.log('   Customers:', customers);
      console.log('   Messages:', messages);
      return;
    }
    
    // Now try to insert a history record
    console.log('\n2️⃣ Attempting INSERT into user_message_history...');
    
    const testRecord = {
      customer_id: customers[0].id,
      message_id: messages[0].id,
      sent_at: new Date().toISOString()
    };
    
    console.log('📋 Test record:', JSON.stringify(testRecord, null, 2));
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testRecord)
    });
    
    console.log('\n3️⃣ INSERT Response Status:', insertResponse.status);
    
    if (insertResponse.ok) {
      const result = await insertResponse.json();
      console.log('✅ SUCCESS! Record inserted:', JSON.stringify(result, null, 2));
      
      // Clean up - delete the test record
      if (result && result[0]) {
        console.log('\n4️⃣ Cleaning up test record...');
        const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?id=eq.${result[0].id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY
          }
        });
        console.log('🗑️ Cleanup status:', deleteResponse.status);
      }
    } else {
      const errorText = await insertResponse.text();
      console.log('❌ FAILED! Error response:', errorText);
      
      if (insertResponse.status === 403) {
        console.log('\n🔒 This is likely an RLS policy issue!');
        console.log('💡 The service role needs INSERT permission on user_message_history table.');
        console.log('📝 Run the fix-rls-policies.sql script to resolve this.');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testServiceRoleInsert();
