# Manual Migration Application Guide

## ⚠️ Required Action: Apply Database Trigger Migration

**Time Required:** 5 minutes  
**Criticality:** HIGH - Blocks onboarding functionality

---

## Why Manual Application?

Local migration history doesn't match remote Supabase database, causing `db push` to fail. The migration SQL is validated and safe to run directly via Supabase SQL Editor.

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

Navigate to:
```
https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql/new
```

### 2. Copy Migration SQL

```bash
cat supabase/migrations/00010_user_profile_trigger.sql
```

Or view the file at: `/home/chris/app.startupai.site/supabase/migrations/00010_user_profile_trigger.sql`

### 3. Paste and Execute

1. Paste the entire SQL contents into the SQL Editor
2. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
3. Wait for confirmation message

### 4. Verify Success

Run these verification queries in SQL Editor:

```sql
-- Check avatar_url column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'avatar_url';

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Expected Results:**
- First query returns: `avatar_url | text`
- Second query returns: `on_auth_user_created | INSERT | users`

---

## What This Migration Does

### Part 1: Add Avatar URL Column
```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

Adds support for user avatar images from OAuth providers.

### Part 2: Create Automatic Profile Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() ...
CREATE TRIGGER on_auth_user_created ...
```

Automatically creates `user_profiles` record when user signs up, populating:
- Email
- Full name (from OAuth)
- Avatar URL (from OAuth)
- Plan type (from signup form)
- Role and subscription tier

---

## Test After Application

### 1. Create New Test User

1. Open: `https://app-startupai-site.netlify.app/signup`
2. Select a plan (e.g., "Founder")
3. Click "Sign up with GitHub"
4. Complete OAuth authorization

### 2. Verify in Supabase Dashboard

Navigate to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/editor

**Check auth.users:**
```sql
SELECT id, email, raw_user_meta_data 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;
```

Should see `full_name`, `avatar_url`, `plan_type` in `raw_user_meta_data`.

**Check user_profiles:**
```sql
SELECT * 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 1;
```

Should see matching record with:
- ✅ `full_name` populated
- ✅ `avatar_url` populated
- ✅ `subscription_tier` matching selected plan
- ✅ `role` = 'trial'

### 3. Test Onboarding Page

After successful signup, browser should redirect to:
```
https://app-startupai-site.netlify.app/onboarding
```

**Success Criteria:**
- ✅ Page loads (no 404 error)
- ✅ User profile data displayed
- ✅ Onboarding interface appears

---

## Troubleshooting

### If Migration Fails

**Error:** "relation 'user_profiles' does not exist"
- **Solution:** Run migration `00001_initial_schema.sql` first

**Error:** "function handle_new_user already exists"
- **Solution:** Migration is idempotent, use `CREATE OR REPLACE FUNCTION`
- **Action:** Re-run the migration, it will update the existing function

**Error:** "trigger on_auth_user_created already exists"
- **Solution:** Migration includes `DROP TRIGGER IF EXISTS`
- **Action:** Safe to re-run

### If Trigger Doesn't Fire

Check trigger status:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

If missing, rerun the trigger creation part of migration.

### If Profile Not Created

1. Check auth.users has raw_user_meta_data
2. Verify trigger exists and is enabled
3. Check Supabase logs for errors
4. Ensure RLS policies allow insertion

---

## After Successful Application

1. ✅ Mark migration complete in `PHASE_0_PROGRESS.md`
2. ✅ Test complete signup → onboarding flow
3. ✅ Update launch readiness to 90%
4. ✅ Proceed with deployment confidence

---

## Support

If issues persist after following this guide:
- Check Supabase Dashboard → Logs
- Review `raw_user_meta_data` structure
- Verify OAuth scopes in GitHub OAuth app settings
- Contact: Documentation in `docs/engineering/10-authentication/`
