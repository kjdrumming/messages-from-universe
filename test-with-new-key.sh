#!/bin/bash

echo "🔧 Direct Notification Test (bypassing cron-trigger)..."

# Test different API keys - you'll need to get these from Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/settings/api

echo "🔍 You need to:"
echo "1. Go to https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/settings/api"
echo "2. Copy the 'anon public' key"
echo "3. Replace the ANON_KEY below with that key"
echo ""

# REPLACE THIS WITH YOUR ACTUAL ANON KEY FROM SUPABASE DASHBOARD
ANON_KEY="your_anon_key_here"

if [ "$ANON_KEY" = "your_anon_key_here" ]; then
    echo "❌ Please update the ANON_KEY in this script first!"
    echo "Get it from: https://supabase.com/dashboard/project/yrrxbcsoqwamukarkzqa/settings/api"
    exit 1
fi

echo "⏰ Current time: $(date)"
echo ""

echo "📧 Testing send-scheduled-notifications directly with updated key..."
curl -X POST 'https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications' \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H 'Content-Type: application/json' \
  -v

echo ""
echo "✅ Test completed!"
