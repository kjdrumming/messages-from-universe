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
    console.log('🧪 Testing notification system...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get request body for optional parameters
    const body = await req.json().catch(() => ({}))
    const { userId, userEmail, forceAll = false } = body

    let query = supabase
      .from('customer_users')
      .select('*')
      .eq('notification_enabled', true)

    // If userId provided, test specific user
    if (userId) {
      query = query.eq('id', userId)
    } else if (userEmail) {
      query = query.eq('email', userEmail)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      throw usersError
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No users found with notifications enabled',
          users: 0
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
      throw messagesError
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No active messages found',
          messages: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const testResults = []

    for (const user of users) {
      const userLocalTime = new Date().toLocaleString("en-US", {
        timeZone: user.timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      const randomMessage = messages[Math.floor(Math.random() * messages.length)]

      // For testing, we'll either force send or check time
      let shouldSend = forceAll
      
      if (!forceAll) {
        const [userHour, userMinute] = userLocalTime.split(':').map(Number)
        const [prefHour, prefMinute] = user.notification_time.split(':').map(Number)
        const timeDiff = Math.abs((userHour * 60 + userMinute) - (prefHour * 60 + prefMinute))
        shouldSend = timeDiff <= 5 // 5-minute window for testing
      }

      const testResult = {
        userId: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        preferredTime: user.notification_time,
        currentLocalTime: userLocalTime,
        shouldSend,
        message: shouldSend ? {
          id: randomMessage.id,
          content: randomMessage.content,
          category: randomMessage.category
        } : null
      }

      if (shouldSend) {
        // Record the test message
        const { error: insertError } = await supabase
          .from('user_message_history')
          .insert({
            customer_id: user.id,
            message_id: randomMessage.id
          })

        if (insertError) {
          testResult.error = insertError.message
        } else {
          testResult.recorded = true
        }
      }

      testResults.push(testResult)
    }

    const sentCount = testResults.filter(r => r.shouldSend && !r.error).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test completed. ${sentCount} notifications would be sent.`,
        totalUsers: users.length,
        totalMessages: messages.length,
        sentCount,
        forceAll,
        results: testResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Test function error:', error)
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
