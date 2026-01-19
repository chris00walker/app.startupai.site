---
purpose: "High-level architecture overview for StartupAI product platform"
status: "active"
last_reviewed: "2026-01-19"
---

# Architecture Overview

## Three-Service Model

StartupAI operates as a three-service ecosystem with clear separation of concerns:

```
        AI Founders Team
         (startupai-crew)
     [Core Decision Engine]
             ↙    ↘
    startupai.site   app.startupai.site
    [Transparency]      [Delivery]
```

### Canonical Source

> **Master architecture documentation lives in `startupai-crew/docs/master-architecture/`**
>
> That is the single source of truth for cross-service architecture. This document provides product-specific context.

```
startupai-crew/docs/master-architecture/
├── 01-ecosystem.md           # Three-service reality diagram
├── 02-organization.md        # C-suite → Agent hierarchy
├── 03-validation-spec.md     # Technical implementation guide
├── 04-phase-0-onboarding.md  # Phase 0 specification
├── 05-hitl-checkpoints.md    # Human-in-the-loop workflow
├── 10-dogfooding.md          # Dogfooding methodology
└── reference/                # API contracts, schemas
    ├── api-contracts.md      # Modal ↔ Product App contracts
    └── modal-configuration.md # Modal deployment config
```

### Key ADRs

| ADR | Title | Location |
|-----|-------|----------|
| ADR-004 | Two-Pass Onboarding | `startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md` |
| ADR-005 | State-First Loop | `startupai-crew/docs/adr/005-state-first-synchronized-loop.md` |

## Service Responsibilities

### 1. AI Founders Core (startupai-crew)

**Role**: Brain of StartupAI - market analysis, idea validation, strategy generation

- CrewAI Python agents (5 flows / 14 crews / 45 agents)
- Modal serverless execution with HITL checkpoints
- Supabase persistence + Realtime for progress

**Key Components**:
- Modal API: `src/modal_app/app.py`
- Phase functions: `src/modal_app/phases/`
- State persistence: `src/state/persistence.py`

### 2. Marketing Interface (startupai.site)

**Role**: Public transparency, lead capture, AI team visibility

- Next.js 15 (static export)
- Deployed on Netlify
- 19 pages, 60+ components

**Key Flows**:
- Plan selection → signup → redirect to product app
- Waitlist capture
- AI Founders activity display (public feed)

### 3. Product Interface (app.startupai.site)

**Role**: Customer portal, validation delivery, results dashboard

- Next.js 15 (hybrid App + Pages Router)
- Supabase Auth + PostgreSQL + Realtime
- Deployed on Netlify

**Key Flows**:
- OAuth callback → onboarding wizard
- Project creation → CrewAI analysis
- Dashboard → AI-generated insights
- HITL approvals → resume validation

## System Architecture (Updated Jan 2026)

### AI Integration Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 + Vercel AI SDK | Streaming chat UI |
| Chat Provider | OpenRouter → Groq | 300 tok/s streaming |
| Assessment | OpenRouter auto-router | Backend quality evaluation |
| Validation | Modal serverless | CrewAI Flows execution |

### Two-Pass Architecture

> **ADR-004**: See `startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md`

```
User Message
    ↓
Pass 1: /api/chat/stream
    → LLM streams response (no tools)
    → Pure conversation
    ↓
Pass 2: /api/chat/save
    → Backend assesses quality
    → Updates stage progress
    → Persists to DB
```

### Modal Connection

| Endpoint | Purpose |
|----------|---------|
| `POST /kickoff` | Start validation run |
| `GET /status/{run_id}` | Poll execution status |
| `POST /hitl/approve` | Resume from checkpoint |

### Webhook Flow

`POST /api/crewai/webhook` routes by `flow_type`:

| Flow Type | Action |
|-----------|--------|
| `founder_validation` | Persist to 4 tables (briefs, evidence, experiments, costs) |
| `consultant_onboarding` | Update consultant_profiles |
| `progress_update` | Append to validation_progress |
| `hitl_checkpoint` | Create approval_requests entry |

### HITL Approval Flow

```
1. Modal pauses at checkpoint
2. Webhook creates approval_requests entry
3. User reviews via EvidenceSummary component
4. Decision submitted via /api/approvals/[id]
5. Modal resumes via callback URL
```

### Database Layer

- **Supabase PostgreSQL** + pgvector for embeddings
- **Drizzle ORM** (13 schema files)
- **Realtime enabled**:
  - `onboarding_sessions` (scalar columns only)
  - `founders_briefs` (full table)
  - `validation_progress` (progress updates)
- **Realtime disabled** (too large):
  - `crewai_validation_states`
  - `conversation_history` JSONB

## Data Flow

### Authentication Flow

```
startupai.site/signup
    → Supabase Auth (GitHub OAuth + PKCE)
    → app.startupai.site/auth/callback
        → Session established
        → Role-based routing (founder/consultant/trial)
        → /onboarding or /dashboard
```

### Onboarding Flow (Two-Pass)

```
/onboarding page
    → /api/onboarding/start (create/resume session)
    → User types message
    → /api/chat/stream (Pass 1: LLM response)
    → /api/chat/save (Pass 2: assess + persist)
    → Stage advances when topics covered
    → /api/onboarding/complete (finalize + kickoff CrewAI)
```

### AI Analysis Flow

```
Onboarding Complete
    → POST /api/onboarding/complete
    → Modal /kickoff (start validation)
    → 5-flow pipeline executes
    → Webhooks persist results to Supabase
    → HITL checkpoints pause for approval
    → User reviews → resumes
    → Final results to dashboard
```

## Technical Stack

### Shared Services
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth (OAuth, PKCE)
- **Analytics**: PostHog (shared workspace)
- **Deployment**: Netlify (web apps), Modal (agents)

### Product-Specific
- **ORM**: Drizzle for type-safe queries
- **State**: TanStack Query + Supabase Realtime
- **Testing**: Jest (824+ unit) + Playwright (101 E2E)
- **AI Chat**: Vercel AI SDK + OpenRouter
- **AI Validation**: CrewAI via Modal

## Current Status (Jan 2026)

| Area | Status | Notes |
|------|--------|-------|
| Infrastructure | 95% | Netlify + Modal stable |
| Database | 100% | 13 migrations deployed |
| Auth | Working | GitHub OAuth + PKCE |
| Onboarding | 85% | Two-Pass Architecture live |
| AI Backend | 85% | Modal deployed, HITL working |
| Accessibility | 0% | P0 launch blocker |

See `work/in-progress.md` for detailed tracking.

## Layer 1 / Layer 2 Artifacts

| Layer | Table | Source | Purpose |
|-------|-------|--------|---------|
| Layer 1 | `entrepreneur_briefs` | Alex chat extraction | Raw brief from onboarding |
| Layer 2 | `founders_briefs` | S1 agent validation | Validated + enriched brief |

## Known Risks

- Accessibility compliance not yet implemented (launch blocker)
- Service-role credentials for Supabase must be rotated carefully
- pgvector search only via stored procedure - dashboard experiences must use RPC
- Large JSONB columns not suitable for Realtime (use polling)

## Domains & Ownership

| Domain | Owner | Notes |
|--------|-------|-------|
| Marketing site (`startupai.site`) | Growth Engineering | Next.js static export, CTAs with plan hints |
| Auth & Identity | Platform Engineering | Supabase Auth (GitHub OAuth, email) |
| Application site (`app.startupai.site`) | Platform Engineering | Next.js hybrid router, dashboards |
| Database & Storage | Platform Engineering | Supabase Postgres + pgvector |
| AI Workflows | AI Platform | CrewAI Flows on Modal (`startupai-crew`) |
| Analytics | Shared (Growth + Platform) | PostHog instrumentation |

## When to Update This Repo vs Master

### Update This Repo (`app.startupai.site`)

- Product app implementation details
- API route documentation
- Frontend component specs
- UI/UX patterns
- Testing strategies

### Update Master Repo (`startupai-crew`)

- Cross-repo architecture decisions
- Data contracts between services
- ADRs (Architecture Decision Records)
- CrewAI flow specifications
- Modal deployment patterns
- Webhook payload schemas

## Related Documentation

- **Master Architecture**: `startupai-crew/docs/master-architecture/` (canonical)
- **Database Schema**: [data-schema.md](data-schema.md)
- **Auth Spec**: [auth.md](auth.md)
- **API Specs**: [api-onboarding.md](api-onboarding.md)
- **Work Tracking**: [../work/in-progress.md](../work/in-progress.md)
