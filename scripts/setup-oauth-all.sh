#!/bin/bash

# Complete OAuth Setup Script for StartupAI
# Sets up GitHub, Google, and Microsoft Azure OAuth providers

set -e

echo "🚀 StartupAI OAuth Providers Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Supabase configuration
SUPABASE_CALLBACK="https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback"
APP_HOMEPAGE="https://app-startupai-site.netlify.app"
APP_NAME="StartupAI App Platform"
APP_DESCRIPTION="Evidence-led strategy platform for startup validation"

# Create directory for credentials
mkdir -p .oauth-credentials
chmod 700 .oauth-credentials

echo "📝 Configuration:"
echo "  App Name: $APP_NAME"
echo "  Homepage: $APP_HOMEPAGE"
echo "  Supabase Callback: $SUPABASE_CALLBACK"
echo ""

# ============================================================================
# GitHub OAuth Setup
# ============================================================================
echo "1️⃣  GitHub OAuth Setup"
echo "----------------------"

if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI detected"
    
    # Check if already logged in
    if gh auth status &> /dev/null; then
        echo "✅ Already logged in to GitHub"
        echo ""
        echo "⚠️  GitHub OAuth app creation requires manual steps:"
        echo "   1. Visit: https://github.com/settings/developers"
        echo "   2. Click 'New OAuth App'"
        echo "   3. Use these details:"
        echo "      Name: $APP_NAME"
        echo "      Homepage URL: $APP_HOMEPAGE"
        echo "      Callback URL: $SUPABASE_CALLBACK"
        echo "   4. Copy Client ID and Client Secret"
        echo ""
        read -p "Press Enter when done..."
        echo ""
    else
        echo "❌ Please login to GitHub CLI first: gh auth login"
        exit 1
    fi
else
    echo "❌ GitHub CLI not found. Install with: sudo apt install gh"
    exit 1
fi

# ============================================================================
# Microsoft Azure OAuth Setup
# ============================================================================
echo "2️⃣  Microsoft Azure OAuth Setup"
echo "--------------------------------"

if command -v az &> /dev/null; then
    echo "✅ Azure CLI detected (version: $(az --version | head -1))"
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        echo "🔐 Please login to Azure..."
        az login
    else
        echo "✅ Already logged in to Azure"
    fi
    
    echo ""
    echo "Creating Azure AD App Registration..."
    
    # Create the app registration
    APP_RESULT=$(az ad app create \
        --display-name "$APP_NAME" \
        --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
        --web-redirect-uris "$SUPABASE_CALLBACK" "http://localhost:3000/auth/callback" "$APP_HOMEPAGE/auth/callback" \
        --output json 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✅ Azure AD app created successfully!"
        
        APP_ID=$(echo "$APP_RESULT" | jq -r '.appId')
        echo "   Application (Client) ID: $APP_ID"
        
        # Create client secret
        echo "Creating client secret..."
        SECRET_RESULT=$(az ad app credential reset \
            --id "$APP_ID" \
            --append \
            --display-name "StartupAI Production" \
            --output json 2>&1)
        
        if [ $? -eq 0 ]; then
            CLIENT_SECRET=$(echo "$SECRET_RESULT" | jq -r '.password')
            echo "✅ Client secret created!"
            
            # Save credentials
            cat > .oauth-credentials/azure.env << EOF
# Microsoft Azure OAuth Credentials
# Created: $(date)
AZURE_CLIENT_ID=$APP_ID
AZURE_CLIENT_SECRET=$CLIENT_SECRET
AZURE_TENANT_ID=common
AZURE_TENANT_URL=https://login.microsoftonline.com/common
EOF
            chmod 600 .oauth-credentials/azure.env
            
            echo ""
            echo "💾 Azure credentials saved to: .oauth-credentials/azure.env"
            echo "   Client ID: $APP_ID"
            echo "   Client Secret: $CLIENT_SECRET"
            echo ""
        else
            echo "❌ Failed to create client secret"
            echo "$SECRET_RESULT"
        fi
    else
        echo "❌ Failed to create Azure AD app"
        echo "$APP_RESULT"
    fi
else
    echo "❌ Azure CLI not found"
    echo "   Install with: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

echo ""

# ============================================================================
# Google OAuth Setup
# ============================================================================
echo "3️⃣  Google OAuth Setup"
echo "----------------------"

if command -v gcloud &> /dev/null; then
    echo "✅ Google Cloud SDK detected"
    
    # Check if logged in
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        echo "🔐 Please login to Google Cloud..."
        gcloud auth login
    else
        echo "✅ Already logged in to Google Cloud"
    fi
    
    echo ""
    echo "⚠️  Google OAuth setup requires manual configuration:"
    echo "   1. Visit: https://console.cloud.google.com/"
    echo "   2. Create or select project: StartupAI"
    echo "   3. Enable Google+ API"
    echo "   4. Configure OAuth consent screen"
    echo "   5. Create OAuth 2.0 Client ID (Web application)"
    echo "   6. Add authorized redirect URI: $SUPABASE_CALLBACK"
    echo "   7. Copy Client ID and Client Secret"
    echo ""
    read -p "Press Enter when done..."
else
    echo "⚠️  Google Cloud SDK not found"
    echo "   Manual setup required:"
    echo "   1. Visit: https://console.cloud.google.com/"
    echo "   2. Follow Google OAuth setup guide in docs/engineering/10-authentication/oauth-setup-guide.md"
fi

echo ""
echo "============================================"
echo "✅ OAuth Setup Complete!"
echo "============================================"
echo ""

# ============================================================================
# Summary and Next Steps
# ============================================================================
echo "📋 Summary:"
echo ""

if [ -f .oauth-credentials/azure.env ]; then
    echo "✅ Microsoft Azure: Configured"
    echo "   Credentials saved in: .oauth-credentials/azure.env"
else
    echo "⚠️  Microsoft Azure: Manual configuration needed"
fi

echo ""
echo "⚠️  GitHub: Manual configuration needed"
echo "   Visit: https://github.com/settings/developers"

echo ""
echo "⚠️  Google: Manual configuration needed"
echo "   Visit: https://console.cloud.google.com/"

echo ""
echo "============================================"
echo "🔧 Configure in Supabase Dashboard"
echo "============================================"
echo ""
echo "Visit: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers"
echo ""
echo "For each provider:"
echo "1. Enable the provider"
echo "2. Paste Client ID and Client Secret"
echo "3. Click 'Save'"
echo ""
echo "Credentials are saved in: .oauth-credentials/"
echo ""
echo "✅ Setup complete! Test authentication at: http://localhost:3000"
