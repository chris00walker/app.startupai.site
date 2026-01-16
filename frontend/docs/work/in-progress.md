# In Progress Work

Last Updated: 2026-01-16

---

## Two-Pass Onboarding Architecture

**Status:** ✅ IMPLEMENTED - Errata Fixed, Live Verified
**Priority:** P0 - Was blocking entire validation pipeline
**Date Started:** 2026-01-14
**Solution Deployed:** 2026-01-16 (Two-Pass Architecture)
**ADR:** [004-two-pass-onboarding-architecture.md](../../../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md)
**Plan:** [async-mixing-ritchie.md](/home/chris/.claude/plans/async-mixing-ritchie.md)
**Evolution:** [ADR-005: State-First Synchronized Loop](../../../../startupai-crew/docs/adr/005-state-first-synchronized-loop.md) - Proposed

### Problem Statement (RESOLVED)

The AI consultant "Alex" responded with text but **never reliably called the stage progression tools** (`assessQuality`, `advanceStage`, `completeOnboarding`). Analysis showed only **18% tool call rate** (4/22 messages in session `cf0d5e8f`).

**Root Cause**: Using LLM for state management is an architectural anti-pattern. `toolChoice: 'auto'` lets the LLM decide when to call tools, and it increasingly ignores tool instructions as context grows.

### Solution: Two-Pass Architecture

**Deployed:** 2026-01-16

Replaced unreliable tool-calling with deterministic backend assessment:

```
Pass 1: Conversation (streaming)     Pass 2: Assessment (deterministic)
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ LLM generates response          │  │ Backend ALWAYS calls            │
│ NO tools, just conversation     │→ │ generateObject for quality      │
│ Streams to user immediately     │  │ assessment after response       │
└─────────────────────────────────┘  └─────────────────────────────────┘
                                                    ↓
                                     ┌─────────────────────────────────┐
                                     │ Deterministic state machine     │
                                     │ - Merge extractedData → brief   │
                                     │ - Auto-advance if threshold met │
                                     │ - Trigger CrewAI at Stage 7     │
                                     └─────────────────────────────────┘
```

**Key Changes:**
- **Removed**: `assessQuality`, `advanceStage`, `completeOnboarding` tools
- **Added**: `/lib/onboarding/quality-assessment.ts` module
- **Assessment**: Uses `generateObject` with `claude-3.5-haiku` via OpenRouter
- **Idempotency**: Hash-based key (sessionId + messageIndex + stage + content)
- **Atomic completion**: Supabase conditional update for CrewAI trigger

### Previous Fix Attempts (All Failed)

| Commit | Theory | Fix Applied | Result |
|--------|--------|-------------|--------|
| `a068a10` | Prompt said "text first" | Changed to "tools first" | ❌ Still stuck |
| `45d7ee5` | Need guaranteed text step | Added `prepareStep` + `stopWhen` | ❌ Still stuck |
| `3312b05` | `toolChoice: 'auto'` too weak | Changed to `toolChoice: 'required'` | ❌ Broke text |
| `901bb7b` | Provider issue | Switched to OpenRouter + Claude | ❌ 18% tool rate |
| **NEW** | **Architectural anti-pattern** | **Two-Pass Architecture** | ✅ **100% deterministic** |

### Verification Checklist

After deploy completes, test:

1. [ ] Start new onboarding session
2. [ ] Check server logs for `[quality-assessment] Assessment complete`
3. [ ] Answer 2-3 questions in Stage 1
4. [ ] Verify:
   - [ ] Progress bar increases
   - [ ] Stage advances when threshold met (80% coverage)
   - [ ] `stage_data.brief` populated in Supabase
5. [ ] Complete through Stage 7, verify CrewAI triggered

### Files Modified

- `src/lib/onboarding/quality-assessment.ts` - **NEW** assessment module
- `src/app/api/chat/route.ts` - Removed tools, added Pass 2
- `src/lib/ai/onboarding-prompt.ts` - Removed tool instructions
- `src/__tests__/lib/ai/onboarding-prompt.test.ts` - No-tools tests
- `src/__tests__/api/chat/route.test.ts` - Backend assessment tests

### Errata (2026-01-16 Post-Implementation Audit)

Identified by Codex audit + manual review. **Must fix before live verification.**

| ID | Severity | Issue | Impact | Status |
|----|----------|-------|--------|--------|
| E1 | **HIGH** | `ConversationMessage` missing `timestamp` | Resumed sessions show "Invalid Date", unstable React keys | ✅ Fixed |
| E2 | MEDIUM | Schema allows < 3 items for Stage 7 arrays but completion requires >= 3 | Users can complete Stage 7 but stall forever | ✅ Fixed |
| E3 | MEDIUM | Legacy sessions without `stage` tags have messages filtered out | Resumed pre-deployment sessions undercount coverage | ✅ Fixed |
| E4 | LOW | Progress tests use local helper instead of exported `calculateOverallProgress` | Test coverage gap | ✅ Fixed |

**Fixes documented in:** [Plan Errata](/home/chris/.claude/plans/async-mixing-ritchie.md#errata-2026-01-16-post-implementation-audit)
**Commit:** `902ef0c` - fix: Two-Pass Architecture errata - all 4 issues resolved

### Live Dogfooding Fixes (2026-01-16)

Discovered during live testing with chris00walker@proton.me:

| ID | Severity | Issue | Root Cause | Fix | Status |
|----|----------|-------|------------|-----|--------|
| P2 | **HIGH** | Progress regressed to 13% after auto-advance | Used new stage's coverage (0%) for progress calc after auto-advance | Reset `coverageForProgress = 0` when `didAutoAdvance` | ✅ Fixed (`6c6a4db`) |
| P3 | MEDIUM | "Invalid Date" shown for old messages | UI called `new Date(undefined)` for legacy messages without timestamps | `formatTime` returns '--:--' fallback for missing/invalid timestamps | ✅ Fixed (`b1c02b9`) |

**Commits:**
- `6c6a4db` - fix: Phase 0 stage progression + two-artifact data model
- `b1c02b9` - fix: handle missing/invalid timestamps in conversation UI

### Proposed Evolution: State-First Synchronized Loop (ADR-005)

Live dogfooding revealed deeper architectural issues that incremental fixes cannot fully address:

| Latent Risk | Root Cause | Two-Pass Status |
|-------------|------------|-----------------|
| Partial saves | Serverless `onFinish` can be killed after response | **Unaddressed** |
| Race conditions | Last-write-wins merge in app layer | **Latent risk** |
| Hydration gaps | Frontend treats state as ephemeral | Partially addressed |

**Proposed Solution**: Move state machine to PostgreSQL with RPC-based atomic commits.

- **Pillar A**: Modal blocks until RPC commit (no partial saves)
- **Pillar B**: PostgreSQL RPC with `FOR UPDATE` (no race conditions)
- **Pillar C**: Split `chat_history` from `phase_state` (clean separation)
- **Pillar D**: Binary gate on field coverage (deterministic progress)
- **Pillar E**: Frontend hydration + realtime subscriptions

**Status**: Proposed (ADR-005). Decision pending.

**ADR**: [005-state-first-synchronized-loop.md](../../../../startupai-crew/docs/adr/005-state-first-synchronized-loop.md)

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
| Progress stuck at 13% | ✅ Fixed (P2) |
| Stage header stuck | ✅ Fixed (P2) |
| No HITL approval | 🔴 BLOCKED (pending Stage 7 completion) |

---

## Backlog

### Onboarding UX (Deferred)
- Sidebar stage navigation (clickable completed stages)
- Conversation export (PDF/markdown)
- Auto-expanding textarea

### Infrastructure
- ~~**OpenRouter integration for onboarding chat**~~ ✅ Implemented (`901bb7b`)
- Provider health monitoring
- Automatic failover logic enhancement

### Testing
- E2E test for full onboarding flow
- Tool call verification tests
- Provider reliability tests

---

## Technical Debt

1. ~~**Single provider dependency**~~ ✅ Resolved - Now using OpenRouter with Claude fallback
2. ~~**No tool call verification**~~ ✅ Superseded - Tools removed; backend assessment is deterministic
3. **Limited observability** - Need APM/logging for AI calls
4. ~~**No fallback UX**~~ ✅ Addressed - Backend assessment with retry + failure markers
5. ~~**Two-Pass Errata**~~ ✅ Resolved - 4 issues fixed (`902ef0c`)
