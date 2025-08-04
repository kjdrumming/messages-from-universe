import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔧 Admin notification management...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json().catch(() => ({}))
    const { action, ...params } = body

    switch (action) {
      case 'stats':
        return await getNotificationStats(supabase)
      
      case 'send-now':
        return await sendImmediateNotification(supabase, params)
      
      case 'test-user':
        return await testUserNotification(supabase, params)
      
      case 'history':
        return await getNotificationHistory(supabase, params)
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid action. Available: stats, send-now, test-user, history' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('❌ Admin function error:', error)
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

async function getNotificationStats(supabase: any) {
  // Get user stats
  const { data: totalUsers } = await supabase
    .from('customer_users')
    .select('id', { count: 'exact' })

  const { data: enabledUsers } = await supabase
    .from('customer_users')
    .select('id', { count: 'exact' })
    .eq('notification_enabled', true)

  // Get message stats
  const { data: totalMessages } = await supabase
    .from('motivational_messages')
    .select('id', { count: 'exact' })

  const { data: activeMessages } = await supabase
    .from('motivational_messages')
    .select('id', { count: 'exact' })
    .eq('status', 'active')

  // Get today's notification count
  const today = new Date().toISOString().split('T')[0]
  const { data: todayNotifications } = await supabase
    .from('user_message_history')
    .select('id', { count: 'exact' })
    .gte('sent_at', `${today}T00:00:00.000Z`)
    .lt('sent_at', `${today}T23:59:59.999Z`)

  return new Response(
    JSON.stringify({
      success: true,
      stats: {
        users: {
          total: totalUsers?.length || 0,
          enabled: enabledUsers?.length || 0
        },
        messages: {
          total: totalMessages?.length || 0,
          active: activeMessages?.length || 0
        },
        notifications: {
          today: todayNotifications?.length || 0
        }
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendImmediateNotification(supabase: any, params: any) {
  const { userIds, messageId } = params

  if (!userIds || !Array.isArray(userIds)) {
    return new Response(
      JSON.stringify({ success: false, error: 'userIds array required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get message or random active message
  let message
  if (messageId) {
    const { data, error } = await supabase
      .from('motivational_messages')
      .select('*')
      .eq('id', messageId)
      .eq('status', 'active')
      .single()
    
    if (error) throw error
    message = data
  } else {
    const { data, error } = await supabase
      .from('motivational_messages')
      .select('*')
      .eq('status', 'active')
    
    if (error) throw error
    if (!data || data.length === 0) throw new Error('No active messages found')
    message = data[Math.floor(Math.random() * data.length)]
  }

  const results = []
  for (const userId of userIds) {
    try {
      const { error } = await supabase
        .from('user_message_history')
        .insert({
          customer_id: userId,
          message_id: message.id
        })

      results.push({
        userId,
        success: !error,
        error: error?.message
      })
    } catch (err) {
      results.push({
        userId,
        success: false,
        error: err.message
      })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Sent notifications to ${results.filter(r => r.success).length} users`,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function testUserNotification(supabase: any, params: any) {
  const { userId } = params

  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: 'userId required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get user details
  const { data: user, error: userError } = await supabase
    .from('customer_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const userLocalTime = new Date().toLocaleString("en-US", {
    timeZone: user.timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return new Response(
    JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        notificationEnabled: user.notification_enabled,
        preferredTime: user.notification_time,
        timezone: user.timezone,
        currentLocalTime: userLocalTime
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getNotificationHistory(supabase: any, params: any) {
  const { userId, limit = 50, offset = 0 } = params

  let query = supabase
    .from('user_message_history')
    .select(`
      id,
      sent_at,
      customer_users(email, name),
      motivational_messages(content, category)
    `)
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userId) {
    query = query.eq('customer_id', userId)
  }

  const { data, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify({
      success: true,
      history: data,
      pagination: {
        limit,
        offset,
        count: data?.length || 0
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
