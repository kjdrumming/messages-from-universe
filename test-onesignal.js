// OneSignal Notification Test Script
// This script helps you verify if OneSignal can send notifications to specific users

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'; // Replace with actual service role key
const oneSignalAppId = '3bba2652-8fc8-4527-af54-25aa21651194';
const oneSignalApiKey = 'os_v2_app_ho5cmuupzbcspl2uewvcczirsrapcyugir2evo435fmk6nzbkno6igyc3v35isolmccgwnxmybcmpr4y3t2ba63y7oqbatam4rg3jbi';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test function to send a notification and get detailed results
async function testOneSignalNotification(userId, testMessage = "🧪 Test notification from your Zen Prompt Pal app!") {
  console.log(`🧪 Testing OneSignal notification for user: ${userId}`);
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${oneSignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_external_user_ids: [userId],
        headings: { en: "🧪 Test Notification" },
        contents: { en: testMessage },
        web_url: "https://localhost:8080",
        priority: 10,
        ttl: 86400
      })
    });

    console.log(`📡 OneSignal API Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ OneSignal API Response:', JSON.stringify(result, null, 2));
      
      return {
        success: true,
        notificationId: result.id,
        recipients: result.recipients,
        errors: result.errors || [],
        details: result
      };
    } else {
      const errorText = await response.text();
      console.log('❌ OneSignal API Error Response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        return {
          success: false,
          error: errorJson,
          httpStatus: response.status
        };
      } catch {
        return {
          success: false,
          error: errorText,
          httpStatus: response.status
        };
      }
    }
  } catch (error) {
    console.error('❌ Network/Request Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test function to check OneSignal device/subscription status
async function checkOneSignalUserStatus(userId) {
  console.log(`🔍 Checking OneSignal user status for: ${userId}`);
  
  try {
    // Get player/device info using OneSignal's View Devices API
    const response = await fetch(`https://onesignal.com/api/v1/apps/${oneSignalAppId}/players?limit=300`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${oneSignalApiKey}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      const userDevices = result.players.filter(player => 
        player.external_user_id === userId || player.external_user_id === userId.toString()
      );
      
      console.log(`📱 Found ${userDevices.length} devices for user ${userId}`);
      userDevices.forEach((device, index) => {
        console.log(`  Device ${index + 1}:`, {
          id: device.id,
          external_user_id: device.external_user_id,
          device_type: device.device_type,
          active: device.last_active,
          session_count: device.session_count
        });
      });
      
      return {
        found: userDevices.length > 0,
        devices: userDevices,
        totalDevices: result.players.length
      };
    } else {
      console.error('❌ Failed to check user status:', response.status);
      return { found: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Error checking user status:', error);
    return { found: false, error: error.message };
  }
}

// Main test function
async function runNotificationTest() {
  console.log('🚀 Starting OneSignal notification test...\n');
  
  // Get a test user from your database
  const { data: users, error } = await supabase
    .from('customer_users')
    .select('id, email, notification_enabled')
    .eq('notification_enabled', true)
    .limit(1);
    
  if (error || !users || users.length === 0) {
    console.log('❌ No test users found in database');
    return;
  }
  
  const testUser = users[0];
  console.log(`👤 Testing with user: ${testUser.email} (ID: ${testUser.id})\n`);
  
  // Step 1: Check if user is registered with OneSignal
  console.log('Step 1: Checking OneSignal user registration...');
  const userStatus = await checkOneSignalUserStatus(testUser.id);
  console.log('User Status Result:', userStatus);
  console.log('');
  
  // Step 2: Send test notification
  console.log('Step 2: Sending test notification...');
  const notificationResult = await testOneSignalNotification(testUser.id);
  console.log('Notification Result:', notificationResult);
  console.log('');
  
  // Step 3: Summary
  console.log('📊 Test Summary:');
  console.log(`   User Registered: ${userStatus.found ? '✅' : '❌'}`);
  console.log(`   Notification Sent: ${notificationResult.success ? '✅' : '❌'}`);
  console.log(`   Recipients: ${notificationResult.recipients || 0}`);
  
  if (!userStatus.found) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   - User needs to visit your website and accept notifications');
    console.log('   - Check OneSignal initialization in your React app');
    console.log('   - Verify setOneSignalUserId() is called during signup');
  }
}

// Export for use or run directly
if (import.meta.main) {
  runNotificationTest();
}

export { testOneSignalNotification, checkOneSignalUserStatus, runNotificationTest };
