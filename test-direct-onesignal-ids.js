// Test script to send notifications using OneSignal IDs directly
// This helps verify if the users can receive notifications

const oneSignalAppId = '3bba2652-8fc8-4527-af54-25aa21651194';
const oneSignalApiKey = 'os_v2_app_ho5cmuupzbcspl2uewvcczirsthfmqvlgw4u6ffz3uksj3h3q7ke3xqgm3jna2q44rmz6djbttcikofu3sbgmmkicewn6eum3vgcvzy';

// OneSignal IDs from your dashboard
const testUsers = [
  { id: '2694efe8-9777-4a36-a9d9-aa6525f4d0e6', email: 'kjdrumming@gmail.com', type: 'email user' },
  { id: '427d01e3-0dc4-4c2f-9ca5-99fd46a64bbe', email: 'unknown', type: 'web push user 1' },
  { id: 'f6267232-6f7e-434d-8380-37e3e23ebfe7', email: 'unknown', type: 'web push user 2' }
];

async function testDirectOneSignalID(oneSignalId, userType) {
  console.log(`\n🧪 Testing notification to ${userType} (${oneSignalId})`);
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${oneSignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_player_ids: [oneSignalId], // Using OneSignal ID directly
        headings: { en: "🧪 Direct ID Test" },
        contents: { en: `Test notification sent directly to ${userType}` },
        web_url: "http://localhost:8080"
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Success! Recipients: ${result.recipients}`);
      console.log(`📊 Full response:`, JSON.stringify(result, null, 2));
      return { success: true, recipients: result.recipients, result };
    } else {
      const error = await response.text();
      console.log(`❌ Failed: ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDirectIDTests() {
  console.log('🚀 Testing direct OneSignal ID notifications...\n');
  
  const results = [];
  
  for (const user of testUsers) {
    const result = await testDirectOneSignalID(user.id, user.type);
    results.push({ user, result });
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Summary:');
  results.forEach(({ user, result }) => {
    console.log(`${result.success ? '✅' : '❌'} ${user.type}: ${result.success ? `${result.recipients} recipients` : result.error}`);
  });
  
  const successfulTests = results.filter(r => r.result.success && r.result.recipients > 0);
  console.log(`\n🎯 ${successfulTests.length}/${results.length} notifications delivered successfully`);
  
  if (successfulTests.length > 0) {
    console.log('\n💡 Next steps:');
    console.log('1. Check your browser/device for the test notifications');
    console.log('2. Note which OneSignal IDs work for targeting');
    console.log('3. Update your edge function to use working targeting method');
  }
}

// Run the test
runDirectIDTests().catch(console.error);
