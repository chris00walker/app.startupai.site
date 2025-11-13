# Troubleshooting Guide: Client Management Architecture

## Common Issues and Solutions

### Issue 1: Consultant Seeing Demo Mode Instead of Real Clients

**Symptoms:**
- Logged in as consultant
- Dashboard shows demo/sample data
- "Trial mode: upgrade to unlock" message
- No client data visible
- Company name not displayed

**Causes:**
1. Duplicate user_profiles with same email (one founder, one consultant)
2. Wrong profile loaded during login
3. Role field set to 'founder' instead of 'consultant'

**Diagnosis:**
```sql
-- Check for duplicate profiles
SELECT id, email, role, company
FROM user_profiles
WHERE email = 'your-email@example.com';

-- Check which profile is linked to auth
SELECT au.id as auth_user_id, up.id as profile_id, up.role, up.company
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'your-email@example.com';
```

**Solution:**
1. Identify the correct profile (linked to auth.users with role='consultant')
2. Delete any orphaned/duplicate profiles
3. Verify client relationships are intact
4. Log out completely and clear browser cache
5. Log back in

**Example Fix:**
```sql
-- Delete orphaned profile (make sure it's NOT linked to auth.users!)
DELETE FROM user_profiles
WHERE id = 'orphaned-profile-id'
AND email = 'your-email@example.com';
```

---

### Issue 2: Client Cannot Log In (Password Reset Not Working)

**Symptoms:**
- Client receives password reset email
- Click link but doesn't work
- Redirect fails
- "User not found" error

**Causes:**
1. Auth user not created properly
2. User_profile exists but no auth.users entry
3. Mismatch between user_profile ID and auth.users ID

**Diagnosis:**
```sql
-- Check if auth user exists
SELECT au.id, au.email, au.email_confirmed_at
FROM auth.users au
WHERE au.email = 'client-email@example.com';

-- Check if user_profile exists
SELECT id, email, role, consultant_id
FROM user_profiles
WHERE email = 'client-email@example.com';

-- Verify IDs match
SELECT
  au.id as auth_id,
  up.id as profile_id,
  CASE WHEN au.id = up.id THEN 'MATCH' ELSE 'MISMATCH' END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'client-email@example.com';
```

**Solution:**
If auth user doesn't exist:
```bash
# Use the create-auth-user script
node scripts/create-auth-user.mjs
```

If IDs mismatch:
1. Delete user_profile (if safe)
2. Re-create with correct auth user ID
3. Or update user_profile ID to match auth.users ID (be careful!)

---

### Issue 3: Consultant Cannot See Their Clients

**Symptoms:**
- Dashboard shows "0 Clients"
- Clients exist in database
- "Demo Mode" message appears

**Causes:**
1. Clients not linked via consultant_id
2. consultant_id is null
3. Wrong consultant_id value

**Diagnosis:**
```sql
-- Check consultant's clients
SELECT
  id,
  email,
  full_name,
  company,
  consultant_id
FROM user_profiles
WHERE consultant_id = 'your-consultant-id';

-- Verify consultant ID
SELECT id, email, role, company
FROM user_profiles
WHERE email = 'consultant-email@example.com'
AND role = 'consultant';
```

**Solution:**
Update client profiles with correct consultant_id:
```sql
UPDATE user_profiles
SET consultant_id = 'correct-consultant-id'
WHERE id = 'client-profile-id';
```

---

### Issue 4: New Client Creation Fails

**Symptoms:**
- "Add Client" form submits but nothing happens
- Infinite spinner
- Error in console: "Failed to create auth user"

**Causes:**
1. SUPABASE_SERVICE_ROLE_KEY not set
2. Service role key incorrect
3. Email already exists in auth.users

**Diagnosis:**
```bash
# Check environment variable
grep SUPABASE_SERVICE_ROLE_KEY .env.local

# Check if email already exists
# (Use Supabase dashboard or SQL query)
```

**Solution:**
1. Verify SUPABASE_SERVICE_ROLE_KEY in .env.local
2. Check Supabase dashboard for existing users
3. If user exists, link to existing auth user instead

---

### Issue 5: Client Has Projects But Consultant Can't See Them

**Symptoms:**
- Client has created projects
- Consultant cannot see client's projects
- Projects show up for client but not consultant

**Causes:**
1. `client_id` field not yet added to projects table (future enhancement)
2. Projects only link to user_id, no consultant visibility yet

**Status:** This is expected behavior - the architecture doesn't yet support consultant → client → projects hierarchy.

**Solution:**
Add client_id to projects table (future enhancement):
```sql
ALTER TABLE projects
ADD COLUMN client_id uuid
REFERENCES user_profiles(id);

-- Update existing projects
UPDATE projects p
SET client_id = up.id
FROM user_profiles up
WHERE p.user_id = up.id
AND up.consultant_id IS NOT NULL;
```

---

### Issue 6: Migration Script Fails with "duplicate key" Error

**Symptoms:**
- Running migrate-existing-client.mjs fails
- Error: "duplicate key value violates unique constraint"
- Auth user created but profile creation fails

**Causes:**
1. User_profile already exists with that ID
2. Auth user ID doesn't match expected user_profile ID
3. Previous migration attempt left orphaned data

**Solution:**
1. Check if user_profile exists
2. Update existing profile instead of creating new
3. Or delete orphaned profile and retry

```sql
-- Check for existing profile
SELECT id, email, role, consultant_id
FROM user_profiles
WHERE email = 'client-email@example.com';

-- Update existing profile
UPDATE user_profiles
SET
  consultant_id = 'consultant-id',
  company = 'Company Name',
  role = 'founder'
WHERE email = 'client-email@example.com';
```

---

## Debugging SQL Queries

### View Complete Consultant → Client Hierarchy
```sql
SELECT
  'Consultant' as type,
  id,
  email,
  full_name,
  company,
  role
FROM user_profiles
WHERE role = 'consultant'

UNION ALL

SELECT
  'Client' as type,
  up.id,
  up.email,
  up.full_name,
  up.company,
  up.role
FROM user_profiles up
WHERE up.consultant_id IS NOT NULL
ORDER BY type DESC, email;
```

### Check for Orphaned Profiles
```sql
-- Find profiles not linked to auth.users
SELECT up.id, up.email, up.role, up.company
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL;
```

### Verify Auth ↔ Profile Consistency
```sql
-- Check all users and their profiles
SELECT
  au.id as auth_id,
  au.email,
  up.id as profile_id,
  up.role,
  up.company,
  CASE
    WHEN au.id = up.id THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.email;
```

---

## Prevention Best Practices

1. **Always verify no duplicates before creating users**
   ```sql
   SELECT COUNT(*) FROM user_profiles WHERE email = 'email@example.com';
   ```

2. **Use transactions for multi-step operations**
   - Create auth user + user_profile as atomic operation
   - Rollback if any step fails

3. **Validate consultant_id before linking**
   ```sql
   SELECT id FROM user_profiles
   WHERE id = 'consultant-id' AND role = 'consultant';
   ```

4. **Always check auth.users before creating profiles**
   - Prevents orphaned profiles
   - Ensures ID consistency

5. **Log out/in after schema changes**
   - Clears cached user data
   - Loads fresh profile information

---

## Quick Reference Commands

```bash
# Check user profile
npm run db:query "SELECT * FROM user_profiles WHERE email = 'email@example.com'"

# Send password reset
node scripts/send-password-reset.mjs

# Migrate existing client
node scripts/migrate-existing-client.mjs

# Create auth user for existing profile
node scripts/create-auth-user.mjs
```

---

## Getting Help

If you encounter an issue not covered here:

1. Check Supabase logs in dashboard
2. Check browser console for errors
3. Verify environment variables
4. Review MIGRATION_COMPLETE.md for architecture details
5. Check database for duplicate/orphaned records

**Emergency Rollback:**
```sql
-- Remove consultant_id column
ALTER TABLE user_profiles DROP COLUMN consultant_id;

-- Restore old API routes from git
git checkout HEAD~1 -- src/app/api/clients/
```
