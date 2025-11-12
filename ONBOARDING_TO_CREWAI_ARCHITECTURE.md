# Onboarding to CrewAI Architecture - Complete Implementation Plan

**Date:** 2025-11-12
**Status:** Architecture Design - Ready for Implementation
**Priority:** CRITICAL - User-facing workflow completely broken

---

## Problem Statement

**User reports terrible experience:**
> "I spent 15 minutes answering questions with Alex, clicked 'Save & Exit', and was returned to an empty dashboard that says 'Welcome to StartupAI! Ready to validate your startup idea with AI-powered insights? Let's create your first validation project.'"

**This is broken because:**
1. User completed onboarding
2. All answers were saved (in testSessionState or DB)
3. System did NOT create project
4. System did NOT kick off CrewAI analysis
5. User sees empty state as if nothing happened

---

## Current Architecture (BROKEN)

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: OnboardingWizardV2.tsx                                    │
├─────────────────────────────────────────────────────────────────────┤
│ 1. User answers 7 stages of questions from "Alex"                   │
│ 2. Messages sent to POST /api/chat                                  │
│ 3. Receives streaming SSE responses                                 │
│ 4. Updates conversation UI in real-time                             │
│ 5. Polls GET /api/onboarding/status for progress                   │
│ 6. Clicks "Save & Exit" button                                      │
│ 7. Navigates to /dashboard                                          │
│                                                                      │
│ ❌ PROBLEM: No project creation triggered                           │
│ ❌ PROBLEM: No CrewAI workflow triggered                            │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API: /api/chat/route.ts                                             │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Receives messages from frontend                                  │
│ 2. Loads session from testSessionState (dev) or DB (prod)          │
│ 3. Calls streamText() with system prompt + tools                   │
│ 4. onFinish callback:                                               │
│    - Should process tool results (assessQuality, advanceStage)      │
│    - Should update session state (stage, progress, stage_data)      │
│    - Should save to testSessionState or DB                          │
│                                                                      │
│ ❌ PROBLEM: AI not calling tools (gpt-4o-mini failure)              │
│ ❌ PROBLEM: No completeOnboarding handler that kicks off CrewAI     │
│ ❌ PROBLEM: No call to create_project_from_onboarding()             │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE: Supabase                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Tables:                                                             │
│ - onboarding_sessions: Conversation state, stage_data JSONB        │
│ - entrepreneur_briefs: Structured business data                     │
│ - projects: Final project records                                   │
│                                                                      │
│ Functions:                                                          │
│ - create_project_from_onboarding(session_id): Creates project      │
│ - upsert_entrepreneur_brief(session_id, data): Updates brief       │
│                                                                      │
│ ❌ PROBLEM: Never called from API routes                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ CREWAI AMP: startupai-crew                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Deployment UUID: b4d5c1dd-27e2-4163-b9fb-a18ca06ca13b              │
│ Endpoint: https://startupai-b4d5c1dd-27e2-4163-b9fb-a18ca...       │
│ Token: f4cc39d92520                                                 │
│                                                                      │
│ Input: { entrepreneur_input: "string or JSON" }                     │
│ Output: 6-section analysis report                                   │
│                                                                      │
│ ❌ PROBLEM: Never called from onboarding workflow                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Desired Architecture (FIXED)

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND: OnboardingWizardV2.tsx                                    │
├─────────────────────────────────────────────────────────────────────┤
│ 1. User answers 7 stages of questions from "Alex"                   │
│ 2. Messages sent to POST /api/chat                                  │
│ 3. Receives streaming SSE responses with tool calls                 │
│ 4. Updates conversation UI + sidebar progress                       │
│ 5. Polls GET /api/onboarding/status (shows stage 1→2→3...→7)       │
│ 6. AI calls completeOnboarding tool after Stage 7                  │
│ 7. Backend triggers CrewAI + project creation                       │
│ 8. User sees "Analysis running..." state                            │
│ 9. Redirects to /dashboard/{projectId} when complete               │
│                                                                      │
│ ✅ FIX: Seamless flow from onboarding → project → analysis         │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API: /api/chat/route.ts (UPDATED)                                   │
├─────────────────────────────────────────────────────────────────────┤
│ FIXES:                                                              │
│ 1. Switch model: gpt-4o-mini → gpt-5-mini                           │
│ 2. Add toolChoice: 'required' to force tool usage                  │
│ 3. Strengthen system prompt tool-calling instructions               │
│ 4. Add CrewAI kickoff logic in onFinish:                            │
│                                                                      │
│    if (toolCall.toolName === 'completeOnboarding') {               │
│      // Step 1: Extract structured brief from stage_data           │
│      const briefData = extractBriefFromStageData(newStageData);    │
│                                                                      │
│      // Step 2: Save to entrepreneur_briefs table                   │
│      const briefId = await upsertEntrepreneurBrief(sessionId,      │
│        userId, briefData);                                          │
│                                                                      │
│      // Step 3: Create project from onboarding session             │
│      const projectId = await createProjectFromOnboarding(sessionId);│
│                                                                      │
│      // Step 4: Kick off CrewAI workflow                            │
│      const workflowId = await kickoffCrewAIAnalysis(briefData,     │
│        projectId, userId);                                          │
│                                                                      │
│      // Step 5: Store workflow ID for monitoring                    │
│      await updateProject(projectId, {                               │
│        initial_analysis_workflow_id: workflowId,                    │
│        status: 'analyzing'                                          │
│      });                                                            │
│    }                                                                │
│                                                                      │
│ ✅ FIX: Complete end-to-end workflow implementation                │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ HELPER: /lib/crewai/client.ts (NEW FILE)                           │
├─────────────────────────────────────────────────────────────────────┤
│ export async function kickoffCrewAIAnalysis(                        │
│   briefData: EntrepreneurBrief,                                     │
│   projectId: string,                                                │
│   userId: string                                                    │
│ ): Promise<string> {                                                │
│                                                                      │
│   // Format brief data for CrewAI crew input                        │
│   const entrepreneurInput = formatBriefForCrew(briefData);         │
│                                                                      │
│   // Call CrewAI AMP /kickoff endpoint                              │
│   const response = await fetch(                                     │
│     `${CREWAI_BASE_URL}/kickoff`,                                  │
│     {                                                                │
│       method: 'POST',                                               │
│       headers: {                                                    │
│         'Authorization': `Bearer ${CREWAI_TOKEN}`,                 │
│         'Content-Type': 'application/json'                         │
│       },                                                            │
│       body: JSON.stringify({                                        │
│         inputs: { entrepreneur_input: entrepreneurInput }          │
│       })                                                            │
│     }                                                                │
│   );                                                                │
│                                                                      │
│   const { kickoff_id } = await response.json();                    │
│   return kickoff_id;                                                │
│ }                                                                   │
│                                                                      │
│ ✅ FIX: Proper CrewAI integration modeled after /api/assistant      │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE: Supabase (ALREADY CORRECT)                               │
├─────────────────────────────────────────────────────────────────────┤
│ Functions (already exist):                                          │
│ - create_project_from_onboarding(session_id)                       │
│ - upsert_entrepreneur_brief(session_id, data)                      │
│                                                                      │
│ ✅ Schema already perfect - just needs to be called                │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CREWAI AMP: startupai-crew                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Receives kickoff:                                                   │
│ {                                                                   │
│   "inputs": {                                                       │
│     "entrepreneur_input": {                                         │
│       "target_customer": "...",                                     │
│       "problem_description": "...",                                 │
│       "solution_description": "...",                                │
│       "competitors": [...],                                         │
│       "budget_range": "...",                                        │
│       "business_stage": "...",                                      │
│       "goals": "..."                                                │
│     }                                                               │
│   }                                                                 │
│ }                                                                   │
│                                                                      │
│ Runs 6-agent sequential workflow:                                   │
│ 1. Onboarding Agent → Entrepreneur Brief (transforms input)        │
│ 2. Customer Researcher → Customer Profile (Jobs/Pains/Gains)       │
│ 3. Competitor Analyst → Positioning Map                             │
│ 4. Value Designer → Value Proposition Canvas                        │
│ 5. Validation Agent → 3-Tier Validation Roadmap                    │
│ 6. QA Agent → Quality Assurance Report                             │
│                                                                      │
│ Returns: Complete analysis report JSON                              │
│                                                                      │
│ ✅ FIX: Finally integrated into onboarding workflow                │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ MONITORING: /api/crewai/status (NEW ENDPOINT)                      │
├─────────────────────────────────────────────────────────────────────┤
│ Polls CrewAI AMP /status endpoint:                                 │
│ GET /status?kickoff_id={id}                                        │
│                                                                      │
│ Returns:                                                            │
│ {                                                                   │
│   "status": "running" | "completed" | "failed",                    │
│   "progress": 0.67,                                                 │
│   "current_agent": "value_designer",                                │
│   "result": { ... } // if completed                                │
│ }                                                                   │
│                                                                      │
│ When completed:                                                     │
│ - Store result in reports table                                     │
│ - Update project status to 'active'                                 │
│ - Notify user                                                       │
│                                                                      │
│ ✅ FIX: Allow user to see analysis progress                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Brief Schema Mapping

### Supabase → CrewAI Input Format

**Supabase `entrepreneur_briefs` table fields:**
```sql
customer_segments JSONB
primary_customer_segment JSONB
problem_description TEXT
problem_pain_level INTEGER (1-10)
solution_description TEXT
unique_value_proposition TEXT
differentiation_factors JSONB
competitors JSONB
competitive_alternatives JSONB
budget_range VARCHAR(100)
available_channels JSONB
business_stage VARCHAR(50)
three_month_goals JSONB
```

**CrewAI `entrepreneur_input` expected format:**
```json
{
  "entrepreneur_input": {
    "target_customer": "string - from primary_customer_segment",
    "problem_description": "string - from problem_description",
    "pain_level": "integer - from problem_pain_level",
    "solution_description": "string - from solution_description + unique_value_proposition",
    "key_differentiators": "array - from differentiation_factors",
    "competitors": "array - from competitors",
    "available_channels": "array - from available_channels",
    "budget_range": "string - from budget_range",
    "business_stage": "string - from business_stage",
    "goals": "string - from three_month_goals"
  }
}
```

**Mapping function:**
```typescript
function formatBriefForCrew(brief: EntrepreneurBrief): Record<string, any> {
  return {
    target_customer: brief.primary_customer_segment ||
      JSON.stringify(brief.customer_segments),
    problem_description: brief.problem_description,
    pain_level: brief.problem_pain_level,
    solution_description: `${brief.solution_description}.
      Unique Value: ${brief.unique_value_proposition}`,
    key_differentiators: brief.differentiation_factors,
    competitors: brief.competitors,
    available_channels: brief.available_channels,
    budget_range: brief.budget_range,
    business_stage: brief.business_stage,
    goals: JSON.stringify(brief.three_month_goals)
  };
}
```

---

## Implementation Checklist

### Phase 1: Fix Tool Calling (CRITICAL - 2 hours)

**Files to modify:**
- `/api/chat/route.ts`
- `/lib/ai/onboarding-prompt.ts`

**Changes:**
1. ✅ Switch model: `gpt-4o-mini` → `gpt-5-mini`
   ```typescript
   const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-5-mini'; // was gpt-4o-mini
   ```

2. ✅ Add forced tool usage:
   ```typescript
   result = streamText({
     model,
     system: `${ONBOARDING_SYSTEM_PROMPT}\n\n${stageContext}`,
     messages,
     temperature: 0.7,
     tools: onboardingTools,
     toolChoice: 'required', // ← ADD THIS
     maxSteps: 10,
   });
   ```

3. ✅ Strengthen prompt instructions:
   ```typescript
   // In onboarding-prompt.ts
   ## Stage Progression (MANDATORY)

   YOU MUST use the `assessQuality` tool after EVERY substantial user response.
   YOU MUST use the `advanceStage` tool when coverage exceeds the threshold.
   YOU MUST use the `completeOnboarding` tool after Stage 7 completion.

   These are NOT optional suggestions - they are REQUIRED for the system to function.
   ```

**Testing:**
- Create test session, answer 1-2 questions
- Verify AI calls `assessQuality` tool (check console logs)
- Verify `onFinish` receives tool results
- Verify session state updates with new stage/progress

---

### Phase 2: Add CrewAI Integration (CRITICAL - 3 hours)

**New files to create:**
- `/lib/crewai/client.ts` - CrewAI API wrapper
- `/lib/crewai/types.ts` - TypeScript types
- `/app/api/crewai/status/route.ts` - Status polling endpoint

**File 1: `/lib/crewai/client.ts`**
```typescript
const CREWAI_BASE_URL = process.env.MCP_CREWAI_ENTERPRISE_SERVER_URL;
const CREWAI_TOKEN = process.env.MCP_CREWAI_ENTERPRISE_BEARER_TOKEN;

export async function kickoffCrewAIAnalysis(
  briefData: Record<string, any>,
  projectId: string,
  userId: string
): Promise<string> {
  const entrepreneurInput = formatBriefForCrew(briefData);

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
    throw new Error(`CrewAI kickoff failed: ${response.statusText}`);
  }

  const { kickoff_id } = await response.json();
  return kickoff_id;
}

export async function getCrewAIStatus(kickoffId: string) {
  const response = await fetch(`${CREWAI_BASE_URL}/status?kickoff_id=${kickoffId}`, {
    headers: {
      'Authorization': `Bearer ${CREWAI_TOKEN}`,
    },
  });

  return response.json();
}

function formatBriefForCrew(brief: Record<string, any>): Record<string, any> {
  return {
    target_customer: brief.primary_customer_segment ||
      JSON.stringify(brief.customer_segments || []),
    problem_description: brief.problem_description || '',
    pain_level: brief.problem_pain_level || 5,
    solution_description: `${brief.solution_description || ''}.
      Unique Value: ${brief.unique_value_proposition || ''}`,
    key_differentiators: brief.differentiation_factors || [],
    competitors: brief.competitors || [],
    available_channels: brief.available_channels || [],
    budget_range: brief.budget_range || 'not specified',
    business_stage: brief.business_stage || 'idea',
    goals: JSON.stringify(brief.three_month_goals || [])
  };
}
```

**File 2: Modify `/api/chat/route.ts` onFinish callback**
```typescript
// Handle completeOnboarding tool
if (toolCall.toolName === 'completeOnboarding') {
  const { readinessScore, keyInsights, recommendedNextSteps } = toolCall.input as any;

  isCompleted = true;
  newStageData.completion = {
    readinessScore,
    keyInsights,
    recommendedNextSteps,
    completedAt: new Date().toISOString(),
  };

  console.log('[api/chat] Onboarding completed, triggering CrewAI workflow');

  // ========================================
  // NEW: CrewAI Integration
  // ========================================

  try {
    // Step 1: Extract structured brief from stage_data
    const briefData = {
      customer_segments: newStageData.brief.target_customers || [],
      primary_customer_segment: newStageData.brief.primary_segment,
      problem_description: newStageData.brief.problem_description,
      problem_pain_level: newStageData.brief.pain_level,
      solution_description: newStageData.brief.solution_description,
      unique_value_proposition: newStageData.brief.unique_value_prop,
      differentiation_factors: newStageData.brief.differentiation || [],
      competitors: newStageData.brief.competitors || [],
      budget_range: newStageData.brief.budget_range,
      available_channels: newStageData.brief.available_channels || [],
      business_stage: newStageData.brief.current_stage || 'idea',
      three_month_goals: newStageData.brief.short_term_goals || [],
    };

    // Step 2: Save to entrepreneur_briefs table
    const { data: brief, error: briefError } = await supabaseClient
      .rpc('upsert_entrepreneur_brief', {
        p_session_id: sessionId,
        p_user_id: effectiveUser.id,
        p_brief_data: briefData,
      });

    if (briefError) {
      console.error('[api/chat] Failed to save entrepreneur brief:', briefError);
    }

    // Step 3: Create project from onboarding session
    const { data: projectId, error: projectError } = await supabaseClient
      .rpc('create_project_from_onboarding', {
        p_session_id: sessionId,
      });

    if (projectError) {
      console.error('[api/chat] Failed to create project:', projectError);
      throw projectError;
    }

    console.log('[api/chat] Project created:', projectId);

    // Step 4: Kick off CrewAI workflow
    const { kickoffCrewAIAnalysis } = await import('@/lib/crewai/client');
    const workflowId = await kickoffCrewAIAnalysis(
      briefData,
      projectId,
      effectiveUser.id
    );

    console.log('[api/chat] CrewAI workflow started:', workflowId);

    // Step 5: Store workflow ID in project
    await supabaseClient
      .from('projects')
      .update({
        initial_analysis_workflow_id: workflowId,
        status: 'analyzing',
      })
      .eq('id', projectId);

    // Step 6: Store projectId in completion data for frontend
    newStageData.completion.projectId = projectId;
    newStageData.completion.workflowId = workflowId;

  } catch (error) {
    console.error('[api/chat] Error in CrewAI integration:', error);
    // Don't fail the whole response - user still gets completion message
  }
}
```

**File 3: `/app/api/crewai/status/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCrewAIStatus } from '@/lib/crewai/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kickoffId = searchParams.get('kickoff_id');

    if (!kickoffId) {
      return NextResponse.json({ error: 'kickoff_id required' }, { status: 400 });
    }

    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get CrewAI status
    const status = await getCrewAIStatus(kickoffId);

    // If completed, store result in database
    if (status.status === 'completed' && status.result) {
      // Find project by workflow ID
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('initial_analysis_workflow_id', kickoffId)
        .single();

      if (project) {
        // Store analysis result
        await supabase.from('reports').insert({
          project_id: project.id,
          user_id: user.id,
          report_type: 'value_proposition_analysis',
          content: status.result,
          status: 'completed',
        });

        // Update project status
        await supabase
          .from('projects')
          .update({ status: 'active' })
          .eq('id', project.id);
      }
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('[api/crewai/status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### Phase 3: Fix Frontend UX (CRITICAL - 2 hours)

**Files to modify:**
- `/components/onboarding/OnboardingWizardV2.tsx`

**Changes:**

1. ✅ Detect completion and show analysis state:
   ```typescript
   // After receiving AI response, check for completion
   useEffect(() => {
     if (session?.status === 'completed' && session?.completion?.projectId) {
       // Show "Analysis running" modal
       setShowAnalysisModal(true);

       // Start polling CrewAI status
       startPollingAnalysisStatus(session.completion.workflowId);
     }
   }, [session?.status]);
   ```

2. ✅ Add analysis progress modal:
   ```typescript
   function AnalysisRunningModal({ workflowId, projectId }) {
     const [status, setStatus] = useState('running');
     const [progress, setProgress] = useState(0);

     useEffect(() => {
       const interval = setInterval(async () => {
         const response = await fetch(`/api/crewai/status?kickoff_id=${workflowId}`);
         const data = await response.json();

         setStatus(data.status);
         setProgress(data.progress * 100);

         if (data.status === 'completed') {
           clearInterval(interval);
           // Redirect to project dashboard
           router.push(`/dashboard/project/${projectId}`);
         }
       }, 5000); // Poll every 5 seconds

       return () => clearInterval(interval);
     }, [workflowId]);

     return (
       <Dialog open>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Analyzing Your Business Idea</DialogTitle>
             <DialogDescription>
               Our AI team is analyzing your responses and creating a comprehensive
               value proposition and validation roadmap. This typically takes 3-5 minutes.
             </DialogDescription>
           </DialogHeader>

           <div className="py-6">
             <Progress value={progress} />
             <p className="text-sm text-muted-foreground mt-2">
               {progress}% complete
             </p>
           </div>
         </DialogContent>
       </Dialog>
     );
   }
   ```

3. ✅ Update "Save & Exit" button logic:
   ```typescript
   const handleSaveAndExit = async () => {
     // If onboarding is complete, go to project
     if (session?.status === 'completed' && session?.completion?.projectId) {
       router.push(`/dashboard/project/${session.completion.projectId}`);
     } else {
       // Otherwise, go to dashboard with option to resume
       router.push('/dashboard');
     }
   };
   ```

---

## Testing Strategy

### Test 1: Tool Calling Works
1. Start new onboarding session
2. Answer 2-3 questions in Stage 1
3. Check browser console: Should see `[api/chat] Processing tool result: { toolName: 'assessQuality' }`
4. Check sidebar: Should show progress > 0%
5. Answer more questions
6. Check browser console: Should see `[api/chat] Stage advanced: { from: 1, to: 2 }`
7. Check sidebar: Should show "Stage 2 Active"

**Expected:** AI calls tools, progress updates in real-time

---

### Test 2: Complete Onboarding → CrewAI Workflow
1. Complete all 7 stages (answer ~20-30 questions)
2. AI should say "we've completed the onboarding"
3. Check browser console: Should see:
   ```
   [api/chat] Onboarding completed, triggering CrewAI workflow
   [api/chat] Project created: <uuid>
   [api/chat] CrewAI workflow started: <kickoff_id>
   ```
4. Frontend should show "Analysis Running" modal
5. Modal should poll status every 5 seconds
6. After 3-5 minutes, should redirect to `/dashboard/project/{id}`

**Expected:** Seamless flow from onboarding → analysis → dashboard

---

### Test 3: CrewAI Analysis Result Storage
1. After workflow completes, check Supabase:
   ```sql
   SELECT * FROM projects WHERE initial_analysis_workflow_id = '<kickoff_id>';
   -- Should show status = 'active'

   SELECT * FROM reports WHERE project_id = '<project_id>';
   -- Should show completed analysis report

   SELECT * FROM entrepreneur_briefs WHERE session_id = '<session_id>';
   -- Should show structured brief data
   ```

**Expected:** All data persisted correctly

---

## Rollback Plan

If CrewAI integration fails in production:

**Fallback 1: Manual Project Creation**
- Add "Skip Analysis" button in modal
- Create project without CrewAI analysis
- Allow user to trigger analysis later from dashboard

**Fallback 2: Offline Processing**
- Queue CrewAI kickoff in background job
- Show "Analysis will be ready soon" message
- Email user when analysis completes

**Fallback 3: Simpler Onboarding**
- Remove AI conversation entirely
- Use traditional form-based onboarding
- Trigger CrewAI after form submission

---

## Environment Variables Required

```bash
# .env.local
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL_DEFAULT=gpt-5-mini  # Changed from gpt-4o-mini

# CrewAI Enterprise MCP (already set)
MCP_CREWAI_ENTERPRISE_SERVER_URL=https://startupai-b4d5c1dd-27e2-4163-b9fb-a18ca06ca-4f4192a6.crewai.com
MCP_CREWAI_ENTERPRISE_BEARER_TOKEN=f4cc39d92520

# Supabase (already set)
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Success Metrics

After implementation, the following should be TRUE:

✅ **User Experience:**
- User completes onboarding in 10-15 minutes
- Progress bar updates throughout conversation (14%, 28%, 42%, ...)
- After Stage 7, sees "Analysis Running" modal
- After 3-5 minutes, lands on project dashboard with full analysis
- NO "Create Your First Project" empty state

✅ **System Behavior:**
- AI calls `assessQuality` after every substantial response
- AI calls `advanceStage` when coverage exceeds threshold
- AI calls `completeOnboarding` after Stage 7
- CrewAI workflow kicks off automatically
- Project created and linked to analysis

✅ **Data Integrity:**
- `onboarding_sessions` table: status = 'completed', overall_progress = 100
- `entrepreneur_briefs` table: All fields populated from conversation
- `projects` table: Created with brief_id and workflow_id
- `reports` table: Analysis stored when CrewAI completes

---

## Timeline Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Fix tool calling (model + toolChoice + prompt) | 2 hours |
| 2 | Add CrewAI client + API integration | 3 hours |
| 3 | Update frontend UX (modal + polling + redirect) | 2 hours |
| 4 | Testing end-to-end flow | 2 hours |
| 5 | Bug fixes and edge cases | 2 hours |
| **Total** | | **11 hours (~1.5 days)** |

---

## Next Steps

**Ready to implement?**

1. Start with Phase 1 (fix tool calling) and test immediately
2. Then Phase 2 (CrewAI integration)
3. Then Phase 3 (frontend UX)

---

**End of Architecture Document**

*Generated: 2025-11-12 for fixing onboarding → CrewAI workflow*
