---
purpose: "Spec-to-app phase mapping (startupai-crew -> app.startupai.site)"
status: "active"
last_reviewed: "2026-01-19"
---

# Phase Mapping (spec vs product app)

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

> **Note**: Onboarding uses Two-Pass Architecture (ADR-004). See [api-onboarding.md](api-onboarding.md) for details.

## Phase 0: Onboarding (Founder's Brief)

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| Founder interview conversation (O1) | `frontend/src/components/onboarding/FounderOnboardingWizard.tsx`, `frontend/src/app/api/chat/route.ts` | implemented | 7-stage conversation collects onboarding inputs via Two-Pass architecture. |
| Stage progression + data capture | `frontend/src/lib/ai/founder-onboarding-prompt.ts`, `frontend/src/app/api/chat/stream/route.ts`, `frontend/src/app/api/chat/save/route.ts`, `frontend/src/app/api/onboarding/status/route.ts` | implemented | Progress tracked in `onboarding_sessions`. Two-Pass: stream for conversation, save for persistence. |
| Concept legitimacy + intent verification (GV1/GV2) | `frontend/src/lib/ai/founder-onboarding-prompt.ts` | partial | Prompt includes hard rejection rules; no explicit GV1/GV2 artifacts or separate review step. |
| Founder's Brief artifact | `frontend/src/app/api/onboarding/complete/route.ts` | partial | Creates `entrepreneur_briefs` (not explicit spec schema) without an approval UI for the brief itself. |
| HITL checkpoint `approve_founders_brief` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Webhook can create approval requests if Modal emits checkpoint; no dedicated brief review page. |
| Intent gate loop (follow-up / reject) | none | missing | No explicit routing back to interview based on GV checks. |
| Transition to Phase 1 | `frontend/src/app/api/analyze/route.ts` | implemented | Kickoff to Modal occurs on onboarding completion; phase execution happens off-app. |

## Phase 1: VPC Discovery

| Spec feature | App implementation | Status | Notes |
| --- | --- | --- | --- |
| Segment validation + experiment design (DiscoveryCrew) | `frontend/src/components/strategyzer/AssumptionMap.tsx`, `frontend/src/components/strategyzer/ExperimentCardsGrid.tsx` | partial | UI exists (Pages Router: `pages/founder-dashboard.tsx`), but no automated segment validation flow. |
| Evidence capture (SAY/DO) | `frontend/src/components/fit/EvidenceLedger.tsx` | partial | Evidence ledger UI exists; no formal DiscoveryCrew workflow. |
| Customer Profile (Jobs/Pains/Gains) | `frontend/src/components/vpc/VPCReportViewer.tsx` | partial | UI can display VPC data if present; relies on crew outputs. |
| Value Map (Products/Pain Relievers/Gain Creators) | `frontend/src/app/api/vpc/[projectId]/route.ts` | partial | CRUD exists for VPC; generation from crew results is external. |
| WTP experiments | none | missing | No pricing experiment UI or workflow. |
| HITL `approve_pricing_test` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval infrastructure exists; no pricing test UI. |
| Fit score + routing (pivot/iterate/advance) | `frontend/src/components/gates/GateDashboard.tsx`, `frontend/src/components/fit/FitDashboard.tsx` | partial | UI present but no explicit fit-gate logic tied to VPC outcomes. |
| HITL `approve_vpc_completion` | `frontend/src/app/api/crewai/webhook/route.ts`, `frontend/src/app/approvals/page.tsx` | partial | Approval request can be created if Modal sends checkpoint. |

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
