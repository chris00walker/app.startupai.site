# CLAUDE.md - StartupAI Product Platform Memory

## Project Identity
**Name**: StartupAI Product Platform  
**Purpose**: Evidence-led strategy validation with AI-powered analysis  
**Status**: ⚠️ 65-70% Complete  
**Framework**: Next.js 15.5.3 (Hybrid: App Router + Pages Router)  
**Deployment**: Netlify (considering Vercel migration)  

## Architecture
```
[Next.js Frontend] → [Supabase Backend] → [Vercel AI SDK] → [OpenAI/Anthropic]
                          ↓
                   [Drizzle ORM + pgvector]
                          ↓
[CrewAI AMP] ← Strategic Analysis API (6-agent workflow)
```

### Critical Components
1. **Authentication**: JWT + GitHub OAuth via Supabase
2. **Onboarding**: Vercel AI SDK with streaming chat (7 stages)
3. **Database**: PostgreSQL + pgvector (12 migrations deployed)
4. **AI Analysis**: CrewAI AMP (Fortune 500-quality reports)
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
pnpm crew:contract-check    # Validate CrewAI AMP connectivity

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
CREW_ANALYZE_URL=...                # CrewAI AMP endpoint (optional override)
CREW_CONTRACT_BEARER=...            # Local contract check token

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

### Strategic Analysis (CrewAI AMP)
**Tech Stack**: 6-agent Python workflow on CrewAI AMP platform

**Agents**:
1. Onboarding Agent (Consultant)
2. Customer Researcher (Jobs/Pains/Gains)
3. Competitor Analyst (Market positioning)
4. Value Designer (Value Proposition Canvas)
5. Validation Agent (Experiment roadmap)
6. QA Agent (Quality assurance)

**API Endpoint**:
```bash
POST https://startupai-b4d5c1dd-27e2-4163-b9fb-a18ca06ca-4f4192a6.crewai.com/kickoff
Authorization: Bearer f4cc39d92520
Content-Type: application/json

{
  "entrepreneur_input": "Business idea description..."
}
```

**Integration Point**: Backend API route `/api/crewai/analyze` proxies to CrewAI AMP

**Output**: Structured reports stored in Supabase, displayed in UI

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
├── ecosystem.md              # Three-service reality diagram
├── organizational-structure.md # C-suite → Agent hierarchy
├── current-state.md          # Honest status assessment
└── validation-backlog.md     # Hypothesis-driven feature queue
```

For anything that spans services (auth flow, API contracts, data flow), refer to the crew's master architecture.

## Documentation
- Authentication: `docs/engineering/10-authentication/`
- CrewAI Integration: `docs/integrations/crewai/`
- Features: `docs/features/`

---
**Last Updated**: Generated by Claude Code Architect  
**Maintainer**: Chris Walker  
**Next Milestone**: Complete post-onboarding project wizard (4 hours)
