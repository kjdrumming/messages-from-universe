# Multiple Notification Schedules Feature

This enhancement allows customers to create multiple notification times per day, edit existing schedules, and delete unwanted ones.

## Database Changes

### New Table: notification_schedules
- Stores multiple notification times per customer
- Replaces the single `notification_time` field in `customer_users`
- Includes timezone per schedule and optional labels

### Migration Steps

1. **Apply the database migration:**
   ```sql
   -- Run the notification-schedules-migration.sql file in your Supabase SQL editor
   ```

2. **Test the migration:**
   ```sql
   -- Run the test-notification-schedules.sql file to verify everything works
   ```

## Frontend Changes

### New Components
- `NotificationSchedulesManager`: Main component for managing schedules
- `useNotificationSchedules`: React hook for schedule operations
- `NotificationScheduleService`: Service layer for database operations

### Updated Components
- `CustomerApp.tsx`: Now uses the new notification schedules manager

## Key Features

### For Customers
- **Multiple Schedules**: Create up to 5 notification times per day
- **Custom Labels**: Optional labels like "Morning motivation", "Evening reflection"
- **Individual Timezones**: Each schedule can have its own timezone
- **Toggle Active/Inactive**: Enable/disable schedules without deleting
- **Edit & Delete**: Full CRUD operations on notification schedules

### For Developers
- **Backward Compatible**: Existing users get their current notification migrated
- **RLS Security**: Proper row-level security policies
- **TypeScript Support**: Full type definitions for all interfaces
- **Error Handling**: Comprehensive error handling and user feedback

## UI Flow

1. **Master Toggle**: Enable/disable all notifications (existing behavior)
2. **Schedules List**: View all notification schedules
3. **Add Schedule**: Create new notification times with optional labels
4. **Edit Schedule**: Modify time, timezone, label, or active status
5. **Delete Schedule**: Remove unwanted schedules
6. **Toggle Individual**: Enable/disable specific schedules

## Edge Function Updates

The `send-scheduled-notifications` edge function has been updated to:
- Query `notification_schedules` instead of `customer_users.notification_time`
- Support multiple schedules per user
- Include schedule information in notifications
- Handle timezone per schedule

## Database Schema

```sql
CREATE TABLE notification_schedules (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customer_users(id),
    notification_time TIME NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    is_active BOOLEAN DEFAULT true,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Usage

### Create Schedule
```typescript
const newSchedule = await NotificationScheduleService.createSchedule({
  customer_id: 'user-id',
  notification_time: '09:00',
  timezone: 'America/New_York',
  label: 'Morning motivation',
  is_active: true
});
```

### Update Schedule
```typescript
await NotificationScheduleService.updateSchedule('schedule-id', {
  notification_time: '10:00',
  label: 'Updated morning time'
});
```

### Delete Schedule
```typescript
await NotificationScheduleService.deleteSchedule('schedule-id');
```

## Testing

1. **Create Test User**: Sign up as a customer
2. **Add Multiple Schedules**: Create 2-3 different notification times
3. **Test Editing**: Modify times, labels, and timezones
4. **Test Toggling**: Enable/disable individual schedules
5. **Test Deletion**: Remove schedules
6. **Test Edge Function**: Verify notifications send at correct times

## Benefits

- **Better User Experience**: Customers can receive multiple daily motivations
- **Flexibility**: Different times for different types of messages
- **Personalization**: Custom labels help organize schedules
- **Scalability**: Easy to add features like message type per schedule
- **Maintainability**: Clean separation of concerns with dedicated table

## Future Enhancements

- **Message Categories per Schedule**: Different message types for different times
- **Recurring Patterns**: Weekly schedules (e.g., weekdays only)
- **Smart Scheduling**: AI-suggested optimal notification times
- **Batch Operations**: Enable/disable all schedules at once
- **Schedule Templates**: Pre-defined schedule sets for different lifestyles
