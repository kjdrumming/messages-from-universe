/// <reference path="./types.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  notification_enabled: boolean;
  notification_time: string;
  timezone: string;
  push_token?: string;
}

interface MotivationalMessage {
  id: string;
  content: string;
  category: string;
  status: string;
}

interface NotificationResult {
  userId: string;
  userEmail: string;
  messageId: string;
  success: boolean;
  error?: string;
}

// Send OneSignal Web Push Notification
async function sendOneSignalWebPush(userId: string, userEmail: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    
    if (!appId || !apiKey) {
      console.error('⚠️ OneSignal credentials not configured');
      return { success: false, error: 'OneSignal credentials not configured' };
    }
    
    console.log(`🔔 Sending OneSignal notification to user: ${userEmail}`);
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [userId], // Using user ID as external user ID
        headings: {
          en: "🌟 Your Daily Motivation"
        },
        contents: {
          en: message
        },
        web_url: "https://localhost:8080", // URL to open when notification is clicked
        priority: 10, // High priority
        ttl: 86400 // 24 hours
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ OneSignal notification sent successfully, recipients: ${result.recipients}`);
      return { success: result.recipients > 0 };
    } else {
      const errorText = await response.text();
      console.error(`❌ OneSignal API error: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`❌ OneSignal request failed: ${error}`);
    return { success: false, error: error.message };
  }
}

// Check if current time matches user's notification time (with timezone)
function isNotificationTime(userTimezone: string, userNotificationTime: string): boolean {
  try {
    const now = new Date();
    
    // Get current time in user's timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(parts.find((part) => part.type === 'hour')?.value || '0');
    const currentMinute = parseInt(parts.find((part) => part.type === 'minute')?.value || '0');
    
    // Parse user's preferred notification time (format: "HH:MM:SS" or "HH:MM")
    const timeParts = userNotificationTime.split(':');
    const prefHour = parseInt(timeParts[0] || '0');
    const prefMinute = parseInt(timeParts[1] || '0');
    
    // Calculate time difference in minutes
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const prefTotalMinutes = prefHour * 60 + prefMinute;
    const timeDiff = Math.abs(currentTotalMinutes - prefTotalMinutes);
    
    console.log(`⏰ User timezone: ${userTimezone}, Current: ${currentHour}:${currentMinute.toString().padStart(2, '0')}, Preferred: ${prefHour}:${prefMinute.toString().padStart(2, '0')}, Diff: ${timeDiff}min`);
    
    // Allow 5-minute window for notification delivery
    return timeDiff <= 5;
  } catch (error) {
    console.error(`❌ Error checking notification time: ${error}`);
    return false;
  }
}

// Main notification processing function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting scheduled notification process...');
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get all users with notifications enabled
    console.log('👥 Fetching users with notifications enabled...');
    const { data: users, error: usersError } = await supabase
      .from('customer_users')
      .select('id, email, name, notification_enabled, notification_time, timezone, push_token')
      .eq('notification_enabled', true);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`📊 Found ${users?.length || 0} users with notifications enabled`);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No users with notifications enabled',
        processed: 0,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Get active motivational messages
    console.log('📝 Fetching active motivational messages...');
    const { data: messages, error: messagesError } = await supabase
      .from('motivational_messages')
      .select('id, content, category')
      .eq('status', 'active');

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError);
      throw messagesError;
    }

    console.log(`📚 Found ${messages?.length || 0} active messages`);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No active motivational messages found',
        processed: 0,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Check each user's time zone and send notifications
    const results: NotificationResult[] = [];
    let processedCount = 0;

    for (const user of users) {
      console.log(`🔍 Processing user: ${user.email}`);
      
      // Check if it's the user's notification time
      if (!isNotificationTime(user.timezone, user.notification_time)) {
        console.log(`⏭️ Skipping ${user.email} - not their notification time`);
        continue;
      }

      console.log(`✅ ${user.email} is ready for notification!`);

      // Select a random message
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      console.log(`📨 Selected message: "${randomMessage.content.substring(0, 50)}..."`);

      // Step 4: Send OneSignal web push notification
      const notificationResult = await sendOneSignalWebPush(user.id, user.email, randomMessage.content);

      // Step 5: If successful, update user_message_history
      if (notificationResult.success) {
        console.log(`📝 Recording successful notification in history for ${user.email}`);
        
        const { error: historyError } = await supabase
          .from('user_message_history')
          .insert({
            customer_id: user.id,
            message_id: randomMessage.id,
            sent_at: new Date().toISOString()
          });

        if (historyError) {
          console.error(`⚠️ Failed to record message history for ${user.email}:`, historyError);
          // Don't fail the whole process, just log the error
        } else {
          console.log(`✅ Message history recorded for ${user.email}`);
        }
      }

      results.push({
        userId: user.id,
        userEmail: user.email,
        messageId: randomMessage.id,
        success: notificationResult.success,
        error: notificationResult.error
      });

      processedCount++;
    }

    console.log(`🎯 Processing complete. Sent ${processedCount} notifications.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${processedCount} notifications`,
      processed: processedCount,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Notification process failed:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Error: ${error.message}`,
      processed: 0,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
