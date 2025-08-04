import React, { useState } from 'react';
import { Plus, Clock, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { useNotificationSchedules } from '../hooks/useNotificationSchedules';
import { NotificationSchedule } from '../types/notification-schedules';

interface NotificationSchedulesManagerProps {
  customerId: string;
  timezone: string;
  onTimezoneChange: (timezone: string) => Promise<void>;
  onScheduleUpdate?: () => void;
}

interface ScheduleFormData {
  notification_time: string;
  timezone: string;
  label: string;
  is_active: boolean;
}

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
];

export const NotificationSchedulesManager: React.FC<NotificationSchedulesManagerProps> = ({
  customerId,
  timezone,
  onTimezoneChange,
  onScheduleUpdate
}) => {
  const { schedules, loading, createSchedule, updateSchedule, deleteSchedule, toggleSchedule } = 
    useNotificationSchedules(customerId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<NotificationSchedule | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    notification_time: '09:00',
    timezone: timezone,
    label: '',
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      notification_time: '09:00',
      timezone: timezone,
      label: '',
      is_active: true
    });
    setEditingSchedule(null);
  };

  const handleCreateSchedule = async () => {
    try {
      await createSchedule({
        notification_time: formData.notification_time,
        timezone: formData.timezone,
        label: formData.label || undefined,
        is_active: formData.is_active
      });
      
      resetForm();
      setIsCreateDialogOpen(false);
      
      // Notify parent component to refresh
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    try {
      await updateSchedule(editingSchedule.id, {
        notification_time: formData.notification_time,
        timezone: formData.timezone,
        label: formData.label || undefined,
        is_active: formData.is_active
      });
      
      resetForm();
      
      // Notify parent component to refresh
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  };

  const startEditing = (schedule: NotificationSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      notification_time: schedule.notification_time,
      timezone: schedule.timezone,
      label: schedule.label || '',
      is_active: schedule.is_active
    });
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      await toggleSchedule(scheduleId, isActive);
      // Notify parent component to refresh
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId);
      // Notify parent component to refresh
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Clock className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading notification schedules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Notification Schedules
          </CardTitle>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notification Schedule</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="time">Notification Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.notification_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, notification_time: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="label">Label (Optional)</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Morning motivation, Evening reflection"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="active">Enable this schedule</Label>
                </div>
                
                <Button onClick={handleCreateSchedule} className="w-full">
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notification schedules yet.</p>
            <p className="text-sm">Create your first schedule to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">
                        {formatTime(schedule.notification_time)}
                      </span>
                      {schedule.label && (
                        <Badge variant="outline" className="text-xs">
                          {schedule.label}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {schedule.timezone.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleSchedule(schedule.id, !schedule.is_active)}
                  >
                    {schedule.is_active ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditing(schedule)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Notification Schedule</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-time">Notification Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.notification_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, notification_time: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-timezone">Timezone</Label>
                <Select 
                  value={formData.timezone} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-label">Label (Optional)</Label>
                <Input
                  id="edit-label"
                  placeholder="e.g., Morning motivation, Evening reflection"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="edit-active">Enable this schedule</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleUpdateSchedule} className="flex-1">
                  Update Schedule
                </Button>
                <Button variant="outline" onClick={() => setEditingSchedule(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
