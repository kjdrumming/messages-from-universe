// Check if there are any recent history records
const SUPABASE_URL = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJremFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

async function checkHistoryRecords() {
  console.log('📊 Checking user_message_history table...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_message_history?select=*&order=sent_at.desc&limit=10`, {
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (response.ok) {
      const records = await response.json();
      console.log(`✅ Found ${records.length} history records:`);
      
      records.forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}`);
        console.log(`   Customer: ${record.customer_id}`);
        console.log(`   Message: ${record.message_id}`);
        console.log(`   Sent: ${record.sent_at}`);
        console.log('');
      });
      
      if (records.length === 0) {
        console.log('❌ No history records found. The edge function is not inserting records.');
      } else {
        // Check if any are recent (within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentRecords = records.filter(r => new Date(r.sent_at) > oneHourAgo);
        console.log(`📅 Recent records (last hour): ${recentRecords.length}`);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Failed to fetch history:', error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkHistoryRecords();
