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

  try {
    console.log('🔄 Cron trigger activated from external service')
    
    // Get the Supabase function URL
    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-scheduled-notifications`
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    console.log('📞 Calling notification function with service role key...')
    
    // Call the notification function with service role key
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'cron' })
    })
    
    const result = await response.json()
    
    console.log('📧 Notification function result:', result)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cron trigger executed successfully',
        notificationResult: result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('❌ Cron trigger error:', error)
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
