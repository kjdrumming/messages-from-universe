import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { NotificationSchedule, CreateNotificationSchedule, UpdateNotificationSchedule } from '../types/notification-schedules';
import { NotificationScheduleService } from '../services/notification-schedule.service';

export const useNotificationSchedules = (customerId: string | null) => {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load schedules for the customer
  const loadSchedules = async () => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await NotificationScheduleService.getSchedules(customerId);
      setSchedules(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notification schedules';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create a new schedule
  const createSchedule = async (schedule: Omit<CreateNotificationSchedule, 'customer_id'>) => {
    if (!customerId) return;

    try {
      const newSchedule = await NotificationScheduleService.createSchedule({
        ...schedule,
        customer_id: customerId
      });
      
      setSchedules(prev => [...prev, newSchedule]);
      toast.success('Notification schedule created successfully');
      return newSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create notification schedule';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing schedule
  const updateSchedule = async (scheduleId: string, updates: UpdateNotificationSchedule) => {
    try {
      const updatedSchedule = await NotificationScheduleService.updateSchedule(scheduleId, updates);
      
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? updatedSchedule : schedule
      ));
      
      toast.success('Notification schedule updated successfully');
      return updatedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification schedule';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a schedule
  const deleteSchedule = async (scheduleId: string) => {
    try {
      await NotificationScheduleService.deleteSchedule(scheduleId);
      
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
      toast.success('Notification schedule deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification schedule';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Toggle schedule active status
  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const updatedSchedule = await NotificationScheduleService.toggleSchedule(scheduleId, isActive);
      
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? updatedSchedule : schedule
      ));
      
      toast.success(`Notification schedule ${isActive ? 'enabled' : 'disabled'}`);
      return updatedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle notification schedule';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Load schedules when customer changes
  useEffect(() => {
    loadSchedules();
  }, [customerId]); // loadSchedules is stable, no need to include it

  return {
    schedules,
    loading,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    refreshSchedules: loadSchedules
  };
};
