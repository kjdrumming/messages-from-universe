import { supabase } from './supabase';

// Session management utilities
export class SessionManager {
  private static refreshTimer: NodeJS.Timeout | null = null;

  // Initialize session management
  static async initialize() {
    console.log('🔄 Initializing session management...');
    
    // Set up automatic session refresh
    this.setupAutoRefresh();
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in, session expires at:', new Date(session.expires_at! * 1000));
        this.setupAutoRefresh();
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        this.clearAutoRefresh();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔄 Token refreshed, new expiry:', new Date(session.expires_at! * 1000));
      }
    });

    // Check if we have an existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session && !error) {
      console.log('🔍 Found existing session, expires at:', new Date(session.expires_at! * 1000));
      this.setupAutoRefresh();
    }
  }

  // Set up automatic token refresh
  private static setupAutoRefresh() {
    this.clearAutoRefresh();
    
    // Refresh token every 50 minutes (tokens expire after 1 hour)
    this.refreshTimer = setInterval(async () => {
      console.log('🔄 Auto-refreshing session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ Failed to refresh session:', error);
      } else {
        console.log('✅ Session refreshed successfully');
      }
    }, 50 * 60 * 1000); // 50 minutes in milliseconds
  }

  // Clear auto refresh timer
  private static clearAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Check if session is still valid
  static async checkSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('❌ No valid session found');
        return false;
      }

      // Check if session is close to expiring (within 5 minutes)
      const expiresAt = session.expires_at! * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
        console.log('⚠️ Session expiring soon, refreshing...');
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('❌ Failed to refresh expiring session:', refreshError);
          return false;
        }
        
        console.log('✅ Session refreshed preemptively');
      }

      return true;
    } catch (error) {
      console.error('❌ Session check failed:', error);
      return false;
    }
  }

  // Force refresh the current session
  static async refreshSession(): Promise<boolean> {
    try {
      console.log('🔄 Manually refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Manual session refresh failed:', error);
        return false;
      }
      
      console.log('✅ Manual session refresh successful');
      return true;
    } catch (error) {
      console.error('❌ Manual session refresh error:', error);
      return false;
    }
  }

  // Handle user logout
  static logout() {
    console.log('🚪 SessionManager: Cleaning up on logout');
    this.clearAutoRefresh();
  }
}

// Enhanced database operation wrapper with session validation
export const withSessionCheck = async <T>(operation: () => Promise<T>): Promise<T> => {
  // Check session before operation
  const isValid = await SessionManager.checkSession();
  if (!isValid) {
    throw new Error('Session expired. Please sign in again.');
  }

  try {
    return await operation();
  } catch (error: any) {
    // If we get an auth error, try refreshing session once
    if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
      console.log('🔄 Auth error detected, attempting session refresh...');
      
      const refreshed = await SessionManager.refreshSession();
      if (refreshed) {
        // Retry the operation once
        return await operation();
      }
    }
    
    throw error;
  }
};
