# Database Seeding

This directory contains database utilities for seeding Supabase with mock data for development and testing.

## Overview

The seed script (`seed.ts`) populates your Supabase database with:
- ✅ Test user account
- ✅ User profile
- ✅ 7 sample projects (portfolio + demo data)
- ✅ 10+ evidence items with hypotheses and experiments
- ✅ 3 AI-generated reports (VPC, BMC, TBI)

All data is taken from your existing mock data files:
- `/src/data/demoData.ts` - TechStart Inc demo client
- `/src/data/portfolioMockData.ts` - Portfolio projects

## Prerequisites

Before running the seed script, ensure you have:

1. **Environment variables set** in `/frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Required for seeding!
   ```

2. **Database tables created**. The tables should already exist from the Drizzle migrations:
   - `user_profiles`
   - `projects`
   - `evidence`
   - `reports`

   If not, refer to `/docs/engineering/30-data/drizzle-schema.md`

## Running the Seed Script

```bash
cd frontend
pnpm db:seed
```

## Test Credentials

After seeding, you can login with:
- **Email:** `test@startupai.site`
- **Password:** `Test123456!`

## What Gets Seeded

### 1. User Profile
- Email: test@startupai.site
- Name: Test User
- Company: StartupAI Demo
- Subscription: Pro (Active)

### 2. Projects (7 total)
From portfolio mock data:
1. TechStart Inc. (DESIRABILITY stage)
2. CloudCorp (FEASIBILITY stage)
3. AppVenture (VIABILITY stage)
4. FinanceFlow (DESIRABILITY stage)
5. RetailRev (FEASIBILITY stage)
6. HealthTech Solutions (SCALE stage)

Plus the detailed TechStart Inc. demo project.

### 3. Evidence Items
For TechStart Inc.:
- Customer jobs, pains, and gains from VPC
- 5 validated/testing hypotheses
- 3 experiment results with analytics
- Tags: desirability, feasibility, viability, experiment, etc.

### 4. Reports (AI-Generated)
For TechStart Inc.:
- **Value Proposition Canvas** - Complete customer segment & value map
- **Business Model Canvas** - Full 9-block business model
- **Testing Business Ideas** - Hypothesis validation framework

## Re-Running the Seed

The seed script uses `upsert` for most data, so you can re-run it safely:
```bash
pnpm db:seed
```

This will:
- ✅ Update existing records
- ✅ Skip duplicates
- ✅ Add new records

## Verification

After seeding, verify the data:

1. **Via Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Check the "Table Editor" for each table

2. **Via the application:**
   - Run `pnpm dev`
   - Login with test credentials
   - Navigate to `/consultant-dashboard` (consultant dashboard)
   - Check that all 7 projects appear

## Troubleshooting

### Error: "Missing environment variables"
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`. Find it in your Supabase Dashboard under Settings → API.

### Error: "relation 'projects' does not exist"
**Solution:** Run the Drizzle migrations first or create tables manually using the schema in `/docs/engineering/30-data/drizzle-schema.md`

### Error: "User already registered"
**Solution:** This is normal! The script will find and use the existing user.

### Error: "Invalid JWT"
**Solution:** Ensure your `SUPABASE_SERVICE_ROLE_KEY` is correct (not the anon key).

## Next Steps

After seeding:

1. **Update queries.ts** to fetch from Supabase instead of returning mock data
2. **Add React Query** for data fetching in Pages Router
3. **Test authentication flow** end-to-end
4. **Connect UI components** to real data

See the main implementation plan in `/docs/operations/implementation-status.md`

## Development Workflow

```bash
# 1. Seed the database
pnpm db:seed

# 2. Start the dev server
pnpm dev

# 3. Login with test credentials
# Email: test@startupai.site
# Password: Test123456!

# 4. Explore the seeded data in the UI
```

Happy developing! 🚀

---

## Recent Changes (2025-11-13)

### Dashboard Routes Updated
- Consultant dashboard moved from `/dashboard` to `/consultant-dashboard`
- Founder dashboard at `/founder-dashboard`
- Login now redirects to role-specific dashboards

### Row Level Security Status
- ⚠️ RLS currently **DISABLED** on `user_profiles` table
- Required for production deployment
- See `MIGRATION_SUMMARY.md` for re-enabling instructions
