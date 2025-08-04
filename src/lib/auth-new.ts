import { supabase } from './supabase'
import { toast } from 'sonner'

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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

      return {
        id: user.id,
        email: user.email!,
        userTypes
      }
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
      return data
    } catch (error) {
      console.error('Error creating admin profile:', error)
      throw error
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
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}
