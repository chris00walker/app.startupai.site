# CLAUDE.md - StartupAI Product Platform Memory

## Project Identity
**Name**: StartupAI Product Platform  
**Purpose**: Evidence-led strategy validation with AI-powered analysis  
**Status**: ✅ ~85% Complete (Phase Alpha)  
**Framework**: Next.js 15.5.3 (Hybrid: App Router + Pages Router)  
**Deployment**: Netlify (considering Vercel migration)  

## Dogfooding Methodology

> **"If StartupAI can't validate itself, it won't work for anyone else."**

Test as a real user before testing as a developer.

### Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Founder** | chris00walker@proton.me | W7txYdr7bV0Tc30U0bv& | Tests full validation journey |
| **Consultant** | chris00walker@gmail.com | Test123! | Tests advisor/client features |

**Project**: StartupAI (the platform validating itself)

### Quality Gates (Dogfooding)
- [ ] Founder account can complete onboarding
- [ ] Founder account can approve all HITL checkpoints
- [ ] Consultant account can view client data
- [ ] No mock data in any user-facing component
- [ ] UI displays real StartupAI validation results

See [startupai-crew/docs/master-architecture/10-dogfooding.md](../startupai-crew/docs/master-architecture/10-dogfooding.md) for full methodology.

## Architecture
```
[Next.js Frontend] → [Supabase Backend] → [Vercel AI SDK] → [OpenAI/Anthropic]
                          ↓
                   [Drizzle ORM + pgvector]
                          ↓
                [Modal FastAPI + CrewAI Flows]
                          ↓
        AI Founders Engine (5 flows / 14 crews / 45 agents)
```

### Ecosystem Source of Truth
**`startupai-crew/docs/master-architecture/`** - Contains ecosystem-level architecture

### Critical Components
1. **Authentication**: JWT + GitHub OAuth via Supabase
2. **Onboarding**: Vercel AI SDK with streaming chat (7 stages)
3. **Database**: PostgreSQL + pgvector (13 migrations deployed)
4. **AI Analysis**: Modal serverless (CrewAI Flows, 5 phases)
5. **Frontend**: 20 pages, 50+ Shadcn components

## Directory Structure
```
frontend/
├── app/                # App Router (new pages)
├── pages/              # Pages Router (legacy, being migrated)
├── components/         # Shadcn UI + custom components
├── lib/                # Utilities, hooks, Supabase client
├── db/                 # Drizzle schema + migrations
└── styles/             # Tailwind config

docs/                   # Platform documentation
tests/                  # Jest + Playwright E2E
```

## Core Commands
```bash
# Development
pnpm dev                    # Next.js dev server (port 3000)
nvm use                     # Load Node 22.18.0

# Quality Checks
pnpm lint                   # ESLint
pnpm type-check             # TypeScript validation
pnpm test                   # Jest unit tests
pnpm test:e2e               # Playwright E2E tests
pnpm format                 # Prettier write

# Database
pnpm db:generate            # Generate Drizzle migration
pnpm db:push                # Push schema to Supabase
pnpm db:studio              # Open Drizzle Studio
supabase status             # Check connection

# CrewAI Integration
pnpm crew:contract-check    # Validate CrewAI/Modal contract connectivity

# Build & Deploy
pnpm build                  # Production build
# Deployment automatic via Netlify on push to main
```

## Authentication System
### Flow
1. User signs up on marketing site → Supabase creates account
2. OAuth callback: `/auth/callback` validates token
3. Role-based routing: Redirects based on `user_metadata.role`
4. Protected routes: Check JWT in middleware

### Supabase Auth Config
- **Provider**: GitHub OAuth (production + development)
- **Session**: JWT stored in cookies
- **RLS**: Row-Level Security enforced on all tables
- **Service Role**: Used for admin operations only

### Environment Variables (Critical - Never Commit)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # ⚠️ CRITICAL - Full DB access
DATABASE_URL=...                    # ⚠️ CRITICAL - Direct connection

# Auth
JWT_SECRET=...                      # ⚠️ CRITICAL - Token validation

# AI Providers
OPENAI_API_KEY=...                  # ⚠️ COST - Vercel AI SDK
ANTHROPIC_API_KEY=...               # ⚠️ COST - Fallback LLM

# CrewAI Integration
CREW_ANALYZE_URL=...                # Modal /kickoff endpoint (optional override)
CREW_CONTRACT_BEARER=...            # Webhook bearer token (CrewAI results)

# Feature Flags
NEXT_PUBLIC_ONBOARDING_BYPASS=false # ⚠️ MUST BE FALSE in production
```

## Database Schema (Drizzle ORM)
### Core Tables
- `users`: Extended Supabase auth.users with profiles
- `projects`: User business ideas
- `hypotheses`: Testable assumptions
- `evidence`: Validation data with pgvector embeddings
- `onboarding_sessions`: AI chat state management
- `entrepreneur_briefs`: Structured onboarding output
- `gate_scores`: Progress tracking (5 innovation gates)

### Key Relationships
```
users (1) → (∞) projects
projects (1) → (∞) hypotheses
hypotheses (1) → (∞) evidence
users (1) → (1) onboarding_sessions
```

### Vector Search
- Function: `match_evidence()` (pgvector similarity search)
- Dimensions: 1536 (OpenAI text-embedding-ada-002)
- Storage: Supabase bucket `evidence-files` with RLS

## AI Integration Architecture
### Onboarding (Vercel AI SDK)
**Tech Stack**: Vercel AI SDK v5 + OpenAI GPT-4.1-nano (primary) + Anthropic Claude (fallback)

**Flow**:
1. User starts chat → POST `/api/onboarding/start`
2. Streaming chat → POST `/api/onboarding/message`
3. AI tools: `assessQuality`, `advanceStage`, `completeOnboarding`
4. 7-stage progression: Problem → Customer → Solution → Market → Competition → Validation → Summary

**State Management**: `onboarding_sessions` table stores conversation history

### Strategic Analysis (CrewAI Flows)
**Tech Stack**: 5-flow/14-crew/45-agent architecture on Modal serverless

**6 AI Founders**: Sage (CSO), Forge (CTO), Pulse (CMO), Compass (CPO), Guardian (CGO), Ledger (CFO)

**Canonical Flows**: Phase 0-4 (Onboarding → Viability) with HITL checkpoints

See `startupai-crew/docs/master-architecture/` for the full technical blueprint.

**API Endpoints**:
```bash
POST https://chris00walker--startupai-validation-fastapi-app.modal.run/kickoff
Content-Type: application/json

{
  "project_id": "...",
  "entrepreneur_input": "Business idea description..."
}
```

**Integration Point**: Backend API route `/api/crewai/analyze` proxies to Modal `/kickoff`

**Output**: Structured reports persisted in Supabase and displayed in the UI

## Design System
- **UI Framework**: Shadcn UI (New York theme, same as marketing)
- **CSS**: Tailwind CSS (shared design tokens)
- **Components**: 50+ custom + Shadcn primitives
- **Canvas Tools**: 9 interactive tools (160KB code)

## Coding Standards
### TypeScript
- **Strict Mode**: Enabled (`tsconfig.json`)
- **No `any`**: Use `unknown` or proper types
- **Type-Safe Queries**: Drizzle ORM only (no raw SQL)

### React Components
- Functional components with hooks
- Custom hooks for data fetching (e.g., `useProjects`, `useHypotheses`)
- Error boundaries for all routes
- Loading states with Suspense

### Database Operations
```typescript
// ✅ GOOD: Type-safe Drizzle query
const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId));

// ❌ BAD: Raw SQL (avoid unless necessary)
const projects = await db.execute(sql`SELECT * FROM projects WHERE user_id = ${userId}`);
```

### API Routes
- Validate inputs with Zod
- Return typed responses
- Handle errors with try/catch
- Use Supabase Service Role only when needed

### Testing
- **Unit**: Jest for utilities and hooks
- **Integration**: Test API routes with mock Supabase
- **E2E**: Playwright for critical user flows
- **Target Coverage**: >70% for critical paths

## Quality Gates (Before Production)
- [ ] `NEXT_PUBLIC_ONBOARDING_BYPASS=false` enforced
- [ ] NO mock data in any component
- [ ] NO console.log (use proper logging)
- [ ] NO hardcoded secrets
- [ ] All TypeScript errors resolved
- [ ] All ESLint errors resolved
- [ ] Test coverage >70%
- [ ] E2E tests passing for:
  - [ ] Auth flow
  - [ ] Onboarding completion
  - [ ] Project creation
  - [ ] CrewAI analysis trigger

## Common Tasks
### Add New Database Table
1. Define schema in `frontend/db/schema/[table].ts`
2. Export from `frontend/db/schema/index.ts`
3. Run `pnpm db:generate` to create migration
4. Review migration SQL in `frontend/db/migrations/`
5. Run `pnpm db:push` to apply
6. Update RLS policies in Supabase dashboard

### Create New API Route
1. Create file: `frontend/app/api/[route]/route.ts` (App Router) or `frontend/pages/api/[route].ts` (Pages Router)
2. Validate inputs with Zod
3. Use Supabase client (anon key) or service role (admin)
4. Return typed JSON response
5. Add error handling

### Integrate New Shadcn Component
1. Run `npx shadcn@latest add [component]`
2. Component added to `frontend/components/ui/`
3. Customize if needed (keep New York theme)
4. Import and use in pages

### Test Auth Flow
1. Start marketing site: `pnpm --dir ../startupai.site dev`
2. Start product app: `pnpm dev`
3. Sign up on marketing site
4. Verify redirect to product app
5. Check Supabase dashboard for user

### Test CrewAI Integration
1. Check connectivity: `pnpm crew:contract-check`
2. Expected output: Deployment UUID and inputs schema
3. If fails: Check `CREW_ANALYZE_URL` and `CREW_CONTRACT_BEARER`

## Integration Audit Rules

**CRITICAL**: Before creating new UI components for displaying CrewAI/Modal data, ALWAYS follow this checklist:

### Pre-Implementation Audit
1. **Audit existing components FIRST** - The frontend was engineered with sophisticated UI components:
   - `components/approvals/EvidenceSummary.tsx` - D-F-V signal badges, metrics display
   - `components/approvals/ApprovalDetailModal.tsx` - Full approval workflow
   - `components/approvals/ApprovalCard.tsx` - Approval list items
   - `components/vpc/` - VPC visualization components
   - `components/validation/` - Validation progress components

2. **Check data transformation, not UI first** - When data doesn't display:
   - Is the webhook handler (`/api/crewai/webhook/route.ts`) populating the correct fields?
   - Does Modal send data in a different structure than the UI expects?
   - Check what fields existing components expect (read the component's interface/props)

3. **Map data contracts before coding**:
   - Modal sends: Check `startupai-crew/docs/master-architecture/reference/api-contracts.md`
   - Frontend expects: Read the component's TypeScript interface
   - Transform in: Webhook handler or API route

### Data Flow Verification
```
Modal Backend → Webhook Handler → Supabase Tables → UI Components
     ↓              ↓                  ↓               ↓
  payload      transform          persist         read & display
```

If data isn't displaying:
1. Check Supabase table has the data (SQL query)
2. Check component is reading from correct table/field
3. Check webhook populated the field correctly
4. ONLY THEN consider if component needs modification

### Never Do This
- ❌ Create new `TaskOutputDisplay.tsx` when `EvidenceSummary.tsx` exists
- ❌ Assume "UI Gap" when it's actually a data transformation gap
- ❌ Add components without checking `git status` for existing untracked files
- ❌ Modify components without understanding their existing data contracts

### Always Do This
- ✅ Run `glob` on `components/` to see existing components before creating new ones
- ✅ Read existing component props/interfaces to understand expected data structure
- ✅ Trace data from Modal → Webhook → Supabase → Component before assuming gaps
- ✅ Fix data transformation in webhook handlers, not by creating parallel components

## Known Issues & Workarounds
### Hybrid Routing (App + Pages Router)
**Status**: Intentional (Vercel-recommended migration strategy)  
**Workaround**: Keep both routers coexisting during migration  
**Plan**: Eventually migrate all Pages Router routes to App Router

### Onboarding Bypass Enabled
**Status**: ⚠️ Temporary for QA  
**Risk**: Users can create unlimited projects without plan limits  
**Action**: MUST set `NEXT_PUBLIC_ONBOARDING_BYPASS=false` before launch

## Related Repositories
- Marketing Site: `startupai.site` (lead capture)
- AI Backend: `startupai-crew` (CrewAI strategic analysis)

### Master Architecture

The **single source of truth** for cross-service architecture lives in:
```
startupai-crew/docs/master-architecture/
├── 01-ecosystem.md           # Three-service reality diagram
├── 02-organization.md        # C-suite → Agent hierarchy
├── 03-validation-spec.md     # Technical implementation guide
├── 04-status.md              # Honest status assessment
└── reference/                # API contracts, approval workflows
```

For anything that spans services (auth flow, API contracts, data flow), refer to the crew's master architecture.

## Cross-Repo Coordination

**✅ All P0 blockers resolved (Nov 30). Marketing site now unblocked.**

### Before Starting Work
- Check `docs/work/cross-repo-blockers.md` for current dependencies
- CrewAI Phase 2D complete (~85%), 18 tools implemented

### When Blockers Are Resolved
1. Update `docs/work/cross-repo-blockers.md` status
2. Move items from "Blocked" to "In Progress" in `docs/work/in-progress.md`
3. Notify downstream (marketing) if this unblocks their work

### When Completing Work That Unblocks Others
1. Update `docs/work/cross-repo-blockers.md`
2. Update marketing blockers: `startupai.site/docs/work/cross-repo-blockers.md`

### Dependency Chain
```
CrewAI → Product App (this repo) → Marketing Site
```

**Current blockers**: See `docs/work/cross-repo-blockers.md`

## LLM Coordination Protocol
See `startupai-crew/docs/master-architecture/llm-coordination.md`.

## Claude Code Customizations

### Available Agents (Project-Level)
See `.claude/agents/` for repo-specific agents:
- **database-architect**: Database schema design, Drizzle ORM, Supabase PostgreSQL, pgvector embeddings, migrations, and data modeling
- **testing-specialist**: Jest unit testing, Playwright E2E testing, test-driven development, coverage optimization, and testing strategy

### User-Level Agents (Available Across All Repos)
See `~/.claude/agents/` for cross-repo agents:
- **ecosystem-coordinator**: Cross-repo dependency management and blocker tracking
- **backend-developer**: Supabase, Drizzle ORM, API design, database architecture
- **frontend-developer**: Next.js, React, shadcn/ui, component patterns
- **ai-engineer**: CrewAI Flows, Vercel AI SDK, LLM integration

### Available Skills
See `~/.claude/skills/` for cross-repo skills:
- **frontend-design**: Creative UI design guidance emphasizing distinctive aesthetics (typography, bold colors, motion, atmospheric backgrounds) - avoid generic "AI slop" patterns
- **cross-repo-sync**: Update blocker files across all 3 repos
- **quality-gate**: Comprehensive pre-commit checks (lint, type-check, test, build)
- **crewai-integration-check**: Validate CrewAI API contracts and deployment connectivity

### Usage
Agents are automatically invoked based on context and trigger words in their descriptions. Skills are discovered and used when relevant to the current task. See individual agent/skill files for detailed capabilities.

## Documentation
- Authentication: `docs/specs/auth.md`
- CrewAI Integration: `docs/overview/ONBOARDING_TO_CREWAI_ARCHITECTURE.md`
- Architecture: `docs/overview/`
- Specs: `docs/specs/`
- Features: `docs/features/`
- Work Tracking: `docs/work/`

---
**Last Updated**: 2026-01-12
**Maintainer**: Chris Walker
**Status**: ~85% Complete - Phase Alpha (P0 blockers cleared)
