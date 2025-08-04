#!/bin/bash

echo "🧪 Testing Edge Function Manually..."

# REPLACE THIS WITH FRESH API KEY FROM SUPABASE DASHBOARD
# Go to: https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/settings/api
# Copy the "anon public" key and replace the line below:
ANON_KEY="PASTE_YOUR_FRESH_ANON_KEY_HERE"

if [ "$ANON_KEY" = "PASTE_YOUR_FRESH_ANON_KEY_HERE" ]; then
    echo "❌ Please update the ANON_KEY in this script!"
    echo "1. Go to: https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/settings/api"
    echo "2. Copy the 'anon public' key"
    echo "3. Replace ANON_KEY in this script"
    exit 1
fi

# Get current time
echo "⏰ Current time: $(date)"

# Test the cron-trigger function (this calls send-scheduled-notifications)
echo ""
echo "🔄 Testing cron-trigger function..."
curl -X POST 'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/cron-trigger' \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H 'Content-Type: application/json' \
  | jq '.'

echo ""
echo "📧 Testing send-scheduled-notifications directly..."
curl -X POST 'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications' \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H 'Content-Type: application/json' \
  | jq '.'

echo ""
echo "✅ Manual test completed!"
