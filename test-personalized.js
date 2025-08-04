// Test personalized OneSignal notification
const ONESIGNAL_APP_ID = '3bba2652-8fc8-4527-af54-25aa21651194';
const ONESIGNAL_REST_API_KEY = 'os_v2_app_ho5cmuupzbcspl2uewvcczirsthfmqvlgw4u6ffz3uksj3h3q7ke3xqgm3jna2q44rmz6djbttcikofu3sbgmmkicewn6eum3vgcvzy';

// Test user - update with current user from your logs
const TEST_USER_ID = '367ef821-7e8a-4878-8467-ea3959069a56';
const TEST_EMAIL = 'uxuimusic@gmail.com';

async function testPersonalizedNotification() {
  console.log(`🧪 Testing personalized notification to: ${TEST_EMAIL}`);
  console.log(`🧪 OneSignal User ID: ${TEST_USER_ID}`);
  
  try {
    // Create personalized message like the edge function does
    const motivationalMessage = "Remember that every challenge is an opportunity to grow stronger and wiser.";
    const personalizedMessage = `Hello, ${TEST_EMAIL}! ${motivationalMessage}`;
    
    console.log(`💌 Sending: "${personalizedMessage}"`);
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [TEST_USER_ID],
        headings: { en: "🌟 Your Daily Motivation" },
        contents: { en: personalizedMessage },
        web_url: "http://localhost:8080",
        priority: 10
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Personalized notification sent:');
      console.log(`📊 Recipients: ${result.recipients || 0}`);
      console.log('📊 Full response:', JSON.stringify(result, null, 2));
      
      if (result.recipients > 0) {
        console.log('🎯 SUCCESS: Personalized notification delivered!');
        console.log('📱 Check your browser for the notification with your email address.');
      } else {
        console.log('⚠️  No recipients found. User may not be subscribed.');
      }
    } else {
      const error = await response.text();
      console.error('❌ Failed to send notification:', response.status, error);
    }
  } catch (error) {
    console.error('❌ Error sending personalized notification:', error);
  }
}

// Run the test
testPersonalizedNotification();
