# Production Deployment Checklist

**Last Updated:** October 4, 2025  
**Purpose:** Pre-deployment verification for trial usage guardrails

---

## Database Prerequisites

### 1. Verify `set_updated_at_timestamp()` Function Exists

**Run this SQL in Supabase SQL Editor:**

```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'set_updated_at_timestamp';
```

**Expected Result:**
- Should return 1 row with the function definition
- If empty, run the migration that creates it (typically in `00001_initial_schema.sql` or similar)

**Function Definition (if missing):**
```sql
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Netlify Environment Variables

### 2. Configure Production Environment Variables

**Navigate to:** Netlify Dashboard → Site Settings → Environment Variables

**Required Variables:**

| Variable | Value Source | Notes |
|----------|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Public, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | **SECRET** - Never expose to client |
| `NEXT_PUBLIC_SITE_URL` | `https://app-startupai-site.netlify.app` | Production URL |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database | Connection pooling URL |

**Steps:**
1. Go to: https://app.netlify.com/sites/app-startupai-site/settings/env
2. Add each variable above
3. Set scope to: **All scopes** (or at minimum: Builds, Functions, Deploy Previews)
4. Click **Save**

---

## Migration Deployment

### 3. Apply Database Migrations

**Local Test (Optional):**
```bash
cd frontend
pnpm db:migrate
```

**Production Deployment:**
- Migrations in `supabase/migrations/` are applied via Supabase CLI or Dashboard
- For `00007_trial_usage_counters.sql`:
  1. Go to Supabase Dashboard → SQL Editor
  2. Paste migration content
  3. Run migration
  4. Verify table exists: `SELECT * FROM trial_usage_counters LIMIT 1;`

**Drizzle Migrations:**
- Migrations in `frontend/src/db/migrations/` are for local development
- Not deployed directly; schema should match Supabase migrations

---

## Verification Steps

### 4. Post-Deployment Verification

**A. Check Netlify Build:**
```bash
# Trigger new deployment
git push origin main

# Monitor build logs
# Verify no environment variable errors
```

**B. Test Trial Guardrails API:**
```bash
curl -X POST https://app-startupai-site.netlify.app/api/trial/allow \
  -H "Content-Type: application/json" \
  -d '{"action":"projects.create"}' \
  -H "Authorization: Bearer <user-jwt-token>"
```

**Expected Response:**
```json
{
  "allowed": true,
  "remaining": 2
}
```

**C. Verify Database Table:**
```sql
-- In Supabase SQL Editor
SELECT * FROM trial_usage_counters LIMIT 5;
```

**D. Test RLS Policies:**
```sql
-- Should return only user's own counters
SELECT * FROM trial_usage_counters 
WHERE user_id = auth.uid();
```

---

## Rollback Plan

### 5. Emergency Rollback

**If deployment fails:**

1. **Revert Netlify Deploy:**
   - Netlify Dashboard → Deploys → Previous Deploy → Publish
   
2. **Rollback Database Migration:**
   ```sql
   DROP TABLE IF EXISTS trial_usage_counters;
   ```

3. **Remove Environment Variables:**
   - Only if causing build failures
   - Netlify Dashboard → Environment Variables → Delete

---

## Success Criteria

- ✅ `set_updated_at_timestamp()` function exists in production
- ✅ All 5 environment variables configured in Netlify
- ✅ Migration `00007_trial_usage_counters.sql` applied successfully
- ✅ Table `trial_usage_counters` exists with RLS enabled
- ✅ API endpoint `/api/trial/allow` returns 200 responses
- ✅ Tests pass: `pnpm --filter frontend test`
- ✅ Build succeeds on Netlify

---

## Next Steps

After successful deployment:
1. Monitor error logs for 24 hours
2. Verify trial users see usage limits in UI
3. Test counter reset functionality
4. Document any production issues in `docs/operations/implementation-status.md`

---

**Deployment Approved By:** _________________  
**Date:** _________________
