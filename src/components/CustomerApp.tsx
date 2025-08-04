
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Heart, Sparkles, User, Settings, Mail, Star, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/auth';
import { supabase, type CustomerUser } from '@/lib/supabase';
import { setOneSignalUserId, getOneSignalSubscription } from '@/lib/oneSignal';
import { NotificationSchedulesManager } from './NotificationSchedulesManager';
import { NotificationSetup } from './NotificationSetup';
import { SessionManager, withSessionCheck } from '@/lib/session-manager';

interface CustomerAppProps {
  onBack: () => void;
}

interface TodayMessage {
  id: string;
  content: string;
  category: string;
  sent_at: string;
}

const CustomerApp = ({ onBack }: CustomerAppProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [customerProfile, setCustomerProfile] = useState<CustomerUser | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [userName, setUserName] = useState('');
  const [todayMessage, setTodayMessage] = useState<TodayMessage | null>(null);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [nextMessageTime, setNextMessageTime] = useState<string | null>(null);
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Helper function to format days active display
  const formatDaysActive = (days: number): string => {
    if (days === 0) return '< 1';
    return days.toString();
  };

  // Helper function to format next message time
  const formatNextMessageTime = (nextTime: string | null): string => {
    if (!nextTime) return 'No messages scheduled';
    
    try {
      const messageTime = new Date(nextTime);
      const now = new Date();
      
      // Convert to customer's timezone for comparison and display
      const customerTimezone = timezone || 'America/New_York';
      
      // Format time in customer's timezone with 12-hour format
      const timeString = messageTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: customerTimezone
      });
      
      // Get dates in customer's timezone for comparison
      const messageDateInTZ = messageTime.toLocaleDateString('en-US', { timeZone: customerTimezone });
      const todayDateInTZ = now.toLocaleDateString('en-US', { timeZone: customerTimezone });
      
      // Calculate tomorrow's date in customer's timezone
      const tomorrowInTZ = new Date(now);
      tomorrowInTZ.setDate(tomorrowInTZ.getDate() + 1);
      const tomorrowDateInTZ = tomorrowInTZ.toLocaleDateString('en-US', { timeZone: customerTimezone });
      
      if (messageDateInTZ === todayDateInTZ) {
        return `Today at ${timeString}`;
      } else if (messageDateInTZ === tomorrowDateInTZ) {
        return `Tomorrow at ${timeString}`;
      } else {
        const monthDay = messageTime.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          timeZone: customerTimezone
        });
        return `${monthDay} at ${timeString}`;
      }
    } catch (error) {
      console.error('Error formatting next message time:', error);
      return 'Schedule unavailable';
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Initialize session manager with timeout
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session manager timeout')), 5000)
        );
        
        try {
          await Promise.race([SessionManager.initialize(), sessionTimeout]);
          console.log('✅ Session manager initialized');
        } catch (sessionError) {
          console.warn('⚠️ Session manager failed (non-blocking):', sessionError);
          // Continue without session manager if it fails
        }
        
        // Check auth status after session manager is ready (or failed)
        await checkAuthStatus();
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event);
      if (event === 'SIGNED_IN' && session) {
        await handleAuthSuccess(session.user.id, session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        handleAuthStateSignOut();
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array is intentional - we only want this to run once on mount

  // Real-time update for expired next message times
  useEffect(() => {
    if (!nextMessageTime || !isLoggedIn) return;

    const checkAndUpdateExpiredTime = () => {
      try {
        const messageTime = new Date(nextMessageTime);
        const now = new Date();
        
        // If the scheduled time has passed, refresh the profile to get updated time
        if (messageTime <= now) {
          console.log('🕐 Next message time has passed, refreshing profile...');
          refreshProfile();
        }
      } catch (error) {
        console.error('Error checking expired time:', error);
      }
    };

    // Check immediately
    checkAndUpdateExpiredTime();

    // Set up interval to check every minute
    const interval = setInterval(checkAndUpdateExpiredTime, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [nextMessageTime, isLoggedIn]); // Depend on nextMessageTime and login status

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking auth status...');
      const user = await auth.getCurrentUser();
      console.log('👤 Current user:', user);
      
      if (user && user.userTypes.includes('customer')) {
        console.log('✅ User is authenticated as customer, loading profile...');
        await loadCustomerProfile(user.id);
        setIsLoggedIn(true);
        console.log('✅ Customer profile loaded, user is logged in');
      } else {
        console.log('❌ User not authenticated or not a customer');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  };

  const loadCustomerProfile = async (authUserId: string) => {
    try {
      console.log('🔍 Debug - Loading customer profile for auth user:', authUserId);
      const { data, error } = await supabase
        .from('customer_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      console.log('🔍 Debug - Customer profile result:', { data, error });

      if (error) throw error;

      setCustomerProfile(data);
      setUserName(data.name || data.email.split('@')[0]);
      setNotificationsEnabled(data.notification_enabled);
      setNotificationTime(data.notification_time);
      setTimezone(data.timezone);
      
      // Set message count from the number_sent column
      setMessagesReceived(data.number_sent || 0);
      console.log('✅ Debug - Message count loaded from profile:', data.number_sent || 0);
      
      // Set next message time from the next_message_time column
      setNextMessageTime(data.next_message_time || null);
      console.log('✅ Debug - Next message time loaded from profile:', data.next_message_time || 'No message scheduled');
      
      // Calculate days active since account creation
      const createdDate = new Date(data.created_at);
      const currentDate = new Date();
      const timeDifference = currentDate.getTime() - createdDate.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
      setDaysActive(daysDifference);
      console.log('✅ Debug - Days active calculated:', daysDifference);
      
      console.log('🔍 Debug - About to load today message for customer ID:', data.id);
      // Load today's message
      await loadTodayMessage(data.id);
    } catch (error) {
      console.error('Error loading customer profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const loadTodayMessage = async (customerId: string) => {
    setIsLoadingMessage(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 Debug - Loading today message for customer:', customerId);
      console.log('🔍 Debug - Today date:', today);
      
      const { data, error } = await supabase
        .from('user_message_history')
        .select(`
          id,
          sent_at,
          motivational_messages (
            id,
            content,
            category
          )
        `)
        .eq('customer_id', customerId)
        .gte('sent_at', `${today}T00:00:00.000Z`)
        .lt('sent_at', `${today}T23:59:59.999Z`)
        .order('sent_at', { ascending: false })
        .limit(1);

      console.log('🔍 Debug - Query result:', { data, error });

      if (error) throw error;

      if (data && data.length > 0 && data[0].motivational_messages) {
        const messageData = data[0];
        const messageContent = Array.isArray(messageData.motivational_messages) 
          ? messageData.motivational_messages[0] 
          : messageData.motivational_messages;
        
        console.log('🔍 Debug - Found message:', messageData);
        setTodayMessage({
          id: messageContent.id,
          content: messageContent.content,
          category: messageContent.category,
          sent_at: messageData.sent_at
        });
      } else {
        console.log('🔍 Debug - No message found for today');
        setTodayMessage(null);
      }
    } catch (error) {
      console.error('Error loading today\'s message:', error);
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleAuthSuccess = async (authUserId: string, userEmail: string) => {
    try {
      // Check if customer profile exists
      const { data: existingProfile } = await supabase
        .from('customer_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      let isNewUserFlag = false;
      if (!existingProfile) {
        // Create new customer profile - but DON'T auto-subscribe to notifications
        const { data: newProfile, error } = await supabase
          .from('customer_users')
          .insert({
            auth_user_id: authUserId,
            email: userEmail,
            name: userEmail.split('@')[0]
          })
          .select()
          .single();

        if (error) throw error;
        
        isNewUserFlag = true;
        toast.success('Welcome! Your universe receiver account has been created.');
      } else {
        toast.success('Welcome back to your universe receiver!');
      }

      await loadCustomerProfile(authUserId);
      setIsLoggedIn(true);
      setIsNewUser(isNewUserFlag);

      // Set OneSignal user ID (but don't auto-subscribe)
      try {
        await setOneSignalUserId(authUserId);
        console.log('✅ OneSignal user ID set for customer:', authUserId);
        
        // Check if user already has notifications enabled
        const subscription = await getOneSignalSubscription();
        if (!subscription.isSubscribed && isNewUserFlag) {
          // New user without notifications - show setup
          setShowNotificationSetup(true);
        }
      } catch (oneSignalError) {
        console.warn('⚠️ OneSignal user ID setup failed (non-blocking):', oneSignalError);
        // Still show notification setup for new users
        if (isNewUserFlag) {
          setShowNotificationSetup(true);
        }
      }
    } catch (error) {
      console.error('Error handling auth success:', error);
      toast.error('Failed to complete sign-in');
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 User requesting sign out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out. Please try again.');
        return;
      }
      
      // Clear session data
      SessionManager.logout();
      
      // Reset component state
      setIsLoggedIn(false);
      setCustomerProfile(null);
      setUserName('');
      setEmail('');
      setTodayMessage(null);
      setMessagesReceived(0);
      setDaysActive(0);
      setNextMessageTime(null);
      
      toast.success('You have been signed out successfully');
      console.log('✅ User signed out successfully');
      
      // Redirect to portal selection page
      onBack();
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const handleAuthStateSignOut = () => {
    // This function is called by auth state change handlers only
    // Don't call onBack() here to avoid conflicts with manual signout
    console.log('🔐 Auth state changed to signed out');
    setIsLoggedIn(false);
    setCustomerProfile(null);
    setUserName('');
    setEmail('');
    setTodayMessage(null);
    setMessagesReceived(0);
    setDaysActive(0);
    setNextMessageTime(null);
  };

  const handleCustomerLogin = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    const result = await auth.sendMagicLink(email, 'customer');
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  };

  // For magic link auth, sign-in and registration are the same
  const handleCustomerRegister = async () => {
    await handleCustomerLogin();
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!customerProfile) {
      toast.error('Profile not loaded. Please refresh the page.');
      return;
    }

    try {
      await withSessionCheck(async () => {
        console.log('🔍 Updating notifications for customer:', customerProfile.id);

        const { error } = await supabase
          .from('customer_users')
          .update({ 
            notification_enabled: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerProfile.id);

        if (error) {
          console.error('Update error details:', error);
          throw error;
        }

        setNotificationsEnabled(enabled);
        if (enabled) {
          toast.success('Push notifications enabled! You\'ll receive daily motivation on your device.');
        } else {
          toast.info('Notifications disabled. You can re-enable anytime.');
        }
      });
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      toast.error(`Failed to update notification settings: ${error.message}`);
    }
  };

  const handleTimeChange = async (time: string) => {
    if (!customerProfile) {
      toast.error('Profile not loaded. Please refresh the page.');
      return;
    }

    try {
      // Check auth state before update
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Authentication lost. Please sign in again.');
        return;
      }

      console.log('🔍 Updating time for customer:', customerProfile.id);

      const { error } = await supabase
        .from('customer_users')
        .update({ 
          notification_time: time,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerProfile.id);

      if (error) {
        console.error('Time update error:', error);
        throw error;
      }

      setNotificationTime(time);
      toast.success(`Notification time updated to ${time} (${timezone})`);
    } catch (error) {
      console.error('Error updating time:', error);
      toast.error(`Failed to update notification time: ${error.message}`);
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    if (!customerProfile) {
      toast.error('Profile not loaded. Please refresh the page.');
      return;
    }

    try {
      await withSessionCheck(async () => {
        console.log('🔍 Updating timezone for customer:', customerProfile.id);

        const { error } = await supabase
          .from('customer_users')
          .update({ 
            timezone: newTimezone,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerProfile.id);

        if (error) {
          console.error('Timezone update error:', error);
          throw error;
        }

        setTimezone(newTimezone);
        toast.success(`Timezone updated to ${newTimezone}`);
      });
    } catch (error: any) {
      console.error('Error updating timezone:', error);
      toast.error(`Failed to update timezone: ${error.message}`);
    }
  };

  const refreshProfile = async () => {
    if (!customerProfile) return;
    
    try {
      console.log('🔄 Refreshing customer profile...');
      
      // First, update any expired next message times in the database
      try {
        await supabase.rpc('update_expired_next_message_times');
        console.log('✅ Updated expired next message times');
      } catch (rpcError) {
        console.warn('⚠️ Could not update expired times (non-blocking):', rpcError);
      }
      
      const { data, error } = await supabase
        .from('customer_users')
        .select('*')
        .eq('id', customerProfile.id)
        .single();

      if (error) throw error;

      // Update all the state with fresh data
      setCustomerProfile(data);
      setUserName(data.name || data.email.split('@')[0]);
      setNotificationsEnabled(data.notification_enabled);
      setNotificationTime(data.notification_time);
      setTimezone(data.timezone);
      setMessagesReceived(data.number_sent || 0);
      setNextMessageTime(data.next_message_time || null);
      
      console.log('✅ Profile refreshed - Next message time:', data.next_message_time);
      
      // Recalculate days active
      const createdDate = new Date(data.created_at);
      const currentDate = new Date();
      const timeDifference = currentDate.getTime() - createdDate.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
      setDaysActive(daysDifference);
      
      toast.success('Profile refreshed!');
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast.error('Failed to refresh profile');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">

          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Universe Receiver
              </CardTitle>
              <CardDescription>
                Enter your email to receive a secure sign-in link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email Address</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="Enter your customer email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-blue-200 focus:border-blue-400"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleCustomerLogin} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  disabled={!email || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCustomerRegister}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  disabled={!email || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
              </div>
              
              <div className="text-center mt-4 space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium flex items-center justify-center">
                    <Mail className="w-3 h-3 mr-1" />
                    Passwordless Authentication
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    We'll send you a secure magic link to sign in instantly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show notification setup for new users
  if (showNotificationSetup && customerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <NotificationSetup
          userId={customerProfile.auth_user_id}
          userEmail={customerProfile.email}
          onComplete={() => setShowNotificationSetup(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hello, {userName}!
            </h1>
            <p className="text-gray-600">Ready for some daily motivation?</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <User className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Today's Message from the Universe */}
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Star className="w-6 h-6 mt-1 flex-shrink-0" />
              <div className="flex-1">
                {isLoadingMessage ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-white bg-opacity-20 rounded mb-2"></div>
                    <div className="h-3 bg-white bg-opacity-20 rounded w-1/2"></div>
                  </div>
                ) : todayMessage ? (
                  <>
                    <p className="text-lg font-medium mb-2">
                      "{todayMessage.content}"
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-blue-100 text-sm">- The Universe</p>
                      <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-none">
                        {todayMessage.category}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      No message from the universe today yet...
                    </p>
                    <p className="text-blue-100 text-sm">
                      {notificationsEnabled 
                        ? `Your next message: ${formatNextMessageTime(nextMessageTime)}`
                        : 'Enable notifications to receive your daily cosmic wisdom'
                      }
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Notification Settings */}
        <div className="space-y-4">
          {/* Overall Notifications Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Push Notifications</span>
              </CardTitle>
              <CardDescription>
                Enable or disable all push notifications from the universe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Enable Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Master switch for all notification schedules
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Schedules Manager */}
          {customerProfile && (
            <NotificationSchedulesManager
              customerId={customerProfile.id}
              timezone={timezone}
              onTimezoneChange={handleTimezoneChange}
              onScheduleUpdate={refreshProfile}
            />
          )}
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Motivation Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatDaysActive(daysActive)}</div>
                <div className="text-sm text-gray-600">Days Active</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {messagesReceived}
                </div>
                <div className="text-sm text-gray-600">Messages Received</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerApp;
