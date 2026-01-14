---
purpose: "Exhaustive feature inventory derived from code"
status: "draft"
last_reviewed: "2026-01-13"
---

# Feature Inventory (code-based)

Legend:
- active: wired to a Next.js route or API endpoint
- legacy: pages router or legacy folder; may still be reachable but not the primary app shell
- demo: uses demo data or placeholder logic only
- stub: endpoint exists but returns empty/no-op data

## App Router UI (frontend/src/app)

- active: `/login` - login form and auth flow (`frontend/src/app/login/page.tsx`, `frontend/src/components/auth/LoginForm.tsx`)
- active: `/signup` - signup form (`frontend/src/app/signup/page.tsx`, `frontend/src/components/signup-form.tsx`)
- active: `/auth/callback` - OAuth callback/session exchange (`frontend/src/app/auth/callback/route.ts`)
- active: `/auth/auth-code-error` - OAuth error display (`frontend/src/app/auth/auth-code-error/page.tsx`)
- active: `/debug-oauth` - OAuth debugging screen (`frontend/src/app/debug-oauth/page.tsx`)
- active: `/test-auth` - auth test screen (`frontend/src/app/test-auth/page.tsx`)
- active: `/onboarding` - AI-guided founder onboarding (7-stage conversation) (`frontend/src/app/onboarding/page.tsx`, `frontend/src/components/onboarding/OnboardingWizardV2.tsx`)
- active: `/onboarding/founder` - founder-specific onboarding entry (`frontend/src/app/onboarding/founder/page.tsx`)
- active: `/onboarding/consultant` - consultant onboarding flow (`frontend/src/app/onboarding/consultant/page.tsx`, `frontend/src/components/onboarding/ConsultantOnboardingWizardV2.tsx`)
- active: `/approvals` - approvals dashboard (personal + client approvals) (`frontend/src/app/approvals/page.tsx`, `frontend/src/components/approvals/ApprovalList.tsx`)
- active: `/projects/new` - project creation wizard (`frontend/src/app/projects/new/page.tsx`, `frontend/src/components/onboarding/ProjectCreationWizard.tsx`)
- active: `/client/[id]/projects/new` - consultant project creation for a client (`frontend/src/app/client/[id]/projects/new/page.tsx`)
- active: `/project/current/evidence` - redirect to active project evidence explorer (`frontend/src/app/project/current/evidence/page.tsx`)
- active: `/project/current/gate` - redirect to active project gate dashboard (`frontend/src/app/project/current/gate/page.tsx`)
- active: `/project/[id]/evidence` - evidence explorer dashboard (`frontend/src/app/project/[id]/evidence/page.tsx`, `frontend/src/components/evidence-explorer/EvidenceTimeline.tsx`)
- active: `/project/[id]/gate` - gate evaluation dashboard and alerts (`frontend/src/app/project/[id]/gate/page.tsx`, `frontend/src/components/gates/GateDashboard.tsx`)
- active: `/project/[id]/analysis` - strategic analysis view (VPC + signals) (`frontend/src/app/project/[id]/analysis/page.tsx`, `frontend/src/components/vpc/VPCReportViewer.tsx`)
- active: `/project/[id]/report` - CrewAI report viewer (`frontend/src/app/project/[id]/report/page.tsx`, `frontend/src/components/reports/CrewAIReportViewer.tsx`)

## Pages Router UI (frontend/src/pages) - legacy

- legacy: `/founder-dashboard` - founder dashboard (fit dashboard, evidence ledger, gates, AI assistant) (`frontend/src/pages/founder-dashboard.tsx`)
- legacy: `/consultant-dashboard` - consultant portfolio dashboard (portfolio metrics, risk budgets, gate alerts, guided tour) (`frontend/src/pages/consultant-dashboard.tsx`)
- demo: `/workflows` - AI workflow dashboard with demo workflows (`frontend/src/pages/workflows.tsx`)
- demo+active: `/clients` - client portfolio list with demo fallback (`frontend/src/pages/clients.tsx`)
- active: `/clients/new` - client creation form (`frontend/src/pages/clients/new.tsx`, `frontend/src/components/ClientForm.tsx`)
- active: `/client/[id]` - client detail dashboard (`frontend/src/pages/client/[id].tsx`)
- legacy: `/ai-analysis` - direct CrewAI analysis page (Netlify function) (`frontend/src/pages/ai-analysis.tsx`)
- demo: `/analytics` - analytics dashboard with demo metrics (`frontend/src/pages/analytics.tsx`)
- legacy: `/settings` - profile, notifications, approvals preferences (`frontend/src/pages/settings.tsx`)
- planned: `/settings` → Projects tab - project archive/delete management (Founders) (`frontend/src/components/settings/ProjectsTab.tsx`)
- planned: `/settings` → Clients tab - client archive management (Consultants) (`frontend/src/components/settings/ClientsTab.tsx`)
- legacy: `/export` - report export UI (`frontend/src/pages/export.tsx`, `frontend/src/components/reports/export/PDFExporter.tsx`)
- legacy: `/canvas` - canvas gallery (`frontend/src/pages/canvas.tsx`, `frontend/src/components/canvas/CanvasGallery.tsx`)
- legacy: `/canvas/bmc` - Business Model Canvas editor (`frontend/src/pages/canvas/bmc.tsx`, `frontend/src/components/canvas/BusinessModelCanvas.tsx`)
- legacy: `/canvas/vpc` - Value Proposition Canvas editor (`frontend/src/pages/canvas/vpc.tsx`, `frontend/src/components/canvas/ValuePropositionCanvas.tsx`)
- legacy: `/canvas/tbi` - Testing Business Ideas canvas editor (`frontend/src/pages/canvas/tbi.tsx`, `frontend/src/components/canvas/TestingBusinessIdeasCanvas.tsx`)
- legacy: `/validation` - validation results summary (`frontend/src/pages/validation/index.tsx`, `frontend/src/components/validation/ValidationResultsSummary.tsx`)
- legacy: `/canvas` index backup (`frontend/src/legacy/index_backup.tsx`)

## App Router API (frontend/src/app/api)

- active: `POST /api/auth/logout` - logout and session cleanup (`frontend/src/app/api/auth/logout/route.ts`)
- active: `POST /api/chat` - founder onboarding AI chat with stage progression tools (`frontend/src/app/api/chat/route.ts`)
- active: `POST /api/onboarding/start` - start or resume onboarding session with plan limits (`frontend/src/app/api/onboarding/start/route.ts`)
- active: `POST /api/onboarding/message` - store onboarding message and return AI response (`frontend/src/app/api/onboarding/message/route.ts`)
- active: `GET /api/onboarding/status` - current onboarding stage + progress (`frontend/src/app/api/onboarding/status/route.ts`)
- active: `POST /api/onboarding/complete` - mark onboarding session complete (`frontend/src/app/api/onboarding/complete/route.ts`)
- active: `POST /api/onboarding/abandon` - abandon onboarding session (`frontend/src/app/api/onboarding/abandon/route.ts`)
- active: `POST /api/onboarding/recover` - recover onboarding session (`frontend/src/app/api/onboarding/recover/route.ts`)
- active: `POST /api/consultant/chat` - consultant AI chat (`frontend/src/app/api/consultant/chat/route.ts`)
- active: `POST /api/consultant/onboarding/start` - start consultant onboarding session (`frontend/src/app/api/consultant/onboarding/start/route.ts`)
- active: `GET /api/consultant/onboarding/status` - consultant onboarding status (`frontend/src/app/api/consultant/onboarding/status/route.ts`)
- active: `POST /api/consultant/onboarding/complete` - consultant onboarding completion (`frontend/src/app/api/consultant/onboarding/complete/route.ts`)
- legacy: `POST /api/consultant/onboarding` - save consultant profile from onboarding (`frontend/src/app/api/consultant/onboarding/route.ts`)
- active: `POST /api/assistant/chat` - dashboard AI assistant with tool calling (`frontend/src/app/api/assistant/chat/route.ts`)
- active: `GET /api/assistant/history` - AI assistant conversation history (`frontend/src/app/api/assistant/history/route.ts`)
- active: `POST /api/analyze` - trigger CrewAI/Modal analysis and persist results (`frontend/src/app/api/analyze/route.ts`)
- active: `GET /api/crewai/status` - poll CrewAI/Modal workflow status (`frontend/src/app/api/crewai/status/route.ts`)
- active: `GET /api/crewai/results` - fetch CrewAI analysis outputs (`frontend/src/app/api/crewai/results/route.ts`)
- active: `POST /api/crewai/webhook` - CrewAI workflow results webhook (`frontend/src/app/api/crewai/webhook/route.ts`)
- legacy: `POST /api/crewai/consultant` - consultant onboarding webhook (deprecated) (`frontend/src/app/api/crewai/consultant/route.ts`)
- active: `GET /api/agents/status` - AI founders status indicator (`frontend/src/app/api/agents/status/route.ts`)
- active: `POST /api/projects/create` - create project + seed hypotheses (`frontend/src/app/api/projects/create/route.ts`)
- planned: `PATCH /api/projects/[id]` - archive/unarchive project (`frontend/src/app/api/projects/[id]/route.ts`)
- planned: `DELETE /api/projects/[id]` - permanently delete project (`frontend/src/app/api/projects/[id]/route.ts`)
- active: `GET|POST /api/clients` - consultant client CRUD (create + list) (`frontend/src/app/api/clients/route.ts`)
- active: `GET /api/clients/[id]` - client detail (`frontend/src/app/api/clients/[id]/route.ts`)
- planned: `PATCH /api/clients/[id]/archive` - archive/unarchive client relationship (`frontend/src/app/api/clients/[id]/archive/route.ts`)
- stub: `GET /api/clients/[id]/tasks` - client tasks (empty) (`frontend/src/app/api/clients/[id]/tasks/route.ts`)
- stub: `GET /api/clients/[id]/artefacts` - client artefacts (empty) (`frontend/src/app/api/clients/[id]/artefacts/route.ts`)
- demo: `POST /api/clients/[id]/discovery` - discovery workflow trigger (metadata only) (`frontend/src/app/api/clients/[id]/discovery/route.ts`)
- active: `GET|POST /api/vpc/[projectId]` - value proposition canvas read/write (`frontend/src/app/api/vpc/[projectId]/route.ts`)
- active: `POST /api/vpc/[projectId]/initialize` - seed VPC from CrewAI validation state (`frontend/src/app/api/vpc/[projectId]/initialize/route.ts`)
- active: `GET /api/approvals` - approvals list and filtering (`frontend/src/app/api/approvals/route.ts`)
- active: `GET|PATCH /api/approvals/[id]` - approval detail + approve/reject decision (`frontend/src/app/api/approvals/[id]/route.ts`)
- active: `POST /api/approvals/webhook` - approvals webhook receiver (`frontend/src/app/api/approvals/webhook/route.ts`)
- active: `GET|PUT /api/settings/approvals` - approval preferences (`frontend/src/app/api/settings/approvals/route.ts`)
- active: `POST /api/trial/allow` - trial usage gating (`frontend/src/app/api/trial/allow/route.ts`)
- active: `GET|POST /api/health` - health checks (`frontend/src/app/api/health/route.ts`)
- active: `GET /api/v1/public/metrics` - public aggregate metrics (`frontend/src/app/api/v1/public/metrics/route.ts`)
- active: `GET /api/v1/public/activity` - public activity feed (`frontend/src/app/api/v1/public/activity/route.ts`)

## Serverless + backend functions

- active: Netlify CrewAI analysis function (`netlify/functions/crew-analyze.py`)
- active: Netlify CrewAI background runner (`netlify/functions/crew-analyze-background.py`)
- active: Netlify diagnostics endpoint (`netlify/functions/crew-analyze-diagnostics.py`)
- active: Netlify crew runtime helpers (`netlify/functions/crew_runtime.py`)
- active: Crew package for Netlify (`netlify/functions/startupai/crew.py`, `netlify/functions/startupai/tools.py`)
- legacy: backend CrewAI analysis wrapper (`backend/netlify/functions/crewai-analyze.py`)
- active: backend gate evaluation service (`backend/netlify/functions/gate-evaluate.py`)

## Shared feature modules (used across routes)

- AI onboarding prompts + stage definitions (`frontend/src/lib/ai/onboarding-prompt.ts`)
- CrewAI Modal client and transformers (`frontend/src/lib/crewai/modal-client.ts`, `frontend/src/lib/crewai/vpc-transformer.ts`)
- Evidence management and explorer (`frontend/src/components/evidence-explorer/index.ts`, `frontend/src/lib/evidence/transform.ts`)
- Gate evaluation, readiness, alerts (`frontend/src/components/gates/GateDashboard.tsx`, `frontend/src/hooks/useGateEvaluation.ts`, `frontend/src/hooks/useGateAlerts.ts`)
- Portfolio analytics widgets (risk budget, stage progress, gate alerts) (`frontend/src/components/portfolio/PortfolioGrid.tsx`, `frontend/src/components/portfolio/RiskBudgetWidget.tsx`)
- Reports + exports (CrewAI report viewer, PDF export) (`frontend/src/components/reports/CrewAIReportViewer.tsx`, `frontend/src/components/reports/export/PDFExporter.tsx`)
- Canvases (BMC, VPC, TBI) and guided variants (`frontend/src/components/canvas/BusinessModelCanvas.tsx`, `frontend/src/components/canvas/ValuePropositionCanvas.tsx`, `frontend/src/components/canvas/TestingBusinessIdeasCanvas.tsx`)
- Strategyzer tools (assumption map, experiment cards) (`frontend/src/components/strategyzer/AssumptionMap.tsx`, `frontend/src/components/strategyzer/ExperimentCardsGrid.tsx`)
- Fit and evidence tracking (fit dashboard, experiments, innovation signals) (`frontend/src/components/fit/FitDashboard.tsx`, `frontend/src/components/fit/ExperimentsPage.tsx`)
- Approvals UI + preferences (`frontend/src/components/approvals/ApprovalList.tsx`, `frontend/src/components/approvals/ApprovalDetailModal.tsx`)
- AI assistant UI (`frontend/src/components/assistant/DashboardAIAssistant.tsx`)
- Analytics/consent tracking (`frontend/src/components/analytics/AnalyticsProvider.tsx`, `frontend/src/components/analytics/ConsentBanner.tsx`)
- Demo mode and guided tour (`frontend/src/components/demo/GuidedTour.tsx`, `frontend/src/hooks/useDemoMode.ts`)

## Developer and debug utilities

- Auth debug scripts (`debug-auth.js`, `debug-onboarding.js`)
- OAuth and storage setup scripts (`scripts/setup-oauth-all.sh`, `scripts/setup-storage.sh`)
- Crew contract checker (`scripts/crew-contract-check.ts`)

## Cross-repo evidence used

- `../startupai-crew/docs/master-architecture/01-ecosystem.md` (three-layer architecture + Modal endpoints)
- `../startupai-crew/docs/master-architecture/04-phase-0-onboarding.md` (Founder's Brief + `approve_founders_brief` checkpoint)
- `../startupai-crew/docs/master-architecture/reference/api-contracts.md` (Modal API contracts + Phase 0 endpoints)
- `../startupai-crew/docs/master-architecture/09-status.md` (Modal deployment status + MCP/tool roadmap)
- `../startupai.site/docs/overview/platform-overview.md` (ecosystem overview)
- `../startupai.site/docs/incidents/2025-11-07-supabase-email-signup.md` (auth trigger -> `user_profiles`)
