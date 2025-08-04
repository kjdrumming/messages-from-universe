import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestData() {
  console.log('🧪 Setting up test data...');
  
  // Create test messages
  const { error: messagesError } = await supabase
    .from('motivational_messages')
    .insert([
      { content: '🌟 Start your day with intention and purpose!', category: 'morning', status: 'active' },
      { content: '💪 You have the power to create positive change today!', category: 'motivation', status: 'active' },
      { content: '🎯 Focus on progress, not perfection!', category: 'success', status: 'active' }
    ]);
    
  if (messagesError && !messagesError.message.includes('duplicate')) {
    console.error('❌ Error creating messages:', messagesError);
  } else {
    console.log('✅ Test messages created');
  }
  
  // Create test user with current time for immediate testing
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const testTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  const { error: userError } = await supabase
    .from('customer_users')
    .upsert({
      email: 'test@example.com',
      name: 'Test User',
      notification_enabled: true,
      notification_time: testTime,
      timezone: 'America/New_York'
    }, {
      onConflict: 'email'
    });
    
  if (userError) {
    console.error('❌ Error creating test user:', userError);
  } else {
    console.log(`✅ Test user created with notification time: ${testTime}`);
    console.log('🚀 Ready to test! Run the cron endpoint now.');
  }
}

setupTestData();
