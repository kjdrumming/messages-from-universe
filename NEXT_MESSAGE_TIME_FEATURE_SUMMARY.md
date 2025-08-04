# Next Message Time Feature Implementation

## Overview
We've implemented a dynamic next message time system that calculates when each customer will receive their next message based on their individual notification schedules.

## Database Changes

### New Column
- Added `next_message_time` (TIMESTAMP WITH TIME ZONE) to `customer_users` table
- Added performance index for querying next message times

### Functions Created

1. **`calculate_next_message_time(customer_user_id UUID)`**
   - Calculates the next scheduled message time for a specific customer
   - Considers customer's timezone and all active notification schedules
   - Returns the earliest upcoming message time across all schedules

2. **`update_all_next_message_times()`**
   - Updates next_message_time for all customers with notifications enabled
   - Clears next_message_time for customers with notifications disabled
   - Returns count of updated customers

3. **`get_formatted_next_message_time(customer_user_id UUID)`**
   - Returns a formatted string representation of the next message time
   - Handles cases where no messages are scheduled

### Triggers Implemented

1. **Notification Schedules Trigger**
   - Automatically updates customer's next_message_time when schedules are added/updated/deleted
   - Ensures real-time accuracy when schedule changes occur

2. **Customer Settings Trigger**
   - Updates next_message_time when notification_enabled or timezone changes
   - Prevents infinite recursion during updates

## Frontend Changes

### TypeScript Interface
- Updated `CustomerUser` interface to include `next_message_time?: string`

### CustomerApp Component
- Added `nextMessageTime` state variable
- Created `formatNextMessageTime()` helper function for user-friendly display
- Updated message display to show calculated next message time instead of hardcoded time

### Display Logic
The next message time is displayed as:
- "Today at HH:MM" for today's messages
- "Tomorrow at HH:MM" for tomorrow's messages  
- "MMM DD at HH:MM" for future dates
- "No messages scheduled" when no schedules exist

## Benefits

1. **Accuracy**: Shows actual next message time based on customer's schedules
2. **Real-time Updates**: Automatically recalculates when schedules change
3. **Timezone Aware**: Displays times in customer's local timezone
4. **Performance**: Indexed column for efficient querying
5. **User Experience**: Clear, contextual messaging about when to expect messages

## Database Migration Steps

1. Copy the content of `NEXT_MESSAGE_TIME_IMPLEMENTATION.sql`
2. Paste it into your Supabase SQL Editor
3. Execute the script
4. Verify the implementation with the provided verification queries

## Testing

The script includes verification queries to:
- Confirm the new column was added
- View next message times for all customers
- Check distribution of message scheduling status
- Test the helper functions

## Usage in Code

```typescript
// The next message time is automatically loaded with customer profile
const nextTime = customerProfile.next_message_time;

// Display formatted time
const displayText = formatNextMessageTime(nextTime);
```

## Automatic Maintenance

The system is fully automated:
- ✅ Updates when schedules change
- ✅ Updates when notification settings change
- ✅ Handles timezone changes
- ✅ Clears times for disabled notifications
- ✅ Performance optimized with indexes

This implementation provides accurate, real-time next message scheduling information that enhances the user experience significantly!
