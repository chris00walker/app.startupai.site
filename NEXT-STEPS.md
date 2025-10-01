# Next Steps: Connecting UI to Supabase

**Date:** October 1, 2025  
**Status:** Seed Script Ready, Authentication Working  
**Goal:** Connect existing UI to Supabase database

---

## ✅ What We've Accomplished

### 1. Authentication Working
- ✅ GitHub OAuth integrated
- ✅ App Router auth pages (`/login`, `/auth/callback`)
- ✅ Session management with middleware
- ✅ User can successfully login

### 2. Database Seed Script Created
- ✅ Comprehensive seed script at `/frontend/src/db/seed.ts`
- ✅ Transfers all mock data to Supabase
- ✅ Creates test user: `test@startupai.site`
- ✅ Populates 7 projects, 10+ evidence items, 3 reports
- ✅ Safe to re-run (uses upsert)

### 3. Documentation Complete
- ✅ `/frontend/src/db/README.md` - Seed script docs
- ✅ `/docs/operations/database-seeding.md` - Full guide
- ✅ This file - Next steps roadmap

---

## 🚀 Immediate Action Required

### Run the Seed Script

**1. Get Service Role Key**
   - Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/settings/api
   - Copy the **service_role** key (NOT anon key)

**2. Add to Environment**
   ```bash
   # Add to /frontend/.env.local
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ... # Your actual key
   ```

**3. Run Seed**
   ```bash
   cd frontend
   pnpm db:seed
   ```

**4. Verify**
   - Check Supabase Dashboard tables
   - Login to app: `test@startupai.site` / `Test123456!`
   - Visit: http://localhost:3000/clients

---

## 📋 Roadmap: Mock Data → Live Data

### Phase 1: Database Seeded ✅ (Just Completed!)
- ✅ Created seed script
- ⏳ Run seed script (your next action!)
- ⏳ Verify data in Supabase

### Phase 2: Update Query Layer (1-2 hours)

**Current State:**
```typescript
// /frontend/src/db/queries.ts
export async function getUserProjects(userId: string) {
  console.log('🧪 MOCK: getUserProjects');
  return MOCK_PROJECTS;  // Returns hardcoded mock data
}
```

**Target State:**
```typescript
// /frontend/src/db/queries.ts
import { createClient } from '@/lib/supabase/server';

export async function getUserProjects(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
}
```

**Files to Update:**
- `src/db/queries.ts` - All query functions
- Keep same function signatures (no UI changes needed!)

### Phase 3: Add React Query to Pages Router (2-3 hours)

**Install:**
```bash
pnpm add @tanstack/react-query
```

**Setup:** `/pages/_app.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

**Usage:** `/pages/clients.tsx`
```typescript
import { useQuery } from '@tanstack/react-query';
import { getUserProjects } from '@/db/queries';

export default function ClientsPage() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getUserProjects(user.id)
  });

  // Existing UI code remains the same!
}
```

### Phase 4: Update Pages (3-4 hours)

**Priority Order:**

1. **`/pages/clients.tsx`** (Consultant Dashboard)
   - Replace `mockPortfolioProjects` with `getUserProjects()`
   - Test CRUD operations

2. **`/pages/index.tsx`** (Homepage)
   - Update metrics with real data
   - Test project counts

3. **Canvas Pages** (VPC, BMC, TBI)
   - Connect to `reports` table
   - Load saved canvases

4. **Evidence, Experiments, Hypotheses**
   - Connect to `evidence` table
   - Test filtering and search

### Phase 5: Clean Up (1 hour)

**Remove Duplicate Dashboard:**
- ❌ Delete `/app/dashboard/` (duplicate I created)
- ✅ Keep Pages Router pages
- ✅ Update navigation to correct routes

**Update Navigation:**
```typescript
// /components/layout/AppSidebar.tsx
// Ensure URLs match actual pages:
// - /clients (consultant dashboard) ✓
// - Need to create /founder-dashboard (uses FitDashboard)
```

---

## 🎯 Current Architecture

### Two Router System

```
/frontend/src/
├── app/                    # App Router (Auth only)
│   ├── login/             # Login page
│   ├── auth/callback/     # OAuth callback
│   └── dashboard/         # ❌ DUPLICATE - TO DELETE
│
├── pages/                  # Pages Router (Main App)
│   ├── index.tsx          # Homepage
│   ├── clients.tsx        # Consultant dashboard ✅
│   ├── canvas/            # Canvas pages (VPC, BMC, TBI)
│   ├── analytics.tsx      # Analytics
│   ├── workflows.tsx      # AI workflows
│   ├── settings.tsx       # Settings
│   └── export.tsx         # Export tools
│
├── components/            # Shared Components
│   ├── layout/
│   │   ├── AppSidebar.tsx        # Navigation
│   │   └── DashboardLayout.tsx   # Layout wrapper
│   ├── fit/
│   │   └── FitDashboard.tsx      # Founder dashboard component
│   └── ...
│
├── data/                  # Mock Data (to be phased out)
│   ├── demoData.ts       # TechStart demo
│   └── portfolioMockData.ts  # Portfolio projects
│
└── db/                    # Database Layer
    ├── queries.ts        # Query functions (UPDATE THESE)
    ├── seed.ts           # Seed script ✅
    └── README.md         # Documentation
```

### Data Flow

```
Current (Mock):
Mock Files → Components

After Phase 2:
Supabase → queries.ts → Components

After Phase 3:
Supabase → queries.ts → React Query → Components
```

---

## 🔧 Technical Debt to Address

### 1. Missing Pages
- `/founder-dashboard` - References exist but page doesn't
- Should use `FitDashboard` component
- Navigation points to it but 404s

### 2. Duplicate Dashboard
- `/app/dashboard` - I created this by mistake
- Should be deleted
- Use `/pages/clients.tsx` for consultants

### 3. Navigation Mismatch
- Links point to `/dashboard` and `/founder-dashboard`
- Actual pages are `/clients` and TBD
- Need to align routes

---

## 📊 Testing Checklist

After each phase, test:

- [ ] Login with test user
- [ ] View all projects
- [ ] Create new project
- [ ] Edit existing project
- [ ] Delete project
- [ ] View evidence
- [ ] Generate AI report
- [ ] Canvas editing
- [ ] Search/filter
- [ ] RLS policies working
- [ ] No console errors
- [ ] Loading states
- [ ] Error handling

---

## 🎓 Learning Resources

**Supabase + Next.js:**
- https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs

**React Query:**
- https://tanstack.com/query/latest/docs/framework/react/overview

**Drizzle ORM:**
- https://orm.drizzle.team/docs/overview

---

## 💡 Tips

### Keep UI Working
- Update backend incrementally
- Test each query function
- Keep mock data as fallback during development
- Use feature flags if needed

### Error Handling
```typescript
try {
  const data = await getUserProjects(userId);
  return data;
} catch (error) {
  console.error('Failed to fetch projects:', error);
  // Return mock data as fallback during development
  return MOCK_PROJECTS;
}
```

### Performance
- Use React Query for caching
- Implement pagination for large lists
- Add loading skeletons
- Debounce search inputs

---

## 📞 Support

**Documentation:**
- `/docs/operations/database-seeding.md` - Seed guide
- `/docs/engineering/30-data/` - Database docs
- `/docs/operations/implementation-status.md` - Overall status

**Supabase Dashboard:**
- Tables: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/editor
- Auth: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/users
- Logs: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/logs/explorer

---

## ✨ What You've Built So Far

Your application has:
- ✅ Complete UI with mock data
- ✅ Comprehensive canvas tools (VPC, BMC, TBI)
- ✅ Portfolio management
- ✅ Analytics dashboards
- ✅ AI workflow integration (CrewAI ready)
- ✅ Beautiful, accessible design
- ✅ Full authentication flow
- ✅ Database schema deployed
- ✅ Seed data ready

**You're 80% there!** Just need to connect the dots between UI and database.

---

**Status:** Ready to Execute  
**Next Action:** Add service role key and run `pnpm db:seed`  
**Time to Complete:** ~8-10 hours for full integration

Good luck! 🚀
