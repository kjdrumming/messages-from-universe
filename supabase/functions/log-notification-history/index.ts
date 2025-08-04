import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface HistoryLogRequest {
  customer_id: string;
  message_id: string;
  notification_id?: string;
  delivery_method?: string;
  recipients_count?: number;
  success: boolean;
  error_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📝 History logging function triggered...');
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const requestData: HistoryLogRequest = await req.json();
    console.log('📊 Received history log request:', JSON.stringify(requestData, null, 2));

    // Validate required fields
    if (!requestData.customer_id || !requestData.message_id) {
      console.error('❌ Missing required fields: customer_id or message_id');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: customer_id and message_id are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only log successful notifications
    if (!requestData.success) {
      console.log('⚠️ Notification failed, not logging to history');
      return new Response(JSON.stringify({
        success: true,
        message: 'Notification failed, history not logged',
        logged: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create history record with only the columns that exist in the table
    const historyRecord = {
      customer_id: requestData.customer_id,
      message_id: requestData.message_id,
      sent_at: new Date().toISOString()
    };

    console.log('💾 Inserting history record:', JSON.stringify(historyRecord, null, 2));

    // Insert into user_message_history
    const { data, error } = await supabase
      .from('user_message_history')
      .insert(historyRecord)
      .select();

    if (error) {
      console.error('❌ Failed to insert history record:', error);
      return new Response(JSON.stringify({
        success: false,
        error: `Database error: ${error.message}`,
        logged: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ History record inserted successfully:', data);

    return new Response(JSON.stringify({
      success: true,
      message: 'History record logged successfully',
      logged: true,
      record_id: data[0]?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 History logging function failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Function error: ${error.message}`,
      logged: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
