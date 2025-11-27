# app.startupai.site

**Product Platform - Delivery layer for StartupAI's AI Founders validation engine**

## Architecture Overview

This repository implements the **Product Platform** (`app.startupai.site`) - the delivery portal where users interact with the AI Founders team and receive validation results.

### Ecosystem Position

```
┌─────────────────────┐
│   AI Founders Core  │  ← Brain (startupai-crew)
│  CrewAI Flows Engine│
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
- **startupai-crew** - AI Founders engine (8 crews / 18 agents)

---

## What This Platform Does

**Evidence-Led Strategy Platform** that helps entrepreneurs validate business ideas:

- **AI-Powered Onboarding** - Vercel AI SDK with 7-stage conversation flow
- **CrewAI Integration** - Triggers and displays results from AI Founders analysis
- **Project Management** - Track validation projects and hypotheses
- **Gate-Based Validation** - Desirability → Feasibility → Viability → Scale
- **Evidence Collection** - Store and analyze validation evidence with vector search

---

## Technology Stack

- **Frontend:** Next.js 15.5.3 with TypeScript 5.8.3
- **AI Provider:** Vercel AI SDK v5 (OpenAI GPT-4.1-nano + Anthropic Claude)
- **Database:** Supabase PostgreSQL with pgvector (12 migrations deployed)
- **ORM:** Drizzle ORM for type-safe operations
- **Storage:** Supabase Storage with RLS policies
- **Vector Search:** pgvector with 1536-dim embeddings
- **CrewAI Backend:** CrewAI AMP Platform (8-crew/18-agent Flows architecture)
- **Authentication:** JWT + GitHub OAuth with role-based routing
- **Deployment:** Netlify

**Status:** 65-70% Complete

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
- **Development:** http://localhost:3000
- **With Marketing Site:** Run `pnpm dev` in both repos (3000 + 3001)

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

**Overall Progress:** 65-70% Complete

> **Reality Check:** CrewAI integration works, but outputs are LLM-generated synthetic data until real analysis tools are built. See [cross-repo-blockers.md](docs/work/cross-repo-blockers.md) for the full gap analysis.

### What's Working
- 20 pages deployed (hybrid App + Pages Router)
- 50+ UI components including 9 canvas tools
- Complete validation UI with database integration
- GitHub OAuth with role-based routing
- 12 database migrations deployed
- Vector search function (match_evidence)
- AI onboarding with Vercel AI SDK (7 stages, streaming)
- CrewAI integration (kickoff, status polling, result storage)
- Trial usage guardrails

### In Progress
- Post-onboarding workflow completion
- Analysis results display improvements
- E2E test coverage expansion

### Integration with CrewAI

The platform connects to the AI Founders engine via:
- `/api/analyze` - Triggers CrewAI workflow
- `/api/crewai/status` - Polls for completion
- `/api/crewai/webhook` - Receives results on flow completion
- Results stored in `reports` and `evidence` tables

**Architecture:** 8-crew/18-agent Flows with Innovation Physics routers (Phase 2D complete in startupai-crew).

---

## Documentation

### Ecosystem Source of Truth
**`startupai-crew/docs/master-architecture/`** contains:
- `ecosystem.md` - Three-service overview
- `organizational-structure.md` - 6 founders, 18 agents
- `internal-validation-system-spec.md` - Technical blueprint
- `current-state.md` - Status assessment

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

---

**Status:** 65-70% Complete
**Deployment:** Netlify
**License:** Proprietary - StartupAI Platform
