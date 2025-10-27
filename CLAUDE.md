# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **Product Platform** (`app.startupai.site`) in StartupAI's two-site architecture. It implements an evidence-led strategy platform that helps entrepreneurs validate business ideas through systematic experimentation, powered by CrewAI agents for AI-driven insights.

**Sister Repository:** `startupai.site` (marketing site) - located at `../startupai.site/`
**Master Plan:** `../startupai.site/docs/technical/two-site-implementation-plan.md` (single source of truth)

## Development Commands

### Local Development
```bash
# Install dependencies (uses pnpm 9.12.1)
pnpm install

# Start dev server (uses Turbopack for Next.js 15.5.3)
pnpm dev                    # Runs on http://localhost:3000

# Start both sites for cross-site testing
pnpm dev                    # Terminal 1: app site (port 3000)
pnpm --dir ../startupai.site dev  # Terminal 2: marketing site (port 3001)
```

### Building & Testing
```bash
# Build for production
pnpm build

# Run all tests
pnpm test                   # Jest unit tests (162 passing)
pnpm test:watch             # Jest watch mode
pnpm test:e2e               # Playwright E2E tests (45 tests)
pnpm test:e2e:ui            # Playwright with UI
pnpm test:e2e:backend       # Backend integration tests only
pnpm test:all               # Run unit + integration + E2E

# Run specific test types
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests only
pnpm test:coverage          # With coverage report
```

### Database Operations
```bash
# Generate Drizzle schema from code
pnpm db:generate            # Creates migration files

# Push schema to database
pnpm db:push                # Apply schema changes

# Run migrations
pnpm db:migrate             # Execute pending migrations

# Open Drizzle Studio (visual database browser)
pnpm db:studio              # Web UI at https://local.drizzle.studio

# Seed database with test data
pnpm --filter frontend run db:seed
```

### CrewAI Backend
```bash
# Check CrewAI contract compliance
pnpm crew:contract-check    # Requires CREW_CONTRACT_BEARER env var

# Test Netlify function locally
pnpm test:function          # Invoke onboarding-start function
```

### Documentation & Linting
```bash
# Validate markdown documentation
pnpm lint:md                # Check docs/ for linting errors
pnpm lint:md:fix            # Auto-fix markdown issues

# Note: Frontend linting is deferred (see docs/status/linting.md)
pnpm lint                   # Currently outputs deferred message
```

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 15.5.3 with TypeScript 5.8.3, Hybrid Router (Pages + App Router)
- **Backend:** Netlify Functions (Python 3.10) for CrewAI workflows
- **Database:** Supabase PostgreSQL with Drizzle ORM
- **Vector Search:** pgvector with `match_evidence()` function
- **AI:** CrewAI 0.201.1 with 6-agent workflow
- **Auth:** Supabase JWT with GitHub OAuth (primary) and email fallback
- **Analytics:** PostHog (shared with marketing site)
- **Package Manager:** pnpm 9.12.1 (migrated from npm Sept 2025)
- **Deployment:** Netlify at https://app-startupai-site.netlify.app

### Hybrid Router Strategy
This application uses BOTH Pages Router (`pages/`) and App Router (`app/`) intentionally:
- **Pages Router:** Dashboard, canvas tools, legacy features (stable, proven)
- **App Router:** Auth flows, onboarding wizard, new API routes (modern, streaming-capable)
- **Decision:** Vercel recommends gradual migration; see `docs/adrs/adr-0002-routing-strategy.md`
- **Do NOT consolidate routers** - this is by design for stability during feature development

### Data Flow

1. **Authentication:**
   - Marketing site (`startupai.site`) captures plan selection → redirects to `/signup?plan=trial|sprint|founder|enterprise`
   - Supabase Auth completes GitHub OAuth or email signup
   - `handle_new_user` trigger (migration `00010`) creates `user_profiles` row
   - Session cookie set, user lands in authenticated App Router

2. **Onboarding (CrewAI-Powered):**
   - `POST /api/onboarding/start` → Creates session, proxies to Netlify function with `action=conversation_start`
   - `POST /api/onboarding/message` → Validates session, forwards to CrewAI, persists conversation + quality signals
   - `POST /api/onboarding/complete` → Upserts entrepreneur brief, creates project, triggers full analysis
   - Quality signals (`clarity_low`, `incomplete`) surface guardrails to prevent premature stage advancement

3. **CrewAI Analysis Pipeline:**
   - Six agents: research, analysis, validation, synthesis, reporting, orchestration
   - Configured via `backend/config/agents.yaml`, orchestrated by `backend/src/startupai/crew.py`
   - Tools: `EvidenceStoreTool`, `WebSearchTool`, `ReportGenerator` (in `backend/src/startupai/tools.py`)
   - Netlify function at `/.netlify/functions/crew-analyze` authenticates JWTs, enforces rate limits (10 req/15min), writes evidence back to Supabase

4. **Dashboard & Evidence:**
   - `useProjects` hook (`frontend/src/hooks/useProjects.ts`) fetches projects from Supabase
   - Evidence ledger integrates pgvector semantic search via `match_evidence()` RPC
   - Gate scoring calculates project readiness based on evidence quality
   - PostHog captures completion, drop-off, and feedback events

### Database Schema (Supabase + Drizzle)

**Core Tables:**
- `user_profiles` - User accounts, roles, plan tiers (RLS: own profile only)
- `trial_usage_counters` - Enforces free-tier limits (unique on user, action, period)
- `projects` - Portfolio data + onboarding metadata (links to `onboarding_sessions`, `entrepreneur_briefs`)
- `evidence` - Validation artifacts with 1536-dim pgvector embeddings
- `reports` - AI-generated deliverables
- `hypotheses` / `experiments` - Validation workflows
- `onboarding_sessions` - Conversation history, stage data, quality scores
- `entrepreneur_briefs` - Structured onboarding outputs

**Key Migrations:**
- `00001_initial_schema.sql` - User profiles and core tables
- `00005_user_roles_and_plans.sql` - Roles enum + timestamp triggers
- `00007_trial_usage_counters.sql` - Trial quotas
- `00009_onboarding_schema.sql` - Onboarding tables + helper functions
- `00010_user_profile_trigger.sql` - Auto-create profiles on signup
- `20251004082434_vector_search_function.sql` - pgvector `match_evidence()` function

**Schema Source of Truth:**
- Drizzle models: `frontend/src/db/schema/*.ts`
- SQL migrations: `frontend/src/db/migrations/*.sql` (generated by Drizzle, reviewed manually)
- Always run `pnpm db:generate` after schema changes, review SQL, then `pnpm db:push`

**Database Queries:**
- Repository pattern: `frontend/src/db/queries/*.ts` (projects, evidence, reports, etc.)
- Admin operations: `frontend/src/lib/supabase/admin.ts` (service-role client, server-only)
- Client operations: `frontend/src/lib/supabase/client.ts` and `server.ts`

### Authentication & Authorization

**Auth Flow:**
- Primary: GitHub OAuth via Supabase
- Fallback: Email/password (Supabase Auth)
- JWT stored in HTTP-only cookie, validated by middleware (`frontend/src/middleware.ts`)
- Role-based routing: `frontend/src/lib/auth/roles.ts` defines `UserRole` enum (founder, consultant, admin)

**Trial Guards:**
- `frontend/src/lib/auth/trial-guard.ts` - Checks usage quotas before allowing actions
- `frontend/src/lib/auth/trial-limits.ts` - Plan limit definitions
- `/api/trial/allow` - Endpoint for quota validation (used by trial users)
- **Temporary Override:** `NEXT_PUBLIC_ONBOARDING_BYPASS=true` disables guards for QA (remove before launch!)

**RLS Policies:**
- All tables enforce `auth.uid()` checks
- Service-role operations use `frontend/src/lib/supabase/admin.ts` (server-only!)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client

### Important File Locations

**API Routes (App Router):**
- `frontend/src/app/api/onboarding/start/route.ts` - Initialize onboarding session
- `frontend/src/app/api/onboarding/message/route.ts` - Handle conversation turns
- `frontend/src/app/api/onboarding/complete/route.ts` - Finalize onboarding, create project
- `frontend/src/app/api/analyze/route.ts` - Proxy to CrewAI, enforce plan limits
- `frontend/src/app/api/trial/allow/route.ts` - Trial usage validation
- `frontend/src/app/auth/callback/route.ts` - OAuth callback handler

**Key Components:**
- `frontend/src/components/onboarding/OnboardingWizard.tsx` - Main onboarding flow
- `frontend/src/components/onboarding/ProjectCreationWizard.tsx` - Post-onboarding project setup
- `frontend/src/components/dashboard/MetricsCards.tsx` - Dashboard metrics
- `frontend/src/components/gates/GateDashboard.tsx` - Gate scoring UI
- `frontend/src/components/canvas/*.tsx` - Business Model Canvas, Value Prop Canvas, Testing Business Ideas Canvas

**Hooks:**
- `frontend/src/hooks/useProjects.ts` - Fetch and manage projects
- `frontend/src/hooks/useGateEvaluation.ts` - Calculate gate readiness
- `frontend/src/hooks/useDemoMode.ts` - Demo data for unauthenticated users

**Backend (CrewAI):**
- `backend/src/startupai/crew.py` - Crew orchestration
- `backend/src/startupai/tools.py` - Tool implementations
- `backend/config/agents.yaml` - Agent configurations
- `netlify/functions/crew-analyze.py` - Netlify function wrapper

## Common Development Tasks

### Adding a New Database Table

1. Define Drizzle schema in `frontend/src/db/schema/your-table.ts`
2. Export from `frontend/src/db/schema/index.ts`
3. Generate migration: `pnpm db:generate`
4. Review generated SQL in `frontend/src/db/migrations/`
5. Apply locally: `pnpm db:push`
6. Add RLS policies manually in migration file (Drizzle doesn't generate RLS)
7. Create repository file in `frontend/src/db/queries/your-table.ts`
8. Update Supabase: `supabase db push --include-all` (in production)

### Testing Cross-Site Authentication

1. Start both servers (see commands above)
2. Visit http://localhost:3001 (marketing site)
3. Click "Get Started" or "Sign Up"
4. Complete OAuth flow
5. Verify redirect to http://localhost:3000 with valid session
6. Check `user_profiles` in Drizzle Studio to confirm trigger fired

### Working with CrewAI Backend

1. Ensure `.env.local` has `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
2. Check contract: `pnpm crew:contract-check` (requires `CREW_CONTRACT_BEARER`)
3. Test function locally: `netlify dev` then `curl` to `http://localhost:8888/.netlify/functions/crew-analyze`
4. View logs in Netlify dashboard: Functions → crew-analyze → Function log
5. Python backend runs in Netlify serverless environment (26s timeout for Pro, 10s for Free)

### Debugging Onboarding Flow

1. Enable bypass for testing: Set `NEXT_PUBLIC_ONBOARDING_BYPASS=true` in Netlify env vars
2. Check session state in Supabase: `SELECT * FROM onboarding_sessions WHERE user_id = 'uuid'`
3. Verify quality signals in `stage_data` JSON column
4. Check conversation history in `conversation_history` JSONB column
5. Confirm entrepreneur brief created: `SELECT * FROM entrepreneur_briefs WHERE user_id = 'uuid'`
6. Review CrewAI function logs in Netlify dashboard
7. **Remember:** Remove bypass flag before enabling paid access!

### Adding New Plan Limits

1. Update `PLAN_LIMITS` in `frontend/src/app/api/onboarding/start/route.ts`
2. Add action to `trial_usage_counters` table (migration if new action type)
3. Update trial guard logic in `frontend/src/lib/auth/trial-guard.ts`
4. Update docs in marketing repo: `../startupai.site/docs/product/PRD.md`
5. Test with bypass disabled to ensure limits enforce correctly

## Testing Strategy

### Test Organization
- **Unit Tests:** `frontend/src/__tests__/*.test.tsx` (162 passing)
- **Integration Tests:** `frontend/src/__tests__/integration/*.test.ts`
- **E2E Tests:** `frontend/src/__tests__/e2e/*.spec.ts` (Playwright, 45 tests)
- **Specification-Driven:** `frontend/src/components/onboarding/__tests__/*.specification.test.tsx` (validates marketing contracts)

### Running Focused Tests
```bash
# Single test file
pnpm test path/to/file.test.tsx

# Pattern matching
pnpm test:watch --testNamePattern="OnboardingWizard"

# E2E headed mode (see browser)
pnpm test:e2e:headed

# Backend integration only
pnpm test:e2e:backend
```

### Test Fixtures
- Mock data: `frontend/src/data/demoData.ts`, `frontend/src/data/portfolioMockData.ts`
- Test helpers: `frontend/src/__tests__/utils/test-helpers.ts`
- Specification data: `frontend/src/__tests__/utils/specification-data.ts`

## Environment Variables

**Required for Local Development:**
```bash
# Copy example and populate
cp frontend/.env.example frontend/.env.local

# Essential variables:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only!
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres?workaround=supabase-pooler.vercel
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key

# Optional:
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-gemini-key
```

**CrewAI Testing:**
```bash
CREW_CONTRACT_BEARER=test-token-for-local-contract-check
CREW_ANALYZE_URL=http://localhost:8888/.netlify/functions/crew-analyze  # Optional override
```

**Temporary QA Override (remove before launch!):**
```bash
NEXT_PUBLIC_ONBOARDING_BYPASS=true  # Disables monthly onboarding limit
```

**Netlify Deployment:**
- Set in Netlify UI: Site settings → Environment variables
- See `docs/archive/legacy/NETLIFY_ENV_VARS.md` for full list

## Documentation Structure

This repository follows a strict documentation hierarchy. Always check these locations:

**Master Reference (External):**
- `../startupai.site/docs/technical/two-site-implementation-plan.md` - Single source of truth for both sites

**Active Documentation (This Repo):**
- `docs/overview/` - Platform overview, architecture, two-site plan reference
- `docs/specs/` - API contracts, data schema, CrewAI integration, frontend components
- `docs/testing/` - Testing strategy, specification-driven testing
- `docs/work/` - Roadmap, phases, backlog, in-progress work, done items
- `docs/adrs/` - Architecture Decision Records (e.g., two-site architecture, routing strategy)
- `docs/status/` - Implementation status, linting status, release notes

**Archived Documentation:**
- `docs/archive/legacy/` - Historical docs superseded by current specs
- `docs/archive/completion-reports/` - Feature completion reports (CrewAI, PostHog, Gates, TDD)

**External Dependencies:**
- Marketing site docs: `../startupai.site/docs/` (business, product, design)
- Shared design system: `../startupai.site/docs/design/design-system.md`
- Product requirements: `../startupai.site/docs/product/PRD.md`

## Key Constraints & Gotchas

### DO NOT:
- **Consolidate routers** - Hybrid Pages/App Router is intentional (ADR-0002)
- **Create new files unnecessarily** - Prefer editing existing files
- **Expose service-role key to client** - Use `admin.ts` server-side only
- **Skip RLS policies** - Drizzle doesn't generate them; add manually to migrations
- **Launch with bypass enabled** - Set `NEXT_PUBLIC_ONBOARDING_BYPASS=false` before enabling purchases
- **Commit `.env.local`** - Already in `.gitignore`, contains secrets
- **Use Cursor/Copilot rules from other projects** - None exist in this repo

### DO:
- **Read master plan first** - `../startupai.site/docs/technical/two-site-implementation-plan.md` before major changes
- **Update both Drizzle and SQL** - Schema changes require both to stay in sync
- **Test cross-site flows** - Run both servers when changing auth or onboarding
- **Check specification tests** - `*.specification.test.tsx` validates marketing promises
- **Use pnpm** - This project uses `pnpm@9.12.1`, not npm or yarn
- **Review migration SQL** - Don't blindly trust `drizzle-kit generate`; add RLS policies manually
- **Follow TDD** - See `frontend/TDD_IMPLEMENTATION_COMPLETE.md` for testing culture
- **Validate accessibility** - PostHog tracks Core Web Vitals (LCP < 2.2s, INP < 200ms)

### Current Status Reminders:
- **Onboarding bypass active** - Temp override disables plan limits for QA; remove before paid launch
- **CrewAI 70% complete** - Onboarding flow integrated (start/message routes live), full analysis pipeline operational
- **Hybrid router stable** - No consolidation planned; App Router for new features, Pages Router for stable dashboards
- **162 unit tests + 45 E2E tests** - Maintain test coverage when adding features
- **8 database migrations deployed** - Always generate new numbered migrations, never edit existing

## Runtime Requirements

- **Node.js:** 22.18.0 (use `nvm use` to load from `.nvmrc`)
- **Package Manager:** pnpm 9.12.1 (enable via `corepack enable pnpm`)
- **Supabase CLI:** Available via `pnpm exec supabase` (installed as dev dependency)
- **Python:** 3.10 for Netlify functions (managed by Netlify)

## Production Deployment

- **Live URL:** https://app-startupai-site.netlify.app
- **Future Domain:** https://app.startupai.site (pending DNS)
- **Auto-Deploy:** Push to `main` branch triggers Netlify build
- **Environment:** Set in Netlify UI (see `docs/archive/legacy/NETLIFY_ENV_VARS.md`)
- **Database:** Supabase managed Postgres 15 (local dev uses Postgres 17 via CLI)
- **Functions:** Netlify serverless (10s timeout free, 26s Pro, 15min background)

## Related Resources

- **Netlify Functions:** `netlify/functions/README.md`
- **CrewAI Spec:** `backend/CREW_AI.md`
- **E2E Testing Guide:** `frontend/E2E_TESTING_GUIDE.md`
- **TDD Report:** `frontend/TDD_IMPLEMENTATION_COMPLETE.md`
- **Gate Integration:** `docs/archive/completion-reports/GATE_INTEGRATION_COMPLETE.md`
- **PostHog Setup:** `docs/archive/completion-reports/POSTHOG_PRODUCTION_COMPLETE.md`

---

**Last Updated:** 2025-10-27
**Codebase Status:** 65-70% complete, CrewAI onboarding flow live, dashboard integration ongoing
