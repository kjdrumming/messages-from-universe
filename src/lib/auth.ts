import { supabase } from './supabase'
import { toast } from 'sonner'
import { subscribeUserToOneSignal, switchOneSignalUser, setOneSignalUserId } from './oneSignal'

export interface AuthUser {
  id: string
  email: string
  userTypes: ('customer' | 'admin')[] // Can be both
}

export interface UserProfile {
  isCustomer: boolean
  isAdmin: boolean
  customerProfile?: any
  adminProfile?: any
}

// Unified Authentication System
export const auth = {
  // Send magic link (works for both new and existing users)
  async sendMagicLink(email: string, userType: 'customer' | 'admin'): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?portal=${userType}`,
          data: {
            requested_user_type: userType // Store which portal they're trying to access
          }
        }
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { 
        success: true, 
        message: 'Check your email for the magic link to sign in!' 
      }
    } catch (error) {
      console.error('Magic link error:', error)
      return { success: false, message: 'Failed to send magic link. Please try again.' }
    }
  },

  // Get current authenticated user with their profiles
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) return null

      // Get user profiles to determine types
      const userProfile = await this.getUserProfile(user.id)
      
      const userTypes: ('customer' | 'admin')[] = []
      if (userProfile.isCustomer) userTypes.push('customer')
      if (userProfile.isAdmin) userTypes.push('admin')

      const authUser = {
        id: user.id,
        email: user.email!,
        userTypes
      }

      // 🔔 Link existing customer users to OneSignal (but don't prompt again)
      // Wrapped in timeout to prevent hanging
      if (userProfile.isCustomer && userProfile.customerProfile) {
        try {
          const oneSignalPromise = setOneSignalUserId(userProfile.customerProfile.id);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OneSignal timeout')), 3000)
          );
          
          await Promise.race([oneSignalPromise, timeoutPromise]);
        } catch (oneSignalError) {
          console.warn('OneSignal linking failed (non-blocking):', oneSignalError);
          // Don't block auth flow if OneSignal fails
        }
      }

      return authUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },

  // Get user profile information
  async getUserProfile(authUserId: string): Promise<UserProfile> {
    try {
      // Check for customer profile
      const { data: customerData } = await supabase
        .from('customer_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      // Check for admin profile
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      return {
        isCustomer: !!customerData,
        isAdmin: !!adminData,
        customerProfile: customerData,
        adminProfile: adminData
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return {
        isCustomer: false,
        isAdmin: false
      }
    }
  },

  // Create customer profile
  async createCustomerProfile(authUserId: string, email: string, name?: string) {
    try {
      const { data, error } = await supabase
        .from('customer_users')
        .insert({
          auth_user_id: authUserId,
          email,
          name: name || email.split('@')[0]
        })
        .select()
        .single()

      if (error) throw error

      // 🔔 Subscribe user to OneSignal notifications
      try {
        const subscriptionResult = await subscribeUserToOneSignal(data.id, email);
        if (subscriptionResult.success) {
          if (subscriptionResult.isNewSubscription) {
            toast.success('🔔 You\'ll receive daily zen messages!');
          } else {
            toast.success('🔔 Linked to existing notifications on this device!');
          }
        } else if (subscriptionResult.error === 'Permission denied') {
          toast.info('You can enable notifications later in your settings');
        }
      } catch (oneSignalError) {
        console.warn('OneSignal subscription failed:', oneSignalError);
        // Don't throw - profile creation should still succeed
      }

      return data
    } catch (error) {
      console.error('Error creating customer profile:', error)
      throw error
    }
  },

  // Create admin profile
  async createAdminProfile(authUserId: string, email: string, name?: string) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          auth_user_id: authUserId,
          email,
          name: name || email.split('@')[0],
          role: 'admin'
        })
        .select()
        .single()

      if (error) throw error

      // 🔔 Subscribe admin to OneSignal notifications
      try {
        const subscriptionResult = await subscribeUserToOneSignal(data.id, email);
        if (subscriptionResult.success) {
          if (subscriptionResult.isNewSubscription) {
            toast.success('🔔 Admin notifications enabled!');
          } else {
            toast.success('🔔 Linked to existing notifications on this device!');
          }
        } else if (subscriptionResult.error === 'Permission denied') {
          toast.info('You can enable notifications later in your settings');
        }
      } catch (oneSignalError) {
        console.warn('OneSignal subscription failed for admin:', oneSignalError);
        // Don't throw - profile creation should still succeed
      }

      return data
    } catch (error) {
      console.error('Error creating admin profile:', error)
      throw error
    }
  },

  // Check what user types exist for an email
  async checkUserByEmail(email: string): Promise<{ hasCustomer: boolean; hasAdmin: boolean }> {
    try {
      // Check for customer profile
      const { data: customerData, error: customerError } = await supabase
        .from('customer_users')
        .select('id')
        .eq('email', email)
        .single()

      // Check for admin profile  
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .single()

      // Log errors for debugging (but don't fail completely)
      if (customerError && customerError.code !== 'PGRST116') {
        console.error('Customer query error:', customerError)
      }
      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin query error:', adminError)
      }

      const result = {
        hasCustomer: !!customerData,
        hasAdmin: !!adminData
      }

      console.log('checkUserByEmail result for', email, ':', result)

      return result
    } catch (error) {
      console.error('Error checking user by email:', error)
      return {
        hasCustomer: false,
        hasAdmin: false
      }
    }
  },

  // Send unified magic link for users with multiple account types
  async sendUnifiedMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?portal=unified`,
          data: {
            requested_user_type: 'unified' // Special flag for unified login
          }
        }
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { 
        success: true, 
        message: 'Check your email for the magic link to access your accounts!' 
      }
    } catch (error) {
      console.error('Unified magic link error:', error)
      return { success: false, message: 'Failed to send magic link. Please try again.' }
    }
  },

  // Sign out user
  async signOut(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return { success: false, message: 'Failed to sign out' }
      }
      toast.success('Signed out successfully')
      return { success: true, message: 'Signed out successfully' }
    } catch (error) {
      console.error('Sign out failed:', error)
      return { success: false, message: 'Sign out failed' }
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          // Add timeout to prevent hanging
          const userTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('getCurrentUser timeout in auth listener')), 3000)
          );
          
          const user = await Promise.race([this.getCurrentUser(), userTimeout]);
          callback(user);
        } else {
          callback(null);
        }
      } catch (error) {
        console.warn('Auth state change error (non-blocking):', error);
        callback(null);
      }
    });
  }
}
