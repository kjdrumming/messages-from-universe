import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Configure Supabase client with persistent sessions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use localStorage for persistent sessions across browser restarts
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Extend session timeouts
    flowType: 'pkce',
    debug: false
  }
})

// Types for our database tables
export interface CustomerUser {
  id: string;
  auth_user_id: string;
  email: string;
  name?: string;
  notification_enabled: boolean;
  notification_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  number_sent: number;
  next_message_time?: string;
}

export interface AdminUser {
  id: string
  auth_user_id: string
  email: string
  name?: string
  role: string
  created_at: string
  updated_at: string
}

export interface MotivationalMessage {
  id: string
  content: string
  category: string
  status: 'active' | 'draft'
  created_by?: string
  created_at: string
  updated_at: string
}
