---
purpose: "Private technical source of truth for frontend component architecture"
status: "active"
last_reviewed: "2026-01-19"
---

# Frontend Components

## Design System

- Tailwind CSS + Shadcn UI primitives live under `frontend/src/components/ui/*` (button, sidebar, alert-dialog, tooltip, skeleton, etc.). Components favour server-friendly styling with accessible defaults (focus rings, aria attributes) baked in.
- Layout shells rely on the `SidebarProvider` and related primitives; onboarding adopts the same sidebar system as dashboards for consistency.
- Motion is minimal by default. Animated affordances (e.g., pulsating active stage indicator) are implemented with Tailwind utility classes so they degrade gracefully when prefers-reduced-motion is enabled.
- Reusable feedback: toasts use the Sonner wrapper (`frontend/src/components/ui/sonner.tsx`) and analytics hooks integrate through `frontend/src/lib/analytics/hooks.ts`.

---

## Onboarding Experience

> **Architecture**: See [ADR-004: Two-Pass Onboarding Architecture](../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md)

### Core Wizard Components

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `FounderOnboardingWizard` | `components/onboarding/FounderOnboardingWizard.tsx` | 7-stage founder journey. Orchestrates Two-Pass flow (stream + save), manages stage progression, handles completion via SummaryModal. |
| `ConsultantOnboardingWizard` | `components/onboarding/ConsultantOnboardingWizard.tsx` | Consultant profile creation. Same Two-Pass architecture with consultant-specific stages and data collection. |
| `ClientOnboardingWizard` | `components/onboarding/ClientOnboardingWizard.tsx` | Client (invited by consultant) onboarding. Simpler flow, linked to consultant relationship. |
| `ConversationInterface` | `components/onboarding/ConversationInterface.tsx` | Renders chat timeline, manages voice input via `webkitSpeechRecognition`, auto-scrolls, wraps follow-up prompts + validation feedback. |
| `OnboardingSidebar` | `components/onboarding/OnboardingSidebar.tsx` | Presents stage progress, agent persona card (Alex), and session controls. Uses shared sidebar primitives. |

### Modal Components

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `StageReviewModal` | `components/onboarding/StageReviewModal.tsx` | Displays collected data when advancing between stages. Allows user to review and confirm before progressing. |
| `SummaryModal` | `components/onboarding/SummaryModal.tsx` | Final review of complete brief. Shows all extracted data with Approve/Revise actions. Triggers CrewAI validation on approval. |
| `FoundersBriefReview` | `components/onboarding/FoundersBriefReview.tsx` | Read-only display of the extracted founders brief. Used in dashboard context. |

### Post-Onboarding

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `ProjectCreationWizard` | `components/onboarding/ProjectCreationWizard.tsx` | Project setup after onboarding completion. Links project to founders brief and triggers CrewAI analysis. |

### Implementation Highlights

- **Two-Pass Architecture**: Wizards use `/api/chat/stream` for conversation, then `/api/chat/save` for persistence and quality assessment. No LLM tool calls for progression.
- **Topic-Based Progression**: Backend assesses topics covered per stage. Stage advances when all required topics are discussed.
- **Accessibility**: Wizards announce state changes to screen readers via `announceToScreenReader` utility. Skip links provided on onboarding pages.
- **Message Handling**: Optimistic updates append user messages before API round-trip. AI responses reconciled on completion.
- **Voice Input**: `ConversationInterface` toggles recording state, writes transcripts into textarea.
- **Completion Flow**: SummaryModal presents Approve/Revise options. Approve triggers CrewAI via `/api/crewai/kickoff`.

---

## Approvals (HITL)

Components for Human-in-the-Loop approval workflow during CrewAI validation.

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `ApprovalCard` | `components/approvals/ApprovalCard.tsx` | Card display for a single approval request. Shows checkpoint type, status, preview of data. |
| `ApprovalList` | `components/approvals/ApprovalList.tsx` | List of pending/recent approvals with filtering and sorting. |
| `ApprovalDetailModal` | `components/approvals/ApprovalDetailModal.tsx` | Full approval workflow interface. Shows checkpoint data, evidence summary, decision buttons (Approve/Reject/Revise). |
| `EvidenceSummary` | `components/approvals/EvidenceSummary.tsx` | Displays D-F-V (Desirability-Feasibility-Viability) signals, metrics, and evidence quality scores. |
| `ApprovalBadge` | `components/approvals/ApprovalBadge.tsx` | Status badge (pending, approved, rejected, auto_approved). |
| `ApprovalTypeIndicator` | `components/approvals/ApprovalTypeIndicator.tsx` | Visual indicator for checkpoint type (evidence_review, strategy_approval, etc.). |
| `FounderAvatar` | `components/approvals/FounderAvatar.tsx` | Avatar display for AI Founder agents (Sage, Forge, Pulse, etc.). |

### Approval Flow

1. Modal pauses at HITL checkpoint
2. Webhook creates `approval_requests` entry
3. User sees notification via `ApprovalList`
4. User opens `ApprovalDetailModal`
5. Reviews via `EvidenceSummary`
6. Submits decision → Modal resumes

---

## Validation & Results

Components for displaying CrewAI validation results.

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `ValidationResultsSummary` | `components/validation/ValidationResultsSummary.tsx` | High-level summary of validation run with D-F-V scores and key findings. |
| `ValidationProgressTimeline` | `components/validation/ValidationProgressTimeline.tsx` | Timeline display of validation progress events. |
| `CrewAIReportViewer` | `components/reports/CrewAIReportViewer.tsx` | Full report viewer with section navigation (Desirability, Feasibility, Viability, Governance). |
| `DesirabilitySection` | `components/reports/sections/DesirabilitySection.tsx` | Customer and market analysis findings. |
| `FeasibilitySection` | `components/reports/sections/FeasibilitySection.tsx` | Technical and operational feasibility findings. |
| `ViabilitySection` | `components/reports/sections/ViabilitySection.tsx` | Business model and financial viability findings. |
| `GovernanceSection` | `components/reports/sections/GovernanceSection.tsx` | Compliance, risk, and governance findings. |
| `PDFExporter` | `components/reports/export/PDFExporter.tsx` | PDF export functionality for reports. |

---

## Value Proposition Canvas (VPC) Display

> Note: Core VPC canvas components live in `components/canvas/`. These are display/utility components.

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `VPCSummaryCard` | `components/vpc/VPCSummaryCard.tsx` | Compact VPC summary for dashboard cards. |
| `VPCFitBadge` | `components/vpc/VPCFitBadge.tsx` | Visual badge showing product-market fit assessment. |
| `VPCReportViewer` | `components/vpc/VPCReportViewer.tsx` | Detailed VPC report with evidence links. |
| `VPCWithSignals` | `components/vpc/VPCWithSignals.tsx` | VPC display overlaid with D-F-V signals. |

---

## Innovation Signals & Fit

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `FitDashboard` | `components/fit/FitDashboard.tsx` | Overview dashboard for D-F-V fit metrics. |
| `InnovationPhysicsSignals` | `components/fit/InnovationPhysicsSignals.tsx` | Visual display of innovation physics metrics. |
| `InnovationPhysicsPanel` | `components/signals/InnovationPhysicsPanel.tsx` | Panel with expandable signal details. |
| `SignalGauge` | `components/signals/SignalGauge.tsx` | Circular gauge for individual signal scores. |
| `SignalBadge` | `components/signals/SignalBadge.tsx` | Compact badge for signal status. |
| `CrewAIEvidenceMetrics` | `components/fit/CrewAIEvidenceMetrics.tsx` | Metrics display for CrewAI-generated evidence quality. |
| `EvidenceLedger` | `components/fit/EvidenceLedger.tsx` | Tabular view of all evidence with filtering. |
| `ExperimentsPage` | `components/fit/ExperimentsPage.tsx` | Full page component for experiments management. |

---

## Evidence & Experiments

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `EvidenceInputForm` | `components/evidence/EvidenceInputForm.tsx` | Form for manual evidence entry. |
| `AIEvidenceCard` | `components/evidence-explorer/AIEvidenceCard.tsx` | Card display for AI-generated evidence. |
| `UserEvidenceCard` | `components/evidence-explorer/UserEvidenceCard.tsx` | Card display for user-provided evidence. |
| `EvidenceFilters` | `components/evidence-explorer/EvidenceFilters.tsx` | Filter controls for evidence explorer. |
| `EvidenceSummaryPanel` | `components/evidence-explorer/EvidenceSummaryPanel.tsx` | Summary panel in evidence explorer. |
| `EvidenceTimeline` | `components/evidence-explorer/EvidenceTimeline.tsx` | Timeline view of evidence collection. |
| `EvidenceDetailPanel` | `components/evidence-explorer/EvidenceDetailPanel.tsx` | Detail panel for individual evidence items. |
| `ExperimentCard` | `components/strategyzer/ExperimentCard.tsx` | Card display for validation experiments. |
| `ExperimentCardForm` | `components/strategyzer/ExperimentCardForm.tsx` | Form for creating/editing experiments. |
| `ExperimentCardsGrid` | `components/strategyzer/ExperimentCardsGrid.tsx` | Grid layout for experiment cards. |
| `EvidenceStrengthIndicator` | `components/strategyzer/EvidenceStrengthIndicator.tsx` | Visual indicator of evidence strength. |
| `AssumptionMap` | `components/strategyzer/AssumptionMap.tsx` | Visual map of assumptions with risk levels. |
| `CanvasesGallery` | `components/strategyzer/CanvasesGallery.tsx` | Gallery view of all strategy canvases. |

---

## Gates & Portfolio

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `GateDashboard` | `components/gates/GateDashboard.tsx` | Overview of 5 innovation gates with progress. |
| `GateReadinessIndicator` | `components/gates/GateReadinessIndicator.tsx` | Visual indicator of gate readiness (ready/not ready). |
| `GateStatusBadge` | `components/gates/GateStatusBadge.tsx` | Badge showing gate status. |
| `GateStageFilter` | `components/portfolio/GateStageFilter.tsx` | Filter for portfolio by gate stage. |
| `PortfolioGrid` | `components/portfolio/PortfolioGrid.tsx` | Grid layout of portfolio projects. |
| `PortfolioMetrics` | `components/portfolio/PortfolioMetrics.tsx` | Aggregate metrics for portfolio. |
| `RiskBudgetWidget` | `components/portfolio/RiskBudgetWidget.tsx` | Risk budget allocation display. |
| `StageProgressIndicator` | `components/portfolio/StageProgressIndicator.tsx` | Visual progress through validation stages. |
| `GateAlerts` | `components/portfolio/GateAlerts.tsx` | Alert notifications for gate status changes. |

---

## Consultant Features

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `ClientValidationCard` | `components/consultant/ClientValidationCard.tsx` | Card showing client's validation progress for consultant view. |
| `InviteClientModal` | `components/consultant/InviteClientModal.tsx` | Modal for consultants to invite new clients. |

---

## Canvas Tools

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `TestingBusinessIdeasCanvas` | `components/canvas/TestingBusinessIdeasCanvas.tsx` | Main canvas for Testing Business Ideas methodology. |
| `TestingBusinessIdeasTabs` | `components/canvas/TestingBusinessIdeasTabs.tsx` | Tab navigation for canvas sections. |
| `GuidedTestingBusinessIdeasCanvas` | `components/canvas/GuidedTestingBusinessIdeasCanvas.tsx` | Guided version with step-by-step prompts. |
| `CanvasEditor` | `components/canvas/CanvasEditor.tsx` | Generic canvas editing interface. |
| `CanvasGallery` | `components/canvas/CanvasGallery.tsx` | Gallery view of all canvas types. |
| `ValuePropositionCanvas` | `components/canvas/ValuePropositionCanvas.tsx` | Value Proposition Canvas display. |
| `EditableValuePropositionCanvas` | `components/canvas/EditableValuePropositionCanvas.tsx` | Editable version of VPC. |
| `EnhancedValuePropositionCanvas` | `components/canvas/EnhancedValuePropositionCanvas.tsx` | VPC with enhanced visual features. |
| `GuidedValuePropositionCanvas` | `components/canvas/GuidedValuePropositionCanvas.tsx` | Guided VPC with step-by-step prompts. |
| `BusinessModelCanvas` | `components/canvas/BusinessModelCanvas.tsx` | Standard 9-block Business Model Canvas. |
| `GuidedBusinessModelCanvas` | `components/canvas/GuidedBusinessModelCanvas.tsx` | Guided BMC with step-by-step prompts. |
| `BMCViabilityOverlay` | `components/canvas/BMCViabilityOverlay.tsx` | Business Model Canvas with viability overlay. |

---

## Layout & Navigation

| Component | Path | Responsibilities |
|-----------|------|------------------|
| `DashboardLayout` | `components/layout/DashboardLayout.tsx` | Main layout wrapper for authenticated dashboard pages. |
| `AppSidebar` | `components/layout/AppSidebar.tsx` | Application sidebar with navigation links. |
| `DashboardAIAssistant` | `components/assistant/DashboardAIAssistant.tsx` | In-app AI assistant widget. |

---

## Routing & Layouts

- Routes are organized directly under `frontend/src/app/` without route groups. Pages check Supabase session server-side and redirect unauthenticated users to `/login?returnUrl=...`.
- Key route directories: `onboarding/`, `projects/`, `project/`, `consultant/`, `client/`, `approvals/`, `auth/`
- The onboarding page wraps the wizard in a full-height flex layout with skeleton loading states.
- Top-level app router (`frontend/src/app/layout.tsx`) handles global providers (theme, analytics, toast). Client components opt-in only when interactivity is required.

---

## State Management

- Component-local state uses React hooks (`useState`, `useReducer`, `useCallback`). There is no global state container; Supabase is the source of truth for session state.
- API mutations are performed via `fetch` against App Router route handlers. Each handler uses Supabase server and admin clients to persist data (`frontend/src/app/api/onboarding/*`).
- TanStack Query (`@tanstack/react-query`) provides data fetching, caching, and optimistic updates for dashboard pages.
- Analytics hooks (`usePageTracking`, `useFeatureTracking`, etc.) are imported as needed to mark key events such as onboarding stage transitions.
- Error feedback: toast helpers surface API errors; wizards also store error strings in state for inline guidance.

---

## Additional Component Directories

The following directories contain additional components not detailed above:

| Directory | Purpose |
|-----------|---------|
| `components/auth/` | Authentication UI (LoginForm, SignupForm) |
| `components/brief/` | Brief display and editing components |
| `components/dashboard/` | Dashboard-specific widgets |
| `components/demo/` | Demo mode components (deprecated) |
| `components/founder/` | Founder-specific views |
| `components/founders/` | AI Founders display components |
| `components/hypothesis/` | Hypothesis management UI |
| `components/providers/` | React context providers |
| `components/settings/` | User settings components |
| `components/viability/` | Viability analysis components |
| `components/analytics/` | Analytics display components |
| `components/ui/` | Shadcn UI primitives (50+ components) |

---

## Related Documentation

- **Stage Progression**: [`features/stage-progression.md`](../features/stage-progression.md)
- **API Specs**: [`api-onboarding.md`](api-onboarding.md), [`api-approvals.md`](api-approvals.md)
- **Architecture**: [`architecture.md`](architecture.md) (redirects to startupai-crew canonical source)
- **Journey Map**: [`user-experience/founder-journey-map.md`](../user-experience/founder-journey-map.md)
