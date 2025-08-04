// Edge function for Deno environment - TypeScript module resolution warnings expected
// @ts-nocheck

// Type declarations for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CustomerUser {
  id: string
  email: string
  name: string
  notification_enabled: boolean
  timezone: string
}

interface NotificationSchedule {
  id: string
  customer_id: string
  notification_time: string
  timezone: string
  is_active: boolean
  label?: string
}

interface MotivationalMessage {
  id: string
  content: string
  category: string
}

interface NotificationPayload {
  userId: string
  userEmail: string
  userName: string
  message: string
  category: string
  timezone: string
  timestamp: string
}

// Function to log failed history insert attempts
async function logFailedHistoryInsert(supabase: any, userId: string, messageId: string, errorMessage: string): Promise<void> {
  try {
    console.log(`📝 Logging failed history insert for user ${userId}`)
    // You can either log to a separate audit table or just console log
    // For now, we'll console log, but you could add a database insert here
    console.error(`💾 AUDIT: Failed to record history - User: ${userId}, Message: ${messageId}, Error: ${errorMessage}`)
    
    // Optional: Insert into an audit log table if you have one
    // await supabase.from('user_message_history_audit_log').insert({
    //   operation: 'INSERT',
    //   success: false,
    //   customer_id: userId,
    //   message_id: messageId,
    //   error_message: errorMessage,
    //   timestamp: new Date().toISOString()
    // })
  } catch (auditError) {
    console.error(`❌ Failed to log audit record: ${auditError}`)
  }
}

// Check if current time matches user's notification time
function isNotificationTime(userTimezone: string, userNotificationTime: string): boolean {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const parts = formatter.formatToParts(now)
    const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0')
    const currentMinute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0')
    
    const [prefHour, prefMinute] = userNotificationTime.split(':').map((v) => parseInt(v, 10))
    
    // Check if current time matches exactly (within 1 minute)
    const timeDiff = currentHour * 60 + currentMinute - (prefHour * 60 + prefMinute)
    
    console.log(`🕐 Time check for timezone ${userTimezone}: Current ${currentHour}:${currentMinute.toString().padStart(2, '0')}, Pref ${prefHour}:${prefMinute.toString().padStart(2, '0')}, Diff: ${timeDiff}`)
    
    return timeDiff === 0 // Exact match
  } catch (error) {
    console.error('❌ Time check failed:', error)
    return false
  }
}
async function sendOneSignalNotification(userId: string, title: string, message: string): Promise<boolean> {
  try {
    const appId = Deno.env.get('ONESIGNAL_APP_ID')
    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')
    
    console.log(`🔑 OneSignal credentials check - AppId: ${appId ? 'SET' : 'MISSING'}, ApiKey: ${apiKey ? 'SET' : 'MISSING'}`)
    
    if (!appId || !apiKey) {
      console.warn('⚠️ OneSignal credentials not configured for push notifications')
      return false
    }

    console.log(`📤 Sending OneSignal notification to user ${userId}`)
    
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          app_id: appId,
          include_external_user_ids: [userId], // Use your user ID from database
          headings: { en: title },
          contents: { en: message },
          ios_badgeType: 'Increase',
          ios_badgeCount: 1,
          priority: 5,
          ttl: 86400 // 24 hours
        })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`🔔 OneSignal push notification result:`, result)
      const recipients = result.recipients || 0
      console.log(`🔔 OneSignal push notification sent, recipients: ${recipients}`)
      return recipients > 0
    } else {
      const error = await response.text()
      console.error(`❌ OneSignal push failed: ${error}`)
      return false
    }
  } catch (error) {
    console.error(`❌ OneSignal push error: ${error}`)
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🌌 Starting scheduled notification process...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time in UTC
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentMinute = now.getUTCMinutes()
    
    console.log(`⏰ Current UTC time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`)

    // Get users who have notifications enabled AND their active notification schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('notification_schedules')
      .select(`
        *,
        customer_users!inner (
          id,
          email,
          name,
          notification_enabled
        )
      `)
      .eq('is_active', true)
      .eq('customer_users.notification_enabled', true)

    if (schedulesError) {
      console.error('❌ Error fetching notification schedules:', schedulesError)
      throw schedulesError
    }

    console.log(`� Found ${schedules?.length || 0} active notification schedules`)

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active notification schedules found',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active messages
    const { data: messages, error: messagesError } = await supabase
      .from('motivational_messages')
      .select('*')
      .eq('status', 'active')

    if (messagesError) {
      console.error('❌ Error fetching messages:', messagesError)
      throw messagesError
    }

    if (!messages || messages.length === 0) {
      console.log('📭 No active messages found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active messages to send',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📝 Found ${messages.length} active messages`)

    const results: any[] = []
    let processedCount = 0

    // Process each notification schedule
    for (const schedule of schedules) {
      const user = schedule.customer_users
      console.log(`🔍 Checking schedule for ${user.email} (${schedule.timezone}, ${schedule.notification_time}) - Label: ${schedule.label || 'No label'}`)
      
      // Check if it's time for this specific schedule
      if (!isNotificationTime(schedule.timezone, schedule.notification_time)) {
        console.log(`⏭️ Skipping ${user.email} schedule - not time yet`)
        continue
      }

      console.log(`✅ ${user.email} schedule is ready for notification!`)

      // Select a random message
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      console.log(`📨 Selected message for ${user.email}: "${randomMessage.content.substring(0, 50)}..."`)

      // Send OneSignal notification
      const notificationResult = await sendOneSignalNotification(user.id, 'Message from the Universe', randomMessage.content)
      
      let historyRecorded = false
      let historyError = null

      if (notificationResult) {
        console.log(`� OneSignal notification sent to ${user.email}`)
        
        // Use direct Supabase insert to record history
        try {
          console.log(`📝 Recording history for ${user.email} using direct insert...`)
          
          const { data: historyResult, error: historyInsertError } = await supabase
            .from('user_message_history')
            .insert([
              {
                customer_id: user.id,
                message_id: randomMessage.id,
                notification_method: 'onesignal',
                status: 'sent',
                sent_at: new Date().toISOString()
              }
            ])
            .select()

          if (historyInsertError) {
            console.error(`❌ History insert failed for ${user.email}:`, historyInsertError)
            historyError = historyInsertError.message
            await logFailedHistoryInsert(supabase, user.id, randomMessage.id, historyInsertError.message)
          } else if (historyResult && historyResult.length > 0) {
            console.log(`✅ History recorded for ${user.email}, ID: ${historyResult[0].id}`)
            historyRecorded = true
          }
        } catch (historyException) {
          console.error(`💥 History insert exception for ${user.email}:`, historyException)
          historyError = historyException.message
          await logFailedHistoryInsert(supabase, user.id, randomMessage.id, historyException.message)
        }
      } else {
        console.log(`📱 OneSignal not configured for ${user.email}, recording app notification only`)
        
        // Still try to record as app notification using direct insert
        try {
          const { data: historyResult, error: historyInsertError } = await supabase
            .from('user_message_history')
            .insert([
              {
                customer_id: user.id,
                message_id: randomMessage.id,
                notification_method: 'app_notification',
                status: 'sent',
                sent_at: new Date().toISOString()
              }
            ])
            .select()

          if (historyInsertError) {
            historyError = historyInsertError.message
          } else if (historyResult && historyResult.length > 0) {
            historyRecorded = true
            console.log(`✅ App notification history recorded for ${user.email}`)
          }
        } catch (err) {
          historyError = err.message
        }
      }

      results.push({
        userId: user.id,
        userEmail: user.email,
        scheduleId: schedule.id,
        scheduleLabel: schedule.label,
        notificationTime: schedule.notification_time,
        timezone: schedule.timezone,
        messageId: randomMessage.id,
        success: notificationResult || true, // Consider app notification as success
        recipients: notificationResult || 1,
        historyRecorded,
        error: historyError || undefined
      })

      processedCount++
    }

    console.log(`🎯 Successfully processed ${processedCount} users`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} users`,
        processed: processedCount,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})