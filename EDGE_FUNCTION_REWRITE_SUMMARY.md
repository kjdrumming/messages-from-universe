# 🚀 Rewritten Edge Function Documentation

## Overview
The `send-scheduled-notifications` edge function has been completely rewritten to follow your exact specifications. Here's what it does:

## Process Flow

### 1. **Receives Trigger from cron-job.org**
- The `public-cron` function receives the HTTP request from cron-job.org
- It then calls this `send-scheduled-notifications` function internally

### 2. **Edge Function Starts**
- Initializes Supabase client with service role permissions
- Logs the start of the notification process

### 3. **Time Zone Checking**
- Fetches all users with `notification_enabled: true`
- For each user, compares their `notification_time` with current time in their `timezone`
- Uses `Intl.DateTimeFormat` for accurate timezone conversion
- Allows ±5 minute window for notification delivery

### 4. **OneSignal Web Push Notification**
- Sends web push notification via OneSignal REST API
- Uses `user.id` as the external user ID in OneSignal
- Sends a random message from the `motivational_messages` table (status='active')
- Returns success/failure status for each notification

### 5. **User Message History Update**
- **Only if OneSignal was successful**, records the notification in `user_message_history`
- Stores: `customer_id`, `message_id`, `sent_at` timestamp
- Continues processing other users even if history recording fails for one user

## Key Features

### ✅ **Exactly What You Requested**
1. ✅ Receives trigger from cron-job.org
2. ✅ Starts edge function
3. ✅ Checks user records against current time using their timezone
4. ✅ Sends OneSignal web push notifications with motivational messages
5. ✅ Updates user message history table only on successful delivery

### 🔧 **Technical Implementation**
- **Time Matching**: Uses `Intl.DateTimeFormat` for accurate timezone handling
- **Message Selection**: Random selection from active motivational messages
- **Error Handling**: Graceful failure handling, continues processing other users
- **Logging**: Comprehensive console logging for debugging
- **Performance**: Processes users sequentially to avoid API rate limits

### 📊 **Response Format**
```json
{
  "success": true,
  "message": "Successfully processed 2 notifications",
  "processed": 2,
  "results": [
    {
      "userId": "user-uuid",
      "userEmail": "user@example.com", 
      "messageId": "message-uuid",
      "success": true
    }
  ]
}
```

## Database Tables Used

### **customer_users**
- Fields: `id`, `email`, `notification_enabled`, `notification_time`, `timezone`
- Purpose: Identify users ready for notifications

### **motivational_messages** 
- Fields: `id`, `content`, `category`, `status`
- Purpose: Source of motivational content (status='active')

### **user_message_history**
- Fields: `customer_id`, `message_id`, `sent_at`
- Purpose: Track successfully delivered notifications

## OneSignal Configuration
- Uses environment variables: `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`
- Sends web push notifications with title "🌟 Your Daily Motivation"
- Uses `user.id` as external user ID for targeting
- High priority notifications with 24-hour TTL

## Cron-job.org Setup
**URL**: `https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron`
**Method**: POST
**Headers**: 
```
Content-Type: application/json
Authorization: Bearer [SUPABASE_ANON_KEY]
```

## Testing
To test the function manually:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/public-cron
```

The function is now deployed and ready for automated daily notifications! 🎉
