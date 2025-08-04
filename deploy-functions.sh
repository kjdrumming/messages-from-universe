#!/bin/bash

# Deploy Edge Functions for Messages from the Universe
# Make sure you have Supabase CLI installed and are logged in

echo "🌌 Deploying Messages from the Universe Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory or config.toml not found"
    echo "Run 'supabase init' or 'supabase link --project-ref YOUR_PROJECT_REF' first"
    exit 1
fi

echo "📡 Deploying send-scheduled-notifications function..."
supabase functions deploy send-scheduled-notifications

if [ $? -eq 0 ]; then
    echo "✅ send-scheduled-notifications deployed successfully"
else
    echo "❌ Failed to deploy send-scheduled-notifications"
    exit 1
fi

echo "🔄 Deploying cron-trigger function..."
supabase functions deploy cron-trigger

if [ $? -eq 0 ]; then
    echo "✅ cron-trigger deployed successfully"
else
    echo "❌ Failed to deploy cron-trigger"
    exit 1
fi

echo ""
echo "🎉 All edge functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Supabase Dashboard > Settings > Edge Functions:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY" 
echo "   - SUPABASE_ANON_KEY"
echo ""
echo "2. Set up a cron job to call the cron-trigger function every minute"
echo "   URL: https://YOUR_PROJECT.supabase.co/functions/v1/cron-trigger"
echo ""
echo "3. Test the functions manually using the URLs provided in EDGE_FUNCTIONS_SETUP.md"
echo ""
echo "✨ Happy cosmic messaging! ✨"
