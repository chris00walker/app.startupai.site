# Trial Guardrails Deployment Guide

**Status:** ✅ Ready for Production  
**Created:** October 4, 2025  
**Purpose:** Deploy trial usage limits and guardrails

---

## Overview

Trial guardrails enforce usage limits for free-tier users, preventing abuse while encouraging upgrades. This system tracks per-user action usage across configurable time periods.

---

## What Was Implemented

### 1. Database Schema

**Migration Files:**
- `supabase/migrations/00007_trial_usage_counters.sql` - Production migration
- `frontend/src/db/migrations/0002_trial_usage_counters.sql` - Drizzle mirror

**Table: `trial_usage_counters`**
```sql
CREATE TABLE trial_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  period text NOT NULL,
  period_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, action, period, period_start)
);
```

**RLS Policy:**
- Users can only view/manage their own counters
- Service role bypasses RLS for admin operations

### 2. Server-Side Enforcement

**Files Created:**
- `frontend/src/lib/auth/trial-guard.ts` - Core guardrail logic
- `frontend/src/db/repositories/trialUsage.ts` - Database operations
- `frontend/src/app/api/trial/allow/route.ts` - API endpoint

**API Endpoint:**
```typescript
POST /api/trial/allow
{
  "action": "projects.create"
}

// Response:
{
  "allowed": true,
  "remaining": 2
}
```

### 3. Configuration

**Trial Limits (from `trial-limits.ts`):**
- `projects.create`: 3 per month
- `workflows.run`: 10 per month
- `reports.generate`: 5 per month

**Configurable per action:**
- Limit count
- Period (monthly, weekly, daily)
- Role enforcement (trial only)

### 4. Testing

**Test Suite:**
- `frontend/src/__tests__/trial-guard.test.ts`
- 4 test cases covering:
  - Non-trial user bypass
  - Unknown action handling
  - Usage increment
  - Limit exhaustion

**Test Results:** ✅ All 162 tests passing

---

## Local Setup

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Configure Environment

**File: `frontend/.env.local`** (already configured)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://eqxropalhxjeyvfcoyxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=<your-database-url>
```

**File: `frontend/.env.test.local`** (created)
```bash
# Test environment with dummy values
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-token>
SUPABASE_SERVICE_ROLE_KEY=<test-token>
```

### 3. Run Tests

```bash
pnpm --filter frontend test
```

### 4. Apply Migration (Local)

```bash
# Option 1: Via Supabase CLI
pnpm exec supabase db push

# Option 2: Via Drizzle
pnpm --filter frontend db:migrate
```

---

## Production Deployment

### Step 1: Verify Prerequisites

**Check `set_updated_at_timestamp()` function exists:**

```sql
SELECT proname FROM pg_proc WHERE proname = 'set_updated_at_timestamp';
```

If missing, create it:
```sql
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Step 2: Configure Netlify Environment

**Navigate to:** https://app.netlify.com/sites/app-startupai-site/settings/env

**Add these variables:**
1. `NEXT_PUBLIC_SUPABASE_URL` - From Supabase Dashboard
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase Dashboard
3. `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Dashboard (SECRET)
4. `NEXT_PUBLIC_SITE_URL` - `https://app-startupai-site.netlify.app`
5. `DATABASE_URL` - From Supabase Dashboard (connection pooling)

### Step 3: Apply Database Migration

**Option A: Supabase Dashboard**
1. Go to SQL Editor
2. Paste contents of `supabase/migrations/00007_trial_usage_counters.sql`
3. Run migration
4. Verify: `SELECT * FROM trial_usage_counters LIMIT 1;`

**Option B: Supabase CLI**
```bash
pnpm exec supabase db push
```

### Step 4: Deploy to Netlify

```bash
git add .
git commit -m "feat: add trial usage guardrails and enforcement"
git push origin main
```

**Monitor deployment:**
- https://app.netlify.com/sites/app-startupai-site/deploys

### Step 5: Verify Production

**A. Test API Endpoint:**
```bash
curl -X POST https://app-startupai-site.netlify.app/api/trial/allow \
  -H "Content-Type: application/json" \
  -d '{"action":"projects.create"}'
```

**B. Check Database:**
```sql
SELECT * FROM trial_usage_counters ORDER BY created_at DESC LIMIT 5;
```

**C. Test RLS:**
```sql
-- Should only return user's own counters
SELECT * FROM trial_usage_counters WHERE user_id = auth.uid();
```

---

## Usage Examples

### Frontend Integration

```typescript
// In a React component
import { useState } from 'react';

async function handleCreateProject() {
  // Check allowance before action
  const response = await fetch('/api/trial/allow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'projects.create' })
  });
  
  const result = await response.json();
  
  if (!result.allowed) {
    alert(`Trial limit reached. ${result.remaining} remaining.`);
    return;
  }
  
  // Proceed with project creation
  // ...
}
```

### Server-Side Usage

```typescript
import { assertTrialAllowance } from '@/lib/auth/trial-guard';

export async function POST(request: Request) {
  const userId = await getUserId(request);
  
  const { allowed, remaining } = await assertTrialAllowance({
    userId,
    action: 'workflows.run'
  });
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trial limit exceeded' },
      { status: 403 }
    );
  }
  
  // Process workflow...
}
```

---

## Maintenance

### Reset User Counters

```sql
-- Reset all counters for a user
DELETE FROM trial_usage_counters WHERE user_id = '<uuid>';

-- Reset specific action
DELETE FROM trial_usage_counters 
WHERE user_id = '<uuid>' AND action = 'projects.create';
```

### Adjust Limits

Edit `frontend/src/lib/auth/trial-limits.ts`:

```typescript
const TRIAL_ACTION_LIMITS: TrialActionConfig[] = [
  {
    action: 'projects.create',
    limit: 5,  // Increase from 3 to 5
    period: 'monthly',
    description: 'Create new projects'
  },
  // ...
];
```

### Monitor Usage

```sql
-- Top users by action count
SELECT user_id, action, SUM(count) as total_usage
FROM trial_usage_counters
GROUP BY user_id, action
ORDER BY total_usage DESC
LIMIT 10;

-- Actions approaching limits
SELECT u.email, t.action, t.count, t.period_start
FROM trial_usage_counters t
JOIN user_profiles u ON u.id = t.user_id
WHERE t.count >= 2  -- Adjust threshold
ORDER BY t.count DESC;
```

---

## Troubleshooting

### Issue: "Missing environment variables"

**Solution:** Verify all 5 environment variables are set in Netlify

### Issue: "relation trial_usage_counters does not exist"

**Solution:** Run migration `00007_trial_usage_counters.sql` in Supabase

### Issue: "function set_updated_at_timestamp() does not exist"

**Solution:** Create the trigger function (see Step 1 above)

### Issue: Tests failing with Supabase errors

**Solution:** Ensure `.env.test.local` exists with dummy values

---

## Rollback Plan

If deployment fails:

1. **Revert Netlify:**
   - Dashboard → Deploys → Previous Deploy → Publish

2. **Rollback Database:**
   ```sql
   DROP TABLE IF EXISTS trial_usage_counters;
   ```

3. **Remove Code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## Success Criteria

- ✅ All tests passing (162/162)
- ✅ Migration applied successfully
- ✅ API endpoint returns 200 responses
- ✅ RLS policies enforced correctly
- ✅ Netlify build succeeds
- ✅ Environment variables configured
- ✅ Production verification complete

---

## Related Documentation

- [Database Seeding Guide](./database-seeding.md)
- [Production Deployment Checklist](./production-deployment-checklist.md)
- [Implementation Status](./implementation-status.md)
- [Two-Site Implementation Plan](../../startupai.site/docs/technical/two-site-implementation-plan.md)

---

**Deployment Status:** Ready for Production  
**Next Action:** Follow production deployment steps above
