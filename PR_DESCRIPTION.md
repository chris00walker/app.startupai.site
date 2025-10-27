# Pull Request: Fix CrewAI Python Function Deployment

## Branch
`claude/fix-onboarding-imports-011CUYQeXXZnofgKgFpwhHTQ` → `main`

## Title
fix: deploy Python functions to correct Netlify directory for CrewAI onboarding

---

## Problem

The CrewAI-powered onboarding flow returns "AI onboarding agent is unavailable" error because **Python functions are not being deployed by Netlify**.

### Root Cause

Netlify configuration in `netlify.toml`:
- `build.base = "frontend"`
- `functions.directory = "netlify/functions"` (relative to build.base)
- Therefore Netlify looks for functions in: `frontend/netlify/functions/`
- But Python files were in: `netlify/functions/` (root level, ignored by Netlify)

**Result:** Zero Python functions deployed → 404 errors on all function endpoints

## Solution

Move all Python function files to the correct deployment directory:

### Files Moved: `netlify/functions/` → `frontend/netlify/functions/`

- ✅ `crew-analyze.py` - Main CrewAI onboarding endpoint
- ✅ `crew_runtime.py` - Conversation engine and shared utilities
- ✅ `crew-analyze-background.py` - Long-running analysis jobs
- ✅ `crew-analyze-diagnostics.py` - Health check and debugging endpoint
- ✅ `requirements.txt` - Python dependencies (supabase, dotenv, crewai, etc.)
- ✅ `runtime.txt` - Python 3.11 specification
- ✅ `__init__.py` - Makes directory a Python package
- ❌ `onboarding-start.ts` - Removed empty placeholder file

## Impact

After deployment, these endpoints will be available:

1. **`/.netlify/functions/crew-analyze`** (Main onboarding endpoint)
   - Handles `conversation_start` action for onboarding flow
   - Handles `conversation_message` for user messages
   - Handles `analysis` for full CrewAI workflows

2. **`/.netlify/functions/crew-analyze-diagnostics`** (Health check)
   - Returns Python version, environment status, import test results
   - Useful for debugging deployment issues

3. **`/.netlify/functions/crew-analyze-background`** (Long-running jobs)
   - 15-minute timeout for complex analyses

## Testing Plan

### After Merge:

**1. Verify Functions Deploy**
```bash
# Should return JSON health status (not 404)
curl https://app-startupai-site.netlify.app/.netlify/functions/crew-analyze-diagnostics
```

**2. Verify Main Endpoint Exists**
```bash
# Should return 401 auth error (not 404 not found)
curl https://app-startupai-site.netlify.app/.netlify/functions/crew-analyze
```

**3. Test Onboarding Flow**
- Navigate to: `https://app-startupai-site.netlify.app/onboarding/?plan=founder-platform`
- After authentication, should see AI agent introduction
- Should NOT see "AI onboarding agent is unavailable"

## Environment Variables Required

Ensure these are set in **Netlify Dashboard → Site Settings → Environment Variables**:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (for JWT validation)

## Why Previous Fixes Didn't Work

All previous fixes to the Python code (imports, error handling, dependencies) were correct, but the files were in a directory that Netlify wasn't deploying. It's like having perfect code that never gets uploaded to the server.

## Alignment with Vision

This fix delivers on the **CrewAI-powered AI onboarding agent** promised in the two-site implementation plan. Users will experience:

- AI-driven conversation powered by CrewAI multi-agent system
- Quality signals and feedback during onboarding
- Structured strategic analysis based on their responses
- Real AI capabilities, not vaporware

## Files Changed

```
frontend/netlify/functions/__init__.py                    | new file
frontend/netlify/functions/crew-analyze-background.py     | new file
frontend/netlify/functions/crew-analyze-diagnostics.py    | new file
frontend/netlify/functions/crew-analyze.py                | new file
frontend/netlify/functions/crew_runtime.py                | new file
frontend/netlify/functions/onboarding-start.ts            | deleted
frontend/netlify/functions/requirements.txt               | new file
frontend/netlify/functions/runtime.txt                    | new file
```

**8 files changed, 1406 insertions(+), 0 deletions(-)**

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
