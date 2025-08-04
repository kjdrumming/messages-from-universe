import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { showNotificationPopup } from '@/lib/oneSignal';

interface NotificationButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const NotificationButton = ({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  onSuccess,
  onError
}: NotificationButtonProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>(() => {
    if (typeof Notification === 'undefined') return 'unknown';
    return Notification.permission as 'unknown' | 'granted' | 'denied';
  });

  const handleNotificationRequest = async () => {
    setIsRequesting(true);
    
    try {
      const result = await showNotificationPopup();
      
      if (result.success) {
        if (result.alreadyGranted) {
          toast.success('🔔 Notifications are already enabled!');
        } else if (result.justGranted) {
          toast.success('🎉 Notifications enabled! You\'ll receive daily zen messages.');
        }
        setPermissionStatus('granted');
        onSuccess?.();
      } else {
        if (result.error === 'Previously denied - check browser settings') {
          toast.error('Notifications were blocked. Please enable them in your browser settings.');
        } else {
          toast.error(`Failed to enable notifications: ${result.error}`);
        }
        setPermissionStatus('denied');
        onError?.(result.error || 'Permission denied');
      }
    } catch (error) {
      console.error('Error requesting notifications:', error);
      toast.error('Failed to request notification permission');
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRequesting(false);
    }
  };

  const getButtonContent = () => {
    if (isRequesting) {
      return (
        <>
          <BellRing className="w-4 h-4 mr-2 animate-pulse" />
          Requesting...
        </>
      );
    }

    switch (permissionStatus) {
      case 'granted':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            Notifications Enabled
          </>
        );
      case 'denied':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
            Enable in Settings
          </>
        );
      default:
        return (
          <>
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </>
        );
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleNotificationRequest}
      disabled={isRequesting || permissionStatus === 'granted'}
    >
      {getButtonContent()}
    </Button>
  );
};

// Simple hook to check notification permission status
export const useNotificationPermission = () => {
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>(() => {
    if (typeof Notification === 'undefined') return 'unknown';
    return Notification.permission as 'unknown' | 'granted' | 'denied';
  });

  const requestPermission = async () => {
    const result = await showNotificationPopup();
    setPermission(Notification.permission as 'unknown' | 'granted' | 'denied');
    return result;
  };

  return {
    permission,
    isSupported: typeof Notification !== 'undefined',
    requestPermission
  };
};
