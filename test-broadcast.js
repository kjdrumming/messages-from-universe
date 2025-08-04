// Test sending to ALL subscribed users
const ONESIGNAL_APP_ID = '3bba2652-8fc8-4527-af54-25aa21651194';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_ho5cmuupzbcspl2uewvcczirsthfmqvlgw4u6ffz3uksj3h3q7ke3xqgm3jna2q44rmz6djbttcikofu3sbgmmkicewn6eum3vgcvzy';

async function testBroadcastNotification() {
  console.log('🧪 Testing broadcast notification to all subscribed users...');
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"], // Send to all subscribed users
        headings: { en: "🧪 Broadcast Test" },
        contents: { en: "Testing if anyone receives notifications on this device" },
        web_url: "http://localhost:8080",
        priority: 10
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Broadcast notification sent:');
      console.log(`📊 Recipients: ${result.recipients || 0}`);
      console.log('📊 Full response:', JSON.stringify(result, null, 2));
      
      if (result.recipients > 0) {
        console.log('🎯 SUCCESS: Device has active push subscriptions!');
      } else {
        console.log('⚠️  No recipients found. No active push subscriptions on this device.');
      }
    } else {
      const error = await response.text();
      console.error('❌ Failed to send notification:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Error sending broadcast notification:', error);
  }
}

testBroadcastNotification();
