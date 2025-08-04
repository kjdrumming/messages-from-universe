import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Smartphone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getOneSignalSubscription, promptForPushNotifications, subscribeUserToOneSignal } from '@/lib/oneSignal';

interface NotificationSetupProps {
  userId: string;
  userEmail: string;
  onComplete?: () => void;
}

export const NotificationSetup = ({ userId, userEmail, onComplete }: NotificationSetupProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isSubscribed: boolean;
    hasPermission: boolean;
    isSupported: boolean;
  } | null>(null);

  const checkNotificationStatus = async () => {
    setIsChecking(true);
    try {
      const subscription = await getOneSignalSubscription();
      const hasPermission = Notification.permission === 'granted';
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
      
      setSubscriptionStatus({
        isSubscribed: subscription.isSubscribed,
        hasPermission,
        isSupported
      });
      
      console.log('🔍 Notification status:', {
        isSubscribed: subscription.isSubscribed,
        hasPermission,
        isSupported,
        permission: Notification.permission
      });
    } catch (error) {
      console.error('Error checking notification status:', error);
      toast.error('Failed to check notification status');
    } finally {
      setIsChecking(false);
    }
  };

  const enableNotifications = async () => {
    setIsSubscribing(true);
    try {
      console.log('🔔 Starting notification setup...');
      
      const result = await subscribeUserToOneSignal(userId, userEmail);
      
      if (result.success) {
        toast.success('🔔 Notifications enabled! You\'ll receive daily zen messages.');
        setSubscriptionStatus(prev => prev ? { ...prev, isSubscribed: true, hasPermission: true } : null);
        onComplete?.();
      } else if (result.error === 'Permission denied') {
        toast.error('Notifications were blocked. You can enable them later in your browser settings.');
      } else {
        toast.error(`Failed to enable notifications: ${result.error}`);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsSubscribing(false);
    }
  };

  const getMobileInstructions = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !isChrome;

    if (isIOS && isSafari) {
      return (
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <p className="font-medium text-blue-900 mb-2">📱 iPhone Safari Instructions:</p>
          <ol className="text-blue-800 space-y-1">
            <li>1. Tap the "Enable Notifications" button below</li>
            <li>2. When prompted, tap "Allow" to enable notifications</li>
            <li>3. If no prompt appears, try refreshing the page</li>
          </ol>
        </div>
      );
    } else if (isAndroid) {
      return (
        <div className="bg-green-50 p-3 rounded-lg text-sm">
          <p className="font-medium text-green-900 mb-2">📱 Android Instructions:</p>
          <ol className="text-green-800 space-y-1">
            <li>1. Tap "Enable Notifications" below</li>
            <li>2. Select "Allow" when prompted</li>
            <li>3. Notifications will appear in your notification panel</li>
          </ol>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-3 rounded-lg text-sm">
        <p className="font-medium text-gray-900 mb-2">💻 Desktop Instructions:</p>
        <p className="text-gray-800">Click "Enable Notifications" and allow when prompted by your browser.</p>
      </div>
    );
  };

  if (subscriptionStatus === null) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Daily Zen Messages
          </CardTitle>
          <CardDescription>
            Get your daily dose of cosmic wisdom delivered right to your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Would you like to receive daily inspirational messages?
            </p>
            <Button 
              onClick={checkNotificationStatus}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? 'Checking...' : 'Check Notification Status'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionStatus.isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support push notifications. You can still enjoy the app without them!
          </p>
          <Button onClick={onComplete} variant="outline" className="w-full">
            Continue Without Notifications
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionStatus.isSubscribed) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Bell className="h-5 w-5" />
            Notifications Enabled!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            🎉 You're all set! You'll receive daily zen messages.
          </p>
          <Button onClick={onComplete} className="w-full">
            Continue to App
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Enable Daily Zen Messages
        </CardTitle>
        <CardDescription>
          Get inspirational messages delivered to your device every day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {getMobileInstructions()}
        
        <div className="text-center space-y-3">
          <Button 
            onClick={enableNotifications}
            disabled={isSubscribing}
            className="w-full"
            size="lg"
          >
            {isSubscribing ? 'Setting up...' : '🔔 Enable Notifications'}
          </Button>
          
          <Button 
            onClick={onComplete}
            variant="ghost"
            className="w-full text-gray-500"
          >
            Skip for now
          </Button>
        </div>

        {!subscriptionStatus.hasPermission && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-yellow-800 text-sm">
              💡 <strong>Tip:</strong> If you don't see a notification prompt, try refreshing the page or check your browser settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
