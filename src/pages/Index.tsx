import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CustomerApp from '@/components/CustomerApp';
import AdminApp from '@/components/AdminApp';
import UnifiedLogin from '@/components/UnifiedLogin';
import AdminLogin from '@/components/AdminLogin';
import AdminRegister from '@/components/AdminRegister';
import UnifiedPortalSelection from '@/components/UnifiedPortalSelection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, Sparkles } from 'lucide-react';
import { auth, type AuthUser } from '@/lib/auth';
import { toast } from 'sonner';

interface CheckEmailProps {
  email: string;
  userType: 'customer' | 'admin';
  onBackToLogin: () => void;
}

const CheckEmailPage = ({ email, userType, onBackToLogin }: CheckEmailProps) => {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    const result = await auth.sendMagicLink(email, userType);
    
    if (result.success) {
      toast.success('Email sent again! Please check your inbox.');
    } else {
      toast.error(result.message);
    }
    setIsResending(false);
  };

  const isCustomer = userType === 'customer';
  
  const gradientClass = isCustomer ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600';
  const borderClass = isCustomer ? 'border-blue-300' : 'border-purple-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className={`shadow-xl border-2 ${borderClass}`}>
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${gradientClass} rounded-full flex items-center justify-center mb-4`}>
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className={`text-2xl ${isCustomer ? 'text-blue-600' : 'text-purple-600'}`}>
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base">
              We've sent you a secure sign-in link
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="text-center space-y-3">
              <p className="text-gray-700">
                We've sent a magic link to:
              </p>
              <p className="font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
                {email}
              </p>
              <p className="text-sm text-gray-600">
                Click the link to access your {userType === 'customer' ? 'Universe Receiver' : 'Universe Messenger'} account
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full"
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Resend Email'}
              </Button>
              
              <Button
                onClick={onBackToLogin}
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>

            <div className="text-center">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-600">
                  Didn't receive the email? Check your spam folder or try again with a different email address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<'login' | 'admin-login' | 'admin-register' | 'check-email' | 'portal-selection' | 'customer' | 'admin'>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkEmailData, setCheckEmailData] = useState<{
    email: string;
    userType: 'customer' | 'admin';
  } | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 Index: Starting auth initialization...');
        
        // Add timeout to auth check to prevent hanging
        const authTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        );
        
        let user = null;
        try {
          user = await Promise.race([auth.getCurrentUser(), authTimeout]);
          console.log('✅ Index: Auth check completed:', user);
        } catch (authError) {
          console.warn('⚠️ Index: Auth check failed (non-blocking):', authError);
          // Continue without user if auth fails
        }
        
        setCurrentUser(user);
        
        // Handle URL parameters only if user is currently authenticated
        const portal = searchParams.get('portal');
        
        if (user && portal) {
          // User is logged in and URL specifies portal
          if (portal === 'customer' && user.userTypes.includes('customer')) {
            setCurrentView('customer');
          } else if (portal === 'admin' && user.userTypes.includes('admin')) {
            setCurrentView('admin');
          } else {
            // User doesn't have access to requested portal
            toast.error(`You don't have access to the ${portal} portal`);
            // Default to their available portal
            if (user.userTypes.includes('customer')) {
              setCurrentView('customer');
              setSearchParams({ portal: 'customer' });
            } else if (user.userTypes.includes('admin')) {
              setCurrentView('admin');
              setSearchParams({ portal: 'admin' });
            } else {
              setCurrentView('login');
              setSearchParams({});
            }
          }
        } else if (user) {
          // User is logged in but no portal specified
          if (user.userTypes.length === 1) {
            // User has only one type, auto-navigate
            const userType = user.userTypes[0];
            setCurrentView(userType);
            setSearchParams({ portal: userType });
          } else if (user.userTypes.length > 1) {
            // User has multiple types, show portal selection
            setCurrentView('portal-selection');
          } else {
            // No user types found, show login
            setCurrentView('login');
            setSearchParams({});
          }
        } else {
          // No user logged in - show login
          setCurrentView('login');
          setSearchParams({});
        }
        
        console.log('✅ Index: Auth initialization complete');
      } catch (error) {
        console.error('❌ Index: Auth initialization error:', error);
        setCurrentView('login');
        setSearchParams({});
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes
    const authListener = auth.onAuthStateChange((user) => {
      console.log('🔐 Index: Auth state changed:', user);
      setCurrentUser(user);
      if (!user) {
        setCurrentView('login');
        setSearchParams({});
      }
    });

    initializeAuth();

    return () => authListener.data.subscription.unsubscribe();
  }, [searchParams, setSearchParams]);

  const handleBackToLogin = () => {
    setCurrentView('login');
    setCheckEmailData(null);
    setSearchParams({});
  };

  const handleCheckEmail = (email: string, userType: 'customer' | 'admin') => {
    setCheckEmailData({ email, userType });
    setCurrentView('check-email');
  };

  const handleAdminLogin = () => {
    setCurrentView('admin-login');
  };

  const handleAdminRegister = () => {
    setCurrentView('admin-register');
  };

  const handleSelectPortal = (portal: 'customer' | 'admin') => {
    setCurrentView(portal);
    setSearchParams({ portal });
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setCurrentView('login');
      setSearchParams({});
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Checking your authentication status...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'customer') {
    return <CustomerApp onBack={handleBackToLogin} />;
  }

  if (currentView === 'admin') {
    return <AdminApp onBack={handleBackToLogin} />;
  }

  if (currentView === 'check-email' && checkEmailData) {
    return (
      <CheckEmailPage
        email={checkEmailData.email}
        userType={checkEmailData.userType}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  if (currentView === 'admin-register') {
    return (
      <AdminRegister
        onCheckEmail={handleCheckEmail}
        onBack={handleBackToLogin}
      />
    );
  }

  if (currentView === 'admin-login') {
    return (
      <AdminLogin
        onCheckEmail={handleCheckEmail}
        onBack={handleBackToLogin}
      />
    );
  }

  if (currentView === 'portal-selection' && currentUser) {
    const userName = currentUser.email.split('@')[0];
    return (
      <UnifiedPortalSelection
        userName={userName}
        onSelectPortal={handleSelectPortal}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <UnifiedLogin
      onCheckEmail={handleCheckEmail}
      onAdminRegister={handleAdminRegister}
      onAdminLogin={handleAdminLogin}
    />
  );
};

export default Index;
