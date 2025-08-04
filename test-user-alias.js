// Test OneSignal User Aliasing - Send notification to specific user
const ONESIGNAL_APP_ID = '3bba2652-8fc8-4527-af54-25aa21651194';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_ho5cmuupzbcspl2uewvcczirsthfmqvlgw4u6ffz3uksj3h3q7ke3xqgm3jna2q44rmz6djbttcikofu3sbgmmkicewn6eum3vgcvzy';

// Test user from your logs
const TEST_USER_ID = '367ef821-7e8a-4878-8467-ea3959069a56';
const TEST_EMAIL = 'uxuimusic@gmail.com';

async function testUserAliasNotification() {
  console.log(`🧪 Testing notification to specific user: ${TEST_EMAIL}`);
  console.log(`🧪 OneSignal User ID: ${TEST_USER_ID}`);
  
  try {
    // Test 1: Try external user ID targeting
    console.log('\n📡 Test 1: External User ID targeting...');
    const response1 = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [TEST_USER_ID], // Target specific user
        headings: { en: "🧪 External User ID Test" },
        contents: { en: `Hello ${TEST_EMAIL}! (External User ID method)` },
        web_url: "http://localhost:8080",
        priority: 10
      })
    });
    
    if (response1.ok) {
      const result1 = await response1.json();
      console.log('📊 External User ID result:', result1.recipients || 0, 'recipients');
    }
    
    // Test 2: Try tag-based targeting
    console.log('\n� Test 2: Tag-based targeting...');
    const response2 = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          {"field": "tag", "key": "user_id", "relation": "=", "value": TEST_USER_ID}
        ],
        headings: { en: "🧪 Tag Targeting Test" },
        contents: { en: `Hello ${TEST_EMAIL}! (Tag targeting method)` },
        web_url: "http://localhost:8080",
        priority: 10
      })
    });
    
    if (response2.ok) {
      const result2 = await response2.json();
      console.log('📊 Tag targeting result:', result2.recipients || 0, 'recipients');
      console.log('📊 Full response:', JSON.stringify(result2, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
}

// Run the test
testUserAliasNotification();
