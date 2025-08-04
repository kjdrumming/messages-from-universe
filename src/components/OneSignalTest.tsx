import { useState, useEffect } from 'react';
import { subscribeUserToOneSignal, getOneSignalSubscription } from '@/lib/oneSignal';

const OneSignalTest = () => {
  const [status, setStatus] = useState<{
    available: boolean;
    subscribed?: boolean;
    userId?: string;
    error?: string;
    subscription?: {
      isSubscribed: boolean;
      userId?: string;
      playerId?: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      console.log('🔍 Checking OneSignal status...');
      
      // Check if OneSignal is available
      const isAvailable = !!window.OneSignal;
      console.log('OneSignal available:', isAvailable);
      
      if (isAvailable) {
        // Get subscription status
        const subscription = await getOneSignalSubscription();
        console.log('Subscription status:', subscription);
        
        setStatus({
          available: true,
          subscription
        });
      } else {
        setStatus({
          available: false,
          error: 'OneSignal not loaded'
        });
      }
    } catch (error) {
      console.error('Error checking OneSignal status:', error);
      setStatus({
        available: false,
        error: error.message
      });
    }
  };

  const testSubscription = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing subscription flow...');
      const result = await subscribeUserToOneSignal('test-user-123', 'test@example.com');
      console.log('Subscription result:', result);
      
      // Refresh status
      await checkStatus();
    } catch (error) {
      console.error('Subscription test error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait a bit for OneSignal to initialize, then check status
    setTimeout(checkStatus, 2000);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>OneSignal Debug Panel</h4>
      
      <button onClick={checkStatus} style={{ marginRight: '5px', fontSize: '10px' }}>
        Check Status
      </button>
      
      <button 
        onClick={testSubscription} 
        disabled={loading}
        style={{ fontSize: '10px' }}
      >
        {loading ? 'Testing...' : 'Test Subscribe'}
      </button>
      
      {status && (
        <div style={{ marginTop: '10px', fontSize: '10px' }}>
          <strong>Status:</strong><br/>
          Available: {status.available ? '✅' : '❌'}<br/>
          
          {status.subscription && (
            <>
              Subscribed: {status.subscription.isSubscribed ? '✅' : '❌'}<br/>
              User ID: {status.subscription.userId || 'None'}<br/>
              Token: {status.subscription.playerId ? '✅' : '❌'}
            </>
          )}
          
          {status.error && (
            <div style={{ color: 'red' }}>
              Error: {status.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OneSignalTest;
