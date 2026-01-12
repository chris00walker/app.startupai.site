# .claude/project.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StartupAI Product Platform** (`app.startupai.site`) - Evidence-led strategy platform that helps entrepreneurs validate business ideas through systematic experimentation. Part of a two-site architecture:

- **startupai.site** (Marketing) - Convert prospects to customers
- **app.startupai.site** (Product) - Deliver value and create advocates ← **THIS REPO**

**Tech Stack:**
- Frontend: Next.js 15.5.3 (TypeScript 5.8.3) with hybrid routing (Pages + App Router)
- Backend: Modal serverless (CrewAI Flows in `startupai-crew`)
- Database: Supabase PostgreSQL with pgvector for semantic search
- ORM: Drizzle ORM for type-safe database operations
- Package Manager: pnpm 9.12.1
- Node Version: 22.18.0 (managed via `.nvmrc`)

## Development Commands

### Setup and Development

```bash
# Initial setup
nvm use                    # Load Node 22.18.0
pnpm install              # Install dependencies

# Development
pnpm dev                  # Start Next.js dev server (localhost:3000)

# Building
pnpm build                # Production build

# Testing
pnpm test                 # Run Jest unit tests
pnpm test:watch           # Jest in watch mode
pnpm test:coverage        # Generate coverage report
pnpm test:e2e             # Run Playwright E2E tests
pnpm test:e2e:ui          # Playwright with UI
pnpm test:all             # Run all tests
```

### Database Operations

```bash
# Drizzle ORM (run from repo root)
pnpm db:generate          # Generate migrations from schema
pnpm db:push              # Push schema changes to database
pnpm db:migrate           # Run pending migrations
pnpm db:studio            # Open Drizzle Studio UI
pnpm db:introspect        # Introspect existing database

# Database seeding (run from frontend/)
cd frontend && pnpm db:seed
```

**Important:** Drizzle config (`drizzle.config.ts`) loads env from `frontend/.env.local`. Schema is in `frontend/src/db/schema/index.ts`.

### AI Backend (Modal)

```bash
# AI backend lives in startupai-crew
cd /home/chris/projects/startupai-crew
uv sync
modal serve src/modal_app/app.py

# Contract check (validates CrewAI API contract)
pnpm crew:contract-check  # Requires CREW_CONTRACT_BEARER env var
```

### Linting and Documentation

```bash
pnpm lint                 # Frontend linting (deferred - see docs/status/linting.md)
pnpm lint:md              # Lint markdown docs
pnpm lint:md:fix          # Auto-fix markdown issues
pnpm docs:validate        # Validate documentation
```

## Architecture

### Hybrid Routing (Next.js Pages + App Router)

**DO NOT consolidate routers.** Vercel officially supports hybrid routing and it's documented as a deliberate architectural choice (see `docs/operations/routing-consolidation-plan.md`).

**App Router** (`frontend/src/app/`):
- `/api/*` - API routes (server-side endpoints)
- `/signup`, `/login` - Authentication flows
- `/onboarding` - AI-powered onboarding wizard
- `/project/*`, `/projects` - Project management
- Modern features: Server Components, streaming, parallel routes

**Pages Router** (`frontend/src/pages/`):
- `/dashboard` - Main dashboard
- `/founder-dashboard` - Founder-specific view
- `/clients` - Client management
- `/canvas/*` - Business model canvas tools
- `/workflows`, `/analytics`, `/settings` - Core features
- Stable, well-tested pages with established patterns

### Database Layer

**Schema** (`frontend/src/db/schema/`):
- `users.ts` - User profiles and authentication
- `projects.ts` - Project metadata and settings
- `evidence.ts` - Evidence storage with pgvector embeddings
- `reports.ts` - AI-generated reports
- `hypotheses.ts` - Hypothesis tracking
- `experiments.ts` - Experiment data
- `usage-quota.ts` - Trial and plan limits

**Queries** (`frontend/src/db/queries/`):
- Type-safe database operations using Drizzle ORM
- Always prefer using existing queries over raw SQL
- New queries should be added to appropriate query files

**Migrations** (`supabase/migrations/`):
- All schema changes go through Supabase migrations
- Never modify schema directly in production
- Latest migrations include onboarding schema (00009) and user profile triggers (00010)

### CrewAI Integration (Modal)

**Canonical Workflow (5 Phases / 14 Crews / 45 Agents):**
1. Phase 0 → OnboardingFlow
2. Phase 1 → VPCDiscoveryFlow
3. Phase 2 → DesirabilityFlow
4. Phase 3 → FeasibilityFlow
5. Phase 4 → ViabilityFlow

**Critical Files (this repo):**
- `frontend/src/app/api/crewai/analyze/route.ts` - Triggers Modal `/kickoff`
- `frontend/src/app/api/crewai/webhook/route.ts` - Receives Modal callbacks
- `frontend/src/components/approvals/` - HITL approvals UI
- `frontend/src/components/validation/` - Progress display UI

**Upstream (startupai-crew):**
- `src/modal_app/app.py` - Modal FastAPI endpoints
- `src/modal_app/phases/` - Phase orchestration
- `src/state/persistence.py` - Supabase checkpoint state

**Deployment:**
- Modal deploys from `startupai-crew`
- Product app consumes Modal endpoints
- Supabase handles auth + persistence

**API Flow:**
1. Frontend calls onboarding routes (`/api/onboarding/start`, `/api/onboarding/message`)
2. Product app triggers `/api/crewai/analyze` → Modal `/kickoff`
3. Modal writes progress to Supabase + emits webhook to `/api/crewai/webhook`
4. UI subscribes to Supabase Realtime for progress + HITL approvals

See `docs/specs/crewai-integration.md` for integration details.

### Component Organization

```
frontend/src/components/
├── auth/              # Authentication components
├── onboarding/        # AI-powered onboarding wizard
├── dashboard/         # Dashboard-specific components
├── gates/             # Gate scoring UI
├── canvas/            # Business model canvas tools
├── hypothesis/        # Hypothesis management
├── analytics/         # Analytics and charts
└── ui/                # Shared UI primitives (Radix UI + shadcn)
```

**UI Library:** Built on Radix UI primitives with Tailwind CSS. Components in `ui/` follow shadcn conventions.

### Environment Variables

**Required** (set in `frontend/.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for onboarding (Vercel AI SDK)

**Optional:**
- `ANTHROPIC_API_KEY` - Claude models fallback
- `GOOGLE_AI_API_KEY` - Gemini models for creative tasks
- `CREW_ANALYZE_URL` - Override Modal `/kickoff` URL
- `CREW_CONTRACT_BEARER` - Legacy CrewAI AMP token (unused for Modal)
- `NEXT_PUBLIC_ONBOARDING_BYPASS` - Disable trial limits (QA only, **must be false in production**)

See `.env.example` for complete template.

### Testing Infrastructure

**Jest Configuration** (`frontend/jest.config.js`):
- Test environment: jsdom
- Module aliases: `@/*` maps to `src/*`
- Coverage threshold: 80% (branches, functions, lines, statements)
- Test organization: `__tests__/` directories and `*.test.*` files

**Test Types:**
- Unit tests: `src/__tests__/**/*.test.{ts,tsx}`
- Component tests: `src/components/**/__tests__/*.test.{ts,tsx}`
- Integration tests: `src/__tests__/integration/**`
- E2E tests: Playwright (`frontend/e2e/`)

**Running Single Tests:**
```bash
# Jest
pnpm test -- path/to/file.test.ts
pnpm test:watch -- --testNamePattern="test name"

# Playwright
pnpm test:e2e -- tests/specific-test.spec.ts
pnpm test:e2e:headed -- tests/specific-test.spec.ts
```

## Important Conventions

### Database Operations

1. **Always use service-role client for admin operations:**
   ```typescript
   import { createAdminClient } from '@/lib/supabase/server';
   const supabase = createAdminClient();
   ```

2. **User-scoped operations use regular client:**
   ```typescript
   import { createClient } from '@/lib/supabase/server';
   const supabase = createClient();
   ```

3. **Never expose service-role key to client:** Service-role operations must stay in API routes or server components.

4. **Use Drizzle for type safety:** Prefer Drizzle queries over raw SQL for maintainability.

### File Organization

- **No mock data in production code paths** - All components use real Supabase data
- **Colocate tests with components** - Use `__tests__/` directories next to the code
- **API routes in App Router** - All new API endpoints go in `frontend/src/app/api/`
- **Pages stay in Pages Router** - Don't migrate existing pages unless necessary

### Code Quality

- **TypeScript strict mode** - All code must type-check
- **No unused imports** - Clean up imports before committing
- **Explicit error handling** - All async operations should handle errors
- **Accessibility** - All interactive elements need proper ARIA labels
- **Security** - Never commit secrets, use environment variables

### Git Workflow

- **Never force push to main/master** without explicit permission
- **Follow existing commit message style** - Check `git log` for patterns
- **Test before committing** - Run `pnpm test` and `pnpm build`
- **Document breaking changes** - Update relevant docs

## Key Documentation

### Engineering Docs (`docs/engineering/`)
- **10-authentication/** - OAuth setup, JWT validation, role-based routing
- **30-data/** - Supabase setup, Drizzle schema, migrations, data retention
- **50-testing/** - Testing infrastructure and TDD practices
- **deployment/** - Docker, Netlify environment variables

### Specifications (`docs/specs/`)
- **crewai-integration.md** - Complete CrewAI integration guide (CRITICAL for AI features)
- **api-onboarding.md** - Onboarding API contract
- **data-schema.md** - Database structure and functions
- **mvp-specification.md** - Core feature requirements

### AI Backend (`startupai-crew`)
- **CLAUDE.md** - Backend memory and architecture context
- **docs/master-architecture/** - Ecosystem source of truth
- **docs/work/phases.md** - Phase completion criteria and blockers

### Master Documentation
- **README.md** - This file (project overview and status)
- **docs/DOCUMENTATION_INDEX.md** - Complete doc index

### External References
- **Two-Site Implementation Plan:** `../startupai.site/docs/technical/two-site-implementation-plan.md` - Single source of truth for all StartupAI development (lives in marketing repo)

## Common Pitfalls

1. **Don't bypass trial limits in production:** Ensure `NEXT_PUBLIC_ONBOARDING_BYPASS=false` before launch
2. **Don't edit AI backend here:** Crew/agent config lives in `startupai-crew`
3. **Don't mix routing paradigms carelessly:** Understand when to use Pages vs App Router
4. **Don't skip migrations:** All schema changes require Supabase migrations
5. **Don't use `npm`:** This project uses `pnpm` exclusively
6. **Don't modify `.next/` or `node_modules/`:** These are generated directories
7. **Don't store secrets in code:** Use environment variables and `.env.local`

## Project Status

**Overall:** ~65-70% Complete
- ✅ Infrastructure: 95% (Auth, DB, Deployment)
- ✅ UI Components: 70% (50+ components, Radix UI + Tailwind)
- ✅ Backend Integration: 70% (Dashboard, projects, evidence connected)
- ⚠️ AI Backend: Modal workflows deployed; UI integration still in progress

**Recent Updates (Oct 2025):**
- CrewAI onboarding flow live with start/message routes
- Quality signal detection and guardrails
- Contract-check tooling for CrewAI validation
- Onboarding guard configurable via environment variable

**Next Priorities:**
1. Complete frontend integration with CrewAI endpoints
2. Real-time progress tracking for AI workflows
3. End-to-end workflow testing
4. Production readiness checklist (disable bypass, verify limits)

## Getting Help

- **Documentation Issues:** Check `docs/DOCUMENTATION_INDEX.md` first
- **Build Errors:** Ensure `nvm use` and `pnpm install` completed successfully
- **Test Failures:** Review test output and check `frontend/jest.config.js` for paths
- **Database Issues:** Verify `frontend/.env.local` has correct `DATABASE_URL`
- **CrewAI Issues:** See `startupai-crew/CLAUDE.md` and `docs/specs/crewai-integration.md`
