#!/bin/bash

echo "🚀 Testing edge function with detailed logging..."

# Get the service role key from environment or prompt
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycnhiY3NvcXdhbXVrYXJremFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTE5NDM3MCwiZXhwIjoyMDUwNzcwMzcwfQ.cJhkJO7jwZkOwZr7kTkWPf7wGgpBXR3qk_x8hfG7xQg"

echo "📡 Triggering edge function..."
curl -X POST "https://yrrxbcsoqwamukarkzqa.supabase.co/functions/v1/send-scheduled-notifications" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo "✅ Test complete"
