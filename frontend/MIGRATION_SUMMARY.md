# Client Management Architecture Migration

## Summary

Successfully migrated from CRM-style `clients` table to user-based client management where clients are actual users who can log in.

## Architecture Changes

### Before (CRM Model)
```
consultants (user_profiles) → clients (data table) ✗ No login capability
```

### After (User Model)
```
consultants (user_profiles) ← consultant_id ← clients (user_profiles with auth) ✓ Full login capability
```

## Key Principle

**Clients are Founders who work with a Consultant**
- Clients see the same UI as founders
- Clients can create projects
- Consultants see a portfolio view of all their clients
- Consultants can drill down into individual client accounts

## Database Changes

### Migration: `0004_add_consultant_id_to_user_profiles.sql`

```sql
ALTER TABLE "user_profiles"
ADD COLUMN "consultant_id" uuid;

ALTER TABLE "user_profiles"
ADD CONSTRAINT "user_profiles_consultant_id_fkey"
FOREIGN KEY ("consultant_id")
REFERENCES "public"."user_profiles"("id")
ON DELETE SET NULL;

CREATE INDEX "user_profiles_consultant_id_idx"
ON "user_profiles" ("consultant_id");
```

**Status:** ✅ Applied to database

## Code Changes

### 1. `/src/hooks/useClients.ts` ✅
- **Before:** Queries `clients` table
- **After:** Queries `user_profiles` where `consultant_id = current_user.id`
- **Impact:** Dashboard now shows real client user accounts

### 2. `/src/app/api/clients/route.ts` ✅
- **Before:** Inserts into `clients` table (no auth account created)
- **After:**
  1. Creates Supabase auth user with `auth.admin.createUser()`
  2. Creates `user_profile` with `consultant_id` set
  3. Sends password reset email to client
- **Impact:** Clients can now log in to the platform

### 3. `/src/app/api/clients/[id]/route.ts` ✅
- **Before:** Fetches from `clients` table
- **After:** Fetches from `user_profiles` where `consultant_id` matches
- **Impact:** Client detail pages work with new schema

## Data Migration Required

### Existing Client Record
```
ID: bb242900-3444-4897-9113-99eae6789d00
Name: Suzanne Walker
Email: suzanne00walker@gmail.com
Company: Elias Food Imports
Consultant: Chris Walker (e0dc74ab-8222-4c5f-af20-11e972f24c03)
```

### Migration Steps
This existing client needs to be converted to a user account:

1. **Option A (Recommended):** Use the new client creation flow
   - Consultant re-adds the client through the UI
   - System creates auth account and sends invite
   - Old client record can be archived

2. **Option B:** Manual migration script
   - Create auth user for suzanne00walker@gmail.com
   - Create user_profile with consultant_id set
   - Send password reset email

## Environment Variables

Required for client creation (already configured in `.env.local`):
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJh... (✅ Present)
NEXT_PUBLIC_SUPABASE_URL=https://... (✅ Present)
```

## Testing Checklist

### Consultant Flow
- [ ] Consultant logs in to dashboard
- [ ] Consultant sees "Active Clients" heading
- [ ] Consultant clicks "Add Client"
- [ ] Consultant fills out client form
- [ ] Client auth account is created
- [ ] Client receives password reset email
- [ ] Consultant sees new client in dashboard with "Live Data" badge

### Client Flow
- [ ] Client receives invite email
- [ ] Client clicks link and sets password
- [ ] Client logs in
- [ ] Client sees same UI as a founder would see
- [ ] Client can create projects
- [ ] Projects are linked to client user account

### Consultant → Client → Projects Flow
- [ ] Consultant can view client's projects
- [ ] Projects have `user_id` = client's user_id
- [ ] Consultant dashboard shows aggregated client metrics

## Next Steps

1. **Test the new client creation flow**
   - Create a new test client
   - Verify auth account creation
   - Check password reset email delivery

2. **Migrate existing client** (Suzanne Walker / Elias Food Imports)
   - Either re-add through UI or create migration script

3. **Add client_id to projects table** (Future enhancement)
   ```sql
   ALTER TABLE projects ADD COLUMN client_id uuid REFERENCES user_profiles(id);
   ```
   This would enable consultants to see which client owns which project.

4. **Deprecate old clients table**
   - Once migration is complete and tested
   - Remove old API routes and references
   - Drop table after backup

## Rollback Plan

If issues arise:
1. Revert migration: `DROP COLUMN consultant_id FROM user_profiles`
2. Restore old API routes from git history
3. Re-enable clients table queries

## Notes

- The old `clients` table still exists but is no longer used
- All new client creations will create proper user accounts
- Consultants manage clients through `user_profiles.consultant_id` relationship
- This architecture supports the principle: **Clients = Founders + Consultant relationship**
