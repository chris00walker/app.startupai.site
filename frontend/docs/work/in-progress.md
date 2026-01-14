# In Progress Work

Last Updated: 2026-01-14

---

## CRITICAL: Onboarding Stage Progression Broken

**Status:** 🔴 UNRESOLVED - Multiple fix attempts failed
**Priority:** P0 - Blocks entire validation pipeline
**Date Started:** 2026-01-14
**Time Spent:** ~8 hours across 14 commits

### Problem Statement

The AI consultant "Alex" responds with text but **never calls the stage progression tools** (`assessQuality`, `advanceStage`, `completeOnboarding`). This causes:
- Progress stuck at ~13% (message-based fallback calculation)
- Stage header stuck at "Stage 1 of 7"
- No HITL approval flow triggered
- CrewAI/Modal workflow never starts
- Entire Phase 0 → Phase 1 pipeline blocked

### Evidence (Supabase MCP Query)
```sql
-- All sessions show same pattern:
current_stage: 1      -- Stuck at stage 1
overall_progress: 13  -- Stuck at 13%
msg_count: 56         -- Many messages exchanged
stage_data: {
  brief: {},
  coverage: { stage_1: { coverage: 0 } }
  -- NO stage_1_quality, stage_1_summary, completion fields
}
```

### Fix Attempts (All Failed)

| Commit | Theory | Fix Applied | Result |
|--------|--------|-------------|--------|
| `a068a10` | Prompt said "text first" but code disabled tools after text | Updated prompt to say "tools first" | ❌ Still stuck |
| `45d7ee5` | Need to guarantee text after tools | Added `prepareStep` + `stopWhen` | ❌ Still stuck |
| `3312b05` | `toolChoice: 'auto'` doesn't enforce | Changed to `toolChoice: 'required'` | ❌ Still stuck |
| `4bd8b8e` | Need diagnostic logging | Added debug endpoint + logging | ✅ Logs work, ❌ Issue persists |
| `e83a01f` | Off-by-one error: `stepNumber === 1` should be `0` | Fixed to `stepNumber === 0` | ❌ Still stuck |
| `f25f33d` | Early return blocked DB updates on empty text | Removed early return | ❌ Still stuck |
| (env var) | Model too small to respect toolChoice | Changed to `gpt-4o` | ❌ Still stuck |

### Root Cause Analysis: INCONCLUSIVE

We do NOT definitively know the root cause. Theories explored:

1. **Prompt/Code Mismatch** - Fixed, but issue persists
2. **Off-by-One Error** - Fixed, but issue persists
3. **Early Return Bug** - Fixed, but issue persists
4. **Model Quality** - Upgraded to gpt-4o, but issue persists
5. **AI SDK Bug** - Known issues with `toolChoice: 'required'` not being enforced:
   - [GitHub #8992](https://github.com/vercel/ai/issues/8992) - toolChoice not enforced
   - [GitHub #10269](https://github.com/vercel/ai/issues/10269) - Tool execution unreliable after ~5 messages

### What We Know For Certain

| Fact | Evidence |
|------|----------|
| Alex generates text responses | Messages appear in UI and DB |
| Tools are NOT being called | No `stage_X_quality`, `stage_X_summary` in `stage_data` |
| `prepareStep` may not be executing | No server logs confirming `toolChoice: 'required'` is sent |
| Multiple sessions affected | All 5+ test sessions show identical pattern |
| Problem persists across models | gpt-4o-mini and gpt-4o both fail |

### What We Don't Know

- Is `prepareStep` callback actually being called?
- Is `toolChoice: 'required'` being sent to OpenAI API?
- Is OpenAI ignoring the toolChoice parameter?
- Is there an AI SDK bug we haven't identified?
- Is the streaming response format affecting tool execution?

### Current Architecture (Problematic)

```
Frontend (OnboardingWizardV2)
    ↓ POST /api/chat
Backend (chat/route.ts)
    ↓ streamText() with tools
OpenAI API (gpt-4o)
    ↓ Should call tools, doesn't
Response (text only, no tool calls)
    ↓
Database (stage never updates)
```

**Single Point of Failure:** Direct OpenAI dependency with no fallback

### Recommendations

#### Immediate (P0)
1. **Add instrumentation** - Log exact request/response to OpenAI to confirm toolChoice is sent
2. **Test with different provider** - Try Anthropic Claude which has better tool reliability
3. **Consider OpenRouter** - Multi-provider gateway with automatic fallback

#### Short-term (P1)
4. **Implement provider abstraction** - Use OpenRouter or custom gateway
5. **Add retry logic** - If no tools called, retry with stronger prompt
6. **Fallback to manual progression** - Let user click "Next Stage" if AI fails

#### Architectural (P2)
7. **Decouple tool execution** - Separate tool calls from text generation
8. **Use generateObject** - More reliable than streaming for structured output
9. **Consider CrewAI for onboarding** - Already proven reliable in Modal backend

### Files Involved

- `src/app/api/chat/route.ts` - Main chat endpoint with tool definitions
- `src/lib/ai/onboarding-prompt.ts` - System prompt with tool instructions
- `src/components/onboarding/OnboardingWizardV2.tsx` - Frontend state management
- Environment: `OPENAI_MODEL_DEFAULT`, `OPENAI_API_KEY`

---

## Previously Completed (Verified Working)

### HITL Founder's Brief Approval Flow
**Status:** ✅ Complete (blocked by above issue)
**Date:** 2026-01-14

Implemented `approve_founders_brief` checkpoint. Will work once onboarding completes.

### Session Resume Bugs
**Status:** ✅ Complete
**Commit:** `3a8bf4b`

### Onboarding UX Bugs (Partial)
**Status:** ⚠️ Partial - Some fixed, some blocked
**Commit:** `d31738c`, `1a3be08`

| Issue | Status |
|-------|--------|
| Time estimate static | ✅ Fixed |
| STAGES label rendering | ✅ Fixed |
| Stage completion indicators | ✅ Fixed |
| Progress stuck at 13% | 🔴 UNRESOLVED |
| Stage header stuck | 🔴 UNRESOLVED |
| No HITL approval | 🔴 BLOCKED |

---

## Backlog

### Onboarding UX (Deferred)
- Sidebar stage navigation (clickable completed stages)
- Conversation export (PDF/markdown)
- Auto-expanding textarea

### Infrastructure
- OpenRouter integration (multi-provider)
- Provider health monitoring
- Automatic failover

### Testing
- E2E test for full onboarding flow
- Tool call verification tests
- Provider reliability tests

---

## Technical Debt

1. **Single provider dependency** - OpenAI-only is a reliability risk
2. **No tool call verification** - Can't confirm tools are being called
3. **Limited observability** - Need APM/logging for AI calls
4. **No fallback UX** - User stuck if AI fails to progress stages
