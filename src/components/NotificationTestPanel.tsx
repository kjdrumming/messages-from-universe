import { NotificationButton } from './NotificationButton';
import { Button } from '@/components/ui/button';
import { showNotificationPopup } from '@/lib/oneSignal';
import { toast } from 'sonner';

export const NotificationTestPanel = () => {
  const testNotificationPopup = async () => {
    console.log('🧪 Testing notification popup...');
    const result = await showNotificationPopup();
    
    if (result.success) {
      if (result.alreadyGranted) {
        toast.success('✅ Notifications already enabled!');
      } else {
        toast.success('🎉 Notification permission granted!');
      }
    } else {
      toast.error(`❌ Failed: ${result.error}`);
    }
  };

  const checkNotificationStatus = () => {
    const permission = Notification.permission;
    const isSupported = 'Notification' in window;
    
    toast.info(`
      📱 Notification Status:
      • Supported: ${isSupported ? 'Yes' : 'No'}
      • Permission: ${permission}
      • Browser: ${navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}
    `);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-3">🔔 Notification Testing</h3>
      <div className="space-y-2">
        <NotificationButton 
          variant="default" 
          size="sm"
          onSuccess={() => console.log('✅ Notification button success!')}
          onError={(error) => console.log('❌ Notification button error:', error)}
        />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testNotificationPopup}
          className="w-full"
        >
          🧪 Test Popup Directly
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={checkNotificationStatus}
          className="w-full"
        >
          📊 Check Status
        </Button>
      </div>
    </div>
  );
};
