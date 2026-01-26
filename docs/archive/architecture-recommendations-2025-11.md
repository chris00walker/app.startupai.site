# Architecture Analysis & Implementation Roadmap

**Date**: November 8, 2025
**Status**: Implementation In Progress
**Version**: 3.0 (Merged November 20, 2025)
**Last Updated**: November 20, 2025

---

## Related Documentation

**CRITICAL:** Review these related documents for full context:

1. **[ONBOARDING_FAILURE_ANALYSIS.md](../incidents/ONBOARDING_FAILURE_ANALYSIS.md)** - Root cause analysis of onboarding workflow failures
   - Why progress shows 0% despite completing conversation
   - Why AI tools (assessQuality, advanceStage, completeOnboarding) aren't being called
   - Data flow diagrams and failure cascade analysis

2. **[onboarding-crewai-architecture.md](./onboarding-crewai-architecture.md)** - Implementation plan to fix broken workflow
   - Phase 1: Fix AI tool-calling
   - Phase 2: Add CrewAI integration
   - Phase 3: Fix frontend UX

3. **[SYSTEM_ENGINEER_HANDOFF.md](../incidents/SYSTEM_ENGINEER_HANDOFF.md)** - Original investigation into Forbidden errors

**Document relationship:**
- `ONBOARDING_FAILURE_ANALYSIS.md` → Forensic analysis of what's broken
- `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` → Actionable fix plan
- `ARCHITECTURE_RECOMMENDATIONS.md` (this file) → Complete status tracking + long-term vision

---

## Executive Summary

### Current Assessment (November 20, 2025)

The 3-repository architecture is **working well**. Phases 1-3A (user flow, role-based routing, onboarding conversational UI) are **complete**.

**However**, the core value proposition is **only ~40% complete**. The critical gap is the **Dashboard AI Assistant** - the conversational interface that bridges users and CrewAI crews for continuous strategic support.

### What's Working

- Onboarding conversational AI (Alex for Founders, Maya for Consultants) - excellent UX
- Role-based routing end-to-end (Marketing → Signup → Onboarding → Dashboard)
- Founder CrewAI integration at onboarding completion
- CrewAI AMP client library and infrastructure
- Database schema for storing analysis results
- Session persistence for both roles

### What's Missing (Critical)

1. **Dashboard AI Assistant** for both Founders and Consultants
2. **Consultant CrewAI workflow integration** (0% implemented)
3. **Notification system** for CrewAI completion
4. **Follow-up workflow dispatch** capability
5. **Bi-directional AI ↔ CrewAI conversation loop**

**This is not a routing problem - it's a feature completeness problem.** The vision of "AI crews supporting every user" is partially realized for founders and not at all for consultants.

---

## Current State Analysis

### Architecture Overview

```yaml
architecture:
  marketing_site:
    repo: 'startupai.site'
    tech: 'Next.js 15 static export'
    purpose: 'Promise - sell the value proposition'
    status: '✅ Working well'

  product_app:
    repo: 'app.startupai.site'
    tech: 'Next.js with Vercel AI SDK + CrewAI integration'
    purpose: 'Product - deliver the value'
    auth: 'Supabase (working)'
    dashboards:
      - 'Founder dashboard exists'
      - 'Consultant dashboard exists'
      - 'Role-based navigation implemented'
    status: '✅ Core features working'

  crewai_service:
    repo: 'startupai-crew'
    deployment: 'CrewAI AMP Platform'
    api: 'https://startupai-[uuid].crewai.com'
    integration: '✅ Called from app via CrewAIAMPClient'
    workflow: '6-agent strategic analysis'
    status: '✅ Deployed and functioning'
```

### Key Achievements

1. **Onboarding conversational AI is excellent**: Both Alex (Founder) and Maya (Consultant) have:
   - Conversational AI interface with 7-stage guided onboarding
   - Session resumption with conversation history persistence
   - AI tool calling for intelligent stage progression
   - Quality-based progress tracking with coverage metrics
   - Real-time streaming responses using Vercel AI SDK
   - Responsive and accessible UI

2. **Role-based routing working end-to-end**:
   - Marketing site → Pricing (role-filtered) → Signup (role-captured) → Auth → Onboarding (role-specific) → Dashboard (role-specific)

3. **Database architecture solid**:
   - consultant_profiles table with practice information
   - consultant_onboarding_sessions table with conversation history
   - onboarding_sessions table with session resumption for founders
   - Projects, reports, evidence, entrepreneur_briefs tables for founder analysis results

4. **Founder CrewAI integration partially working**:
   - CrewAI AMP client library functional
   - CrewAI triggered automatically at onboarding completion
   - Manual `/api/analyze` endpoint for strategic analysis
   - Results properly saved to Supabase

---

## Critical Architectural Gap

### The Value Proposition is NOT Fully Realized

The core vision is that "the entire system is supported by a crew of AIs" - but this is only partially true:

**Intended Architecture:**

```
Customer (Founder/Consultant)
    ↕ conversational dialogue
AI Assistant (Onboarding & Dashboard)
    ↕ API calls with context/briefs
CrewAI Multi-Agent Teams (on AMP Platform)
    ↓ async execution, saves results
Supabase Database
    ↑ alerts customer via AI Assistant
AI Assistant discusses findings, gathers follow-up questions
    ↓ dispatches new CrewAI workflows
[CONTINUOUS LOOP]
```

**Current Implementation:**

```
✅ Customer → AI Assistant (Onboarding only)
✅ (Founders only) AI Assistant → CrewAI (one-time at completion)
✅ CrewAI → Supabase
❌ [DEAD END - No dashboard AI Assistant]
❌ No notification system
❌ No follow-up workflow dispatch
❌ No consultant CrewAI integration at all
```

**The Missing Piece**: The AI Assistant exists only during onboarding. After onboarding, there's no conversational AI interface in the dashboards to:

- Alert users when CrewAI analysis completes
- Discuss findings with users
- Gather follow-up questions/context
- Dispatch new strategic analysis tasks to CrewAI
- Create the continuous value delivery loop

---

## Implementation Status

### ✅ Phase 1: App Routing Fixes - **100% COMPLETE**

- ✅ Deleted confusing landing page (commit 4461490)
- ✅ Updated auth callback with role routing (commit 369a71e)
- ✅ Updated signup to capture role parameter (commit 369a71e)
- ✅ Created separate onboarding routes for founder and consultant (commit 84251f0)
- ✅ Fixed post-onboarding redirects to role-specific dashboards (commit 663a265)
- ✅ Fixed logout flow to redirect to marketing site (commit 07101c8)
- ✅ Fixed email login redirect behavior (commit 62a18a8)

### ✅ Phase 2: Marketing Site Updates - **100% COMPLETE**

- ✅ Homepage redesign with two-path conversion
- ✅ Pricing page role-based filtering implemented (commit fe1b7b7)
- ✅ Free trial copy made inclusive of all roles (commit 22b1b95)

### ✅ Phase 3A: Onboarding Conversational UI - **100% COMPLETE**

- ✅ Consultant profile database tables created (commits ea64d14, 2e04b1c)
- ✅ Consultant onboarding wizard V2 with conversational UI (commit fe1ce88)
- ✅ Consultant API routes (start, chat, status, complete) (commit fe1ce88)
- ✅ Full session resumption with database persistence (commit 2e04b1c)
- ✅ AI tool calling (assessQuality, advanceStage, completeOnboarding) (commit 975f5d8)
- ✅ Quality-based progress tracking (commit 975f5d8)
- ✅ Feature parity with Founder onboarding conversational UI (commit 975f5d8)
- ✅ Founder session resumption added (commit 975f5d8)
- ✅ Bug fixes and responsive UI (commits a83505d, e8889f5, 47c1276, 4f4bfc8, 517b3d6)

### 🚧 Phase 3B: CrewAI Multi-Agent Integration - **~40% COMPLETE**

**Founder Implementation (~60% complete):**

- ✅ Onboarding AI Assistant (Alex) gathering context
- ✅ CrewAI AMP client library (`lib/crewai/amp-client.ts`)
- ✅ CrewAI triggered at onboarding completion (`/api/onboarding/complete`)
- ✅ `/api/analyze` endpoint for manual CrewAI workflow triggers
- ✅ Results saved to Supabase (projects, reports, evidence, entrepreneur_briefs)
- ❌ **MISSING**: Dashboard AI Assistant to discuss CrewAI findings
- ❌ **MISSING**: Follow-up CrewAI task dispatch from AI Assistant
- ❌ **MISSING**: Notification system for CrewAI completion
- ❌ **MISSING**: Bi-directional AI ↔ CrewAI conversation loop

**Consultant Implementation (~20% complete):**

- ✅ Onboarding AI Assistant (Maya) gathering practice context
- ✅ consultant_profiles and consultant_onboarding_sessions tables
- ❌ **MISSING**: CrewAI integration (onboarding completion does NOT trigger workflow)
- ❌ **MISSING**: Per-client AI Assistant interface
- ❌ **MISSING**: Per-client CrewAI workflow system
- ❌ **MISSING**: Dashboard AI Assistant for consultants
- ❌ **MISSING**: Client-specific project/report management

### ❌ Phase 4: Conversion Tracking & Notifications - **NOT STARTED**

- ⏸️ Notification bell component
- ⏸️ Conversion offer system for Strategy Sprint → Platform upgrades
- ⏸️ User notifications database table

---

## Required User Flows

### Founder Flow

```mermaid
graph TD
    A[Marketing Homepage] -->|Click: For Founders| B[Pricing Page role=founder]
    B -->|Select Plan| C[Signup role=founder&plan=X]
    C -->|Supabase Auth| D[Auth Callback]
    D -->|Store role=founder| E[/onboarding/founder]
    E -->|Complete| F[/founder-dashboard]

    G[Strategy Sprint User] -->|After completion| H[Bell Icon Notification]
    H -->|Click| I[Convert to Platform offer]
    I -->|Accept| J[Update to Platform + free month]
```

### Consultant Flow

```mermaid
graph TD
    A[Marketing Homepage] -->|Click: For Consultants| B[Pricing Page role=consultant]
    B -->|Select Plan| C[Signup role=consultant&plan=X]
    C -->|Supabase Auth| D[Auth Callback]
    D -->|Store role=consultant| E[/onboarding/consultant]
    E -->|CrewAI gathers info| F[Consultant Profile Created]
    F -->|Complete| G[/dashboard consultant view]
```

### Trial User Flow

```mermaid
graph TD
    A[Either Homepage Path] -->|Click: Free Trial| B[Pricing Page role=X]
    B -->|Free Trial Button| C[Signup role=X&plan=trial]
    C -->|Supabase Auth| D[Auth Callback]
    D -->|Route by role| E{Role?}
    E -->|Founder| F[/onboarding/founder]
    E -->|Consultant| G[/onboarding/consultant]
    F -->|Complete| H[/founder-dashboard trial mode]
    G -->|Complete| I[/dashboard consultant trial mode]
```

---

## Target Architecture (Option B - Clean Separation)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js on Netlify)                               │
│                                                             │
│  Vercel AI SDK Streaming Chat                              │
│  - Conversational onboarding UX                            │
│  - Dashboard AI Assistant (NEW)                            │
│  - Collects: entrepreneur_input (JSON)                     │
│  - Real-time streaming responses                           │
│                                                             │
│  When onboarding complete:                                 │
│  └─> Calls CrewAI Enterprise API                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ CrewAI AMP (Managed Platform)                               │
│                                                             │
│  StartupAI Crew - 6 Agent Sequential Workflow              │
│                                                             │
│  Agent 1: Supervisor Agent                                 │
│  ├─ Receives entrepreneur_input                            │
│  ├─ Validates data completeness                            │
│  └─ Distributes context to analysis agents                 │
│                                                             │
│  Agent 2: Customer Researcher                              │
│  Agent 3: Competitor Analyst                               │
│  Agent 4: Value Designer                                   │
│  Agent 5: Validation Agent                                 │
│  Agent 6: QA Agent                                         │
│                                                             │
│  Output: Complete strategic analysis package               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 3B: Dashboard AI Assistant (CRITICAL)

### 3B.1 Dashboard AI Assistant Component

```yaml
task: 'Create persistent AI Assistant for dashboards'
priority: 'CRITICAL - Core value proposition'
location: 'app.startupai.site/frontend/src/components/assistant/'
status: '❌ NOT STARTED'

component_architecture:
  shared_component:
    name: 'DashboardAIAssistant'
    file: 'components/assistant/DashboardAIAssistant.tsx'
    purpose: 'Conversational AI interface for ongoing strategic support'
    features:
      - 'Collapsible panel or modal interface'
      - "Context-aware of user's projects/clients"
      - 'Session persistence across page navigation'
      - 'Real-time streaming responses (Vercel AI SDK)'
      - 'Can trigger CrewAI workflows via tool calling'
      - 'Displays CrewAI analysis results when available'
      - 'Notification badge for new reports'

  founder_integration:
    dashboard: '/founder-dashboard'
    context_awareness:
      - 'Current project status'
      - 'Recent CrewAI analysis reports'
      - 'Entrepreneur brief data'
      - 'Evidence and insights collected'
    capabilities:
      - 'Discuss strategic analysis findings'
      - 'Answer questions about reports'
      - 'Gather follow-up context for deeper analysis'
      - 'Dispatch new CrewAI workflows via /api/analyze'

  consultant_integration:
    dashboard: '/dashboard (consultant view)'
    context_awareness:
      - 'Consultant practice profile'
      - 'Active clients list'
      - 'Per-client analysis reports'
      - 'Client project status'
    capabilities:
      - 'Discuss client-specific findings'
      - 'Help consultants prepare client reports'
      - 'Dispatch CrewAI analysis for each client'
      - 'Generate client-facing deliverables'

implementation:
  new_files:
    - 'frontend/src/components/assistant/DashboardAIAssistant.tsx'
    - 'frontend/src/components/assistant/AssistantPanel.tsx'
    - 'frontend/src/components/assistant/ConversationThread.tsx'
    - 'frontend/src/components/assistant/AssistantTrigger.tsx'
    - 'frontend/src/app/api/assistant/chat/route.ts'

  api_endpoint:
    path: '/api/assistant/chat'
    features:
      - 'Stream responses using Vercel AI SDK'
      - 'Tool calling for CrewAI dispatch'
      - 'Context injection (project, reports, briefs)'
      - 'Session management per user/project'

  tools_for_ai:
    triggerAnalysis:
      description: 'Dispatch new CrewAI strategic analysis'
      inputs: ['strategic_question', 'project_id', 'additional_context']
      implementation: 'Calls /api/analyze endpoint'

    getReportSummary:
      description: 'Retrieve and summarize a specific report'
      inputs: ['report_id', 'project_id']
      implementation: 'Queries reports table'

    getProjectStatus:
      description: 'Get current project status and recent activity'
      inputs: ['project_id']
      implementation: 'Queries projects, evidence, reports tables'

effort: '3-5 days'
risk: 'Medium - reusing onboarding patterns but new context'
```

### 3B.2 Consultant CrewAI Workflow Integration

```yaml
task: 'Integrate CrewAI workflows for consultant practice analysis'
priority: 'CRITICAL - Consultant value proposition missing'
repo: 'startupai-crew'
status: '❌ NOT STARTED (0% complete)'

consultant_onboarding_workflow:
  trigger: 'Consultant completes onboarding with Maya'
  location: '/api/consultant/onboarding/complete'
  implementation:
    - 'Call CrewAI AMP client with consultant practice context'
    - 'Inputs: practice_size, industries, services, pain_points, clients'
    - 'Outputs: practice analysis, workspace setup, client acquisition strategy'
    - 'Save to consultant_profiles and consultant_analysis_reports table'

  crewai_workflow:
    repo: 'startupai-crew'
    new_crew: 'consultant_practice_crew'
    agents:
      - 'Practice Analyst Agent'
      - 'Client Acquisition Strategist'
      - 'Workflow Optimization Agent'

per_client_workflow:
  trigger: 'Consultant requests analysis for a client via Dashboard AI Assistant'
  endpoint: '/api/consultant/analyze-client'

effort: '5-7 days'
```

### 3B.3 Notification System for CrewAI Completion

```yaml
task: "Alert users when CrewAI analysis completes"
priority: "HIGH - Completes the feedback loop"
status: "❌ NOT STARTED"

notification_types:
  crewai_analysis_complete:
    trigger: "CrewAI workflow finishes, results saved"
    recipients: "User who requested analysis"
    delivery:
      - "In-app notification badge on AI Assistant icon"
      - "Dashboard banner/toast"
      - "Optional email notification"
    message: "Your strategic analysis is ready! Click to discuss findings with your AI Assistant."

implementation:
  database:
    table: "user_notifications"
    columns:
      - id: "UUID PRIMARY KEY"
      - user_id: "UUID REFERENCES auth.users(id)"
      - type: "TEXT (analysis_complete, analysis_failed, system)"
      - title: "TEXT"
      - message: "TEXT"
      - metadata: "JSONB (project_id, report_id, analysis_id)"
      - read: "BOOLEAN DEFAULT false"
      - action_url: "TEXT"
      - created_at: "TIMESTAMPTZ"

  api_endpoints:
    - "/api/notifications/list"
    - "/api/notifications/mark-read"
    - "/api/notifications/create"

  ui_components:
    - "NotificationBell component in dashboard header"
    - "NotificationDropdown with list of recent notifications"
    - "Integration with DashboardAIAssistant"

effort: "2-3 days"
```

---

## Technical Implementation Details

### CrewAI Integration Service

**File**: `frontend/src/lib/crewai/client.ts`

```typescript
export interface EntrepreneurInput {
  business_idea: string;
  target_customers: string;
  problem: string;
  solution: string;
  competitors: string;
  resources: string;
  goals: string;
}

export interface KickoffResponse {
  kickoff_id: string;
}

export interface CrewStatus {
  state: 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  status: string;
  result: any | null;
  result_json: any | null;
}

export async function kickoffCrewAnalysis(
  entrepreneurInput: EntrepreneurInput
): Promise<KickoffResponse> {
  const response = await fetch(`${CREWAI_BASE_URL}/kickoff`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CREWAI_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: { entrepreneur_input: entrepreneurInput },
    }),
  });

  if (!response.ok) {
    throw new Error(`CrewAI kickoff failed: ${response.status}`);
  }

  return response.json();
}

export async function getCrewStatus(kickoffId: string): Promise<CrewStatus> {
  const response = await fetch(`${CREWAI_BASE_URL}/status/${kickoffId}`, {
    headers: {
      'Authorization': `Bearer ${CREWAI_TOKEN}`,
    },
  });

  return response.json();
}

export async function waitForCrewCompletion(
  kickoffId: string,
  options: { maxAttempts?: number; onProgress?: (status: CrewStatus) => void }
): Promise<CrewStatus> {
  // Poll with exponential backoff
  // See full implementation in codebase
}
```

### Database Migration for Analysis Results

```sql
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kickoff_id TEXT NOT NULL,
  result JSONB,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_kickoff_id ON analysis_results(kickoff_id);

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis results"
  ON analysis_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis results"
  ON analysis_results FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Testing Strategy

### Unit Tests

```bash
# Frontend
cd ~/projects/app.startupai.site/frontend
pnpm test src/lib/crewai/client.test.ts

# CrewAI Crew
cd ~/projects/startupai-crew
crewai test
```

### Integration Tests

1. **Test Supervisor Agent Locally**
```bash
cd ~/projects/startupai-crew
crewai run --input test_input.json
```

2. **Test Full Flow**
   - Complete onboarding (stages 1-7)
   - Verify crew kickoff happens automatically
   - Monitor execution in CrewAI AMP dashboard
   - Verify results appear in dashboard
   - Check database for saved results

### Test Cases

```yaml
founder_flow:
  - name: 'Free trial founder signup'
    steps:
      - 'Homepage → For Founders → Pricing'
      - 'Complete signup with role=founder&plan=trial'
      - 'Verify redirect to /onboarding/founder'
      - 'Complete onboarding'
      - 'Verify redirect to /founder-dashboard'

consultant_flow:
  - name: 'Agency co-pilot signup'
    steps:
      - 'Pricing → Agency Co-Pilot'
      - 'Complete signup with role=consultant'
      - 'Complete consultant onboarding'
      - 'Verify workspace setup recommendations'
```

---

## Monitoring & Observability

### CrewAI AMP Logs

```bash
# Real-time logs
crewai deploy logs --uuid b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b --follow

# Filter by task
crewai deploy logs --uuid b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b | grep supervision_task
```

### Frontend Analytics

```typescript
import { track } from '@/lib/analytics';

track('crew_kickoff', {
  kickoff_id,
  user_id: userId,
  onboarding_duration_seconds: sessionDuration,
});

track('crew_completed', {
  kickoff_id,
  execution_duration_seconds: executionTime,
  success: true,
});
```

### Database Queries

```sql
-- Check recent analyses
SELECT id, user_id, kickoff_id, created_at
FROM analysis_results
ORDER BY created_at DESC LIMIT 10;

-- Success rate
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN result IS NOT NULL THEN 1 ELSE 0 END) as successful
FROM analysis_results
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## Rollback Plan

### Quick Rollback

```bash
cd ~/projects/app.startupai.site
git revert HEAD~3..HEAD
git push origin main
```

### Gradual Rollback

1. Disable auto-kickoff in frontend (comment out `useEffect`)
2. Keep crew changes (Supervisor Agent is better anyway)
3. Manually trigger analysis when ready

---

## Success Criteria

### Phase 3B Complete When:

- ✅ Dashboard AI Assistant component exists for both roles
- ✅ Users can discuss CrewAI analysis results
- ✅ AI Assistant can dispatch new CrewAI workflows
- ✅ Notification system alerts users to new results
- ✅ Consultant CrewAI workflow integration functional
- ✅ Per-client management for consultants working

### Overall Success:

- ✅ End-to-end flow: Chat → Crew → Results → Discussion → Follow-up
- ✅ No manual intervention required
- ✅ <5% error rate over 1 week
- ✅ Average execution time <10 minutes
- ✅ User feedback positive (NPS >8)

---

## Timeline Estimate

| Phase | Estimated Time | Status |
|-------|---------------|--------|
| Phase 1: App Routing | - | ✅ Complete |
| Phase 2: Marketing Updates | - | ✅ Complete |
| Phase 3A: Onboarding UI | - | ✅ Complete |
| Phase 3B: Dashboard AI Assistant | 3-5 days | ❌ Not Started |
| Phase 3B: Consultant CrewAI | 5-7 days | ❌ Not Started |
| Phase 3B: Notifications | 2-3 days | ❌ Not Started |
| Phase 4: Conversion Tracking | 2-3 days | ❌ Not Started |
| **Total Remaining** | **12-18 days** | |

---

## Risks & Mitigation

```yaml
risk_1_breaking_existing_users:
  risk: 'Current users have undefined roles'
  mitigation:
    - 'Add migration to set default role=founder for existing users'
    - 'Gracefully handle missing role with fallback to founder'

risk_2_crewai_complexity:
  risk: 'Consultant workflow may be complex'
  mitigation:
    - 'Start simple with basic profile gathering'
    - 'Iterate on workflow based on feedback'
    - 'Can fall back to manual form if needed'

risk_3_dashboard_assistant_scope_creep:
  risk: 'AI Assistant may become too complex'
  mitigation:
    - 'Start with read-only features (discuss reports)'
    - 'Add CrewAI dispatch as second phase'
    - 'Follow onboarding patterns for consistency'
```

---

## Document Control

**Status**: Phases 1-3A Complete, Phase 3B-4 Pending
**Version**: 3.0 (Merged from marketing + app versions)
**Created**: November 8, 2025
**Updated**: November 20, 2025
**Next Steps**: Phase 3B - Dashboard AI Assistant (CRITICAL)

**Version History**:
- 1.0 (Nov 8): Initial analysis and routing fixes
- 2.0 (Nov 10): Status tracking with completion commits
- 2.1 (Nov 12): Option B technical implementation details
- 3.0 (Nov 20): Merged marketing + app versions with complete status tracking

---

Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
