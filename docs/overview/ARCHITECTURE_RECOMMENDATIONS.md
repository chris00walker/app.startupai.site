# Architecture Recommendations: Option B - CrewAI AMP Integration

**Date**: November 12, 2025
**Status**: Ready for Implementation
**Prerequisites**: ✅ Option A Complete (Streaming chat working with OpenAI)

---

## 🔗 Related Documentation

**CRITICAL:** Do NOT implement Option B until (./ONBOARDING_TO_CREWAI_ARCHITECTURE.md) has been fully implemented, tested and is working. Please review these related documents:

1. **[ONBOARDING_FAILURE_ANALYSIS.md](../incidents/ONBOARDING_FAILURE_ANALYSIS.md)** - Root cause analysis of current onboarding workflow failures
   - Why progress shows 0% despite completing conversation
   - Why AI tools (assessQuality, advanceStage, completeOnboarding) aren't being called
   - Where conversation data is stored (testSessionState)
   - Data flow diagrams and failure cascade analysis

2. **[ONBOARDING_TO_CREWAI_ARCHITECTURE.md](./ONBOARDING_TO_CREWAI_ARCHITECTURE.md)** - Complete implementation plan to fix broken workflow
   - **Phase 1**: Fix AI tool-calling (switch gpt-4o-mini → gpt-4o, add toolChoice: 'required')
   - **Phase 2**: Add CrewAI integration (kickoff handler, status polling, project creation)
   - **Phase 3**: Fix frontend UX (analysis modal, auto-redirect to project dashboard)
   - Includes: Brief schema mapping, testing strategy, rollback plan
   - Timeline: 11 hours (~1.5 days)

3. **[SYSTEM_ENGINEER_HANDOFF.md](../incidents/SYSTEM_ENGINEER_HANDOFF.md)** - Original investigation into Forbidden errors
   - Historical context: Netlify AI Gateway issue
   - Why we removed Anthropic provider
   - SSE streaming format parsing fix

**Relationship between documents:**
- `SYSTEM_ENGINEER_HANDOFF.md` → Led to Option A (fix streaming)
- `ARCHITECTURE_RECOMMENDATIONS.md` (this file) → Original Option B vision (long-term architecture)
- `../incidents/ONBOARDING_FAILURE_ANALYSIS.md` → Forensic analysis of why current system is broken
- `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` (in this directory) → **Actionable implementation plan** combining Option A fixes + Option B architecture

**Recommended reading order:**
1. `../incidents/ONBOARDING_FAILURE_ANALYSIS.md` - Understand what's broken
2. `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` (in this directory) - See the fix plan
3. `ARCHITECTURE_RECOMMENDATIONS.md` (this file) - Understand long-term vision

---

## Executive Summary

This document outlines the recommended architecture for **Option B**: migrating from duplicated onboarding logic to a clean separation where the frontend handles conversational UX while CrewAI AMP handles all strategic analysis through a Supervisor Agent pattern.

**Key Benefits**:
- ✅ Single source of truth for AI logic (CrewAI AMP)
- ✅ Clean separation: Frontend = UX, CrewAI = Intelligence
- ✅ Uses official CrewAI Enterprise MCP server
- ✅ Eliminates logic duplication
- ✅ Scalable for multiple crew workflows

---

## Current State (Option A - Complete)

### What's Working Now
```
Frontend: Vercel AI SDK streaming chat
    ↓ Direct OpenAI API calls
Netlify Function: /api/chat
    ↓ OpenAI gpt-4.1-nano
Streaming Response → Rendered correctly ✅

Separate System:
CrewAI AMP Deployment
    ↓ 6-agent sequential workflow
    Agent 1: "Onboarding Agent" ← DUPLICATE LOGIC
    Agents 2-6: Analysis agents
```

### Problems with Current State
1. **Logic Duplication**: Onboarding logic exists in both frontend chat AND CrewAI "Onboarding Agent"
2. **Disconnected Systems**: Chat collects data, but doesn't trigger analysis automatically
3. **Manual Handoff**: No automated flow from chat → crew execution
4. **Misnamed Agent**: "Onboarding Agent" doesn't actually onboard users - it processes already-collected data

---

## Target State (Option B - Recommended)

### Clean Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js on Netlify)                               │
│                                                             │
│  Vercel AI SDK Streaming Chat                              │
│  - Conversational onboarding UX                            │
│  - Collects: entrepreneur_input (JSON)                     │
│  - Real-time streaming responses                           │
│  - 7 stages of questions                                   │
│                                                             │
│  When onboarding complete:                                 │
│  └─> Calls CrewAI Enterprise MCP Server                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ MCP Protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ CrewAI Enterprise MCP Server (Local)                        │
│                                                             │
│  Tools:                                                     │
│  - kickoff_crew(inputs: {entrepreneur_input})              │
│  - get_crew_status(crew_id)                                │
│                                                             │
│  Configuration:                                             │
│  - URL: https://startupai-[uuid].crewai.com                │
│  - Token: f4cc39d92520                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ CrewAI AMP (Managed Platform)                               │
│                                                             │
│  StartupAI Crew - 6 Agent Sequential Workflow              │
│                                                             │
│  Agent 1: Supervisor Agent ← RENAMED & REFACTORED          │
│  ├─ Receives entrepreneur_input from MCP                   │
│  ├─ Validates data completeness                            │
│  ├─ Orchestrates workflow                                  │
│  └─ Distributes context to analysis agents                 │
│                                                             │
│  Agent 2: Customer Researcher                              │
│  └─ Jobs, Pains, Gains analysis                            │
│                                                             │
│  Agent 3: Competitor Analyst                               │
│  └─ Market positioning & differentiation                   │
│                                                             │
│  Agent 4: Value Designer                                   │
│  └─ Value Proposition Canvas creation                      │
│                                                             │
│  Agent 5: Validation Agent                                 │
│  └─ 3-tier validation roadmap                              │
│                                                             │
│  Agent 6: QA Agent                                         │
│  └─ Quality assurance & compliance check                   │
│                                                             │
│  Output: Complete strategic analysis package               │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Refactor CrewAI Crew (No Frontend Changes)

**Objective**: Rename and refactor the first agent to be a true Supervisor

#### 1.1 Update Agent Configuration

**File**: `~/projects/startupai-crew/src/startupai/config/agents.yaml`

```yaml
supervisor_agent:  # Renamed from onboarding_agent
  role: Workflow Supervisor & Context Distributor
  goal: >
    Receive structured entrepreneur input from the frontend, validate completeness,
    and orchestrate the analysis workflow by distributing relevant context to
    specialized agents
  backstory: >
    You are an experienced strategic consultant who excels at coordinating teams
    of specialists. Your role is to ensure all agents have the context they need
    and that the workflow produces comprehensive, high-quality analysis. You don't
    conduct interviews - you receive pre-collected data and ensure it flows
    through the system effectively.
  verbose: true
  allow_delegation: true
  max_iter: 5  # Reduced - supervisor doesn't need many iterations
```

**Changes**:
- ❌ Remove interview/questioning language
- ✅ Add orchestration & coordination focus
- ✅ Expect structured JSON input, not conversation
- ✅ Reduce max_iter from 10 to 5 (less reasoning needed)

#### 1.2 Update Task Configuration

**File**: `~/projects/startupai-crew/src/startupai/config/tasks.yaml`

```yaml
supervision_task:  # Renamed from onboarding_task
  description: |
    Receive and validate the entrepreneur_input data structure from the frontend.

    Input format (JSON):
    {
      "business_idea": "Description of the startup concept",
      "target_customers": "Customer segment details",
      "problem": "Core problem being solved",
      "solution": "Proposed solution approach",
      "competitors": "Known competitors (if any)",
      "resources": "Available budget, timeline, assets",
      "goals": "Validation goals and success metrics"
    }

    Your job:
    1. Validate all required fields are present
    2. Extract key insights for downstream agents
    3. Create a structured brief for the analysis team
    4. Flag any critical missing information

    DO NOT conduct interviews or ask questions - the data is already collected.

  expected_output: |
    A validated Entrepreneur Brief JSON containing:
    - business_concept: Refined business idea statement
    - target_segment: Customer segment definition
    - core_problem: Problem statement
    - solution_vision: Solution approach
    - competitive_context: Competitor landscape (if known)
    - resource_constraints: Budget, timeline, available assets
    - validation_goals: What success looks like
    - completeness_score: 0-100 rating of data completeness
    - flagged_gaps: List of any critical missing information

  agent: supervisor_agent
```

**Changes**:
- ❌ Remove conversational prompts
- ✅ Expect structured JSON input
- ✅ Focus on validation & orchestration
- ✅ Clear output contract for downstream agents

#### 1.3 Update Python Crew Implementation

**File**: `~/projects/startupai-crew/src/startupai/crew.py`

```python
@agent
def supervisor_agent(self) -> Agent:
    """Supervisor Agent - Workflow orchestration and context distribution."""
    return Agent(
        config=self.agents_config['supervisor_agent'],
        verbose=True,
    )

@task
def supervision_task(self) -> Task:
    """Task for validating input and orchestrating workflow."""
    return Task(
        config=self.tasks_config['supervision_task'],
        agent=self.supervisor_agent(),
    )
```

**Changes**:
- Rename method from `onboarding_agent()` to `supervisor_agent()`
- Rename method from `onboarding_task()` to `supervision_task()`
- Update docstrings

#### 1.4 Update Crew Assembly

**File**: `~/projects/startupai-crew/src/startupai/crew.py`

```python
@crew
def crew(self) -> Crew:
    """
    Creates the StartupAI Crew with sequential process.

    Workflow:
    1. Supervisor validates entrepreneur_input
    2. Customer Researcher analyzes Jobs/Pains/Gains
    3. Competitor Analyst maps competitive landscape
    4. Value Designer creates Value Proposition Canvas
    5. Validation Agent designs 3-tier roadmap
    6. QA Agent performs quality checks
    """
    return Crew(
        agents=self.agents,
        tasks=self.tasks,
        process=Process.sequential,
        verbose=True,
    )
```

#### 1.5 Deploy to CrewAI AMP

```bash
cd ~/projects/startupai-crew

# Test locally first
crewai run

# If successful, deploy
crewai deploy push --uuid b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b

# Monitor deployment
crewai deploy status --uuid b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b
crewai deploy logs --uuid b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b
```

**Verification**:
```bash
# Test with sample input
curl -X POST https://startupai-b4d5c1dd-27e2-4163-b9fb-a18ca06ca-4f4192a6.crewai.com/kickoff \
  -H "Authorization: Bearer f4cc39d92520" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "entrepreneur_input": {
        "business_idea": "B2B SaaS for small manufacturing maintenance tracking",
        "target_customers": "Facilities managers at 50-200 employee companies",
        "problem": "Using spreadsheets, experiencing unexpected equipment failures",
        "solution": "Cloud-based maintenance tracking platform",
        "competitors": "Not sure yet",
        "resources": "6 months runway, $10k budget",
        "goals": "Validate problem exists before building MVP"
      }
    }
  }'
```

---

### Phase 2: Frontend Integration with MCP

**Objective**: Wire up frontend to call CrewAI crew via MCP when onboarding completes

#### 2.1 Environment Configuration

**File**: `~/projects/app.startupai.site/frontend/.env.local`

Already configured:
```bash
MCP_CREWAI_ENTERPRISE_SERVER_URL=https://startupai-b4d5c1dd-27e2-4163-b9fb-a18ca06ca-4f4192a6.crewai.com
MCP_CREWAI_ENTERPRISE_BEARER_TOKEN=f4cc39d92520
```

#### 2.2 Create CrewAI Integration Service

**File**: `~/projects/app.startupai.site/frontend/src/lib/crewai/client.ts` (NEW)

```typescript
/**
 * CrewAI Enterprise Integration Client
 *
 * Provides typed interface to CrewAI AMP via direct API calls.
 * Note: MCP server is for Claude Code usage, not frontend runtime.
 */

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
  last_step: any | null;
  last_executed_task: any | null;
  source: string;
}

const CREWAI_BASE_URL = process.env.MCP_CREWAI_ENTERPRISE_SERVER_URL;
const CREWAI_TOKEN = process.env.MCP_CREWAI_ENTERPRISE_BEARER_TOKEN;

if (!CREWAI_BASE_URL || !CREWAI_TOKEN) {
  throw new Error('CrewAI configuration missing. Check MCP env vars.');
}

/**
 * Kick off the StartupAI strategic analysis crew
 */
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
    const error = await response.text();
    throw new Error(`CrewAI kickoff failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get the status and results of a crew execution
 */
export async function getCrewStatus(kickoffId: string): Promise<CrewStatus> {
  const response = await fetch(`${CREWAI_BASE_URL}/status/${kickoffId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CREWAI_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CrewAI status check failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Poll for crew completion with exponential backoff
 */
export async function waitForCrewCompletion(
  kickoffId: string,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    onProgress?: (status: CrewStatus) => void;
  } = {}
): Promise<CrewStatus> {
  const {
    maxAttempts = 60, // ~5 minutes with exponential backoff
    initialDelay = 2000,
    maxDelay = 30000,
    onProgress,
  } = options;

  let delay = initialDelay;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getCrewStatus(kickoffId);

    if (onProgress) {
      onProgress(status);
    }

    if (status.state === 'COMPLETED') {
      return status;
    }

    if (status.state === 'FAILED') {
      throw new Error(`Crew execution failed: ${status.status}`);
    }

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
    delay = Math.min(delay * 1.5, maxDelay);
  }

  throw new Error(`Crew execution timeout after ${maxAttempts} attempts`);
}
```

#### 2.3 Update Onboarding Completion Handler

**File**: `~/projects/app.startupai.site/frontend/src/components/onboarding/OnboardingWizardV2.tsx`

Add after imports:
```typescript
import { kickoffCrewAnalysis, waitForCrewCompletion, type EntrepreneurInput } from '@/lib/crewai/client';
```

Add new state:
```typescript
const [crewKickoffId, setCrewKickoffId] = useState<string | null>(null);
const [crewStatus, setCrewStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
```

Add crew kickoff handler:
```typescript
const handleOnboardingComplete = useCallback(async () => {
  try {
    // Extract entrepreneur input from conversation
    const entrepreneurInput: EntrepreneurInput = {
      business_idea: extractFromMessages('business idea'),
      target_customers: extractFromMessages('target customers'),
      problem: extractFromMessages('problem'),
      solution: extractFromMessages('solution'),
      competitors: extractFromMessages('competitors') || 'Not specified',
      resources: extractFromMessages('resources') || 'To be determined',
      goals: extractFromMessages('goals') || 'Validate core assumptions',
    };

    // Kick off CrewAI analysis
    setCrewStatus('running');
    const { kickoff_id } = await kickoffCrewAnalysis(entrepreneurInput);
    setCrewKickoffId(kickoff_id);

    toast.success('Strategic analysis started!', {
      description: 'Our AI team is analyzing your business concept...',
    });

    // Poll for completion
    const result = await waitForCrewCompletion(kickoff_id, {
      onProgress: (status) => {
        console.log('[Crew Progress]', status.last_executed_task?.name);
      },
    });

    setCrewStatus('completed');

    // Save results to database
    await saveAnalysisResults(result);

    // Redirect to dashboard with results
    router.push(`/dashboard?analysis=${kickoff_id}`);

  } catch (error) {
    console.error('[Crew Kickoff Error]', error);
    setCrewStatus('failed');
    toast.error('Analysis failed', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}, [messages, router]);

// Helper to extract data from conversation
function extractFromMessages(topic: string): string {
  // Simple extraction - can be enhanced with AI summarization
  const relevant = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');
  return relevant;
}
```

Add completion trigger when stage 7 finishes:
```typescript
useEffect(() => {
  if (session?.currentStage === 7 && session?.overallProgress >= 95) {
    handleOnboardingComplete();
  }
}, [session, handleOnboardingComplete]);
```

#### 2.4 Create Analysis Results API

**File**: `~/projects/app.startupai.site/frontend/src/app/api/analysis/save/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { kickoff_id, result, result_json } = body;

    // Save to analysis_results table
    const { error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        user_id: user.id,
        kickoff_id,
        result,
        result_json,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[Analysis Save Error]', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Analysis Save Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 2.5 Database Migration

**File**: `~/projects/app.startupai.site/frontend/src/db/migrations/add_analysis_results.sql` (NEW)

```sql
-- Analysis Results Table
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kickoff_id TEXT NOT NULL,
  result JSONB,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_kickoff_id ON analysis_results(kickoff_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- RLS Policies
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis results"
  ON analysis_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis results"
  ON analysis_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE TRIGGER update_analysis_results_updated_at
  BEFORE UPDATE ON analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Run migration:
```bash
# Apply via Supabase CLI or dashboard SQL editor
```

---

### Phase 3: Dashboard Results Display

**Objective**: Show crew analysis results in the dashboard

#### 3.1 Create Analysis Results Component

**File**: `~/projects/app.startupai.site/frontend/src/components/analysis/AnalysisResults.tsx` (NEW)

```typescript
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

interface AnalysisResultsProps {
  result: {
    entrepreneur_brief: any;
    customer_profile: string;
    competitor_analysis: string;
    value_proposition_canvas: string;
    validation_roadmap: string;
    qa_report: string;
  };
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const tabs = [
    { id: 'customer', label: 'Customer Profile', content: result.customer_profile },
    { id: 'competitor', label: 'Competitor Analysis', content: result.competitor_analysis },
    { id: 'value-prop', label: 'Value Proposition', content: result.value_proposition_canvas },
    { id: 'validation', label: 'Validation Roadmap', content: result.validation_roadmap },
    { id: 'qa', label: 'Quality Assessment', content: result.qa_report },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Strategic Analysis Results</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive analysis from our AI strategy team
        </p>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card>
              <CardHeader>
                <CardTitle>{tab.label}</CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{tab.content}</ReactMarkdown>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Export Options */}
      <div className="flex gap-4">
        <button className="btn btn-primary">
          Export as PDF
        </button>
        <button className="btn btn-secondary">
          Share with Team
        </button>
      </div>
    </div>
  );
}
```

#### 3.2 Update Dashboard to Show Results

**File**: `~/projects/app.startupai.site/frontend/src/app/dashboard/page.tsx`

```typescript
import { AnalysisResults } from '@/components/analysis/AnalysisResults';

// In page component:
const { data: analysisResults } = await supabase
  .from('analysis_results')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

if (analysisResults?.result_json) {
  return <AnalysisResults result={analysisResults.result_json} />;
}
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

**1. Test Supervisor Agent Locally**
```bash
cd ~/projects/startupai-crew
cat > test_input.json <<EOF
{
  "entrepreneur_input": {
    "business_idea": "Test business concept",
    "target_customers": "Test segment",
    "problem": "Test problem",
    "solution": "Test solution",
    "competitors": "None known",
    "resources": "Test resources",
    "goals": "Test goals"
  }
}
EOF

crewai run --input test_input.json
```

**2. Test MCP Integration**

Use Claude Code with the CrewAI Enterprise MCP server already configured.

**3. Test Full Flow**
1. Complete onboarding in frontend (stage 1-7)
2. Verify crew kickoff happens automatically
3. Monitor crew execution in CrewAI AMP dashboard
4. Verify results appear in dashboard
5. Check database for saved results

---

## Rollback Plan

If Option B causes issues:

### Quick Rollback
```bash
cd ~/projects/app.startupai.site
git revert HEAD~3..HEAD  # Revert last 3 commits
git push origin main
```

### Gradual Rollback
1. Disable auto-kickoff in frontend (comment out `useEffect`)
2. Keep crew changes (Supervisor Agent is better anyway)
3. Manually trigger analysis when ready

---

## Monitoring & Observability

### CrewAI AMP Logs
```bash
# Real-time logs
crewai deploy logs --uuid b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b --follow

# Filter by task
crewai deploy logs --uuid b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b | grep supervision_task
```

### Frontend Monitoring
```typescript
// Add to onboarding completion handler
import { track } from '@/lib/analytics';

track('crew_kickoff', {
  kickoff_id,
  user_id: userId,
  onboarding_duration_seconds: sessionDuration,
});

track('crew_completed', {
  kickoff_id,
  user_id: userId,
  execution_duration_seconds: executionTime,
  success: true,
});
```

### Database Queries
```sql
-- Check recent analyses
SELECT
  id,
  user_id,
  kickoff_id,
  created_at,
  result_json->>'qa_report'->>'pass' as passed_qa
FROM analysis_results
ORDER BY created_at DESC
LIMIT 10;

-- Success rate
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN result IS NOT NULL THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN result IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM analysis_results
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Supervisor Agent deployed to CrewAI AMP
- ✅ Test kickoff completes with structured input
- ✅ All 6 agents execute successfully
- ✅ Output format matches expectations

### Phase 2 Complete When:
- ✅ Frontend can call `kickoffCrewAnalysis()`
- ✅ Status polling works correctly
- ✅ Results saved to database
- ✅ No errors in production logs

### Phase 3 Complete When:
- ✅ Dashboard displays analysis results
- ✅ All 6 analysis sections render correctly
- ✅ Export functionality works
- ✅ User can share results

### Overall Success:
- ✅ End-to-end flow: Chat → Crew → Results
- ✅ No manual intervention required
- ✅ <5% error rate over 1 week
- ✅ Average execution time <10 minutes
- ✅ User feedback positive (NPS >8)

---

## Timeline Estimate

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| Phase 1: Refactor Crew | 2-4 hours | Medium |
| Phase 2: Frontend Integration | 4-6 hours | High |
| Phase 3: Dashboard Display | 2-3 hours | Low |
| Testing & Debugging | 3-5 hours | Medium |
| **Total** | **11-18 hours** | **1-2 days** |

---

## Notes & Considerations

### Why This Architecture?

1. **Separation of Concerns**: Frontend handles UX, CrewAI handles intelligence
2. **Official Patterns**: Uses CrewAI's recommended MCP server
3. **Scalability**: Easy to add more crews (e.g., consultant onboarding, project analysis)
4. **Maintainability**: Single source of truth for AI logic
5. **Observability**: CrewAI AMP provides built-in monitoring

### Alternative Considered: Vercel AI SDK + CrewAI Streaming

**Why not?**: CrewAI doesn't support SSE streaming for conversational agents. It only provides batch `/kickoff` and `/status` endpoints.

**Future possibility**: If CrewAI adds streaming in the future, we could migrate to that.

### Technical Debt Addressed

- ✅ Eliminates duplicated onboarding logic
- ✅ Removes confusion about "Onboarding Agent" name
- ✅ Establishes clear integration pattern for future crews
- ✅ Makes testing easier (backend testable independently)

---

## References

- **CrewAI Documentation**: https://docs.crewai.com
- **CrewAI AMP Dashboard**: https://app.crewai.com/deployments
- **CrewAI Enterprise MCP Server**: https://github.com/crewAIInc/enterprise-mcp-server
- **Vercel AI SDK**: https://sdk.vercel.ai
- **Option A Implementation**: See commits 98d88e8, c3af469

---

**Last Updated**: November 12, 2025
**Author**: System Architecture Team
**Status**: ✅ Ready for Implementation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
