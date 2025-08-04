#!/bin/bash

# Test script for push notification system
echo "🌌 Testing Messages from the Universe Push Notification System..."

SUPABASE_URL="https://yrrxbcsoqwamukarkzqa.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJrenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTMzODksImV4cCI6MjA2OTU2OTM4OX0.sIX6NYscMPbUhz918TOpNXhSq1G0RueRYPDgb2BPwq4"

echo ""
echo "📊 Getting system statistics..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/admin-notifications" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"action": "stats"}' | jq '.'

echo ""
echo "🧪 Testing push notification system (force mode)..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/test-notifications" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"forceAll": true}' | jq '.'

echo ""
echo "🔄 Testing cron trigger..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/cron-trigger" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "⏰ Testing scheduled notifications directly..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/send-scheduled-notifications" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🏁 Test Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Set FCM_SERVER_KEY in Supabase environment variables"
echo "2. Set up automatic cron job to call /cron-trigger every minute"
echo "3. Ensure users have push_token and notification_enabled=true"
echo "4. Test with real users who have FCM tokens from your mobile app" \
  -d '{"forceAll": true}' | jq '.'

echo ""
echo "🔄 Testing cron trigger..."
curl -s -X POST "${SUPABASE_URL}/functions/v1/cron-trigger" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'

echo ""
echo "✨ Test complete! Check your email for notifications."
echo "📧 Monitor your Resend dashboard for email delivery status."
echo "📊 Check Supabase function logs for detailed execution info."
