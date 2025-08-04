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
}

interface MotivationalMessage {
  id: string;
  content: string;
  category: string;
  status: string;
}

interface NotificationPayload {
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  category: string;
  timezone: string;
  timestamp: string;
}

// OneSignal push notification function (perfect for mobile apps)
async function sendOneSignalNotification(userId: string, title: string, message: string) {
  try {
    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
    
    if (!appId || !apiKey) {
      console.warn('⚠️ OneSignal credentials not configured for push notifications');
      return false;
    }
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [userId],
        headings: {
          en: title
        },
        contents: {
          en: message
        },
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        priority: 10, // High priority for daily motivation
        ttl: 86400 // 24 hours
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`🔔 OneSignal push notification sent, recipients: ${result.recipients}`);
      return result.recipients > 0;
    } else {
      const error = await response.text();
      console.error(`❌ OneSignal push failed: ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ OneSignal push error: ${error}`);
    return false;
  }
}

// Email notification function (fallback)
async function sendEmailNotification(email: string, title: string, message: string) {
  try {
    const emailApiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('EMAIL_API_KEY');
    
    if (!emailApiKey) {
      console.warn('⚠️ Email API key not configured, skipping email notification');
      return false;
    }
    
    // Example using Resend (simple email service)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${emailApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Universe <noreply@yourdomain.com>',
        to: email,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">🌟 ${title}</h2>
            <p style="font-size: 18px; line-height: 1.6; color: #374151;">${message}</p>
            <p style="color: #6b7280; font-size: 14px;">Have a wonderful day! ✨</p>
          </div>
        `
      })
    });
    
    if (response.ok) {
      console.log(`📧 Email notification sent to ${email}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Email notification failed: ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Email notification error: ${error}`);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    console.log('🌌 Starting scheduled notification process...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    console.log(`⏰ Current UTC time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    // Get users who have notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('customer_users')
      .select('*')
      .eq('notification_enabled', true);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`👥 Found ${users?.length || 0} users with notifications enabled`);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No users with notifications enabled',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Get active messages
    const { data: messages, error: messagesError } = await supabase
      .from('motivational_messages')
      .select('*')
      .eq('status', 'active');

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError);
      throw messagesError;
    }

    if (!messages || messages.length === 0) {
      console.log('📭 No active messages found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active messages to send',
        processed: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`📝 Found ${messages.length} active messages`);

    const usersToNotify: CustomerUser[] = [];

    // Check each user's local time to see if it matches their notification preference
    for (const user of users) {
      try {
        // Use more reliable Intl.DateTimeFormat for timezone conversion
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: user.timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const parts = formatter.formatToParts(now);
        const userHour = parseInt(parts.find((part) => part.type === 'hour')?.value || '0');
        const userMinute = parseInt(parts.find((part) => part.type === 'minute')?.value || '0');

        // Parse notification time (format: "HH:MM")
        const [prefHour, prefMinute] = user.notification_time.split(':').map(Number);

        // Check if current time matches user's preferred notification time (within 5-minute window)
        const currentTotalMinutes = userHour * 60 + userMinute;
        const prefTotalMinutes = prefHour * 60 + prefMinute;
        const timeDiff = Math.abs(currentTotalMinutes - prefTotalMinutes);

        console.log(`🔍 User ${user.email}:`);
        console.log(`   Timezone: ${user.timezone}`);
        console.log(`   Local time: ${userHour.toString().padStart(2, '0')}:${userMinute.toString().padStart(2, '0')}`);
        console.log(`   Pref time: ${prefHour.toString().padStart(2, '0')}:${prefMinute.toString().padStart(2, '0')}`);
        console.log(`   Time diff: ${timeDiff} minutes`);

        if (timeDiff <= 5) {
          usersToNotify.push(user);
          console.log(`✅ User ${user.email} should receive notification!`);
        } else {
          console.log(`⏭️ User ${user.email} not in time window (need ≤5 minutes, got ${timeDiff})`);
        }
      } catch (timezoneError) {
        console.error(`⚠️ Error processing timezone for user ${user.email}:`, timezoneError);
      }
    }

    console.log(`🔔 ${usersToNotify.length} users ready for notifications`);

    const notifications: NotificationPayload[] = [];

    // Send notifications to eligible users
    for (const user of usersToNotify) {
      try {
        // Check if user already received a message today
        const today = new Date().toISOString().split('T')[0];
        const { data: todayHistory, error: historyError } = await supabase
          .from('user_message_history')
          .select('id')
          .eq('customer_id', user.id)
          .gte('sent_at', `${today}T00:00:00.000Z`)
          .lt('sent_at', `${today}T23:59:59.999Z`)
          .limit(1);

        if (historyError) {
          console.error(`❌ Error checking history for ${user.email}:`, historyError);
          continue;
        }

        if (todayHistory && todayHistory.length > 0) {
          console.log(`⏭️ User ${user.email} already received a message today`);
          continue;
        }

        // Select a random message
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        // Create notification object
        const notification = {
          userId: user.id,
          userEmail: user.email,
          userName: user.name || 'Universe Receiver',
          message: randomMessage.content,
          category: randomMessage.category,
          timezone: user.timezone,
          timestamp: new Date().toISOString()
        };

        // Try OneSignal push notification first (for mobile apps)
        let notificationSent = false;
        const pushSent = await sendOneSignalNotification(user.id, 'Message from the Universe', randomMessage.content);
        if (pushSent) {
          notificationSent = true;
          console.log(`🔔 Push notification sent to ${user.email}`);
        }

        // Fallback to email if push notification failed
        if (!notificationSent) {
          const emailSent = await sendEmailNotification(user.email, 'Message from the Universe', randomMessage.content);
          if (emailSent) {
            notificationSent = true;
            console.log(`📧 Email notification sent to ${user.email}`);
          }
        }

        if (notificationSent) {
          // Record the message as sent
          const { error: insertError } = await supabase
            .from('user_message_history')
            .insert({
              customer_id: user.id,
              message_id: randomMessage.id
            });

          if (insertError) {
            console.error(`❌ Error recording message history for ${user.email}:`, insertError);
            continue;
          }

          // Add to notifications array
          notifications.push(notification);
          console.log(`✨ Notification sent to ${user.email}: "${randomMessage.content.slice(0, 50)}..."`);
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}:`, userError);
      }
    }

    console.log(`🎯 Successfully processed ${notifications.length} notifications`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${notifications.length} notifications`,
      processed: notifications.length,
      notifications: notifications.map((n) => ({
        userEmail: n.userEmail,
        messagePreview: n.message.slice(0, 100) + '...',
        category: n.category,
        timezone: n.timezone
      }))
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
})
