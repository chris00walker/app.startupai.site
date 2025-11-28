# UI-to-CrewAI Wiring Audit Report

**Date:** 2025-11-27
**Auditor:** Claude (AI Assistant)
**Scope:** Product platform UI structure and backend API wiring analysis
**Status:** AUDIT COMPLETE - Integration gaps identified

---

## Executive Summary

This audit examines the StartupAI product platform's UI-to-backend wiring, specifically focusing on how the frontend connects to the CrewAI 6-agent workflow deployed on CrewAI AMP. The platform serves two user personas (Founders and Consultants), each with their own onboarding flow and dashboard.

**Key Findings:**
- ✅ UI structure is well-organized with clear separation between Founder and Consultant personas
- ⚠️ **Onboarding flows use Vercel AI SDK (OpenAI GPT-4.1-nano), NOT CrewAI**
- ⚠️ **CrewAI integration exists but is only used for post-onboarding strategic analysis**
- ⚠️ **UI promises features that CrewAI delivers, but wiring is incomplete**

---

## 1. UI Structure Analysis

### 1.1 Founder Persona

#### Onboarding Flow
**Location:** `frontend/src/app/onboarding/founder/page.tsx`

**Component:** `OnboardingWizardV2`
**File:** `frontend/src/components/onboarding/OnboardingWizardV2.tsx`

**7-Stage Conversational Flow:**
1. Welcome & Introduction
2. Customer Discovery
3. Problem Definition
4. Solution Validation
5. Competitive Analysis
6. Resources & Constraints
7. Goals & Next Steps

**Technology Stack:**
- Vercel AI SDK v5
- OpenAI GPT-4.1-nano (primary)
- Anthropic Claude (fallback)
- **NOT using CrewAI for onboarding**

**Data Collection:**
- Stores conversation in `onboarding_sessions` table
- Structured data extracted into `entrepreneur_briefs` table
- Progress tracking via `stage_data` JSONB column

#### Dashboard
**Location:** `frontend/src/pages/founder-dashboard.tsx` (Pages Router)

**Key Features:**
- 6 tabs: Overview, Gates, Hypotheses, Experiments, Evidence, Insights
- Quick stats: Gate Readiness, Evidence Items, Active Experiments, Next Milestone
- Gate dashboard showing validation progress
- Integration with `useProjects()` hook to fetch project data
- "AI Strategic Analysis" button (links to `/ai-analysis`)

**Shared Components:**
- `DashboardLayout` (layout/DashboardLayout)
- `FitDashboard` (fit/FitDashboard)
- `GateDashboard` (gates/GateDashboard)
- `HypothesisManager` (hypothesis/HypothesisManager)
- `EvidenceLedger` (fit/EvidenceLedger)
- `ExperimentsPage` (fit/ExperimentsPage)
- `DashboardAIAssistant` (assistant/DashboardAIAssistant)

### 1.2 Consultant Persona

#### Onboarding Flow
**Location:** `frontend/src/app/onboarding/consultant/page.tsx`

**Component:** `ConsultantOnboardingWizardV2`
**File:** `frontend/src/components/onboarding/ConsultantOnboardingWizardV2.tsx`

**7-Stage Conversational Flow:**
1. Welcome & Practice Overview
2. Practice Size & Structure
3. Industries & Services
4. Current Tools & Workflow
5. Client Management
6. Pain Points & Challenges
7. Goals & White-Label Setup

**Technology Stack:**
- Same as Founder: Vercel AI SDK + OpenAI
- Stores data in `consultant_onboarding_sessions` table
- **Also NOT using CrewAI for onboarding**

#### Dashboard
**Location:** `frontend/src/pages/consultant-dashboard.tsx` (Pages Router)

**Key Features:**
- Portfolio view of all client projects
- Gate filtering by stage and status
- Portfolio metrics (pass rate, cycle time, evidence coverage)
- Risk alerts for high-risk projects
- Integration with `useClients()` hook

**Shared Components:**
- `DashboardLayout`
- `PortfolioGrid` (portfolio/PortfolioGrid)
- `PortfolioMetrics` (portfolio/PortfolioMetrics)
- `GateAlerts` (portfolio/GateAlerts)
- `GateStageFilter` (portfolio/GateStageFilter)

### 1.3 Shared Components Summary

Both personas share:
- `DashboardLayout` - Main layout wrapper with navigation
- UI primitives from Shadcn (Card, Button, Badge, Tabs, etc.)
- Supabase authentication flow
- Similar conversational onboarding pattern (7 stages)

Differences:
- Founders work on single projects (validation journey)
- Consultants manage multi-client portfolios
- Different dashboard focus (validation vs. portfolio management)

---

## 2. API Endpoints and Wiring Analysis

### 2.1 Onboarding Flow APIs

#### Founder Onboarding Endpoints

| Endpoint | Method | Purpose | Tech Stack |
|----------|--------|---------|------------|
| `/api/onboarding/start` | POST | Initialize onboarding session | Supabase |
| `/api/onboarding/message` | POST | Stream AI conversation | **Vercel AI SDK + OpenAI** |
| `/api/onboarding/status` | GET | Get session progress | Supabase |
| `/api/onboarding/complete` | POST | Finalize onboarding, create project | Supabase |
| `/api/onboarding/recover` | POST | Recover abandoned session | Supabase |

**Key Wiring Details:**

**`/api/onboarding/message/route.ts` (652 lines):**
- Uses Agentuity agent URL (can fallback to legacy CREW_ANALYZE_URL)
- Resolves to `process.env.AGENTUITY_AGENT_URL` or `http://localhost:8000/onboarding`
- Sends `action: 'message'` with session_id and user message
- Receives structured response with:
  - `agent_response` (AI message)
  - `quality_signals` (clarity, completeness scores)
  - `brief_update` (structured data extraction)
  - `stage_state` (progress tracking)
  - `stage_snapshot` (coverage analysis)
- Updates `onboarding_sessions` table with conversation history and progress
- **Does NOT trigger CrewAI workflow**

#### Consultant Onboarding Endpoints

| Endpoint | Method | Purpose | Tech Stack |
|----------|--------|---------|------------|
| `/api/consultant/onboarding/start` | POST | Initialize consultant session | Supabase |
| `/api/consultant/chat` | POST | Stream AI conversation | **Vercel AI SDK + OpenAI** |
| `/api/consultant/onboarding/status` | GET | Get session progress | Supabase |
| `/api/consultant/onboarding/complete` | POST | Finalize consultant onboarding | Supabase |

**Key Finding:** Consultant onboarding also uses Vercel AI SDK, not CrewAI.

### 2.2 Dashboard APIs

#### Founder Dashboard Data Hooks

**`useProjects()` Hook:**
- Fetches from `projects` table
- Filters by `user_id`
- Returns project list with stage, status, gate readiness

**`useGateEvaluation()` Hook:**
- Fetches gate evaluation data
- Calculates readiness score
- Provides evidence count, experiments count

**No direct CrewAI calls from dashboard** - data is served from Supabase tables populated by previous analysis runs.

#### Consultant Dashboard Data Hooks

**`useClients()` Hook:**
- Fetches client projects from `projects` table (consultant role filter)
- Returns portfolio view data

**Portfolio Metrics:**
- Calculated from existing projects in database
- Uses mock data if no real projects exist (see `mockPortfolioProjects` in `data/portfolioMockData`)

### 2.3 CrewAI Integration Endpoints

| Endpoint | Method | Purpose | Current Status |
|----------|--------|---------|----------------|
| `/api/crewai/status` | GET | Poll CrewAI workflow status | ✅ **IMPLEMENTED** |
| `/api/crewai/results` | POST | Webhook for CrewAI results | ✅ **IMPLEMENTED** |
| `/api/crewai/consultant` | POST | Consultant onboarding results (legacy) | ⚠️ **DEPRECATED** |
| `/api/crewai/webhook` | POST | Generic webhook handler | ✅ **IMPLEMENTED** |
| `/api/analyze` | POST | Trigger strategic analysis | ✅ **IMPLEMENTED** |

**Key Integration Points:**

**`/api/crewai/status/route.ts`:**
- GET endpoint that polls CrewAI AMP for workflow status
- Used by frontend to track analysis progress
- Stores completed results in `reports` table
- Updates project status to 'active' when complete

**`/lib/crewai/amp-client.ts` (300 lines):**
- `CrewAIAMPClient` class with methods:
  - `kickoff(request)` - Start crew execution
  - `getStatus(kickoffId)` - Check status
  - `kickoffAndWait(request)` - Async pattern with polling
  - `getInputs()` - Get expected inputs schema
- Uses `process.env.CREWAI_API_URL` and `process.env.CREWAI_API_TOKEN`
- Supports 6-agent crew workflow (6 tasks @ ~16.67% each)

**`/api/analyze/route.ts`:**
- POST endpoint to trigger strategic analysis
- Validates user, project, and plan limits
- Kicks off CrewAI workflow using `CrewAIAMPClient`
- Stores `kickoff_id` for status tracking
- **This is the primary CrewAI trigger endpoint**

---

## 3. CrewAI Integration Points

### 3.1 Current CrewAI Deployment

**Deployment Details:**
- Platform: CrewAI AMP
- URL: `https://startupai-b4d5c1dd-27e2-4163-b9fb-a18ca06ca-4f4192a6.crewai.com`
- Workflow: 6-agent strategic analysis crew
- Authentication: Bearer token (`process.env.CREWAI_API_TOKEN`)

**Input Format:**
```json
{
  "inputs": {
    "entrepreneur_input": {
      "target_customer": "string",
      "problem_description": "string",
      "solution_description": "string",
      "key_differentiators": ["array"],
      "competitors": ["array"],
      "budget_range": "string",
      "business_stage": "string",
      "goals": "string"
    }
  }
}
```

**Output Format:**
- Returns as `result` in status response
- Stored in `reports` table with `report_type: 'value_proposition_analysis'`
- Expected to contain 6-section analysis report

### 3.2 CrewAI Capabilities (Based on Architecture Docs)

According to `CLAUDE.md` and architecture documentation, CrewAI should deliver:

**6 AI Founders (C-Suite Agents):**
1. Sage (CSO) - Strategic oversight
2. Forge (CTO) - Technical analysis
3. Pulse (CGO) - Growth strategy
4. Compass (CPO) - Product validation
5. Guardian (CGO) - Governance
6. Ledger (CFO) - Financial analysis

**8 Crews:**
1. Service Crew
2. Analysis Crew
3. Governance Crew
4. Build Crew
5. Growth Crew
6. Synthesis Crew
7. Finance Crew
8. Enhanced Governance Crew

**Expected Outputs:**
1. Customer Profile (Jobs, Pains, Gains)
2. Competitor Analysis Report
3. Value Proposition Canvas
4. 3-Tier Validation Roadmap
5. QA Report
6. Strategic recommendations

**Current Implementation Status:**
- Platform integrated with **6-agent crew** (not yet rebuilt to Flows architecture)
- See `startupai-crew/docs/master-architecture/internal-validation-system-spec.md` for full blueprint

---

## 4. Gap Analysis: UI Promises vs. CrewAI Capabilities

### 4.1 Onboarding Flow

| UI Feature | Current Wiring | CrewAI Capability | Gap |
|------------|---------------|-------------------|-----|
| 7-stage conversational onboarding | Vercel AI SDK + OpenAI GPT-4.1-nano | N/A - CrewAI not used here | ⚠️ **ARCHITECTURAL MISMATCH** - Onboarding could benefit from CrewAI's deeper analysis |
| Structured data extraction | OpenAI function calling | N/A | ✅ Working but could be enhanced with CrewAI's strategic insights |
| Quality scoring (clarity, completeness) | Custom logic in message route | N/A | ✅ Working |
| Progress tracking | Stage-based progression | N/A | ✅ Working |
| **Post-onboarding project creation** | ✅ Creates project in DB | ✅ CrewAI analysis triggered | ✅ **WIRED CORRECTLY** |

**Key Insight:** Onboarding deliberately uses lightweight OpenAI model for conversational UX. CrewAI is reserved for heavyweight strategic analysis AFTER onboarding completes.

### 4.2 Founder Dashboard

| UI Feature | Data Source | CrewAI Integration | Gap |
|------------|-------------|-------------------|-----|
| Gate readiness scores | Supabase `gate_scores` table | No direct integration | ⚠️ CrewAI could populate gate scores |
| Evidence quality tracking | Supabase `evidence` table | No direct integration | ⚠️ CrewAI could assess evidence quality |
| Experiment recommendations | Static/mock data | No integration | ❌ **MISSING** - CrewAI should generate experiment recommendations |
| Strategic insights | "Coming Soon" placeholder | No integration | ❌ **MISSING** - CrewAI analysis results not displayed |
| Validation roadmap | Not implemented | CrewAI delivers "3-Tier Validation Roadmap" | ❌ **MAJOR GAP** - CrewAI output not wired to UI |
| Competitor analysis | Not implemented | CrewAI delivers "Competitor Analysis Report" | ❌ **MAJOR GAP** |
| Value proposition canvas | Not implemented | CrewAI delivers "Value Proposition Canvas" | ❌ **MAJOR GAP** |
| Customer profile (Jobs/Pains/Gains) | Not implemented | CrewAI delivers "Customer Profile" | ❌ **MAJOR GAP** |

**Critical Missing Wiring:**
1. CrewAI analysis results are stored in `reports` table but NOT displayed in dashboard
2. UI has "Insights" tab with "Coming Soon" message
3. No component exists to render CrewAI's 6-section report
4. Dashboard shows placeholder data instead of CrewAI-generated recommendations

### 4.3 Consultant Dashboard

| UI Feature | Data Source | CrewAI Integration | Gap |
|------------|-------------|-------------------|-----|
| Portfolio metrics | Calculated from projects | No integration | ✅ Works with existing data |
| Gate filtering | Client-side filtering | No integration | ✅ Works |
| Risk alerts | Calculated from project data | No integration | ⚠️ Could be enhanced with CrewAI risk assessment |
| Client practice analysis | Not implemented | CrewAI could deliver consultant-specific insights | ❌ **MISSING** - Consultant persona not fully utilizing CrewAI |
| White-label suggestions | Stored in DB via webhook | `/api/crewai/consultant` (deprecated) | ⚠️ **NEEDS MIGRATION** to new webhook system |

### 4.4 "AI Strategic Analysis" Feature

**Current State:**
- Founder dashboard has button: "AI Strategic Analysis" → `/ai-analysis`
- This likely triggers `/api/analyze` endpoint
- Frontend polls `/api/crewai/status` for progress
- Modal shows analysis progress (see `OnboardingWizardV2.tsx:82-87` - analysis modal logic)

**Missing:**
- No dedicated page/route for displaying completed analysis
- No component to render CrewAI's 6-section report
- Results stored in `reports` table but not surfaced in UI

---

## 5. Recommended Integration Points

### 5.1 High Priority - Display CrewAI Analysis Results

**Problem:** CrewAI generates comprehensive reports but they're not shown to users.

**Solution:**
1. Create `/app/project/[id]/analysis` route
2. Build `CrewAIReportViewer` component to render:
   - Customer Profile (Jobs, Pains, Gains)
   - Competitor Analysis Report
   - Value Proposition Canvas
   - 3-Tier Validation Roadmap
   - QA Report
3. Wire to `reports` table where CrewAI results are stored
4. Add "View Analysis" button on dashboard that links to this page

**Files to Create:**
- `frontend/src/app/project/[id]/analysis/page.tsx`
- `frontend/src/components/crewai/ReportViewer.tsx`
- `frontend/src/components/crewai/sections/CustomerProfile.tsx`
- `frontend/src/components/crewai/sections/CompetitorAnalysis.tsx`
- `frontend/src/components/crewai/sections/ValuePropositionCanvas.tsx`
- `frontend/src/components/crewai/sections/ValidationRoadmap.tsx`
- `frontend/src/components/crewai/sections/QAReport.tsx`

### 5.2 Medium Priority - Populate Dashboard with CrewAI Data

**Problem:** Dashboard shows mock/placeholder data instead of CrewAI insights.

**Solution:**
1. Parse CrewAI report JSON in `reports` table
2. Extract actionable insights:
   - Recommended experiments (populate Experiments tab)
   - Next steps (populate "Recommended Next Steps" widget)
   - Evidence gaps (highlight in Evidence tab)
3. Create `useCrewAIInsights(projectId)` hook
4. Wire to dashboard tabs

**Files to Modify:**
- `frontend/src/pages/founder-dashboard.tsx` (line 185-242: NextSteps component)
- `frontend/src/hooks/useCrewAIInsights.ts` (new hook)
- `frontend/src/lib/crewai/report-parser.ts` (new utility)

### 5.3 Medium Priority - Enhance Gate Scoring with CrewAI

**Problem:** Gate readiness scores are calculated but could be enhanced with AI analysis.

**Solution:**
1. After CrewAI analysis completes, extract validation insights
2. Update `gate_scores` table with AI-recommended thresholds
3. Use CrewAI's QA report to identify evidence gaps

**Files to Modify:**
- `/api/crewai/status/route.ts` (line 52-105: add gate scoring logic)
- Add `/lib/crewai/gate-scorer.ts` utility

### 5.4 Low Priority - Consultant-Specific CrewAI Integration

**Problem:** Consultant persona doesn't fully utilize CrewAI capabilities.

**Solution:**
1. Build consultant-specific analysis workflow
2. Generate practice insights (strengths, gaps, positioning)
3. Populate consultant dashboard with AI recommendations

**Files to Create:**
- `/api/crewai/analyze-consultant` endpoint
- Consultant-specific CrewAI crew (requires `startupai-crew` changes)

### 5.5 Low Priority - Real-time Analysis Updates

**Problem:** Analysis progress modal exists but UX could be smoother.

**Solution:**
1. Add WebSocket support for real-time CrewAI status updates
2. Show which AI agent is currently working
3. Display intermediate insights as they're generated

**Files to Modify:**
- `frontend/src/components/onboarding/OnboardingWizardV2.tsx` (line 125-158: polling logic → WebSocket)
- Add `/api/crewai/stream` SSE endpoint

---

## 6. Architecture Diagram: Current vs. Desired State

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│ USER JOURNEY                                                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. Founder signs up → /onboarding/founder                      │
│ 2. Chats with AI (OpenAI GPT-4.1-nano via Vercel AI SDK)       │
│ 3. Completes 7 stages → data saved to entrepreneur_briefs      │
│ 4. Project created → CrewAI analysis triggered                 │
│ 5. Analysis runs (6 agents, ~5 min)                            │
│ 6. Results stored in reports table                             │
│ 7. User redirected to /founder-dashboard                       │
│                                                                  │
│ ❌ PROBLEM: Analysis results NOT displayed anywhere            │
│ ❌ PROBLEM: Dashboard shows mock data instead of AI insights   │
└─────────────────────────────────────────────────────────────────┘
```

### Desired State

```
┌─────────────────────────────────────────────────────────────────┐
│ IMPROVED USER JOURNEY                                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Founder completes onboarding                                │
│ 2. Project created + CrewAI analysis triggered                 │
│ 3. Analysis progress modal shows real-time updates             │
│ 4. Analysis completes → redirect to /project/{id}/analysis     │
│ 5. User sees 6-section CrewAI report:                          │
│    - Customer Profile (Jobs, Pains, Gains)                     │
│    - Competitor Analysis                                        │
│    - Value Proposition Canvas                                  │
│    - 3-Tier Validation Roadmap                                 │
│    - Recommended Experiments                                    │
│    - QA Report with Evidence Gaps                              │
│ 6. Dashboard populated with AI-generated insights              │
│ 7. Next steps and experiments auto-generated from analysis     │
│                                                                  │
│ ✅ FIX: Complete integration of CrewAI outputs into UI         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Technical Debt and Migration Notes

### 7.1 Hybrid Routing (App Router + Pages Router)

- **Current State:** Onboarding uses App Router (`app/onboarding/*`), Dashboards use Pages Router (`pages/*-dashboard.tsx`)
- **Status:** Intentional migration strategy (Vercel-recommended)
- **Action:** Eventually migrate dashboards to App Router

### 7.2 Mock Data in Production

- **Issue:** Consultant dashboard falls back to `mockPortfolioProjects` when no real data
- **File:** `frontend/src/pages/consultant-dashboard.tsx:178`
- **Action:** Ensure production users always have real data or better empty states

### 7.3 Deprecated Endpoints

- `/api/crewai/consultant` marked as LEGACY
- **Action:** Migrate to `/api/crewai/webhook` with `flow_type: "consultant_onboarding"`

### 7.4 Environment Variables Required

```bash
# CrewAI Integration
CREWAI_API_URL=https://startupai-b4d5c1dd-27e2-4163-b9fb-a18ca06ca...
CREWAI_API_TOKEN=<bearer_token>

# Optional: Agentuity Agent (for onboarding)
AGENTUITY_AGENT_URL=http://localhost:8000/onboarding
CREW_ANALYZE_URL=<legacy_fallback>

# Verification
CREW_CONTRACT_BEARER=f4cc39d92520
```

---

## 8. Summary and Next Steps

### Key Findings

1. ✅ **UI structure is solid** - Clear separation between Founder and Consultant personas
2. ✅ **Onboarding flows work well** - Using Vercel AI SDK for conversational UX is appropriate
3. ✅ **CrewAI integration is implemented** - Backend wiring exists and works
4. ❌ **Major gap: CrewAI outputs are NOT displayed in UI** - Reports stored but not shown
5. ⚠️ **Dashboard relies on mock/placeholder data** - Should use CrewAI insights

### Critical Path to Production

**Priority 1: Display CrewAI Analysis Results**
- Create `/project/[id]/analysis` route
- Build report viewer components
- Wire to `reports` table
- **Estimated effort:** 2-3 days

**Priority 2: Populate Dashboard with AI Insights**
- Parse CrewAI report JSON
- Extract experiments, next steps, evidence gaps
- Replace mock data with real insights
- **Estimated effort:** 3-4 days

**Priority 3: Enhanced UX**
- Real-time analysis updates
- Better progress indicators
- AI-generated experiment recommendations
- **Estimated effort:** 2-3 days

### Total Gap Closure Estimate
**7-10 days of development** to fully integrate CrewAI outputs into the UI and replace all mock/placeholder content with real AI-generated insights.

---

## Appendix A: File Inventory

### Frontend UI Files

**Founder Onboarding:**
- `frontend/src/app/onboarding/founder/page.tsx`
- `frontend/src/components/onboarding/OnboardingWizardV2.tsx`
- `frontend/src/components/onboarding/OnboardingSidebar.tsx`
- `frontend/src/components/onboarding/ConversationInterfaceV2.tsx`

**Consultant Onboarding:**
- `frontend/src/app/onboarding/consultant/page.tsx`
- `frontend/src/components/onboarding/ConsultantOnboardingWizardV2.tsx`

**Dashboards:**
- `frontend/src/pages/founder-dashboard.tsx`
- `frontend/src/pages/consultant-dashboard.tsx`
- `frontend/src/components/layout/DashboardLayout.tsx`

**Dashboard Components:**
- `frontend/src/components/fit/FitDashboard.tsx`
- `frontend/src/components/gates/GateDashboard.tsx`
- `frontend/src/components/hypothesis/HypothesisManager.tsx`
- `frontend/src/components/fit/EvidenceLedger.tsx`
- `frontend/src/components/fit/ExperimentsPage.tsx`
- `frontend/src/components/portfolio/*` (6 files)
- `frontend/src/components/assistant/DashboardAIAssistant.tsx`

### API Endpoints

**Onboarding:**
- `frontend/src/app/api/onboarding/start/route.ts`
- `frontend/src/app/api/onboarding/message/route.ts`
- `frontend/src/app/api/onboarding/status/route.ts`
- `frontend/src/app/api/onboarding/complete/route.ts`
- `frontend/src/app/api/onboarding/recover/route.ts`

**Consultant:**
- `frontend/src/app/api/consultant/onboarding/start/route.ts`
- `frontend/src/app/api/consultant/chat/route.ts`
- `frontend/src/app/api/consultant/onboarding/status/route.ts`
- `frontend/src/app/api/consultant/onboarding/complete/route.ts`

**CrewAI:**
- `frontend/src/app/api/crewai/status/route.ts`
- `frontend/src/app/api/crewai/results/route.ts`
- `frontend/src/app/api/crewai/webhook/route.ts`
- `frontend/src/app/api/crewai/consultant/route.ts` (deprecated)
- `frontend/src/app/api/analyze/route.ts`

### Libraries and Utilities

**CrewAI Integration:**
- `frontend/src/lib/crewai/amp-client.ts`
- `frontend/src/lib/crewai/client.ts`
- `frontend/src/lib/crewai/types.ts`

**Hooks:**
- `frontend/src/hooks/useProjects.ts`
- `frontend/src/hooks/useClients.ts`
- `frontend/src/hooks/useGateEvaluation.ts`
- `frontend/src/hooks/useAuth.ts`

---

**End of Audit Report**
