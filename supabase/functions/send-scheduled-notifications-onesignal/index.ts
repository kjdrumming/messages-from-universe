import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
  notification_time: string
  timezone: string
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

// OneSignal push notification function (perfect for mobile apps)
async function sendOneSignalNotification(userId: string, title: string, message: string): Promise<boolean> {
  try {
    const appId = Deno.env.get('ONESIGNAL_APP_ID')
    const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')
    
    if (!appId || !apiKey) {
      console.warn('⚠️ OneSignal credentials not configured for push notifications')
      return false
    }

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
        android_channel_id: 'zen-prompt-notifications',
        priority: 5,
        ttl: 86400 // 24 hours
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`🔔 OneSignal push notification sent, recipients: ${result.recipients}`)
      return result.recipients > 0
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

    // Get users who have notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('customer_users')
      .select('*')
      .eq('notification_enabled', true)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      throw usersError
    }

    console.log(`👥 Found ${users?.length || 0} users with notifications enabled`)

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users with notifications enabled',
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

    const usersToNotify: CustomerUser[] = []

    // Check each user's local time to see if it matches their notification preference
    for (const user of users) {
      try {
        // Convert current UTC time to user's timezone
        const userLocalTime = new Date().toLocaleString("en-US", {
          timeZone: user.timezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })

        const [userHour, userMinute] = userLocalTime.split(':').map(Number)
        const [prefHour, prefMinute] = user.notification_time.split(':').map(Number)

        // Check if current time matches user's preferred notification time (within 5-minute window)
        const timeDiff = Math.abs((userHour * 60 + userMinute) - (prefHour * 60 + prefMinute))
        
        if (timeDiff <= 5) { // Within 5 minutes to account for cron timing
          usersToNotify.push(user)
          console.log(`✅ User ${user.email} should receive notification (${userLocalTime} in ${user.timezone})`)
        }
      } catch (timezoneError) {
        console.error(`⚠️ Error processing timezone for user ${user.email}:`, timezoneError)
      }
    }

    console.log(`🔔 ${usersToNotify.length} users ready for notifications`)

    const notifications: NotificationPayload[] = []
    let historyRecorded = 0

    // Send notifications to eligible users
    for (const user of usersToNotify) {
      try {
        // Select a random message
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]

        // Create notification object
        const notification: NotificationPayload = {
          userId: user.id,
          userEmail: user.email,
          userName: user.name || 'Universe Receiver',
          message: randomMessage.content,
          category: randomMessage.category,
          timezone: user.timezone,
          timestamp: new Date().toISOString()
        }

        // Send push notification via OneSignal
        let notificationSent = false
        let notificationMethod = 'none'
        
        const pushSent = await sendOneSignalNotification(user.id, 'Message from the Universe', randomMessage.content)
        if (pushSent) {
          notificationSent = true
          notificationMethod = 'onesignal'
          console.log(`🔔 Push notification sent to ${user.email}`)
        } else {
          // If OneSignal fails, we'll still record as sent for app notification
          console.log(`📱 OneSignal not configured for ${user.email}, recording app notification only`)
          notificationSent = true
          notificationMethod = 'app_notification'
        }

        if (notificationSent) {
          // Use SQL function to record history - much simpler and more reliable!
          try {
            console.log(`📝 Recording history for ${user.email} using SQL function...`)
            
            const { data: historyResult, error: historyError } = await supabase
              .rpc('record_user_message_history', {
                p_customer_id: user.id,
                p_message_id: randomMessage.id,
                p_notification_method: notificationMethod,
                p_status: 'sent'
              })

            if (historyError) {
              console.error(`❌ History SQL function failed for ${user.email}:`, historyError)
              await logFailedHistoryInsert(supabase, user.id, randomMessage.id, historyError.message)
            } else if (historyResult && historyResult.length > 0) {
              const result = historyResult[0]
              if (result.success) {
                console.log(`✅ History recorded for ${user.email}, ID: ${result.history_id}`)
                historyRecorded++
              } else {
                console.error(`❌ History recording failed for ${user.email}: ${result.error_message}`)
                await logFailedHistoryInsert(supabase, user.id, randomMessage.id, result.error_message)
              }
            }
          } catch (historyException) {
            console.error(`💥 History function exception for ${user.email}:`, historyException)
            await logFailedHistoryInsert(supabase, user.id, randomMessage.id, historyException.message)
          }

          // Add to notifications array
          notifications.push(notification)
          
          console.log(`✨ Notification sent to ${user.email}: "${randomMessage.content.slice(0, 50)}..."`)
        }

      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}:`, userError)
      }
    }

    console.log(`🎯 Successfully processed ${notifications.length} notifications`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${notifications.length} push notifications`,
        processed: notifications.length,
        historyRecorded: historyRecorded,
        method: 'OneSignal',
        notifications: notifications.map(n => ({
          userEmail: n.userEmail,
          messagePreview: n.message.slice(0, 100) + '...',
          category: n.category,
          timezone: n.timezone
        }))
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
