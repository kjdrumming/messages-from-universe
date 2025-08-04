import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // This endpoint is public - no auth required for external cron services
  try {
    console.log('🕐 Public cron endpoint triggered')
    
    // Get the Supabase function URL and service role key from environment
    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-scheduled-notifications`
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('📞 Calling internal notification function...')
    
    // Call the notification function with proper service role authentication
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'public-cron' })
    })
    
    const result = await response.json()
    
    console.log('📧 Notification function result:', result)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Public cron trigger executed successfully',
        timestamp: new Date().toISOString(),
        notificationResult: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('❌ Public cron trigger error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
