# Database Seeding Guide

**Status:** ✅ Ready to Run  
**Created:** October 1, 2025  
**Purpose:** Populate Supabase with existing mock data for development

---

## Overview

We've created a comprehensive seed script that transfers all your existing mock data from the frontend into Supabase. This allows you to:
- ✅ Test database integration with familiar data
- ✅ Develop business logic against real database
- ✅ Transition smoothly from mock to live data
- ✅ Preserve all your existing UI work

---

## Quick Start

### 1. Get Your Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/settings/api)
2. Copy the **service_role** key (NOT the anon key)
3. Add to `/frontend/.env.local`:

```bash
# Add this line (keep existing vars)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Run the Seed

```bash
cd frontend
pnpm db:seed
```

### 3. Login with Test Account

```
Email: test@startupai.site
Password: Test123456!
```

---

## What Gets Seeded

### Mock Data Sources

**All data comes from your existing files:**
- `src/data/demoData.ts` - TechStart Inc. demo client
- `src/data/portfolioMockData.ts` - 6 portfolio projects

### Data Breakdown

| Category | Count | Description |
|----------|-------|-------------|
| **User Profile** | 1 | Test user with Pro subscription |
| **Projects** | 7 | Portfolio projects + TechStart demo |
| **Evidence** | 10+ | Hypotheses, experiments, customer insights |
| **Reports** | 3 | VPC, BMC, TBI canvases |

### Projects

1. **TechStart Inc.** - AI fitness app (DESIRABILITY)
2. **CloudCorp** - Cloud platform (FEASIBILITY)
3. **AppVenture** - Mobile app (VIABILITY)
4. **FinanceFlow** - Fintech (DESIRABILITY)
5. **RetailRev** - Retail tech (FEASIBILITY)
6. **HealthTech Solutions** - Healthcare (SCALE)

---

## Files Created

```
frontend/src/db/
├── seed.ts           # Main seed script
└── README.md         # Detailed documentation

docs/operations/
└── database-seeding.md  # This file
```

### Seed Script Features

✅ **Idempotent** - Safe to re-run  
✅ **Error Handling** - Clear error messages  
✅ **Type Safe** - Uses Supabase client types  
✅ **Detailed Logging** - See what's happening  
✅ **Test User Creation** - Auto-creates login  

### Trial Usage Counters

**Migration:** `00007_trial_usage_counters.sql` (Supabase) / `0002_trial_usage_counters.sql` (Drizzle)

**Purpose:** Enforce trial usage limits (projects: 3/mo, workflows: 10/mo, reports: 5/mo)

**Production Deployment:**
1. Verify function exists: `SELECT proname FROM pg_proc WHERE proname = 'set_updated_at_timestamp';` (created in migration 00005)
2. Configure Netlify env vars (5 required): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL, DATABASE_URL
3. Apply migration in Supabase SQL Editor: Copy `supabase/migrations/00007_trial_usage_counters.sql` and run
4. Verify: `SELECT * FROM trial_usage_counters LIMIT 1;`
5. Test API: `curl -X POST https://app-startupai-site.netlify.app/api/trial/allow -H "Content-Type: application/json" -d '{"action":"projects.create"}'`

**Reset user counters:**
```sql
DELETE FROM trial_usage_counters WHERE user_id = '<uuid>';
```

**Check usage:**
```sql
SELECT user_id, action, SUM(count) as total
FROM trial_usage_counters
GROUP BY user_id, action
ORDER BY total DESC LIMIT 10;
```

---

## Verification Steps

### 1. Check Supabase Dashboard

Visit: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/editor

Verify tables:
- `user_profiles` (1 row)
- `projects` (7 rows)
- `evidence` (10+ rows)
- `reports` (3 rows)

### 2. Login to App

```bash
cd frontend
pnpm dev
```

Navigate to: http://localhost:3000/login

Login with:
- Email: `test@startupai.site`
- Password: `Test123456!`

### 3. Check Data in UI

Visit: http://localhost:3000/clients

You should see all 7 projects displayed.

---

## Next Steps

Now that you have data in Supabase, you can:

### Phase 1: Update Query Layer (Done!)

✅ Created `src/db/queries.ts` with mock data  
✅ Next: Update to fetch from Supabase

### Phase 2: Connect Pages Router

Update existing pages to use queries:
```typescript
// Instead of:
import { mockPortfolioProjects } from '@/data/portfolioMockData'

// Use:
import { getUserProjects } from '@/db/queries'
```

### Phase 3: Add React Query

Install and configure:
```bash
pnpm add @tanstack/react-query
```

Wrap pages with QueryClientProvider for caching.

### Phase 4: Test Everything

- Login flow
- Data fetching
- CRUD operations
- RLS policies

---

## Troubleshooting

### "Missing environment variables"

**Problem:** Service role key not found

**Solution:**
```bash
# Add to .env.local
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

Get key from: [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/settings/api)

### "User already registered"

**Problem:** Test user exists from previous run

**Solution:** This is normal! Script will use existing user.

### "relation does not exist"

**Problem:** Database tables not created

**Solution:** 
1. Check Supabase dashboard
2. Verify tables exist
3. If not, refer to `/docs/engineering/30-data/drizzle-schema.md`

### Tables exist but no data

**Problem:** RLS policies blocking inserts

**Solution:**
- Service role key bypasses RLS
- Ensure you're using service_role key, not anon key
- Check `.env.local` has correct key

---

## Architecture Notes

### Two Router System

**App Router** (`/src/app`):
- Authentication pages
- OAuth callbacks
- Login/Signup

**Pages Router** (`/src/pages`):
- Main application UI
- Dashboard, clients, canvas pages
- Uses existing components

### Data Flow

```
Mock Data Files
    ↓
Seed Script (seed.ts)
    ↓
Supabase Database
    ↓
Query Layer (queries.ts)
    ↓
React Components
```

### Current State

✅ Mock data → Supabase: **READY**  
⏳ Supabase → Query layer: **TODO**  
⏳ Query layer → Components: **TODO**  
✅ Auth flow: **WORKING**

---

## Seed Script Internals

### Functions

1. **createTestUser()** - Creates/finds test user
2. **seedUserProfile()** - Inserts profile data
3. **seedProjects()** - Inserts project records
4. **seedEvidence()** - Inserts evidence/experiments
5. **seedReports()** - Inserts AI-generated reports

### Upsert Strategy

```typescript
.upsert(data, {
  onConflict: 'id',        // Or 'name,user_id'
  ignoreDuplicates: true   // Skip if exists
})
```

This allows safe re-running without duplicates.

---

## Production Considerations

⚠️ **This is for development only!**

For production:
1. ❌ Do NOT use service role key in frontend
2. ❌ Do NOT commit service role key to Git
3. ✅ Use RLS policies for data security
4. ✅ Use anon key with proper auth checks
5. ✅ Seed via CI/CD or admin dashboard

---

## Resources

**Documentation:**
- [Supabase Setup Guide](../engineering/30-data/supabase-setup.md)
- [Drizzle Schema](../engineering/30-data/drizzle-schema.md)
- [Implementation Status](./implementation-status.md)

**Supabase Dashboard:**
- [API Keys](https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/settings/api)
- [Table Editor](https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/editor)
- [Auth Users](https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/users)

---

**Last Updated:** October 1, 2025  
**Status:** Ready for Testing  
**Next Action:** Add SUPABASE_SERVICE_ROLE_KEY and run `pnpm db:seed`
