#!/bin/bash
# Netlify Environment Variables Sync Script
# Automatically syncs environment variables from centralized secrets to Netlify
# This prevents the constant reconfiguration issues

set -e

echo "🔄 Syncing environment variables to Netlify..."

# Source the centralized secrets
source ~/.secrets/startupai

# Netlify site ID for app.startupai.site
SITE_ID="d92f884b-1113-4821-b0a5-54bb8ff8612a"

# Function to set Netlify environment variable
set_netlify_env() {
    local key=$1
    local value=$2
    local is_secret=${3:-false}
    
    echo "Setting $key..."
    
    if [ "$is_secret" = "true" ]; then
        netlify env:set "$key" "$value" --site "$SITE_ID" --secret
    else
        netlify env:set "$key" "$value" --site "$SITE_ID"
    fi
}

# Required environment variables for Netlify deployment
echo "📋 Setting Supabase configuration..."
set_netlify_env "SUPABASE_URL" "$SUPABASE_URL"
set_netlify_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
set_netlify_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
set_netlify_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" true
set_netlify_env "DATABASE_URL" "$DATABASE_URL" true

echo "📋 Setting analytics configuration..."
set_netlify_env "NEXT_PUBLIC_POSTHOG_HOST" "$NEXT_PUBLIC_POSTHOG_HOST"
set_netlify_env "NEXT_PUBLIC_POSTHOG_KEY" "$NEXT_PUBLIC_POSTHOG_KEY"

echo "📋 Setting application URLs..."
set_netlify_env "NEXT_PUBLIC_APP_URL" "https://app-startupai-site.netlify.app"
set_netlify_env "NEXT_PUBLIC_MARKETING_URL" "https://startupai-site.netlify.app"

echo "✅ Environment variables synced successfully!"
echo "🚀 Ready for deployment"
