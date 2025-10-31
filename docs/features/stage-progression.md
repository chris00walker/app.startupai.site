# Stage Progression Implementation - Resolution Summary

**Date**: October 30, 2025
**Status**: ✅ Implemented and Ready for Testing
**Dev Server**: Running on http://localhost:3001

---

## Problem Solved

The AI chatbot was stuck in Stage 1 of 7 because the tool functions (`assessQuality`, `advanceStage`, `completeOnboarding`) referenced in the system prompt were disabled due to OpenAI schema validation errors.

**Original Error**:
```
Invalid schema for function 'assessQuality': schema must be a JSON Schema of 'type: "object"', got 'type: "None"'
```

---

## Solution Implemented

### 1. **Properly Defined AI Tools with OpenAI-Compatible Schemas**

Created three tools using Vercel AI SDK 5.0's `tool()` function with correctly formatted Zod schemas:

#### `assessQuality` Tool
- **Purpose**: Evaluates response quality after each user message
- **Parameters**:
  - `coverage` (0.0-1.0): How much required information has been collected
  - `clarity` (high/medium/low): How clear and specific responses are
  - `completeness` (complete/partial/insufficient): Readiness to advance
  - `notes` (string): Brief observations about gaps

#### `advanceStage` Tool
- **Purpose**: Progresses from current stage to next stage
- **Parameters**:
  - `fromStage` (1-7): Current stage number
  - `toStage` (1-7): Next stage number
  - `summary` (string): What was learned in this stage
  - `collectedData` (object): Key data points collected

#### `completeOnboarding` Tool
- **Purpose**: Signals all 7 stages are complete
- **Parameters**:
  - `readinessScore` (0.0-1.0): Overall readiness for analysis
  - `keyInsights` (array): 3-5 key insights from conversation
  - `recommendedNextSteps` (array): 3-5 recommended experiments

### 2. **Tool Execution Handlers**

Implemented comprehensive tool result processing in the `onFinish` callback:

- **Database/State Updates**: Automatically updates `onboarding_sessions` table (or in-memory state for test users)
- **Stage Advancement**: Updates `current_stage` when `advanceStage` is called
- **Quality Tracking**: Stores quality assessments in `stage_data` JSONB field
- **Progress Calculation**: Computes `overall_progress` based on stage completion (Stage 1 = 0-14%, Stage 7 = 85-100%)
- **Completion Handling**: Sets progress to 100% and status to 'completed' when `completeOnboarding` is called

### 3. **Schema Compatibility Fixes**

Key changes to ensure OpenAI compatibility:

- ✅ All tool parameters use `z.object({...})` at root level
- ✅ All fields include `.describe()` for better AI understanding
- ✅ Replaced `z.record(z.any())` with `z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))` to avoid ambiguous types
- ✅ Used explicit Zod types (z.number(), z.string(), z.enum(), z.array())

---

## How It Works

### AI Conversation Flow

1. **User sends message** → AI responds with follow-up questions
2. **AI calls `assessQuality`** → Evaluates coverage, clarity, completeness
3. **When coverage exceeds threshold** → AI calls `advanceStage`
4. **Database/state updated** → `current_stage` increments, progress updates
5. **Frontend refetches status** → Sidebar shows new stage number
6. **Repeat for all 7 stages**
7. **After Stage 7 complete** → AI calls `completeOnboarding`

### Database Schema Updates

When tools are called, the following fields are updated:

```typescript
onboarding_sessions {
  current_stage: 1-7,           // Updated by advanceStage
  overall_progress: 0-100,       // Calculated from stage + coverage
  stage_data: {                  // JSONB field
    brief: { /* collected data from all stages */ },
    stage_1_quality: { coverage, clarity, completeness, notes },
    stage_1_summary: "What was learned",
    stage_1_data: { /* specific data points */ },
    // ... repeated for stages 2-7
    completion: {
      readinessScore,
      keyInsights,
      recommendedNextSteps,
      completedAt
    }
  },
  conversation_history: [        // All messages with stage info
    { role, content, timestamp, stage, toolCalls }
  ]
}
```

---

## Testing Instructions

### 1. Navigate to Onboarding
Open your browser and go to:
```
http://localhost:3001/onboarding
```
⚠️ **Note**: Server is on port 3001, not 3000 (port 3000 is in use)

### 2. Start Conversation
Send the test message:
```
I am considering importing dry goods foods from Lebanon to Barbados
```

### 3. Expected Behavior

**Stage 1 - Welcome & Introduction (Initial)**
- AI asks about business concept, inspiration, current stage
- Sidebar shows "Stage 1 of 7"
- Progress: 0-14%

**After 3-5 Quality Exchanges**
- AI calls `assessQuality` tool (you won't see this in UI)
- Console logs: `[api/chat] Quality assessed: { stage: 1, coverage: 0.8, clarity: 'high', completeness: 'complete' }`

**When Coverage Threshold Met (0.8 for Stage 1)**
- AI calls `advanceStage` tool
- Console logs: `[api/chat] Stage advanced: { from: 1, to: 2 }`
- Sidebar updates to "Stage 2 of 7"
- Progress: 14-28%

**Stage 2 - Customer Discovery**
- AI asks about target customers, segments, behaviors
- Process repeats

**Stages 3-7**
- Problem Definition (28-42%)
- Solution Validation (42-56%)
- Competitive Analysis (56-70%)
- Resources & Constraints (70-84%)
- Goals & Next Steps (84-100%)

**After Stage 7 Completion**
- AI calls `completeOnboarding` tool
- Progress reaches 100%
- Status changes to 'completed'

### 4. How to Verify It's Working

#### ✅ Frontend Indicators:
- Sidebar stage number updates automatically
- Progress bar advances
- AI transitions topics between stages

#### ✅ Console Logs (Browser DevTools):
```
[api/chat] onFinish triggered: { toolCallsCount: 1, toolResultsCount: 1 }
[api/chat] Processing tool result: { toolName: 'assessQuality', args: {...} }
[api/chat] Quality assessed: { stage: 1, coverage: 0.8, clarity: 'high', completeness: 'complete' }
[api/chat] Processing tool result: { toolName: 'advanceStage', args: {...} }
[api/chat] Stage advanced: { from: 1, to: 2 }
[api/chat] Test session test-xxx updated in memory: 20% progress
```

#### ✅ Network Tab (DevTools → Network):
- Check `/api/chat` POST requests
- Check `/api/onboarding/status` GET requests after each response

---

## If It Still Doesn't Work

### Option A: Switch to Anthropic Claude (Recommended)

Claude has better tool support with Vercel AI SDK 5.0.

1. **Get Anthropic API Key**: https://console.anthropic.com/

2. **Add to `.env.local`**:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

3. **Restart dev server**:
```bash
# Stop current server (Ctrl+C in terminal where it's running)
pnpm dev
```

The code already prefers Claude if the API key exists (see `getAIModel()` function in `route.ts:26-39`).

### Option B: Debug OpenAI Schema Issue

If still getting schema validation errors with OpenAI:

1. **Check Console for Exact Error**:
   - Browser DevTools → Console
   - Look for errors from `/api/chat` endpoint

2. **Verify Vercel AI SDK Version**:
```bash
pnpm list ai
# Should show: ai 5.0.82
```

3. **Test Tool Schema Generation**:
Add debug logging to `route.ts` before `streamText()`:
```typescript
console.log('[api/chat] Tool schemas:', {
  assessQuality: assessQualityTool.parameters,
  advanceStage: advanceStageTool.parameters,
  completeOnboarding: completeOnboardingTool.parameters,
});
```

### Option C: Manual Stage Progression (Fallback)

If tools continue to fail, implement manual progression:

1. Add stage advance buttons to UI
2. Use message count thresholds (Stage 1: 4-6 messages, Stage 2: 4-6 messages, etc.)
3. Add keyword detection in AI responses ("Let's move on to", "Now let's talk about")

---

## Technical Details

### Files Modified

1. **`frontend/src/app/api/chat/route.ts`** (Main Implementation)
   - Lines 48-99: Tool definitions with Zod schemas
   - Lines 195-196: Enabled tools in `streamText()`
   - Lines 197-325: Tool result processing in `onFinish()`

2. **`frontend/src/app/api/onboarding/status/route.ts`** (Already exists from previous work)
   - Returns current stage, progress, status

3. **`frontend/src/components/onboarding/OnboardingWizardV2.tsx`** (Already modified)
   - `refetchSessionStatus()` polls status after each AI response

### AI Model Configuration

**Current**: GPT-4.1-nano (OpenAI)
- Model: `gpt-4.1-nano`
- Context: 1M tokens
- Temperature: 0.7
- Max Steps: 10 (allows multiple tool calls)

**Fallback**: Claude 3.5 Sonnet (Anthropic)
- Model: `claude-3-5-sonnet-20241022`
- Will be used if `ANTHROPIC_API_KEY` is set

### Stage Definitions

From `frontend/src/lib/ai/onboarding-prompt.ts:9-106`:

| Stage | Name | Threshold | Data Points |
|-------|------|-----------|-------------|
| 1 | Welcome & Introduction | 0.8 | business_concept, inspiration, current_stage, founder_background |
| 2 | Customer Discovery | 0.75 | target_customers, customer_segments, current_solutions, customer_behaviors |
| 3 | Problem Definition | 0.8 | problem_description, pain_level, frequency, problem_evidence |
| 4 | Solution Validation | 0.75 | solution_description, solution_mechanism, unique_value_prop, differentiation |
| 5 | Competitive Analysis | 0.7 | competitors, alternatives, switching_barriers, competitive_advantages |
| 6 | Resources & Constraints | 0.75 | budget_range, available_resources, constraints, team_capabilities, available_channels |
| 7 | Goals & Next Steps | 0.85 | short_term_goals, success_metrics, priorities, first_experiment |

---

## Next Steps

1. **Test the implementation** using the instructions above
2. **Monitor console logs** to verify tool calls are happening
3. **If schema errors persist**, get an Anthropic API key and switch to Claude
4. **Report results** so we can iterate if needed

---

## Questions or Issues?

If you encounter any problems:

1. **Check server logs**: Look for compilation errors or runtime errors
2. **Check browser console**: Look for API errors or failed requests
3. **Verify environment variables**: Ensure `OPENAI_API_KEY` is set correctly
4. **Try Claude**: Add `ANTHROPIC_API_KEY` to test with Claude instead

**Dev Server Status**: ✅ Running on http://localhost:3001
**Implementation Status**: ✅ Complete and ready for testing
