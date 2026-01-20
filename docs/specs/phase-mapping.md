---
purpose: "Spec-to-app phase mapping (startupai-crew -> app.startupai.site)"
status: "active"
last_reviewed: "2026-01-19"
architectural_pivot: "2026-01-19"
---

# Phase Mapping (spec vs product app)

> **Architectural Pivot (2026-01-19)**: Phase 0 was simplified to Quick Start. See [ADR-006](../../../startupai-crew/docs/adr/006-quick-start-architecture.md).

Sources:
- `../startupai-crew/docs/master-architecture/04-phase-0-onboarding.md`
- `../startupai-crew/docs/master-architecture/05-phase-1-vpc-discovery.md`
- `../startupai-crew/docs/master-architecture/06-phase-2-desirability.md`
- `../startupai-crew/docs/master-architecture/07-phase-3-feasibility.md`
- `../startupai-crew/docs/master-architecture/08-phase-4-viability.md`

Legend:
- implemented: app has UI + API/data path wired for the feature
- partial: some wiring exists (UI or API) but missing spec steps or relies on external compute only
- missing: no UI/API surface exists in the product app
- deprecated: feature removed by Quick Start pivot

## Phase 0: Quick Start (formerly Onboarding)

> **Note**: Phase 0 was simplified from 7-stage AI conversation to Quick Start form. See [api-onboarding.md](api-onboarding.md) for API details.

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| Quick Start form | `frontend/src/app/api/projects/quick-start/route.ts` (planned) | missing | Single form: business idea + optional context. Triggers Phase 1 immediately. |
| Project creation with `raw_idea` | `frontend/src/app/api/projects/quick-start/route.ts` (planned) | missing | Creates project record, triggers Modal `/kickoff`. |
| Transition to Phase 1 | `frontend/src/app/api/projects/quick-start/route.ts` (planned) | missing | Automatic on form submission. |
| ~~Founder interview conversation~~ | ~~`frontend/src/components/onboarding/FounderOnboardingWizard.tsx`~~ | deprecated | Removed by Quick Start pivot. |
| ~~Stage progression + data capture~~ | ~~`frontend/src/lib/ai/founder-onboarding-prompt.ts`~~ | deprecated | Removed - no stages in Quick Start. |
| ~~Concept legitimacy (GV1)~~ | ~~`frontend/src/lib/ai/founder-onboarding-prompt.ts`~~ | deprecated | Moved to Phase 1 BriefGenerationCrew. |
| ~~Intent verification (GV2)~~ | N/A | deprecated | Deleted - no transcript to verify. |
| ~~HITL checkpoint `approve_founders_brief`~~ | N/A | deprecated | Replaced by `approve_discovery_output` in Phase 1. |

## Phase 1: VPC Discovery + Brief Generation

> **Note (2026-01-19)**: Phase 1 now includes BriefGenerationCrew (GV1, S1) which generates the Founder's Brief from research. The combined HITL checkpoint `approve_discovery_output` replaces the separate `approve_founders_brief` and `approve_vpc_completion`.

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| **Brief Generation (NEW)** | `frontend/src/app/api/crewai/webhook/route.ts` | partial | BriefGenerationCrew (GV1, S1) generates brief from research. Webhook persists to `entrepreneur_briefs`. |
| **HITL `approve_discovery_output` (NEW)** | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Combined Brief + VPC approval. User can edit brief before approving. |
| Segment validation + experiment design (DiscoveryCrew) | `frontend/src/components/strategyzer/AssumptionMap.tsx`, `frontend/src/components/strategyzer/ExperimentCardsGrid.tsx` | partial | UI exists (Pages Router: `pages/founder-dashboard.tsx`), but no automated segment validation flow. |
| Evidence capture (SAY/DO) | `frontend/src/components/fit/EvidenceLedger.tsx` | partial | Evidence ledger UI exists; no formal DiscoveryCrew workflow. |
| Customer Profile (Jobs/Pains/Gains) | `frontend/src/components/vpc/VPCReportViewer.tsx` | partial | UI can display VPC data if present; relies on crew outputs. |
| Value Map (Products/Pain Relievers/Gain Creators) | `frontend/src/app/api/vpc/[projectId]/route.ts` | partial | CRUD exists for VPC; generation from crew results is external. |
| WTP experiments | none | missing | No pricing experiment UI or workflow. |
| HITL `approve_experiment_plan` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval infrastructure exists. |
| HITL `approve_pricing_test` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval infrastructure exists; no pricing test UI. |
| Fit score + routing (pivot/iterate/advance) | `frontend/src/components/gates/GateDashboard.tsx`, `frontend/src/components/fit/FitDashboard.tsx` | partial | UI present but no explicit fit-gate logic tied to VPC outcomes. |

## Phase 2: Desirability

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| Build test artifacts (LP/MVP) | none | missing | No landing page generation/deployment tooling in app. |
| Ad creative + campaign execution | none | missing | No ad platform integration or campaign UI. |
| Innovation physics metrics (problem_resonance, zombie_ratio) | `frontend/src/components/reports/CrewAIReportViewer.tsx`, `frontend/src/components/signals/InnovationPhysicsPanel.tsx` | partial | Display-only; depends on crew outputs being stored in `reports`/`crewai_validation_states`. |
| HITL `approve_campaign_launch` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval infrastructure exists without campaign UI. |
| HITL `approve_desirability_gate` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval infrastructure exists; no gate-specific review UI. |
| Pivot routing (segment/value) | none | missing | No UI to trigger pivots or re-run earlier phases. |

## Phase 3: Feasibility

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| Technical feasibility assessment | `frontend/src/components/reports/CrewAIReportViewer.tsx` | partial | UI can display feasibility section if crew outputs exist. |
| Cost estimates + constraints | `frontend/src/components/reports/sections/FeasibilitySection.tsx` | partial | Display-only; no in-app calculation. |
| Downgrade protocol + re-test | none | missing | No UI/workflow for downgrades. |
| Feasibility signal (GREEN/ORANGE/RED) | `frontend/src/components/signals/SignalGauge.tsx` | partial | Display-only; depends on crew outputs. |
| HITL `approve_feasibility_gate` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval infrastructure exists. |

## Phase 4: Viability

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| Unit economics + TAM analysis | `frontend/src/components/reports/sections/ViabilitySection.tsx`, `frontend/src/components/viability/ViabilityMetricsPanel.tsx` | partial | Display-only; depends on crew outputs. |
| Viability signal (PROFITABLE/UNDERWATER/ZOMBIE) | `frontend/src/components/signals/SignalGauge.tsx` | partial | Display-only. |
| HITL `request_human_decision` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval infrastructure exists without a dedicated decision UI. |
| Final decision + terminal state (Validated/Killed) | none | missing | No project state transition UI to record final outcome. |

## Cross-phase infrastructure (all phases)

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| Modal kickoff + status polling | `frontend/src/app/api/analyze/route.ts`, `frontend/src/app/api/crewai/status/route.ts` | implemented | Uses Modal client with env-driven URLs. |
| HITL checkpoint ingestion | `frontend/src/app/api/crewai/webhook/route.ts` | partial | Webhook path exists, but master-architecture favors Supabase Realtime over webhooks. |
| Approval workflow UI | `frontend/src/app/approvals/page.tsx`, `frontend/src/hooks/useApprovals.ts` | partial | Generic approvals UI, not phase-specific. |
| Reports rendering | `frontend/src/app/project/[id]/report/page.tsx`, `frontend/src/components/reports/CrewAIReportViewer.tsx` | partial | Requires crew outputs in `reports`. |
| Evidence explorer | `frontend/src/app/project/[id]/evidence/page.tsx`, `frontend/src/components/evidence-explorer/EvidenceTimeline.tsx` | partial | Reads from Supabase; no Phase 1+ evidence ingestion pipelines in app. |
