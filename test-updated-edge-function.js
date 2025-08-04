// Test script for the updated edge function with notification schedules
// This tests that the edge function correctly uses the new notification_schedules table

const testUpdatedEdgeFunction = async () => {
  console.log('🧪 Testing updated edge function with notification schedules...');
  
  // Test the edge function endpoint
  const response = await fetch('https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // Replace with your anon key
    }
  });
  
  const result = await response.json();
  
  console.log('📊 Edge function response:', result);
  
  // Check if it's using the new notification_schedules structure
  if (result.results && result.results.length > 0) {
    const firstResult = result.results[0];
    
    console.log('🔍 Checking result structure...');
    console.log('Has scheduleId:', !!firstResult.scheduleId);
    console.log('Has scheduleLabel:', !!firstResult.scheduleLabel);
    console.log('Has notificationTime:', !!firstResult.notificationTime);
    console.log('Has timezone:', !!firstResult.timezone);
    
    if (firstResult.scheduleId && firstResult.notificationTime) {
      console.log('✅ Edge function is using new notification_schedules table!');
      console.log(`📅 Schedule: ${firstResult.notificationTime} (${firstResult.timezone})`);
      console.log(`🏷️ Label: ${firstResult.scheduleLabel || 'No label'}`);
    } else {
      console.log('❌ Edge function might still be using old structure');
    }
  } else {
    console.log('ℹ️ No notifications sent (either no schedules ready or no users)');
  }
  
  return result;
};

// Manual test query to check notification schedules
const testNotificationSchedulesQuery = `
-- Check notification schedules in database
SELECT 
    ns.id,
    ns.notification_time,
    ns.timezone,
    ns.is_active,
    ns.label,
    cu.email,
    cu.notification_enabled
FROM notification_schedules ns
JOIN customer_users cu ON ns.customer_id = cu.id
ORDER BY cu.email, ns.notification_time;

-- Check the view
SELECT * FROM user_notification_schedules;
`;

console.log('🧪 Test functions loaded!');
console.log('Run testUpdatedEdgeFunction() to test the edge function');
console.log('Run the SQL queries above in Supabase to check data structure');
