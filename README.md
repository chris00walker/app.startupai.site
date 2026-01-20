# app.startupai.site

**Product Platform - Delivery layer for StartupAI's AI Founders validation engine**

> **Modal Migration Complete**: Now integrated with Modal serverless backend. See `startupai-crew/docs/adr/002-modal-serverless-migration.md`.
>
> **Current Focus**: Quick Start Architecture implemented. Phase 0 is now a simple form submission (~30 seconds, no AI). See [ADR-006](../startupai-crew/docs/adr/006-quick-start-architecture.md).

> **Architectural Pivot (2026-01-19)**: The 7-stage AI conversation was replaced by Quick Start. Founder's Brief is now AI-generated in Phase 1.

## Architecture Overview

This repository implements the **Product Platform** (`app.startupai.site`) - the delivery portal where users interact with the AI Founders team and receive validation results.

### Ecosystem Position

```
┌─────────────────────┐
│   AI Founders Core  │  ← Brain (startupai-crew)
│   Modal Serverless  │
└──────────┬──────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
Marketing  DB   Product
  Site          App ← THIS REPO
```

**Ecosystem Source of Truth**: `startupai-crew/docs/master-architecture/`

### Three Services

- **startupai.site** - Marketing & lead capture
- **app.startupai.site** - Product delivery ← THIS REPO
- **startupai-crew** - AI Founders engine (14 crews / 43 agents)

---

## What This Platform Does

**Evidence-Led Strategy Platform** that helps entrepreneurs validate business ideas:

- **Quick Start Onboarding** - Simple form submission (~30 seconds), Phase 1 starts immediately
- **AI-Generated Founder's Brief** - BriefGenerationCrew creates the Brief from research
- **CrewAI Integration** - Triggers and displays results from AI Founders analysis
- **Project Management** - Track validation projects and hypotheses
- **Gate-Based Validation** - Desirability → Feasibility → Viability → Scale
- **Evidence Collection** - Store and analyze validation evidence with vector search

---

## Technology Stack

- **Frontend:** Next.js 15.5.3 with TypeScript 5.8.3
- **AI Provider:** Vercel AI SDK v5 (OpenAI GPT-4.1-nano + Anthropic Claude)
- **Database:** Supabase PostgreSQL with pgvector
- **ORM:** Drizzle ORM for type-safe operations
- **Storage:** Supabase Storage with RLS policies
- **Vector Search:** pgvector with 1536-dim embeddings
- **AI Founders Backend:** Modal Serverless (14-crew/43-agent architecture)
- **Authentication:** JWT + GitHub OAuth with role-based routing
- **Deployment:** Netlify

**Status:** ~95% Complete (Modal integration done, awaiting crew implementation)

---

## Quick Start

### Development Setup
```bash
nvm use
pnpm install
pnpm dev
```

### Environment Setup
```bash
cp frontend/.env.example frontend/.env.local

# Required environment variables:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# DATABASE_URL
# JWT_SECRET
# OPENAI_API_KEY
# CREW_CONTRACT_BEARER
```

### Local Access
- **Development:** http://localhost:3001 (This repo - Product App)
- **With Marketing Site:** Run `pnpm dev` in both repos (Marketing: 3000, App: 3001)

**Development Ports (Canonical):**
- **Marketing Site** (`startupai.site`): `localhost:3000`
- **This repo (Product App)**: `localhost:3001`
- **AI Founders Backend** (`startupai-crew`): Modal Serverless (use `modal serve` for local dev)

### Production
- **Live:** https://app-startupai-site.netlify.app
- **Future Domain:** https://app.startupai.site

---

## Repository Structure

```
app.startupai.site/
├── frontend/
│   ├── src/
│   │   ├── app/           # App Router (API routes)
│   │   ├── pages/         # Pages Router (views)
│   │   ├── components/    # 50+ UI components
│   │   ├── db/            # Drizzle schema & queries
│   │   ├── lib/
│   │   │   └── crewai/    # CrewAI client integration
│   │   └── hooks/         # Custom hooks
│   └── ...
├── docs/                   # Platform-specific docs
├── netlify/                # Netlify functions
└── README.md
```

---

## Current Status

**Overall Progress:** ~95% Complete

> **Modal Integration Complete:** Product app now points to Modal serverless backend. Infrastructure verified (2026-01-08). Awaiting crew implementation for live validation runs. See [cross-repo-blockers.md](docs/work/cross-repo-blockers.md) for status.

### What's Working
- 20 pages deployed (hybrid App + Pages Router)
- 50+ UI components including 9 canvas tools
- Complete validation UI with database integration
- GitHub OAuth with role-based routing
- Database migrations deployed with Modal columns
- Vector search function (match_evidence)
- Quick Start form for onboarding (~30 seconds)
- Modal integration (kickoff, status polling, HITL approval)
- Public APIs for Marketing site (Activity Feed, Metrics)
- Trial usage guardrails

### Recent Architecture Changes (2026-01-19)
- **Quick Start Architecture** ([ADR-006](../startupai-crew/docs/adr/006-quick-start-architecture.md)): Replaced 7-stage AI conversation with simple form submission
- **BriefGenerationCrew** added to Phase 1 to generate Founder's Brief from research

### In Progress
- Quick Start UI implementation
- Delete legacy 7-stage conversation code
- E2E test coverage expansion for Quick Start flow

### Integration with Modal

The platform connects to the AI Founders engine via:
- `/api/analyze` - Triggers Modal `/kickoff` endpoint
- `/api/crewai/status` - Queries Supabase OR Modal `/status`
- `/api/crewai/webhook` - Receives results (Modal format)
- `/api/approvals` - Handles HITL approvals via Modal `/hitl/approve`
- Results stored in `validation_runs`, `reports`, and `evidence` tables

**Architecture:** 4 Flows / 14 Crews / 43 Agents with Innovation Physics routers (Modal serverless).

---

## Documentation

### Ecosystem Source of Truth
**`startupai-crew/docs/master-architecture/`** contains:
- `01-ecosystem.md` - Three-service overview
- `02-organization.md` - 6 founders, 45 agents
- `03-methodology.md` - VPD framework reference
- `09-status.md` - Current ecosystem status

### Platform-Specific Docs

**Authentication (10-series)**
- `docs/engineering/10-authentication/authentication-setup.md`
- `docs/engineering/10-authentication/oauth-setup-guide.md`

**Data Layer (30-series)**
- `docs/engineering/30-data/supabase-setup.md`
- `docs/engineering/30-data/drizzle-schema.md`
- `docs/specs/data-schema.md`

**Testing (50-series)**
- `docs/engineering/50-testing/README.md`

**Features**
- `docs/features/gate-scoring-integration.md`
- `docs/specs/crewai-integration.md`

---

## Related Repositories

- **Marketing Site:** [startupai.site](https://github.com/chris00walker/startupai.site)
- **AI Founders Engine:** [startupai-crew](https://github.com/chris00walker/startupai-crew) - Brain of the ecosystem

**Production URLs**:
- Modal: `https://chris00walker--startupai-validation-fastapi-app.modal.run`
- Product App: `https://app-startupai-site.netlify.app`
- Marketing: `https://startupai.site`

---

## Testing Override

The monthly onboarding guard is temporarily disabled for QA:

```bash
NEXT_PUBLIC_ONBOARDING_BYPASS=true
```

**Re-enable before launch:** Set to `false` and verify plan limits.

---

## Support

- **Ecosystem Docs:** `startupai-crew/docs/master-architecture/`
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com
- **Modal Dashboard:** https://modal.com/apps

---

**Status:** ~95% Complete (Two-Pass onboarding deployed, ADR-005 implementation in progress)
**Deployment:** Netlify
**Last Updated:** 2026-01-16
**License:** Proprietary - StartupAI Platform
