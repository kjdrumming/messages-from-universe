// Mobile Safari auth fix
import { supabase } from './supabase';

export async function handleMobileAuth() {
  try {
    console.log('🔍 Mobile auth handler starting...');
    
    // Wait a bit for mobile browsers to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to get session multiple times with delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔍 Auth attempt ${attempt}/3`);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        console.log('✅ Session found on attempt', attempt);
        return { session: data.session, error: null };
      }
      
      if (error) {
        console.error(`❌ Auth attempt ${attempt} error:`, error);
      }
      
      // Wait before retry
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return { session: null, error: new Error('No session found after 3 attempts') };
  } catch (error) {
    console.error('Mobile auth handler error:', error);
    return { session: null, error };
  }
}
