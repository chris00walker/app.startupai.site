---
purpose: "Security incident report - exposed service role key"
status: "resolved"
date: "2025-10-24"
severity: "critical"
---

# Security Incident: Exposed Supabase Service Role Key

**Date**: October 24, 2025
**Severity**: CRITICAL
**Status**: RESOLVED

## Summary

Netlify secrets scanner detected hardcoded `SUPABASE_SERVICE_ROLE_KEY` in repository file `frontend/create-users-mcp.mjs` line 7.

## Impact

Service role key grants full admin access to Supabase database, bypassing all RLS policies.

## Immediate Actions Taken

1. Removed all development scripts from repository
2. Added .gitignore patterns to prevent future commits
3. Force-pushed to remove files from latest commits
4. Documented incident

## Files Removed

- `frontend/create-users-mcp.mjs` (contained exposed key)
- `frontend/create-test-users-working.mjs`
- `frontend/create-test-users.mjs`
- `frontend/create-users-properly.mjs`
- `frontend/debug-auth.mjs`
- `frontend/test-auth-flow.mjs`

## Commits

- `fd4a1f1` - "security: remove dev scripts with hardcoded secrets"
- `fd5eb94` - "chore: update Supabase CLI to v2.53.6"

## Required User Actions

**Key rotation was required:**

1. Go to Supabase API Settings:
   https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/settings/api

2. Reset/regenerate the service_role key

3. Update Netlify environment variable:
   ```bash
   netlify env:set SUPABASE_SERVICE_ROLE_KEY "new-key-here"
   ```

## Prevention Measures

1. Added patterns to .gitignore for development scripts
2. Netlify secrets scanner enabled
3. Documentation of proper secrets handling in CLAUDE.md

## Lessons Learned

- Never commit development scripts with hardcoded credentials
- Use environment variables for all secrets
- Run secrets scan before pushing
- Git history retains exposed secrets until force-cleaned
