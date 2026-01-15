# In Progress Work

Last Updated: 2026-01-15

---

## CRITICAL: Onboarding Stage Progression - OpenRouter Fix Deployed

**Status:** 🟡 FIX DEPLOYED - Testing Required
**Priority:** P0 - Blocks entire validation pipeline
**Date Started:** 2026-01-14
**Latest Fix:** 2026-01-15 (OpenRouter integration)
**Commit:** `901bb7b`

### Problem Statement

The AI consultant "Alex" responds with text but **never calls the stage progression tools** (`assessQuality`, `advanceStage`, `completeOnboarding`). This causes:
- Progress stuck at ~13% (message-based fallback calculation)
- Stage header stuck at "Stage 1 of 7"
- No HITL approval flow triggered
- CrewAI/Modal workflow never starts
- Entire Phase 0 → Phase 1 pipeline blocked

### Latest Fix: OpenRouter Integration

**Deployed:** 2026-01-15
**Commit:** `901bb7b`

Switched from direct OpenAI API to OpenRouter multi-provider gateway:
- Replaced `@ai-sdk/openai` with `@openrouter/ai-sdk-provider`
- Default model: `anthropic/claude-3.5-sonnet` (better tool reliability)
- OpenRouter provides automatic failover and better tool enforcement
- Environment variables added to Netlify: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

**New Architecture:**
```
Frontend (OnboardingWizardV2)
    ↓ POST /api/chat
Backend (chat/route.ts)
    ↓ streamText() with tools via OpenRouter
OpenRouter Gateway
    ↓ Routes to Claude 3.5 Sonnet (or fallback)
Anthropic Claude API
    ↓ Better tool calling reliability
Response (tools + text)
    ↓
Database (stage updates)
```

### Previous Fix Attempts (All Failed with OpenAI)

| Commit | Theory | Fix Applied | Result |
|--------|--------|-------------|--------|
| `a068a10` | Prompt said "text first" | Changed to "tools first" | ❌ Still stuck |
| `45d7ee5` | Need guaranteed text step | Added `prepareStep` + `stopWhen` | ❌ Still stuck |
| `3312b05` | `toolChoice: 'auto'` too weak | Changed to `toolChoice: 'required'` | ❌ Still stuck |
| `e83a01f` | Off-by-one error | Fixed `stepNumber === 0` | ❌ Still stuck |
| `f25f33d` | Early return blocked DB | Removed early return | ❌ Still stuck |
| (env var) | Model too small | Changed to `gpt-4o` | ❌ Still stuck |
| **`901bb7b`** | **Provider issue** | **Switched to OpenRouter + Claude** | **🟡 Testing** |

### Verification Checklist

After deploy completes, test:

1. [ ] Start new onboarding session
2. [ ] Check server logs for `[api/chat] Using OpenRouter model: anthropic/claude-3.5-sonnet`
3. [ ] Answer 2-3 questions in Stage 1
4. [ ] Verify:
   - [ ] Progress bar > 14%
   - [ ] Stage header changes from "Stage 1" to "Stage 2"
   - [ ] Toast notification shows "Moving to Stage 2"
5. [ ] Query Supabase: `stage_data` should have `stage_1_quality` and `stage_1_summary`

### Files Modified

- `src/app/api/chat/route.ts` - Now uses OpenRouter + Claude
- `package.json` - Added `@openrouter/ai-sdk-provider`
- Netlify env: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

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
2. **No tool call verification** - Can't confirm tools are being called
3. **Limited observability** - Need APM/logging for AI calls
4. **No fallback UX** - User stuck if AI fails to progress stages
