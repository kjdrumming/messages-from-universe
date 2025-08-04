// Notification Schedule Types
export interface NotificationSchedule {
  id: string;
  customer_id: string;
  notification_time: string;
  timezone: string;
  is_active: boolean;
  label?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationSchedule {
  customer_id: string;
  notification_time: string;
  timezone: string;
  is_active?: boolean;
  label?: string;
}

export interface UpdateNotificationSchedule {
  notification_time?: string;
  timezone?: string;
  is_active?: boolean;
  label?: string;
}

export interface NotificationScheduleWithCustomer {
  id: string;
  customer_id: string;
  email: string;
  name: string;
  notification_time: string;
  timezone: string;
  is_active: boolean;
  label?: string;
  created_at: string;
  updated_at: string;
}
