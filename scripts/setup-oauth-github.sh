#!/bin/bash

# GitHub OAuth App Setup Script
# Creates an OAuth app for StartupAI authentication

set -e

echo "🔧 Setting up GitHub OAuth App..."

# Get the Supabase callback URL
SUPABASE_CALLBACK="https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback"

# OAuth App details
APP_NAME="StartupAI App Platform"
HOMEPAGE_URL="https://app-startupai-site.netlify.app"
DESCRIPTION="Evidence-led strategy platform for startup validation"

echo "📝 App Details:"
echo "  Name: $APP_NAME"
echo "  Homepage: $HOMEPAGE_URL"
echo "  Callback URL: $SUPABASE_CALLBACK"
echo ""

# Create the OAuth app using GitHub API
echo "Creating OAuth app via GitHub API..."

RESPONSE=$(gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /user/applications \
  -f name="$APP_NAME" \
  -f url="$HOMEPAGE_URL" \
  -f callback_url="$SUPABASE_CALLBACK" \
  -f description="$DESCRIPTION" 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ GitHub OAuth App created successfully!"
  echo ""
  echo "📋 OAuth Credentials:"
  echo "$RESPONSE" | jq -r '"Client ID: " + .client_id'
  echo "$RESPONSE" | jq -r '"Client Secret: " + .client_secret'
  echo ""
  echo "🔗 Manage app at: https://github.com/settings/developers"
  echo ""
  echo "⚠️  IMPORTANT: Save these credentials immediately!"
  echo "   The client secret will not be shown again."
  echo ""
  
  # Save to a secure file
  CLIENT_ID=$(echo "$RESPONSE" | jq -r '.client_id')
  CLIENT_SECRET=$(echo "$RESPONSE" | jq -r '.client_secret')
  
  mkdir -p .oauth-credentials
  cat > .oauth-credentials/github.env << EOF
# GitHub OAuth Credentials
# Created: $(date)
GITHUB_CLIENT_ID=$CLIENT_ID
GITHUB_CLIENT_SECRET=$CLIENT_SECRET
EOF
  
  echo "💾 Credentials saved to: .oauth-credentials/github.env"
  echo "   (This file is gitignored)"
  echo ""
  
else
  echo "❌ Failed to create OAuth app"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Next steps:"
echo "1. Configure these credentials in Supabase Dashboard"
echo "2. Visit: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers"
echo "3. Enable GitHub provider and paste the credentials"
