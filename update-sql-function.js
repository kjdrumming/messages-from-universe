// Update SQL function to remove duplicate restrictions
const { createClient } = require('@supabase/supabase-js');

// Note: These should match your .env values for VITE_SUPABASE_URL and a service role key
const supabaseUrl = 'https://yrrxbcsoqwamukarkzqa.supabase.co';
// You'll need to get the service role key from Supabase Dashboard > Settings > API
const supabaseServiceKey = 'REPLACE_WITH_SERVICE_ROLE_KEY'; // Get this from Supabase dashboard

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSqlFunction() {
  console.log('🔄 Updating SQL function to remove duplicate restrictions...');
  
  const sqlQuery = `
CREATE OR REPLACE FUNCTION record_user_message_history(
    p_customer_id UUID,
    p_message_id UUID,
    p_notification_method TEXT DEFAULT 'app_notification',
    p_status TEXT DEFAULT 'sent'
)
RETURNS TABLE(
    success BOOLEAN,
    history_id UUID,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_history_id UUID;
    v_error_message TEXT := NULL;
BEGIN
    -- Validate inputs
    IF p_customer_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Customer ID cannot be null'::TEXT;
        RETURN;
    END IF;

    IF p_message_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Message ID cannot be null'::TEXT;
        RETURN;
    END IF;

    -- Check if customer exists
    IF NOT EXISTS (SELECT 1 FROM customer_users WHERE id = p_customer_id) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Customer not found'::TEXT;
        RETURN;
    END IF;

    -- Check if message exists
    IF NOT EXISTS (SELECT 1 FROM motivational_messages WHERE id = p_message_id) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Message not found'::TEXT;
        RETURN;
    END IF;

    -- REMOVED: Duplicate prevention check - allows multiple messages per day per user

    -- Insert the history record
    BEGIN
        INSERT INTO user_message_history (
            customer_id,
            message_id,
            sent_at,
            notification_method,
            status
        ) VALUES (
            p_customer_id,
            p_message_id,
            NOW(),
            p_notification_method,
            p_status
        )
        RETURNING id INTO v_history_id;

        -- Return success
        RETURN QUERY SELECT TRUE, v_history_id, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
        -- Capture any insertion errors
        v_error_message := SQLERRM;
        RETURN QUERY SELECT FALSE, NULL::UUID, v_error_message;
    END;
END;
$$;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlQuery });
    
    if (error) {
      console.error('❌ Error updating SQL function:', error);
      
      // Try alternative approach using direct SQL execution
      const { data: data2, error: error2 } = await supabase
        .from('pg_stat_user_functions') // This will fail but might give us better error info
        .select('*')
        .limit(1);
        
      console.log('Alternative approach error:', error2);
    } else {
      console.log('✅ SQL function updated successfully!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
    console.log('\n📝 Manual SQL to run in Supabase SQL Editor:');
    console.log(sqlQuery);
  }
}

updateSqlFunction();
