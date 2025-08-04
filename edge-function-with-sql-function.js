// Updated edge function code using SQL function for history recording
// Replace the batch history recording section with this simpler approach

// After successful notification sending, replace the entire batch insert section with this:

if (notificationSent) {
  // Use SQL function to record history - much simpler!
  try {
    const { data: historyResult, error: historyError } = await supabase
      .rpc('record_user_message_history', {
        p_customer_id: user.id,
        p_message_id: randomMessage.id,
        p_notification_method: notificationMethod,
        p_status: 'sent'
      })

    if (historyError) {
      console.error(`❌ History function failed for ${user.email}:`, historyError)
      await logFailedHistoryInsert(supabase, user.id, randomMessage.id, historyError.message)
    } else if (historyResult && historyResult.length > 0) {
      const result = historyResult[0]
      if (result.success) {
        console.log(`✅ History recorded for ${user.email}, ID: ${result.history_id}`)
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

// ALTERNATIVE: If you want to use the simpler version without validation:
/*
if (notificationSent) {
  try {
    const { data: historyId, error: historyError } = await supabase
      .rpc('record_user_message_history_simple', {
        p_customer_id: user.id,
        p_message_id: randomMessage.id,
        p_notification_method: notificationMethod
      })

    if (historyError) {
      console.error(`❌ History recording failed for ${user.email}:`, historyError)
      await logFailedHistoryInsert(supabase, user.id, randomMessage.id, historyError.message)
    } else {
      console.log(`✅ History recorded for ${user.email}, ID: ${historyId}`)
    }
  } catch (historyException) {
    console.error(`💥 History exception for ${user.email}:`, historyException)
    await logFailedHistoryInsert(supabase, user.id, randomMessage.id, historyException.message)
  }

  notifications.push(notification)
  console.log(`✨ Notification sent to ${user.email}: "${randomMessage.content.slice(0, 50)}..."`)
}
*/
