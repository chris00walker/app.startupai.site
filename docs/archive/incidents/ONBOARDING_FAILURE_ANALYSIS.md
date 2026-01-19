---
purpose: "Incident analysis - onboarding workflow failure"
status: "resolved"
last_reviewed: "2026-01-18"
---

# Onboarding Workflow Failure - Systems Engineering Analysis

**Date:** 2025-11-12
**Status:** ✅ **RESOLVED** via Two-Pass Architecture (ADR-004)
**Issue:** Completed onboarding conversation shows 0% progress, no stage advancement, no CrewAI trigger

---

> **RESOLUTION NOTE (Jan 2026)**: This incident was fully resolved by the [Two-Pass Architecture](../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md). The tool-based progression system documented below (`assessQuality`, `advanceStage`, `completeOnboarding`) has been **completely removed**. The new system uses:
> - **Pass 1**: `/api/chat/stream` - LLM streams conversation (no tools)
> - **Pass 2**: `/api/chat/save` - Backend deterministically assesses topics and advances stages
>
> The old tool names below are preserved for historical context only.

---

## Expected System Architecture (HISTORICAL - Nov 2025)

### Data Flow Design
```
1. User sends message → Frontend (OnboardingWizardV2.tsx)
   └─> POST /api/chat { messages, sessionId, data }

2. API Route (/api/chat/route.ts) processes request
   ├─> Authenticates user (or allows test mode)
   ├─> Loads session from DB or testSessionState Map
   ├─> Calls streamText() with:
   │   ├─> System prompt + stage context
   │   ├─> Messages history
   │   └─> Three tools: assessQuality, advanceStage, completeOnboarding
   │
   └─> onFinish callback should:
       ├─> Process tool results
       ├─> Update session state (stage, progress, data)
       ├─> Save to DB or testSessionState
       └─> Trigger CrewAI (if completeOnboarding called)

3. Frontend refetches status after response
   └─> GET /api/onboarding/status?sessionId=xxx
       └─> Returns current_stage, overall_progress, status

4. Sidebar updates to show progress
```

---

## What SHOULD Have Happened

### Stage 1: Welcome & Introduction
- **AI should call:** `assessQuality({ coverage: 0.8, clarity: 'high', completeness: 'complete' })`
- **AI should call:** `advanceStage({ fromStage: 1, toStage: 2, summary: '...', collectedData: {...} })`
- **Backend should:** Update `testSessionState` with `current_stage: 2, overall_progress: 14`
- **Frontend should:** Refetch status, show "Stage 2 Active", progress bar at 14%

### Stages 2-6: Same pattern
- Each stage: 3-5 message exchanges
- AI calls assessQuality after substantial answers
- AI calls advanceStage when threshold met (coverage > 0.7-0.85)
- Progress increments by ~14% per stage

### Stage 7: Goals & Next Steps
- **AI should call:** `assessQuality({ coverage: 0.85, clarity: 'high', completeness: 'complete' })`
- **AI should call:** `completeOnboarding({ readinessScore: 0.85, keyInsights: [...], recommendedNextSteps: [...] })`
- **Backend should:**
  - Update status: 'completed', overall_progress: 100
  - **TRIGGER CREWAI WORKFLOW** (THIS LOGIC IS MISSING!)
  - Create project from collected brief data
  - Redirect user to dashboard

---

## What ACTUALLY Happened (Evidence from Screenshot)

### Observable Facts
1. ✅ User successfully conversed with "Alex"
2. ✅ AI responded conversationally through all stages
3. ✅ User answered all questions (visible in conversation)
4. ❌ Sidebar shows: "0% Complete", "0 of 7 stages complete"
5. ❌ Conversation Stages: Only "Stage 1 Active"
6. ❌ Current Stage: 1, Completed: 0
7. ❌ AI said "we've completed the onboarding process" but didn't trigger completion
8. ❌ No CrewAI workflow was kicked off

### Critical Observation
The AI's final response says:
> "Now that we've completed the onboarding process, you have a clear framework..."

**BUT** - The AI never called the `completeOnboarding` tool!

---

## Root Cause Analysis

### Issue #1: AI Tool-Calling Failure (PRIMARY)

**Location:** `/api/chat/route.ts:226-232`

```typescript
result = streamText({
  model,
  system: `${ONBOARDING_SYSTEM_PROMPT}\n\n${stageContext}`,
  messages,
  temperature: 0.7,
  tools: onboardingTools,  // ← Tools defined but not being used
  stopWhen: stepCountIs(10),
  onFinish: async ({ text, finishReason, toolCalls, toolResults }) => {
```

**What went wrong:**
- The AI (gpt-4o-mini) did NOT call any tools during the conversation
- `toolCalls` array was empty on every turn
- Therefore `toolResults` was empty
- Therefore `onFinish` callback had nothing to process
- Therefore session state was never updated (current_stage stayed at 1)

**Why did tools fail?**

**Hypothesis 1: Weak prompt instructions**

`/lib/ai/onboarding-prompt.ts:197-218`:
```typescript
Use the `assessQuality` tool frequently to evaluate responses.

Use the `advanceStage` tool when:
- You have collected most of the required data points
- The user's responses show good clarity and depth
- Coverage is above the stage's threshold
```

**Problem:** These are suggestions, not commands. GPT-4o-mini may ignore tools if:
- Instructions aren't emphatic enough
- Temperature is too high (0.7 allows creative freedom)
- Model prioritizes conversational flow over tool usage

**Hypothesis 2: Model limitations**

GPT-4o-mini is:
- Optimized for speed and cost, not complex reasoning
- May not reliably use tools in multi-turn conversations
- May prefer to "talk through" completion rather than call structured tools

**Hypothesis 3: No examples in prompt**

The system prompt explains WHAT the tools do, but doesn't show:
- WHEN to call them (specific trigger conditions)
- HOW to structure the inputs
- EXAMPLES of good tool calls

---

### Issue #2: No Tool Call Enforcement

**Location:** `/api/chat/route.ts:232`

```typescript
stopWhen: stepCountIs(10),
```

**Problem:** This allows the AI to make up to 10 reasoning steps, but doesn't REQUIRE tool usage. Compare to:

```typescript
// Example from AI SDK docs - FORCE tool usage
maxSteps: 5,
toolChoice: 'required',  // ← Forces at least one tool call
```

---

### Issue #3: onFinish Only Updates IF Tools Are Called

**Location:** `/api/chat/route.ts:243-318`

```typescript
// Process tool results
let newStage = currentStage;
let newStageData = { ...stageData };
let isCompleted = false;

if (toolResults && toolResults.length > 0) {
  // Only processes if tools were called
  for (const result of toolResults) {
    const toolCall = toolCalls?.find(tc => tc.toolCallId === result.toolCallId);
    if (!toolCall) continue;

    if (toolCall.toolName === 'advanceStage') {
      newStage = toStage;  // ← Stage advancement happens here
      // ...
    }
  }
}
```

**Problem:** If AI doesn't call tools, this entire block is skipped!

**Result:**
- `newStage` remains `currentStage` (1)
- `newStageData` unchanged
- `isCompleted` stays false
- `overall_progress` calculation uses base progress only:

```typescript
const baseProgress = Math.floor(((newStage - 1) / 7) * 100);
// newStage = 1, so baseProgress = 0
updateData.overall_progress = 0;
```

---

### Issue #4: Missing CrewAI Kickoff Logic

**Location:** `/api/chat/route.ts:300-316`

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

  console.log('[api/chat] Onboarding completed:', {
    readinessScore,
    insightsCount: keyInsights.length,
  });

  // ❌ MISSING: Call to Modal /kickoff to start analysis
  // ❌ MISSING: Create project in database
  // ❌ MISSING: Redirect user to dashboard
}
```

**Compare to:** `/api/assistant/chat/route.ts:314-347`

This route DOES have CrewAI integration:
```typescript
if (toolCall.toolName === 'triggerAnalysis') {
  const { strategicQuestion, projectId, additionalContext, priority } = toolCall.input as any;

  // Makes actual call to /api/crewai/analyze endpoint
  const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crewai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      strategic_question: strategicQuestion,
      project_context: additionalContext || '',
      project_id: projectId,
      session_id: `assistant-${Date.now()}`,
      user_id: userId,
      priority_level: priority || 'medium',
    }),
  });
}
```

**What's missing from `/api/chat/route.ts`:**
1. No fetch to `/api/crewai/analyze` or Modal `/kickoff`
2. No project creation in database
3. No handoff to CrewAI's 5-flow analysis pipeline

---

## Where Is Your Conversation Data?

### Answered: It's in testSessionState (probably)

**Location:** `/api/chat/route.ts:19`

```typescript
export const testSessionState = new Map<string, any>();
```

**Your conversation should be in memory at:**
```
testSessionState.get('your-session-id')
```

**What it contains (if onFinish executed):**
```javascript
{
  session_id: 'test-xxx-demo',
  user_id: 'test-user-id',
  current_stage: 1,  // ← Never advanced because no tool calls
  stage_data: {
    brief: {}  // ← Should contain your answers, but probably empty
  },
  conversation_history: [
    { role: 'user', content: 'Your first answer...', timestamp: '...', stage: 1 },
    { role: 'assistant', content: 'Alex's response...', timestamp: '...', stage: 1 },
    // ... more messages
  ],
  overall_progress: 0,  // ← Never updated because no stage advancement
  status: 'active'  // ← Should be 'completed'
}
```

### Why wasn't it collated into a brief?

**Answer:** The brief data extraction happens in the `advanceStage` tool:

```typescript
if (toolCall.toolName === 'advanceStage') {
  const { fromStage, toStage, summary, collectedData } = toolCall.input as any;

  // Merge collected data into brief
  newStageData.brief = {
    ...(newStageData.brief || {}),
    ...collectedData,  // ← This is where data gets structured
  };
}
```

**Since advanceStage was never called, collectedData was never extracted.**

The conversation exists in `conversation_history` as raw text, but was never:
1. Parsed into structured fields
2. Validated for completeness
3. Packaged into an entrepreneur brief
4. Handed off to CrewAI

---

## Why Was This Information Not Handed Off to Modal?

### Answer: Two-Part Failure

#### Part 1: No "Completion Signal" (Tool Call Failure)
The handoff is supposed to trigger when `completeOnboarding` tool is called. Since the AI never called this tool, the completion signal was never sent.

#### Part 2: No Handoff Code Even If Signal Worked
Even if the AI HAD called `completeOnboarding`, there's no code to:
1. Format the brief data for CrewAI
2. Call the CrewAI Enterprise MCP server
3. Kick off the 6-agent analysis crew
4. Monitor the workflow status
5. Create the project in database
6. Store the analysis report when complete

**This entire integration is missing from `/api/chat/route.ts`.**

---

## Summary: System Failure Cascade

### Failure Chain
```
1. AI doesn't call tools (PRIMARY FAILURE)
   └─> No tool results to process
       └─> onFinish callback has nothing to update
           └─> Session stays at Stage 1, 0% progress
               └─> Status endpoint returns default state
                   └─> Frontend shows "0% Complete"

2. Even if AI called completeOnboarding:
   └─> Backend has no CrewAI kickoff code
       └─> No analysis would run
           └─> No project would be created
               └─> User stuck at completion screen
```

### Data Loss Assessment
- ✅ **Conversation history:** Saved to `testSessionState.conversation_history`
- ❌ **Structured brief data:** NOT extracted (stuck in raw conversation text)
- ❌ **Stage metadata:** NOT saved (no tool calls means no stage summaries)
- ❌ **Quality assessments:** NOT recorded
- ❌ **Completion status:** NOT marked complete
- ❌ **CrewAI analysis:** NEVER triggered

---

## Required Fixes (In Order of Criticality)

### Fix 1: Force Tool Calling (CRITICAL)
**File:** `/api/chat/route.ts:226-232`

**Options:**
1. **Option A:** Add `toolChoice: 'required'` to force tool usage
2. **Option B:** Use stronger prompt language ("YOU MUST call assessQuality after every substantial answer")
3. **Option C:** Switch to gpt-5-mini (more reliable tool calling)
4. **Option D:** Use structured outputs instead of tools

### Fix 2: Add CrewAI Kickoff Logic (CRITICAL)
**File:** `/api/chat/route.ts:300-316`

**Required:**
1. Detect `completeOnboarding` tool call
2. Extract brief data from `newStageData.brief`
3. Call CrewAI Enterprise MCP server `/kickoff` endpoint
4. Pass entrepreneur inputs as workflow inputs
5. Store workflow ID for monitoring
6. Create project record in database
7. Redirect user to dashboard when analysis completes

### Fix 3: Add Progress Fallback (MEDIUM)
**Current issue:** If tools aren't called, progress stays at 0%

**Fallback option:** Estimate progress from conversation turn count
```typescript
// If no tool calls, estimate progress from message count
if (toolResults.length === 0) {
  const messageCount = updatedHistory.length;
  const estimatedProgress = Math.min(95, Math.floor((messageCount / 30) * 100));
  updateData.overall_progress = estimatedProgress;
}
```

### Fix 4: Add Manual Override (LOW)
Allow user to manually trigger "Complete Onboarding" button if AI doesn't call tool.

---

## Next Steps for Systems Engineer

**Before writing any code:**

1. ✅ **Verify conversation is in testSessionState**
   - Add debug endpoint to dump session state
   - Confirm conversation_history has all messages
   - Check if any tool calls were recorded

2. ✅ **Test tool calling in isolation**
   - Create minimal test case with single message
   - Force tool call with toolChoice: 'required'
   - Verify onFinish receives tool results

3. ✅ **Design CrewAI handoff flow**
   - Map entrepreneur_brief fields to CrewAI crew inputs
   - Define workflow monitoring strategy
   - Plan error handling for crew failures

4. ✅ **Define "brief extraction" fallback**
   - If tools don't work, how do we extract structured data from conversation?
   - Use separate LLM call to parse conversation → brief?
   - Or require user to confirm/edit extracted data?

**Only after understanding current state → implement fixes.**

---

## Questions to Answer

1. **Can we retrieve your conversation from testSessionState?**
   - Need to add debug endpoint or check server memory

2. **Is there ANY CrewAI integration code anywhere?**
   - Check for /api/analyze endpoint
   - Check for CrewAI MCP server usage in codebase

3. **What's the designed entrepreneur brief schema?**
   - What fields does CrewAI crew expect?
   - How do we map conversation → brief structure?

4. **Should we persist test sessions to database?**
   - Currently test sessions only live in memory
   - If server restarts, all test data is lost

5. **What's the rollback plan if CrewAI fails?**
   - Show error to user?
   - Allow retry?
   - Fall back to manual brief entry?

---

**End of Analysis**

*Generated: 2025-11-12 by Systems Engineering forensic review*
