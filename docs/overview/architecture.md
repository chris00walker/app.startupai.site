---
purpose: "High-level architecture overview for StartupAI product platform"
status: "active"
last_reviewed: "2025-11-21"
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

## Service Responsibilities

### 1. AI Founders Core (startupai-crew)

**Role**: Brain of StartupAI - market analysis, idea validation, strategy generation

- CrewAI Python agents (6 founders, 18 agents)
- LangChain integration for multi-provider LLM support
- Deployed via CrewAI AMP (Agent Messaging Protocol)

**Key Components**:
- Agent configs: `config/agents.yaml`
- Task configs: `config/tasks.yaml`
- Crew orchestration: `src/startupai/crew.py`

### 2. Marketing Interface (startupai.site)

**Role**: Public transparency, lead capture, AI team visibility

- Next.js 15 (static export)
- Deployed on Netlify
- 19 pages, 60+ components

**Key Flows**:
- Plan selection → signup → redirect to product app
- Waitlist capture
- AI Founders activity display

### 3. Product Interface (app.startupai.site)

**Role**: Customer portal, validation delivery, results dashboard

- Next.js 15 (hybrid App + Pages Router)
- Supabase Auth + PostgreSQL
- Deployed on Netlify

**Key Flows**:
- OAuth callback → onboarding wizard
- Project creation → CrewAI analysis
- Dashboard → AI-generated insights

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

### AI Analysis Flow

```
User Input (Onboarding/Project)
    → app.startupai.site API
    → CrewAI AMP
        → 6-agent pipeline
        → Strategic analysis
    → Results stored in Supabase
    → Dashboard displays insights
```

## Technical Stack

### Shared Services
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth (OAuth, PKCE)
- **Analytics**: PostHog (shared workspace)
- **Deployment**: Netlify (web apps), CrewAI AMP (agents)

### Product-Specific
- **ORM**: Drizzle for type-safe queries
- **State**: TanStack Query
- **Testing**: Jest + Playwright
- **AI**: CrewAI via AMP

## System Flow

1. **Marketing → Auth**: Marketing pages capture plan context and hand off to `/signup`. Authentication completes via Supabase and drops users into the App Router scope.

2. **Onboarding**: The wizard lives in App Router (`/onboarding`). API handlers mutate `onboarding_sessions` and `entrepreneur_briefs` in Supabase.

3. **AI Analysis**: `POST /api/onboarding/complete` calls CrewAI AMP which writes structured evidence and recommendations back to Supabase.

4. **Dashboards**: Server components consume Supabase data. Analytics events push to PostHog for funnel monitoring.

## Current Status

| Area | Status |
|------|--------|
| Infrastructure | 95% complete |
| Database | 100% complete |
| Auth | Working (GitHub OAuth + PKCE) |
| AI Backend | In progress (CrewAI AMP deployment) |

See `work/implementation-status.md` for detailed tracking.

## Known Risks

- CrewAI AMP integration in progress - needed for end-to-end AI
- Service-role credentials for Supabase must be rotated carefully
- pgvector search only via stored procedure - dashboard experiences must use RPC
- Accessibility compliance not yet implemented (launch blocker)

## Related Documentation

- **Master Architecture**: `startupai-crew/docs/master-architecture/` (canonical)
- **Database Schema**: `specs/database-schema.md`
- **Auth Spec**: `specs/auth.md`
- **Implementation Status**: `work/implementation-status.md`
- **ADRs**: `docs/adrs/`
