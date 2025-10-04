# 🚀 Production Deployment - Trial Guardrails

**Quick Reference for Deploying Trial Usage Limits**

---

## ✅ Pre-Deployment Checklist

### 1. Verify Database Function Exists

**Run in Supabase SQL Editor:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'set_updated_at_timestamp';
```

**If missing, create it:**
```sql
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Configure Netlify Environment Variables

**Go to:** https://app.netlify.com/sites/app-startupai-site/settings/env

**Add these 5 variables:**

| Variable | Get From | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | **SECRET** |
| `NEXT_PUBLIC_SITE_URL` | - | `https://app-startupai-site.netlify.app` |
| `DATABASE_URL` | Supabase → Settings → Database | Connection pooling URL |

---

## 🗄️ Apply Database Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql
2. Copy contents of: `supabase/migrations/00007_trial_usage_counters.sql`
3. Paste and run
4. Verify: `SELECT * FROM trial_usage_counters LIMIT 1;`

### Option 2: Supabase CLI

```bash
pnpm exec supabase db push
```

---

## 🚢 Deploy to Production

```bash
# Commit and push (already done)
git push origin main

# Monitor deployment
# https://app.netlify.com/sites/app-startupai-site/deploys
```

---

## ✨ Verify Deployment

### 1. Test API Endpoint

```bash
curl -X POST https://app-startupai-site.netlify.app/api/trial/allow \
  -H "Content-Type: application/json" \
  -d '{"action":"projects.create"}'
```

**Expected:** `{"allowed":true,"remaining":2}` (or similar)

### 2. Check Database Table

```sql
SELECT * FROM trial_usage_counters ORDER BY created_at DESC LIMIT 5;
```

### 3. Verify RLS Policies

```sql
-- Should only return user's own counters
SELECT * FROM trial_usage_counters WHERE user_id = auth.uid();
```

---

## 🔧 Quick Actions

### Reset User's Trial Counters

```sql
DELETE FROM trial_usage_counters WHERE user_id = '<user-uuid>';
```

### Check Usage Stats

```sql
SELECT user_id, action, SUM(count) as total
FROM trial_usage_counters
GROUP BY user_id, action
ORDER BY total DESC
LIMIT 10;
```

### Adjust Limits

Edit: `frontend/src/lib/auth/trial-limits.ts`

```typescript
{
  action: 'projects.create',
  limit: 5,  // Change this
  period: 'monthly',
  description: 'Create new projects'
}
```

---

## 🆘 Rollback (If Needed)

### 1. Revert Netlify Deploy
- Dashboard → Deploys → Previous Deploy → Publish

### 2. Rollback Database
```sql
DROP TABLE IF EXISTS trial_usage_counters;
```

### 3. Revert Code
```bash
git revert HEAD
git push origin main
```

---

## 📚 Full Documentation

- **Complete Guide:** `docs/operations/trial-guardrails-deployment.md`
- **Deployment Checklist:** `docs/operations/production-deployment-checklist.md`
- **Database Seeding:** `docs/operations/database-seeding.md`

---

## 🎯 Success Criteria

- ✅ Function `set_updated_at_timestamp()` exists
- ✅ All 5 Netlify env vars configured
- ✅ Migration applied successfully
- ✅ Table `trial_usage_counters` exists with RLS
- ✅ API endpoint returns 200 responses
- ✅ Tests passing (162/162)
- ✅ Netlify build succeeds

---

**Status:** Ready for Production ✨  
**Last Updated:** October 4, 2025
