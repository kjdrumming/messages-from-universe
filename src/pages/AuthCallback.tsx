import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('⏰ Auth callback timeout - redirecting home');
        toast.error('Authentication is taking too long. Please try again.');
        navigate('/');
      }, 15000); // 15 second timeout

      try {
        console.log('🔍 Auth callback starting...');
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
        console.log('🔍 URL hash:', window.location.hash);
        console.log('🔍 User agent:', navigator.userAgent);

        // Show progress to user
        toast.info('Processing authentication...');

        // Check if we have tokens in the URL (mobile Safari sometimes needs this)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        
        console.log('🔍 URL tokens found:', { 
          hasRefresh: !!refreshToken, 
          hasAccess: !!accessToken,
          searchLength: window.location.search.length,
          hashLength: window.location.hash.length
        });

        // If we have tokens in URL, set the session first
        if (refreshToken && accessToken) {
          console.log('🔍 Setting session from URL tokens...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error('❌ Failed to set session from URL:', sessionError);
            toast.error(`Session error: ${sessionError.message}`);
            navigate('/');
            return;
          }
          
          console.log('✅ Session set from URL tokens successfully');
        }

        // Now try to get the current session
        const { data, error } = await supabase.auth.getSession();
        console.log('🔍 getSession result:', { data, error });
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          toast.error(`Auth error: ${error.message}`);
          
          // Try to get session from URL if getSession failed
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
          const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
          
          console.log('🔍 URL tokens:', { refreshToken: !!refreshToken, accessToken: !!accessToken });
          
          if (refreshToken && accessToken) {
            console.log('🔍 Trying to set session from URL params...');
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error('❌ Failed to set session:', sessionError);
              toast.error(`Session error: ${sessionError.message}`);
              navigate('/');
              return;
            }
            
            console.log('✅ Session set successfully:', sessionData);
          } else {
            toast.error('No auth tokens found in URL. Please try again.');
            navigate('/');
            return;
          }
        }

        // Get the latest session
        const { data: currentSession } = await supabase.auth.getSession();
        console.log('🔍 Current session:', currentSession);
        console.log('🔍 Session user:', currentSession.session?.user);
        console.log('🔍 User ID:', currentSession.session?.user?.id);
        console.log('🔍 User email:', currentSession.session?.user?.email);

        if (currentSession.session && currentSession.session.user) {
          const user = currentSession.session.user;
          
          // Get portal from URL parameter (from magic link redirect)
          const portalFromUrl = searchParams.get('portal') as 'customer' | 'admin' | 'unified' | null;
          // Also check user metadata as fallback
          const requestedUserType = portalFromUrl || user.user_metadata?.requested_user_type;
          
          console.log('User authenticated:', user.email);
          console.log('Portal from URL:', portalFromUrl);
          console.log('Requested user type from metadata:', user.user_metadata?.requested_user_type);
          console.log('Final portal selection:', requestedUserType);
          
          // Get user's current profiles
          console.log('🔍 Getting user profile for ID:', user.id);
          const userProfile = await auth.getUserProfile(user.id);
          console.log('🔍 User profile result:', userProfile);
          
          // Handle the requested user type
          if (requestedUserType === 'unified') {
            // User clicked unified login link - they should have both account types
            if (userProfile.isCustomer && userProfile.isAdmin) {
              toast.success('Welcome back! Please select your portal.');
              navigate('/?portal=unified');
            } else if (userProfile.isCustomer && !userProfile.isAdmin) {
              // Create admin profile for existing customer
              await auth.createAdminProfile(user.id, user.email!);
              toast.success('Admin access granted! You now have both Universe Receiver and Messenger accounts.');
              navigate('/?portal=unified');
            } else if (!userProfile.isCustomer && userProfile.isAdmin) {
              // Create customer profile for existing admin
              await auth.createCustomerProfile(user.id, user.email!);
              toast.success('Universe Receiver access granted! You now have both accounts.');
              navigate('/?portal=unified');
            } else {
              // New user from unified link - shouldn't happen but create customer by default
              await auth.createCustomerProfile(user.id, user.email!);
              toast.success('Welcome! Your universe receiver account has been created.');
              navigate('/?portal=customer');
            }
          } else if (requestedUserType === 'customer') {
            if (!userProfile.isCustomer) {
              // Create customer profile if it doesn't exist
              console.log('Creating customer profile...');
              const { data: newProfile, error } = await supabase
                .from('customer_users')
                .insert({
                  auth_user_id: user.id,
                  email: user.email!,
                  name: user.email!.split('@')[0]
                })
                .select()
                .single();

              if (error) {
                console.error('Failed to create customer profile:', error);
                toast.error('Failed to create your account. Please try again.');
                navigate('/');
                return;
              }
              
              toast.success('Welcome! Your universe receiver account has been created.');
            } else {
              toast.success('Welcome back to your universe receiver!');
            }
            navigate('/?portal=customer');
          } else if (requestedUserType === 'admin') {
            if (!userProfile.isAdmin) {
              // Create admin profile if it doesn't exist
              console.log('Creating admin profile...');
              await auth.createAdminProfile(user.id, user.email!);
              toast.success('Welcome! Your universe messenger account has been created.');
            } else {
              toast.success('Welcome back, Universe Messenger!');
            }
            navigate('/?portal=admin');
          } else {
            // Fallback: determine based on existing profiles
            if (userProfile.isCustomer && userProfile.isAdmin) {
              // User is both - show selection
              toast.success('Welcome back! Please select your portal.');
              navigate('/');
            } else if (userProfile.isCustomer) {
              navigate('/?portal=customer');
            } else if (userProfile.isAdmin) {
              navigate('/?portal=admin');
            } else {
              // New user, default to customer
              const { data: newProfile, error } = await supabase
                .from('customer_users')
                .insert({
                  auth_user_id: user.id,
                  email: user.email!,
                  name: user.email!.split('@')[0]
                })
                .select()
                .single();

              if (error) {
                console.error('Failed to create customer profile:', error);
                toast.error('Failed to create your account. Please try again.');
                navigate('/');
                return;
              }
              
              toast.success('Welcome! Your account has been created.');
              navigate('/?portal=customer');
            }
          }
        } else {
          toast.error('No session found. Please try signing in again.');
          navigate('/');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        toast.error('Something went wrong. Please try again.');
        navigate('/');
      } finally {
        // Clear the timeout since we're done
        clearTimeout(timeoutId);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Completing Sign In...</h2>
        <p className="text-gray-600">Please wait while we verify your authentication.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
