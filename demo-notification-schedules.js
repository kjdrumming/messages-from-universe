// Demo script for testing notification schedules
// Run this in the browser console after signing in as a customer

async function demoNotificationSchedules() {
  console.log('🎯 Testing Notification Schedules Feature');
  
  // This would be available through the CustomerApp component
  const customerId = 'your-customer-id'; // Replace with actual customer ID
  
  // Test data for multiple schedules
  const testSchedules = [
    {
      notification_time: '08:00',
      timezone: 'America/New_York',
      label: 'Morning motivation',
      is_active: true
    },
    {
      notification_time: '12:00',
      timezone: 'America/New_York', 
      label: 'Lunch inspiration',
      is_active: true
    },
    {
      notification_time: '18:00',
      timezone: 'America/New_York',
      label: 'Evening reflection',
      is_active: true
    }
  ];
  
  console.log('📅 Test schedules to create:', testSchedules);
  
  // In the actual app, these would be called through the UI
  console.log('✅ Demo ready! Use the UI to:');
  console.log('1. Click "Add Schedule" button');
  console.log('2. Set different times (8:00 AM, 12:00 PM, 6:00 PM)');
  console.log('3. Add labels like "Morning motivation", "Lunch inspiration", "Evening reflection"');
  console.log('4. Test editing times and labels');
  console.log('5. Test toggling schedules on/off');
  console.log('6. Test deleting unwanted schedules');
  
  return {
    message: 'Demo script loaded - use the UI to test the notification schedules feature!',
    testData: testSchedules
  };
}

// Export for browser console use
if (typeof window !== 'undefined') {
  window.demoNotificationSchedules = demoNotificationSchedules;
  console.log('🚀 Demo loaded! Run demoNotificationSchedules() to start');
}
