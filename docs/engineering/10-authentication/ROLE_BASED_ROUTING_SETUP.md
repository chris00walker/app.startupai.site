# 🔧 Role-Based Routing Setup Guide

**Issue:** Users are being sent to a confusing landing page instead of their appropriate dashboard after login.

**Solution:** Set up proper role-based routing and test users.

---

## 🎯 The Problem

Currently when users log in from the marketing site, they're being redirected to the landing page (`/`) which shows role selection buttons. This is confusing UX.

**Expected Flow:**
1. User logs in from marketing site (`startupai.site`)
2. Authentication system determines user role
3. User is redirected directly to appropriate dashboard:
   - **Founder role** → `/founder-dashboard`
   - **Consultant role** → `/dashboard`

---

## 🔧 Manual Setup Required

Since the automated script had API key issues, please manually set up the test users:

### **Step 1: Create Test Users in Supabase Auth**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Users**
3. Click **"Add user"** and create:

**Founder Test User:**
- Email: `test@startupai.site`
- Password: `Test123456!`
- Email Confirmed: ✅ Yes

**Consultant Test User:**
- Email: `test2@startupai.site`  
- Password: `Test123456~`
- Email Confirmed: ✅ Yes

### **Step 2: Set User Roles in Database**

1. Go to **Database > SQL Editor**
2. Run this SQL to set up the roles:

```sql
-- Set up test@startupai.site as FOUNDER
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
  (SELECT id FROM auth.users WHERE email = 'test@startupai.site' LIMIT 1),
  'test@startupai.site',
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

-- Set up test2@startupai.site as CONSULTANT
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
  (SELECT id FROM auth.users WHERE email = 'test2@startupai.site' LIMIT 1),
  'test2@startupai.site',
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
  up.full_name
FROM user_profiles up
WHERE up.email IN ('test@startupai.site', 'test2@startupai.site')
ORDER BY up.email;
```

---

## 🔍 How Role-Based Routing Works

The system already has the logic in place:

### **1. Role Definitions** (`/lib/auth/roles.ts`)
```typescript
const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/dashboard',
  consultant: '/dashboard',        // ← Consultant Dashboard
  founder: '/founder-dashboard',   // ← Founder Dashboard  
  trial: '/founder-dashboard?mode=trial'
};
```

### **2. Authentication Callback** (`/app/auth/callback/route.ts`)
- Handles OAuth login from marketing site
- Looks up user role from `user_profiles` table
- Redirects to appropriate dashboard using `getRedirectForRole()`

### **3. Role Detection** (`/lib/auth/hooks.ts`)
- `useRoleInfo()` hook determines user role
- Checks both `user_profiles.role` and `auth.users.app_metadata.role`
- Falls back to `'trial'` if no role found

---

## 🧪 Testing the Fix

### **Test Founder Flow:**
1. Go to marketing site login
2. Login with: `test@startupai.site` / `Test123456!`
3. **Expected:** Direct redirect to Founder Dashboard
4. **URL:** `app.startupai.site/founder-dashboard`

### **Test Consultant Flow:**
1. Go to marketing site login  
2. Login with: `test2@startupai.site` / `Test123456~`
3. **Expected:** Direct redirect to Consultant Dashboard
4. **URL:** `app.startupai.site/dashboard`

---

## 🚨 If Users Still See Landing Page

If users are still being sent to the landing page after setting up roles, the issue might be:

### **Possible Causes:**
1. **Role not set in database** - Run the SQL above
2. **Authentication callback not working** - Check Supabase logs
3. **Marketing site redirect issue** - Check marketing site login form
4. **Session not persisting** - Check cookie settings

### **Debug Steps:**
1. **Check user role in database:**
```sql
SELECT email, role, subscription_status FROM user_profiles 
WHERE email = 'test@startupai.site';
```

2. **Check authentication callback logs:**
- Look for console logs in `/app/auth/callback/route.ts`
- Should show: "Redirecting to: /founder-dashboard"

3. **Check if landing page is being hit:**
- Add console.log to `/pages/index.tsx` to see if it's being accessed

---

## 🎯 Expected Result

After setup:
- ✅ **`test@startupai.site`** → Founder Dashboard (with gate integration)
- ✅ **`test2@startupai.site`** → Consultant Dashboard (with portfolio view)
- ✅ **No confusing landing page** with role selection
- ✅ **Direct routing** based on user role

---

## 📋 Verification Checklist

- [ ] Created both test users in Supabase Auth
- [ ] Set roles in `user_profiles` table via SQL
- [ ] Verified roles with SELECT query
- [ ] Tested founder login → `/founder-dashboard`
- [ ] Tested consultant login → `/dashboard`
- [ ] Confirmed no landing page appears
- [ ] Both dashboards load with proper gate integration

---

**Once you've completed the manual setup, the role-based routing should work perfectly and eliminate the confusing landing page experience!**
