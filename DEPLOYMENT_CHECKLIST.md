# 📋 Production Deployment Checklist - Trial Guardrails

**Date:** October 4, 2025  
**Deployment:** Trial Usage Guardrails  
**Status:** Ready to Execute

---

## ✅ Step 1: Verify Database Function

### Action Required:
1. Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql
2. Run this query:

```sql
SELECT proname FROM pg_proc WHERE proname = 'set_updated_at_timestamp';
```

### Expected Result:
- Should return **1 row** with `proname = 'set_updated_at_timestamp'`

### If Missing:
The function is already defined in `supabase/migrations/00005_user_roles_and_plans.sql` (lines 34-45).
It should already exist from previous migrations.

**Status:** [ ] Verified ✓

---

## ✅ Step 2: Configure Netlify Environment Variables

### Action Required:
1. Go to: https://app.netlify.com/sites/app-startupai-site/settings/env
2. Click **"Add a variable"** for each of the following:

### Variables to Add:

#### 1. NEXT_PUBLIC_SUPABASE_URL
```
Value: https://eqxropalhxjeyvfcoyxg.supabase.co
Scopes: All scopes (or minimum: Builds, Functions, Deploy Previews)
```

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeHJvcGFsaHhqZXl2ZmNveXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDk5ODEsImV4cCI6MjA3NDcyNTk4MX0.Muq6OvplTkSfjb02NihiQKqBLn3gh9YLBNWUQgwV-yU
Scopes: All scopes
```

#### 3. SUPABASE_SERVICE_ROLE_KEY ⚠️ SECRET
```
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeHJvcGFsaHhqZXl2ZmNveXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0OTk4MSwiZXhwIjoyMDc0NzI1OTgxfQ.AhCbVDcyGMdN1abKT1qYXO88oyZ7bbJ3br5AIT0ZppY
Scopes: All scopes
⚠️ NEVER expose this to client-side code
```

#### 4. NEXT_PUBLIC_SITE_URL
```
Value: https://app-startupai-site.netlify.app
Scopes: All scopes
```

#### 5. DATABASE_URL
```
Value: postgresql://postgres.eqxropalhxjeyvfcoyxg:bPRV%21ur25yBx9%40AxHPPh@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
Scopes: All scopes
```

### Verification:
- Click **"Save"** after adding each variable
- Verify all 5 variables are listed

**Status:** [ ] All 5 variables configured ✓

---

## ✅ Step 3: Apply Database Migration

### Action Required:
1. Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql
2. Open file: `supabase/migrations/00007_trial_usage_counters.sql`
3. Copy the **entire contents** of the file
4. Paste into Supabase SQL Editor
5. Click **"Run"**

### Migration Contents Preview:
```sql
-- Trial usage counters table for enforcing free-tier limits
CREATE TABLE IF NOT EXISTS public.trial_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  period text NOT NULL,
  period_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- ... (rest of migration)
```

### Verification Query:
```sql
SELECT * FROM trial_usage_counters LIMIT 1;
```

**Expected:** Query succeeds (even if no rows returned)

**Status:** [ ] Migration applied ✓

---

## ✅ Step 4: Deploy to Netlify

### Action Required:
**ALREADY DONE!** ✅

The code has been committed and pushed:
- Commit 1: `4ad8716` - Trial guardrails implementation
- Commit 2: `039c152` - Production deployment docs

### Monitor Deployment:
1. Go to: https://app.netlify.com/sites/app-startupai-site/deploys
2. Wait for latest deploy to show **"Published"** status
3. Check build logs for any errors

### If Build Fails:
- Check that all 5 environment variables are set correctly
- Review build logs for specific errors
- Verify migration was applied successfully

**Status:** [ ] Deployment published ✓

---

## ✅ Step 5: Verify Deployment

### A. Test API Endpoint

**Run this command in your terminal:**
```bash
curl -X POST https://app-startupai-site.netlify.app/api/trial/allow \
  -H "Content-Type: application/json" \
  -d '{"action":"projects.create"}'
```

**Expected Response:**
```json
{
  "allowed": true,
  "remaining": 2
}
```

**Status:** [ ] API responds correctly ✓

---

### B. Check Database Table

**In Supabase SQL Editor, run:**
```sql
SELECT * FROM trial_usage_counters ORDER BY created_at DESC LIMIT 5;
```

**Expected:** Table exists and query succeeds

**Status:** [ ] Table accessible ✓

---

### C. Verify RLS Policies

**In Supabase SQL Editor, run:**
```sql
-- Test RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'trial_usage_counters';
```

**Expected:** `rowsecurity = true`

**Status:** [ ] RLS enabled ✓

---

## 🎯 Final Success Criteria

Mark each as complete:

- [ ] ✅ Function `set_updated_at_timestamp()` exists
- [ ] ✅ All 5 Netlify environment variables configured
- [ ] ✅ Migration `00007_trial_usage_counters.sql` applied
- [ ] ✅ Table `trial_usage_counters` exists with RLS enabled
- [ ] ✅ Netlify deployment published successfully
- [ ] ✅ API endpoint `/api/trial/allow` returns 200 responses
- [ ] ✅ All tests passing (162/162)

---

## 🆘 Troubleshooting

### Issue: API returns 500 error
**Solution:** Check Netlify function logs for specific error

### Issue: "Missing environment variables" in build
**Solution:** Verify all 5 variables are set in Netlify settings

### Issue: "relation trial_usage_counters does not exist"
**Solution:** Re-run migration in Supabase SQL Editor

### Issue: RLS blocking queries
**Solution:** Verify service role key is set correctly in Netlify

---

## 📝 Post-Deployment Tasks

After successful deployment:

1. **Monitor for 24 hours:**
   - Check Netlify function logs
   - Monitor Supabase database metrics
   - Watch for user-reported issues

2. **Test trial user flow:**
   - Create test trial account
   - Attempt to exceed limits
   - Verify error messages display correctly

3. **Document issues:**
   - Update `docs/operations/implementation-status.md`
   - Log any production bugs
   - Note performance metrics

---

## 🔄 Rollback Plan (If Needed)

### 1. Revert Netlify Deploy
- Dashboard → Deploys → Previous Deploy → **Publish**

### 2. Rollback Database
```sql
DROP TABLE IF EXISTS trial_usage_counters;
```

### 3. Revert Code
```bash
git revert HEAD~2  # Reverts last 2 commits
git push origin main
```

---

**Deployment Completed By:** _________________  
**Date:** _________________  
**Time:** _________________  
**Status:** _________________

---

**Next Review:** October 5, 2025  
**Documentation:** See `docs/operations/trial-guardrails-deployment.md` for complete guide
