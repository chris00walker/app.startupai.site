# StartupAI Ecosystem Current-State Map

**Date**: 2026-01-29 | **Status**: ~85% Complete (Phase Alpha)

---

## Ecosystem Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STARTUPAI ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    PRODUCT APP (app.startupai.site)                   │   │
│  │  Next.js 16.1 + React 19 + Drizzle ORM + Supabase                    │   │
│  │  Deployed: Netlify | ~85% complete | 103 API routes                   │   │
│  │                                                                        │   │
│  │  Features: Founder Onboarding → VPC Discovery → Evidence Explorer     │   │
│  │            HITL Approvals → Ad Platform Integration → Admin Dashboard │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     SUPABASE (Shared PostgreSQL)                      │   │
│  │  45 Drizzle schemas | 33 migrations | pgvector | RLS policies        │   │
│  │                                                                        │   │
│  │  Key Tables: validation_runs, validation_progress, hitl_requests,     │   │
│  │              projects, evidence, entrepreneur_briefs, ad_campaigns    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                              Realtime + REST                                 │
│                                      │                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    AI BACKEND (startupai-crew)                        │   │
│  │  CrewAI 1.4.1 + Modal Serverless + FastAPI                           │   │
│  │  Deployed: Modal | 100% architecture complete                         │   │
│  │                                                                        │   │
│  │  4 Flows → 14 Crews → 43 Agents → 10 HITL Checkpoints → 35 Tools     │   │
│  │  Phases: 0 (Quick Start) → 1 (VPC) → 2 (Desirability) →              │   │
│  │          3 (Feasibility) → 4 (Viability)                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    MARKETING SITE (startupai.site)                    │   │
│  │  Next.js 15.5 + Static Export + Netlify Functions                    │   │
│  │  Deployed: Netlify | Production-ready                                 │   │
│  │                                                                        │   │
│  │  Features: Lead capture, Beta signup ($1,500 Stripe), Live activity  │   │
│  │            feed, Public metrics API, PostHog analytics                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Path: Modal → Supabase → Product App

```
1. User triggers validation via Product App
         │
         ▼
2. POST /api/crewai/webhook (Bearer token auth)
         │
         ▼
3. Modal /kickoff receives request → Returns 202 Accepted
         │
         ▼
4. CrewAI executes phases 1-4 asynchronously
         │
   ┌─────┴─────┐
   ▼           ▼
5a. Progress   5b. HITL checkpoint
   updates        reached
   │              │
   ▼              ▼
6. Supabase    6. Container terminates
   validation_    ($0 cost during wait)
   progress       │
   (Realtime)     ▼
                7. Human approves via
                   Product App UI
                   │
                   ▼
                8. POST /hitl/approve
                   → Resume validation
```

---

## Key Metrics

| Repo | Tech Stack | Completion | Key Stats |
|------|------------|------------|-----------|
| **app.startupai.site** | Next.js 16, React 19, Drizzle | ~85% | 103 API routes, 45 schemas, 113 tests |
| **startupai-crew** | CrewAI, Modal, FastAPI | 100% arch | 43 agents, 14 crews, 555 tests |
| **startupai.site** | Next.js 15, Static Export | Production | 6 serverless functions, lead capture |

---

## Top 5 Risks/Gaps

| # | Risk | Severity | Impact | Mitigation |
|---|------|----------|--------|------------|
| 1 | **Work doc drift** | HIGH | Confusion about actual work status | RESOLVED: WORK.md consolidation |
| 2 | **PostHog events incomplete** | MEDIUM | A1/A2 assumptions not measurable | 4 items in current sprint |
| 3 | **Stripe not configured** | MEDIUM | Can't process payments | Blocked on Stripe account setup |
| 4 | **Ad platform OAuth blocked** | MEDIUM | Phase 2 ad experiments delayed | Need business accounts |
| 5 | **Documentation 71-day stale** | LOW | Spec drift from implementation | P2 backlog item |

---

## Next 3 Most Valuable Actions

### 1. Complete PostHog Instrumentation (Ready to Start)
**Why**: Enables measurement of A1 (trust) and A2 (Quick Start engagement) assumptions.
**Effort**: 4h
**Owner**: @frontend
**Status**: Items in current sprint, marked "Ready"

### 2. Run First Live Validation (E2E Ready)
**Why**: All infrastructure is deployed; 555 tests passing. Need live user validation.
**Effort**: 1 day
**Owner**: @product
**How**: Use dogfooding accounts (chris00walker@proton.me, chris00walker@gmail.com)

### 3. Set Up Stripe Account & Configure Webhooks
**Why**: Unblocks US-FT03 (upgrade webhook), US-FT04 (post-upgrade), and beta payments.
**Effort**: 2h
**Blocker**: Need Stripe business account
**Unblocks**: Trial split migration → Upgrade flow → Revenue

---

## Validation Progress (Dogfooding)

| Phase | Name | Status | Evidence |
|-------|------|--------|----------|
| 0 | Onboarding | **Complete** | Founder's Brief approved |
| 1 | VPC Discovery | **Complete** | VPC fit score 73/100, approved |
| 2 | Desirability | **Active** | Landing pages, experiments pending |
| 3 | Feasibility | Pending | Technical validation |
| 4 | Viability | Pending | Business model validation |

**Test Accounts**:
- Founder: chris00walker@proton.me (validates StartupAI as business idea)
- Consultant: chris00walker@gmail.com (advises StartupAI as client)

---

## Documentation Hierarchy

```
AUTHORITATIVE SOURCES:
├── startupai-crew/docs/master-architecture/09-status.md  ← Ecosystem status
├── app.startupai.site/docs/work/WORK.md                  ← Work tracking (NEW)
└── Each repo's CLAUDE.md                                  ← Repo-specific context

ARCHIVED (read-only):
├── app.startupai.site/docs/work/in-progress.md           → Merged to WORK.md
├── app.startupai.site/docs/work/backlog.md               → Merged to WORK.md
└── Various legacy docs in archive/ folders
```

---

**Generated**: 2026-01-29 by Codebase Discovery
