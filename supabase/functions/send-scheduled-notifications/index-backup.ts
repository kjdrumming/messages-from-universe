/// <reference path="./types.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

// 📤 Send OneSignal Notification
async function sendOneSignalWebPush(userId, userEmail, message) {
  const appId = Deno.env.get("ONESIGNAL_APP_ID");
  const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

  if (!appId || !apiKey) {
      console.error('⚠️ OneSignal credentials not configured');
      return { success: false, error: 'OneSignal credentials not configured' };
    }
    
    console.log(`🔔 Sending OneSignal notification to user: ${userEmail} (ID: ${userId})`);
    
    // Create personalized message
    const personalizedMessage = `Hello, ${userEmail}! ${message}`;
    console.log(`💌 Personalized message: "${personalizedMessage.substring(0, 100)}..."`);
    
    // Method 1: External User ID targeting
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [userId],
        headings: { en: "🌟 Your Daily Motivation" },
        contents: { en: personalizedMessage },
        web_url: "https://localhost:8080",
        priority: 10,
        ttl: 86400
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ OneSignal API Response:`, JSON.stringify(result, null, 2));
      
      const recipients = result.recipients || 0;
      const errors = result.errors || [];
      
      if (recipients > 0) {
        console.log(`🎯 Successfully sent to ${recipients} recipient(s) via External User ID`);
        return { 
          success: true, 
          recipients: recipients,
          notificationId: result.id,
          details: `Sent to ${recipients} recipients via External User ID`
        };
      } else {
        console.log(`⚠️ External User ID method failed. Errors:`, errors);
        
        // Method 2: Try email targeting as fallback
        console.log(`🔄 Trying email targeting for ${userEmail}...`);
        
        const emailResponse = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            app_id: appId,
            include_email_tokens: [userEmail],
            headings: { en: "🌟 Your Daily Motivation" },
            contents: { en: message },
            web_url: "https://localhost:8080",
            priority: 10,
            ttl: 86400
          })
        });
        
        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log(`✅ Email targeting response:`, JSON.stringify(emailResult, null, 2));
          
          const emailRecipients = emailResult.recipients || 0;
          if (emailRecipients > 0) {
            console.log(`🎯 Successfully sent to ${emailRecipients} recipient(s) via email`);
            return { 
              success: true, 
              recipients: emailRecipients,
              notificationId: emailResult.id,
              details: `Sent to ${emailRecipients} recipients via email targeting`
            };
          }
        }
        
        return { 
          success: false, 
          error: `No recipients found. External User ID errors: ${JSON.stringify(errors)}`,
          recipients: 0
        };
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ OneSignal API error (${response.status}): ${errorText}`);
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${errorText}`,
        httpStatus: response.status
      };
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
    const timeDiff = currentTotalMinutes - prefTotalMinutes;
    
    console.log(`⏰ User timezone: ${userTimezone}, Current: ${currentHour}:${currentMinute.toString().padStart(2, '0')}, Preferred: ${prefHour}:${prefMinute.toString().padStart(2, '0')}, Diff: ${timeDiff}min`);
    
    // Only trigger at EXACTLY the scheduled time (no grace period)
    const shouldTrigger = timeDiff === 0;
    console.log(`🎯 Time check result: ${shouldTrigger} (timeDiff must be exactly 0, got ${timeDiff})`);
    
    return shouldTrigger;
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
      .select('id, email, name, notification_enabled, notification_time, timezone')
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
      console.log(`🔍 Message ID type: ${typeof randomMessage.id}, value: ${randomMessage.id}`);

      // Step 4: Send OneSignal web push notification
      const notificationResult = await sendOneSignalWebPush(user.id, user.email, randomMessage.content);

      // Step 5: If successful AND has recipients, update user_message_history
      let historyRecorded = false;
      let historyError: string | null = null;
      
      if (notificationResult.success && notificationResult.recipients && notificationResult.recipients > 0) {
        console.log(`📝 Recording successful notification in history for ${user.email} (${notificationResult.recipients} recipients)`);
        
        const historyRecord = {
          customer_id: user.id,
          message_id: randomMessage.id.toString(), // Ensure it's a string/UUID
          sent_at: new Date().toISOString()
        };
        
        console.log(`🔍 History record to insert:`, JSON.stringify(historyRecord, null, 2));
        console.log(`🔍 Data types - customer_id: ${typeof user.id}, message_id: ${typeof randomMessage.id}`);
        
        const { error: dbError } = await supabase
          .from('user_message_history')
          .insert(historyRecord);

        if (dbError) {
          console.error(`⚠️ Failed to record message history for ${user.email}:`, dbError);
          historyError = dbError.message;
          // Don't fail the whole process, just log the error
        } else {
          console.log(`✅ Message history recorded for ${user.email} - delivered to ${notificationResult.recipients} recipients`);
          historyRecorded = true;
        }
      } else if (notificationResult.success && (!notificationResult.recipients || notificationResult.recipients === 0)) {
        console.log(`⚠️ Notification marked as success but 0 recipients - not recording history for ${user.email}`);
      } else {
        console.log(`❌ Notification failed for ${user.email} - not recording history. Error: ${notificationResult.error}`);
      }

      results.push({
        userId: user.id,
        userEmail: user.email,
        messageId: randomMessage.id,
        success: notificationResult.success,
        recipients: notificationResult.recipients || 0,
        historyRecorded: historyRecorded,
        error: notificationResult.error || historyError || undefined
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
