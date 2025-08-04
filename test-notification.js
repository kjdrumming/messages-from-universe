#!/usr/bin/env node

// Test script to check database and create test notifications
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database...');
  
  // Check users
  const { data: users, error: usersError } = await supabase
    .from('customer_users')
    .select('*');
    
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
  } else {
    console.log(`👥 Found ${users?.length || 0} total users`);
    users?.forEach(user => {
      console.log(`  - ${user.email}: notifications=${user.notification_enabled}, time=${user.notification_time}, timezone=${user.timezone}`);
    });
  }
  
  // Check messages
  const { data: messages, error: messagesError } = await supabase
    .from('motivational_messages')
    .select('*')
    .eq('status', 'active');
    
  if (messagesError) {
    console.error('❌ Error fetching messages:', messagesError);
  } else {
    console.log(`📝 Found ${messages?.length || 0} active messages`);
  }
}

async function createTestNotification() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const testTime = `${currentHour.toString().padStart(2, '0')}:${(currentMinute + 1).toString().padStart(2, '0')}`;
  
  console.log(`🧪 Creating test user with notification time in 1 minute: ${testTime}`);
  
  // Create or update a test user
  const { data, error } = await supabase
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
    
  if (error) {
    console.error('❌ Error creating test user:', error);
  } else {
    console.log('✅ Test user created/updated successfully');
    console.log(`⏰ Notification will trigger at ${testTime} (in ~1 minute)`);
  }
}

// Run the checks
checkDatabase().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('Would you like to create a test user for immediate testing? (y/n)');
});
