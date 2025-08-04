// Direct OneSignal test script to test notification delivery
// This bypasses time window checks and directly tests if we can reach the user

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
const supabaseServiceKey = 'PUT_SERVICE_ROLE_KEY_HERE'; // You'll need to add this
const oneSignalAppId = '3bba2652-8fc8-4527-af54-25aa21651194';
const oneSignalApiKey = 'os_v2_app_ho5cmuupzbcspl2uewvcczirsrapcyugir2evo435fmk6nzbkno6igyc3v35isolmccgwnxmybcmpr4y3t2ba63y7oqbatam4rg3jbi';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDirectNotification() {
  console.log('🧪 Testing direct OneSignal notification...\n');
  
  // Get the kjdrumming user specifically
  const { data: users, error } = await supabase
    .from('customer_users')
    .select('id, email, name')
    .eq('email', 'kjdrumming@gmail.com')
    .limit(1);
    
  if (error || !users || users.length === 0) {
    console.log('❌ User kjdrumming@gmail.com not found in database');
    console.log('Error:', error);
    return;
  }
  
  const user = users[0];
  console.log(`👤 Found user: ${user.email} (ID: ${user.id})\n`);
  
  // Method 1: External User ID
  console.log('📱 Method 1: Testing External User ID targeting...');
  const externalUserResponse = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${oneSignalApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: oneSignalAppId,
      include_external_user_ids: [user.id],
      headings: { en: "🧪 Test: External User ID" },
      contents: { en: "This is a test notification using External User ID targeting." },
      web_url: "https://localhost:8080"
    })
  });
  
  if (externalUserResponse.ok) {
    const result = await externalUserResponse.json();
    console.log('✅ External User ID Response:', JSON.stringify(result, null, 2));
  } else {
    const error = await externalUserResponse.text();
    console.log('❌ External User ID Failed:', error);
  }
  
  console.log('\n');
  
  // Method 2: Email targeting
  console.log('📧 Method 2: Testing Email targeting...');
  const emailResponse = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${oneSignalApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: oneSignalAppId,
      include_email_tokens: [user.email],
      headings: { en: "🧪 Test: Email Token" },
      contents: { en: "This is a test notification using email targeting." },
      web_url: "https://localhost:8080"
    })
  });
  
  if (emailResponse.ok) {
    const result = await emailResponse.json();
    console.log('✅ Email targeting Response:', JSON.stringify(result, null, 2));
  } else {
    const error = await emailResponse.text();
    console.log('❌ Email targeting Failed:', error);
  }
  
  console.log('\n');
  
  // Method 3: Check user devices in OneSignal
  console.log('🔍 Method 3: Checking user devices in OneSignal...');
  const devicesResponse = await fetch(`https://onesignal.com/api/v1/apps/${oneSignalAppId}/players?limit=300`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${oneSignalApiKey}`
    }
  });
  
  if (devicesResponse.ok) {
    const devices = await devicesResponse.json();
    console.log(`📊 Total devices in app: ${devices.players.length}`);
    
    // Look for this specific user
    const userDevices = devices.players.filter(player => 
      player.external_user_id === user.id || 
      player.external_user_id === user.id.toString() ||
      player.identifier === user.email
    );
    
    console.log(`👤 Devices for user ${user.email}:`, userDevices.length);
    userDevices.forEach((device, index) => {
      console.log(`  Device ${index + 1}:`, {
        id: device.id,
        external_user_id: device.external_user_id,
        identifier: device.identifier,
        device_type: device.device_type,
        active: device.last_active,
        session_count: device.session_count,
        invalid_identifier: device.invalid_identifier
      });
    });
    
    if (userDevices.length === 0) {
      console.log('⚠️ No devices found for this user. Showing first 5 devices for debugging:');
      devices.players.slice(0, 5).forEach((device, index) => {
        console.log(`  Sample Device ${index + 1}:`, {
          external_user_id: device.external_user_id,
          identifier: device.identifier,
          device_type: device.device_type
        });
      });
    }
  } else {
    console.log('❌ Failed to get devices list');
  }
}

// Run if this is the main module
if (import.meta.main) {
  testDirectNotification().catch(console.error);
}

export { testDirectNotification };
