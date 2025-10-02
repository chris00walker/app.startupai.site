# OAuth Providers Setup Guide

**Project:** StartupAI App Platform  
**Last Updated:** October 2, 2025  
**Status:** GitHub OAuth ✅ Complete | Google/Azure Optional

---

## ⚠️ Critical: Two-Step Configuration Required

OAuth setup requires configuration in **TWO** locations:

1. **Provider Platform** (GitHub/Google/Azure) - Create OAuth app and get credentials
2. **Supabase Dashboard** - Configure Site URL, Redirect URLs, and paste credentials

Additionally, for cross-site authentication (marketing → product):
3. **Marketing Site** - Add `.env.production` with `NEXT_PUBLIC_APP_URL`
4. **Netlify Build** - Ensure environment variables available at build time

**Missing any step will cause OAuth to redirect to localhost in production.**

---

## Quick Reference

### Supabase Project Details
- **Project ID:** `eqxropalhxjeyvfcoyxg`
- **Dashboard:** https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers
- **Callback URL:** `https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback`

### Application URLs
- **Production:** `https://app-startupai-site.netlify.app`
- **Development:** `http://localhost:3000`
- **Marketing Site:** `https://startupai-site.netlify.app`

---

## 1. GitHub OAuth Setup

### Option A: Via GitHub Web UI (Recommended)

1. **Visit GitHub Settings:**
   ```
   https://github.com/settings/developers
   ```

2. **Click "New OAuth App"**

3. **Fill in Application Details:**
   ```
   Application name:    StartupAI App Platform
   Homepage URL:        https://app-startupai-site.netlify.app
   Application description: Evidence-led strategy platform for startup validation
   Authorization callback URL: https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback
   ```

4. **Register Application**

5. **Generate Client Secret:**
   - Click "Generate a new client secret"
   - **COPY IMMEDIATELY** - it won't be shown again

6. **Copy Credentials:**
   - Client ID: `Iv1.xxxxxxxxxxxxx`
   - Client secrets: `ghp_xxxxxxxxxxxxx`

### Option B: Via GitHub CLI (if permissions allow)

```bash
# Install GitHub CLI extension for OAuth (if available)
gh extension install github/gh-oauth

# Create OAuth app
gh oauth create \
  --name "StartupAI App Platform" \
  --url "https://app-startupai-site.netlify.app" \
  --callback "https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback"
```

### Configure in Supabase:

1. Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers
2. Find "GitHub" provider
3. Enable it
4. Paste Client ID and Client Secret
5. Click "Save"

---

## 2. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. **Visit Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Create New Project:**
   - Click "Select a project" → "New Project"
   - Project name: `StartupAI`
   - Location: No organization
   - Click "Create"

### Step 2: Enable Google+ API

1. **Navigate to APIs & Services:**
   ```
   https://console.cloud.google.com/apis/library
   ```

2. **Search for "Google+ API"**

3. **Click "Enable"**

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen:**
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Select User Type:**
   - Choose "External"
   - Click "Create"

3. **Fill OAuth Consent Screen:**
   ```
   App name: StartupAI
   User support email: your-email@domain.com
   App logo: (optional)
   
   Authorized domains:
     - startupai-site.netlify.app
     - app-startupai-site.netlify.app
     - supabase.co
   
   Developer contact: your-email@domain.com
   ```

4. **Scopes (Step 2):**
   - Add: `userinfo.email`
   - Add: `userinfo.profile`
   - Add: `openid`

5. **Test users (Step 3):**
   - Add your email for testing
   - Click "Save and Continue"

### Step 4: Create OAuth 2.0 Credentials

1. **Go to Credentials:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create Credentials:**
   - Click "+ CREATE CREDENTIALS"
   - Select "OAuth client ID"

3. **Application Type:**
   - Choose "Web application"
   - Name: `StartupAI App Platform`

4. **Authorized Redirect URIs:**
   ```
   https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   https://app-startupai-site.netlify.app/auth/callback
   ```

5. **Create and Copy Credentials:**
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client secret: `GOCSPX-xxxxxxxxxxxxx`

### Configure in Supabase:

1. Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers
2. Find "Google" provider
3. Enable it
4. Paste Client ID and Client Secret
5. Click "Save"

---

## 3. Microsoft Azure AD OAuth Setup

### Step 1: Install Azure CLI

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Verify installation
az --version

# Login
az login
```

### Step 2: Create App Registration (CLI)

```bash
# Create app registration
az ad app create \
  --display-name "StartupAI App Platform" \
  --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
  --web-redirect-uris \
    "https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback" \
    "http://localhost:3000/auth/callback" \
    "https://app-startupai-site.netlify.app/auth/callback"

# Get the app ID from the output
APP_ID="<copy-from-output>"

# Create a client secret
az ad app credential reset \
  --id $APP_ID \
  --append \
  --display-name "StartupAI Production"
```

### Step 2 Alternative: Via Azure Portal (Web UI)

1. **Visit Azure Portal:**
   ```
   https://portal.azure.com/
   ```

2. **Navigate to Azure Active Directory:**
   - Search for "Azure Active Directory"
   - Click "App registrations"

3. **Register New Application:**
   - Click "+ New registration"
   - Name: `StartupAI App Platform`
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox)"
   - Redirect URI: Web → `https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback`
   - Click "Register"

4. **Add Additional Redirect URIs:**
   - Go to "Authentication"
   - Under "Web" → "Redirect URIs", click "+ Add URI"
   - Add:
     ```
     http://localhost:3000/auth/callback
     https://app-startupai-site.netlify.app/auth/callback
     ```
   - Click "Save"

5. **Create Client Secret:**
   - Go to "Certificates & secrets"
   - Click "+ New client secret"
   - Description: `StartupAI Production`
   - Expires: 24 months
   - Click "Add"
   - **COPY THE VALUE IMMEDIATELY** - won't be shown again

6. **Copy Application Details:**
   - Go to "Overview"
   - Copy:
     - Application (client) ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
     - Directory (tenant) ID: Use `common` for multi-tenant

### Configure in Supabase:

1. Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers
2. Find "Azure (Microsoft)" provider
3. Enable it
4. Paste:
   - Client ID (Application ID)
   - Client Secret
   - Azure Tenant URL: `https://login.microsoftonline.com/common`
5. Click "Save"

---

## 4. Save Credentials Securely

Create a secure file to store credentials (gitignored):

```bash
# Create directory
mkdir -p .oauth-credentials

# Create credentials file
cat > .oauth-credentials/providers.env << 'EOF'
# OAuth Provider Credentials
# Created: $(date)

# GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# Microsoft Azure
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=common
EOF

# Secure the file
chmod 600 .oauth-credentials/providers.env
```

---

## 5. Verification Checklist

### GitHub:
- [ ] OAuth App created
- [ ] Callback URL: `https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback`
- [ ] Client ID and Secret copied
- [ ] Configured in Supabase Dashboard
- [ ] Provider enabled

### Google:
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs include Supabase callback
- [ ] Client ID and Secret copied
- [ ] Configured in Supabase Dashboard
- [ ] Provider enabled

### Microsoft:
- [ ] Azure AD app registration created
- [ ] Redirect URIs configured
- [ ] Client secret generated
- [ ] Client ID and Secret copied
- [ ] Configured in Supabase Dashboard
- [ ] Provider enabled

---

## 6. Testing OAuth Flow

### Test Each Provider:

```bash
# Start development server
cd frontend && pnpm dev
```

1. **Visit:** http://localhost:3000/login

2. **Test GitHub:**
   - Click "Sign in with GitHub"
   - Authorize the app
   - Should redirect to `/dashboard`

3. **Test Google:**
   - Click "Sign in with Google"
   - Choose Google account
   - Authorize the app
   - Should redirect to `/dashboard`

4. **Test Microsoft:**
   - Click "Sign in with Microsoft"
   - Choose Microsoft account
   - Authorize the app
   - Should redirect to `/dashboard`

### Verify Database:

```bash
# Check if user was created in Supabase
# Visit: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/users
```

---

## 7. Troubleshooting

### Common Issues:

**"Redirect URI mismatch"**
- Verify callback URL exactly matches: `https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos

**"App not approved" (Google)**
- Add your email as a test user in OAuth consent screen
- Or publish the app (requires verification for production)

**"Invalid client secret"**
- Regenerate the secret
- Make sure you copied the value, not the secret ID

**"Tenant not found" (Microsoft)**
- Use `common` instead of specific tenant ID for multi-tenant
- URL should be: `https://login.microsoftonline.com/common`

---

## 8. Production Deployment

### Before Going Live:

1. **Update Redirect URLs** in all providers to include production URL
2. **Remove localhost** redirect URLs from production apps
3. **Publish OAuth consent screens** (Google, Microsoft)
4. **Enable proper scopes** for user data access
5. **Test with real users** in production environment
6. **Monitor auth logs** in Supabase Dashboard

---

## Quick Command Reference

```bash
# GitHub - check existing OAuth apps
gh api /user/applications

# Azure - install CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Azure - login
az login

# Azure - list app registrations
az ad app list --display-name "StartupAI"

# Test Supabase auth locally
pnpm dev
# Then visit http://localhost:3000 and test OAuth buttons
```

---

**Next Steps:**
1. Complete OAuth provider configurations
2. Test authentication flow
3. Create UI components for login/signup
4. Implement user profile management
