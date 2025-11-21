# Onboarding Agent Fix - Configuration Required

**Date:** October 28, 2025  
**Status:** ⚠️ REQUIRES MANUAL CONFIGURATION

## Root Cause Identified

The Agentuity agent deployed successfully, but it's missing an **API source** configuration. By default, agents only have webhook sources (asynchronous), but our frontend needs synchronous API responses.

### Error Messages
- **Frontend:** "The AI onboarding agent is unavailable right now"
- **Backend curl test:** "No api has been configured for agent_8dafe1"

### What We Need

We need to configure an **API Source** (not Webhook) for the agent so it can respond synchronously to HTTP requests.

## Solution: Configure API Source in Agentuity Dashboard

### Step 1: Access Agent Dashboard
1. Go to: https://app.agentuity.com/projects/proj_cc4a88c94cad106489567765ca25a4f4
2. Click on the **Onboarding** agent
3. Navigate to the **Agent IO** (Input/Output) section

### Step 2: Add API Source
1. Click the **plus button** in the Agent IO visualization
2. Select **"API Source"** (NOT "Webhook Source")
3. Configure authentication if needed:
   - Option 1: **No authentication** (for initial testing)
   - Option 2: **Bearer token** (recommended for production)
4. Save the configuration

### Step 3: Update Frontend URL (if using Bearer token)
If you added Bearer token authentication, update the frontend code to include the token in requests.

### Step 4: Test the Configuration
Once the API source is configured, test with curl:

```bash
# Test the API endpoint
curl -X POST "https://agentuity.ai/api/agent_8dafe1bc5964fff0a81bb29b5b672f8b" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "user_id": "test-user",
    "plan_type": "trial"
  }'
```

Expected response: JSON with session data, not "No api has been configured"

### Step 5: Update Environment Variable
Once the API source is configured, update the Netlify environment variable to use the API endpoint (not webhook):

```bash
netlify env:set AGENTUITY_AGENT_URL "https://agentuity.ai/api/agent_8dafe1bc5964fff0a81bb29b5b672f8b"
```

Then trigger a new deployment:
```bash
cd /home/chris/app.startupai.site/frontend
git commit --allow-empty -m "trigger rebuild for API URL"
git push origin main
```

## Current Status

✅ **Completed:**
- Agent code fixed (optional CrewAI imports)
- Dependencies added to pyproject.toml
- Agent deployed successfully to Agentuity cloud
- Deployment resources increased (1500Mi disk)
- Netlify environment variable set

⚠️ **Needs Configuration:**
- API Source must be added in Agentuity web dashboard
- Environment variable updated to use `/api/` instead of `/webhook/`

## Alternative: Use Webhook with Polling (Not Recommended)

If you can't configure the API source, you could modify the frontend to:
1. Call the webhook endpoint (async)
2. Get the `Location` header from the response
3. Poll that URL until the agent responds

However, this is more complex and not ideal for real-time conversation flow.

## Reference

**Agent Details:**
- Project ID: `proj_cc4a88c94cad106489567765ca25a4f4`
- Agent ID: `agent_8dafe1bc5964fff0a81bb29b5b672f8b`
- Agent Name: `Onboarding`

**Deployment:**
- Status: ✅ Active
- Deployment ID: `deploy_588980826fd9daf3d7f7f08cf83c0fc3`
- Created: 2025-10-28T17:47:11.571Z

**Current URLs:**
- Webhook (async): `https://agentuity.ai/webhook/agent_8dafe1bc5964fff0a81bb29b5b672f8b`
- API (sync): `https://agentuity.ai/api/agent_8dafe1bc5964fff0a81bb29b5b672f8b` ⚠️ NOT CONFIGURED

## Documentation

- Agentuity Agent IO Guide: https://agentuity.dev/Guides/agent-io
- Agentuity Cloud Agents: https://agentuity.dev/Cloud/agents
