import { supabase } from '../lib/supabase';
import { withSessionCheck } from '../lib/session-manager';
import { 
  NotificationSchedule, 
  CreateNotificationSchedule, 
  UpdateNotificationSchedule 
} from '../types/notification-schedules';

export class NotificationScheduleService {
  
  // Get all schedules for a customer
  static async getSchedules(customerId: string): Promise<NotificationSchedule[]> {
    return withSessionCheck(async () => {
      const { data, error } = await supabase
        .from('notification_schedules')
        .select('*')
        .eq('customer_id', customerId)
        .order('notification_time');

      if (error) throw error;
      return data || [];
    });
  }

  // Create a new notification schedule
  static async createSchedule(schedule: CreateNotificationSchedule): Promise<NotificationSchedule> {
    return withSessionCheck(async () => {
      const { data, error } = await supabase
        .from('notification_schedules')
        .insert(schedule)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  // Update an existing schedule
  static async updateSchedule(
    scheduleId: string, 
    updates: UpdateNotificationSchedule
  ): Promise<NotificationSchedule> {
    return withSessionCheck(async () => {
      const { data, error } = await supabase
        .from('notification_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }

  // Delete a schedule
  static async deleteSchedule(scheduleId: string): Promise<void> {
    return withSessionCheck(async () => {
      const { error } = await supabase
        .from('notification_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
    });
  }

  // Toggle schedule active status
  static async toggleSchedule(scheduleId: string, isActive: boolean): Promise<NotificationSchedule> {
    return this.updateSchedule(scheduleId, { is_active: isActive });
  }

  // Get active schedules for a customer
  static async getActiveSchedules(customerId: string): Promise<NotificationSchedule[]> {
    const { data, error } = await supabase
      .from('notification_schedules')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .order('notification_time');

    if (error) throw error;
    return data || [];
  }
}
