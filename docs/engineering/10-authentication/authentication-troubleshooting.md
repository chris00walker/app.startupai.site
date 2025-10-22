# 🔧 Authentication Fix - Step-by-Step Guide

**Status:** Ready to Execute  
**Time Required:** 30 minutes  
**Approach:** Manual Supabase Dashboard Setup (Most Reliable)

---

## 🎯 Root Cause Analysis Complete

After extensive testing and commit history analysis, the authentication infrastructure is **100% working**. The issues are:

1. **No test users with confirmed emails and proper roles**
2. **GitHub OAuth callback URLs may need verification**
3. **Role routing works but has no users to route**

---

## 🔧 Step-by-Step Fix

### **Step 1: Create & Confirm Test Users (10 minutes)**

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/users
   ```

2. **Click "Add user" and create:**

   **Founder Test User:**
   - Email: `founder@startupai.site`
   - Password: `TestFounder123!`
   - Email Confirmed: ✅ **Check this box**
   - User Metadata: `{"role": "founder"}`

   **Consultant Test User:**
   - Email: `consultant@startupai.site`
   - Password: `TestConsultant123!`
   - Email Confirmed: ✅ **Check this box**
   - User Metadata: `{"role": "consultant"}`

### **Step 2: Set User Roles in Database (5 minutes)**

1. **Go to SQL Editor:**
   ```
   https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql/new
   ```

2. **Run this SQL:**
   ```sql
   -- Set up founder@startupai.site as FOUNDER
   INSERT INTO user_profiles (
     id,
     email,
     full_name,
     company,
     role,
     subscription_tier,
     subscription_status,
     plan_status,
     created_at,
     updated_at
   ) VALUES (
     (SELECT id FROM auth.users WHERE email = 'founder@startupai.site' LIMIT 1),
     'founder@startupai.site',
     'Test Founder',
     'Test Company',
     'founder',
     'premium',
     'active',
     'active',
     NOW(),
     NOW()
   ) ON CONFLICT (id) DO UPDATE SET
     role = 'founder',
     subscription_tier = 'premium',
     subscription_status = 'active',
     plan_status = 'active',
     updated_at = NOW();

   -- Set up consultant@startupai.site as CONSULTANT
   INSERT INTO user_profiles (
     id,
     email,
     full_name,
     company,
     role,
     subscription_tier,
     subscription_status,
     plan_status,
     created_at,
     updated_at
   ) VALUES (
     (SELECT id FROM auth.users WHERE email = 'consultant@startupai.site' LIMIT 1),
     'consultant@startupai.site',
     'Test Consultant',
     'Consulting Firm',
     'consultant',
     'enterprise',
     'active',
     'active',
     NOW(),
     NOW()
   ) ON CONFLICT (id) DO UPDATE SET
     role = 'consultant',
     subscription_tier = 'enterprise',
     subscription_status = 'active',
     plan_status = 'active',
     updated_at = NOW();

   -- Verify the setup
   SELECT 
     up.email,
     up.role,
     up.subscription_tier,
     up.full_name,
     au.email_confirmed_at
   FROM user_profiles up
   JOIN auth.users au ON up.id = au.id
   WHERE up.email IN ('founder@startupai.site', 'consultant@startupai.site')
   ORDER BY up.email;
   ```

### **Step 3: Verify GitHub OAuth Settings (5 minutes)**

1. **Check GitHub OAuth App:**
   ```
   https://github.com/settings/developers
   ```

2. **Verify these settings:**
   - Application name: `StartupAI App Platform`
   - Homepage URL: `https://app-startupai-site.netlify.app`
   - Authorization callback URL: `https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback`

3. **If OAuth app doesn't exist, create it with these exact settings**

4. **Copy Client ID and Secret to Supabase:**
   ```
   https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers
   ```
   - Enable GitHub provider
   - Paste Client ID and Client Secret
   - Save

### **Step 4: Test Authentication Flow (10 minutes)**

1. **Test Founder Flow:**
   - Go to: `https://startupai-site.netlify.app/login`
   - Login with: `founder@startupai.site` / `TestFounder123!`
   - **Expected:** Direct redirect to `/founder-dashboard`

2. **Test Consultant Flow:**
   - Go to: `https://startupai-site.netlify.app/login`
   - Login with: `consultant@startupai.site` / `TestConsultant123!`
   - **Expected:** Direct redirect to `/dashboard`

3. **Test GitHub OAuth:**
   - Go to: `https://startupai-site.netlify.app/login`
   - Click "Sign in with GitHub"
   - **Expected:** Authorize and redirect to appropriate dashboard

---

## 🎯 Expected Results

After completing these steps:

- ✅ **founder@startupai.site** → `/founder-dashboard`
- ✅ **consultant@startupai.site** → `/dashboard`
- ✅ **GitHub OAuth** → Works and routes to correct dashboard
- ✅ **No confusing landing page** with role selection
- ✅ **No double login prompts**

---

## 🔍 Verification Script

Run this to verify the fix worked:

```bash
cd /home/chris/app.startupai.site/frontend
node check-auth-settings.mjs
```

Should show:
- ✅ Both users can sign in
- ✅ Both users have profiles with correct roles
- ✅ No RLS errors

---

## 🚨 If Issues Persist

**Issue: Still see landing page**
- Check browser console for auth callback logs
- Verify role detection in `/lib/auth/hooks.ts`

**Issue: GitHub OAuth fails**
- Check Supabase logs for OAuth errors
- Verify callback URL exactly matches

**Issue: Double login prompts**
- Check marketing site `NEXT_PUBLIC_APP_URL` environment variable
- Verify cross-site token handoff in auth callback

---

## 📋 Success Criteria

- [ ] Created both test users in Supabase Auth (email confirmed)
- [ ] Set roles in `user_profiles` table via SQL
- [ ] Verified roles with SELECT query
- [ ] Tested founder login → `/founder-dashboard`
- [ ] Tested consultant login → `/dashboard`
- [ ] Confirmed no landing page appears
- [ ] GitHub OAuth working (if configured)

**Once completed, authentication should work perfectly and match marketing promises!**
