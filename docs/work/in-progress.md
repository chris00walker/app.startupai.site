---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2026-01-15"
last_synced: "2026-01-15 - Onboarding UX overhaul implemented, pending live verification"
---

# In Progress

## Current Focus (2026-01-12)

**Dogfooding: Testing StartupAI using StartupAI**

Test Accounts:
- **Founder**: chris00walker@proton.me (validates StartupAI as business idea)
- **Consultant**: chris00walker@gmail.com (advises StartupAI as client)

Status:
- ✅ Phase 0 (Onboarding) - Founder's Brief approved
- ✅ Phase 1 (VPC Discovery) - VPC fit score 73/100, approved
- ⏳ Phase 2 (Desirability) - Landing pages, experiments (NEXT)
- ⏳ Phase 3-4 - Feasibility + Viability (pending)

Recent Session Work (2026-01-12):
- ✅ Approval API routes enhanced (list + detail endpoints)
- ✅ Webhook route hardened (better error handling, logging)
- ✅ Onboarding complete route improved
- ✅ Evidence summary display working in approval modals
- ✅ RLS policy for consultant client project access deployed
- ✅ Build verification passed (pnpm build succeeds)

See `cross-repo-blockers.md` for ecosystem status.

---

## Priority Order

Work these items in order. Items marked "Ready" can start immediately.

### P0: Launch Blockers (Work First)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| 1 | **Delete deploy zip with secrets** | 🔴 **CRITICAL** | @devops | 1 min | 423MB zip contains SERVICE_ROLE_KEY, DATABASE_URL |
| 2 | **Apply Realtime migration** | **Ready** | @supabase | 1 min | `20260115000001_enable_onboarding_realtime.sql` not pushed |
| 3 | **Apply founders_briefs migration** | **Ready** | @supabase | 1 min | `20260115000002_founders_briefs.sql` creates Layer 2 table |

#### P0 Security Details (2026-01-15)

**Deploy Zip with Secrets** 🔴
```
frontend/deploy-1768437579795-4ada87d3-745a-4904-beaa-3b0fdf0c1e04.zip
Contains: .env.local, .env.staging with SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
```
**Fix**: `rm frontend/deploy-*.zip && echo "frontend/deploy-*.zip" >> .gitignore`

**Realtime Migration**
Local file exists but not applied to remote Supabase.
**Fix**: `supabase db push`

### P1: High Priority (Should Fix Before Launch)

| Priority | Item | Status | Owner | Effort | Notes |
|----------|------|--------|-------|--------|-------|
| 1 | **Phase 0 Stage Progression Fix** | **Ready** | @backend | ~2 hours | Backend auto-advance, remove advanceStage tool, add stage_progress |
| 2 | **Phase 0 Webhook Data Model Fix** | **Ready** | @backend | ~1 hour | Fix webhook to create `founders_briefs` (not overwrite `entrepreneur_briefs`) |
| 3 | **Transcript Handoff to Modal** | **Ready** | @backend | ~30 min | Pass conversation transcript to buildFounderValidationInputs |
| 4 | **Save & Exit Response Checking** | **Ready** | @frontend | ~30 min | Check pause API response before redirect |
| 5 | Onboarding UX Overhaul (9 issues) | ⏳ **PENDING VERIFICATION** | @frontend | ~10 hours | See details below - needs live testing |
| 6 | Phase 2 Desirability Testing | **IN PROGRESS** | @dogfooding | ~2 hours | Landing pages, experiments |
| 7 | Dashboard insights from CrewAI | ✅ Done | @frontend | ~4 hours | Consultant dashboard showing real client data |
| 8 | PostHog coverage gaps | **Ready** | @frontend | 2-3 days | 13+ events defined but not implemented |

#### Phase 0 Architecture Fix (2026-01-15) - Team Audit Findings

**Problem**: 10+ failed attempts to fix stage progression. Root cause: LLM cannot conditionally chain tools.

**Solution**: Backend-driven deterministic logic (Plan: `gentle-booping-mitten.md`)

| Fix | File | Change |
|-----|------|--------|
| Backend auto-advance | `/api/chat/route.ts` | Move stage advancement from LLM tool to backend after `assessQuality` |
| Remove advanceStage tool | `/api/chat/route.ts` | Tool is redundant with backend logic |
| Add stage_progress | `/api/chat/route.ts` | `updateData.stage_progress = Math.round(coverage * 100)` |
| Fix transcript handoff | `/api/chat/route.ts` | Pass `conversationTranscript` as 5th param to `buildFounderValidationInputs` |
| Fix webhook data model | `/api/crewai/webhook/route.ts` | INSERT to `founders_briefs` (Layer 2), don't overwrite `entrepreneur_briefs` (Layer 1) |
| Save & Exit checking | `OnboardingWizardV2.tsx` | Check `response.ok && data.success` before redirect |

**Two-Artifact Data Model** (Key Insight from Team Audit):
```
entrepreneur_briefs (Layer 1) → Created by Alex chat → Raw conversational extraction
founders_briefs (Layer 2)     → Created by S1 agent → Validated brief for Phase 1
```
The webhook was incorrectly overwriting Layer 1 with Layer 2 data. Now creates separate table.

**Deferred to P2**: HITL approval UI data source update (see backlog.md)

#### Onboarding UX Overhaul (2026-01-15) ⏳ PENDING VERIFICATION

**Goal**: Fix 9 UX issues causing user uncertainty during onboarding chat.

| Issue | Fix | Status |
|-------|-----|--------|
| Truncated messages | Fixed flex container overflow (`min-h-0`, removed `overflow-hidden`) | ⏳ Unverified |
| No question highlighting | Questions now highlighted in accent color via `renderMarkdown()` | ⏳ Unverified |
| Unreliable Send button | Added explicit `form.requestSubmit()` handler (matches Enter key) | ⏳ Unverified |
| Ambiguous progress | Added collapsible progress details with topic checklist | ⏳ Unverified |
| No loading feedback | Added "(usually 3-5 seconds)" to typing indicator | ⏳ Unverified |
| Dead-end states | Added mandatory "always end with question" rule to AI prompt | ⏳ Unverified |
| Stages view-only | Completed stages now clickable to review past Q&A | ⏳ Unverified |
| **Save inconsistency** | **Now uses Realtime subscription (<100ms)** instead of polling | ✅ Implemented |
| Context visibility | Deferred to follow-up (P2) | N/A |

**Files Modified**:
- `ConversationInterfaceV2.tsx` - Truncation, button, question highlighting, loading, save indicator
- `OnboardingWizardV2.tsx` - Overflow fix, save delay, stage review modal
- `OnboardingSidebar.tsx` - Progress details, stage navigation
- `onboarding-prompt.ts` - Always-end-with-question rule
- **New**: `StageReviewModal.tsx` - Read-only stage review modal

**Next Step**: Live dogfooding test to verify all fixes work in production.

#### Groq Integration via OpenRouter (2026-01-15) ✅ COMPLETE

**Goal**: Improve speed and reduce cost for onboarding chat flow.

| Task | Status | Notes |
|------|--------|-------|
| Switch `/api/chat` to OpenRouter | ✅ | Multi-provider gateway with automatic fallback |
| Fix TypeScript build error | ✅ | Removed unsupported `maxSteps` property |
| Configure .env files | ✅ | Added OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_PROVIDER |
| Set Netlify production env vars | ✅ | All three env vars configured |
| Force Groq as provider | ✅ | Using `extraBody.provider.order: ["Groq"]` |
| Fix Claude meta-commentary bug | ✅ | Updated prompts to prevent "Let me assess..." narration |
| Production testing | ✅ | Onboarding with Alex working correctly |

**Configuration**:
- **Model**: `meta-llama/llama-3.3-70b-instruct` (90.76% BFCL tool benchmark)
- **Provider**: `Groq` (forced via provider routing, fallback enabled)
- **Speed**: ~300 tok/s (vs ~50-100 for Claude)
- **Cost**: ~91% cheaper per session

**CLI Tools Installed**:
- `llm -m openrouter/...` - One-off prompts and scripting
- `openrouter-cli` - Interactive chat sessions

#### Onboarding Critical Root Cause Fix (2026-01-14 Evening)

**Problem**: Despite earlier fixes, progress still stuck at ~13% and stages never advanced.

**Root Cause Analysis**:
- `frontend/src/app/api/chat/route.ts` lines 196-201: `prepareStep` forces `toolChoice: 'none'` after step 1
- `frontend/src/lib/ai/onboarding-prompt.ts`: Prompt said "Write text FIRST, then call tools"
- Result: AI wrote text in step 1 → tools disabled in step 2 → no `advanceStage`/`completeOnboarding` calls

**Fix**: Changed prompt instruction order to "Call tools FIRST, then write text"

**Impact**: This fix is critical for Phase 0 → Phase 1 transition (unblocks entire validation pipeline)

#### Onboarding UX Bug Fixes (Completed 2026-01-14)

Issues found during dogfooding testing of Founder onboarding flow:

| Fix | Status | Notes |
|-----|--------|-------|
| Progress tracking race condition | ✅ | Added 800ms delay before refetchSessionStatus |
| Empty AI response validation | ✅ | Skip saving empty messages in onFinish callback |
| Optimistic progress removed | ✅ | Now uses backend-calculated progress only |
| Dashboard shows active sessions | ✅ | ContinueSessionCard instead of empty state |
| Save & Exit pauses session | ✅ | New /api/onboarding/pause endpoint |
| AI tool execution forced | ✅ | toolChoice: 'required' + strengthened prompt |
| Progress display fixed | ✅ | Shows "Stage X of 7" instead of "0/7 stages" |
| Stage completion toast | ✅ | Toast notification on stage advancement |
| Redundant X button removed | ✅ | Single "Save & Exit" button in footer |
| Start New wired up | ✅ | Already implemented - calls abandon API |
| forceNew URL param honored | ✅ | useSearchParams reads ?forceNew=true, passed to initializeSession |
| Start New dialog progress context | ✅ | Shows % complete and message count before confirming |
| Elapsed-time estimate | ✅ | Dynamic calculation based on actual time spent per stage |
| Locked-stage visuals | ✅ | Lock icon, cursor-not-allowed, tooltip for pending stages |
| 500ms minimum loading | ✅ | Prevents jarring flash on fast initialization |

### P2: Ready for E2E Testing

| Priority | Item | Status | Notes |
|----------|------|--------|-------|
| 1 | Phase 0-1 HITL flow | ✅ **VERIFIED** | Founder's Brief + VPC approval working |
| 2 | Founder dashboard | ✅ **VERIFIED** | Projects, approvals, evidence display |
| 3 | Consultant dashboard | ✅ **VERIFIED** | Clients, client projects (RLS policy deployed) |
| 4 | Phase 2 Desirability | **NEXT** | Landing page generation, experiments |
| 5 | Phase 3-4 Feasibility/Viability | **Pending** | After Phase 2 complete |
| 6 | **Deprecate /api/onboarding/complete** | **After P1** | Keep for recovery, but /api/chat tool is canonical |
| 7 | **HITL Approval UI Data Source** | **Deferred** | See backlog.md - update FoundersBriefReview to read from founders_briefs |
| 8 | **Webhook Contract Tests** | **After P1** | Add tests for Phase 0 HITL checkpoint handling |

**Modal Status (2026-01-12):** Production deployed, Phase 0-2 validated, HITL working.

---

## Cross-Repo Dependencies - UPDATED 2025-12-05

```
⚠️ startupai-crew (3-Crew Architecture - Deployment Pending)
    ↓ Code complete, needs crewai login + deploy
    ↓ 19 agents, 32 tasks, 7 HITL checkpoints
✅ app.startupai.site (This repo) ← P0 BLOCKERS CLEARED
    ↓ PostHog done, E2E tests fixed, accessibility done, reports + evidence explorer done
    ↓ Activity Feed API + Metrics API shipped
✅ startupai.site (Marketing) ← UNBLOCKED
    ↓ All APIs available, ready for Phase 4 Validation
```

**Current Focus**:
1. Wait for CrewAI 3-Crew deployment (blocking E2E testing)
2. PostHog coverage gaps (P1 - can proceed independently)

---

## Immediate Actions (Updated 2025-11-30)

1. **Dashboard CrewAI integration** - Replace mock data with real AI insights (P1)
2. **Specification-driven test refresh** - Update fixtures, Playwright journeys (P1)

---

## What's Ready

**CrewAI Infrastructure Complete:**
- Webhook endpoint: `POST /api/crewai/webhook`
- All 80+ fields persisting to Supabase
- Hooks: `useCrewAIState`, `useInnovationSignals`, `useVPCData`, `usePortfolioActivity`
- CrewAI Report Viewer component (comprehensive report display)
- Evidence Explorer with D-F-V metrics
- VPC Strategyzer-style canvas with animated fit lines
- E2E test infrastructure (timeouts fixed, API mocks)
- Accessibility foundation (WCAG 2.1 AA + semantic landmarks)
- Consultant dashboard using real portfolio activity data

**Alex Onboarding UX Complete (Nov 30):**
- Project creation routes to Alex (`/onboarding/founder`) not quick wizard
- Session management: "Start New Conversation" button + resume indicator
- Team awareness: Alex knows about Sage (CSO) and 6 AI founders
- Abandon session API: `POST /api/onboarding/abandon`
- 108 unit tests + 4 E2E tests for full coverage

**Test Suite Health (Updated 2025-11-30):**
- 463+ tests passing (355 existing + 108 Alex UX tests), 17 skipped (intentional)
- Specification tests: 12/12 passing (accessibility, contracts, keyboard nav)
- Alex UX tests: 108 passing (abandon API, sidebar, dashboard, prompt, wizard)
- E2E onboarding: 4 new session management tests added
- Deployment tests: Skip by default (require running server)
- Timing tests: Using synthetic values per PERFORMANCE_TARGETS
- Test pollution: Resolved with global afterEach cleanup

**What's Missing:**
- PostHog coverage gaps (13+ events not implemented - P1 remaining item)

See [Integration QA Report](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) for details.

---

## How to Use This Document

1. **Pick highest priority "Ready" item** from P1 table (no P0 blockers remaining)
2. **Update status** when you start work
3. **Move to done.md** when complete
4. **Check cross-repo-blockers.md** for upstream status

---

**Last Updated**: 2026-01-15

**Changes (2026-01-15 - Phase 0 Team Audit):**
- **P0 SECURITY**: Added deploy zip with secrets deletion (423MB file with SERVICE_ROLE_KEY)
- **P0 MIGRATIONS**: Added Realtime + founders_briefs migrations to apply
- **P1 PHASE 0 FIX**: Added 6 core fixes from team audit (backend auto-advance, webhook data model, etc.)
- **P2 DEFERRED**: Added HITL UI data source update, deprecate /api/onboarding/complete, webhook tests
- **NEW AUDIT DOCS**: 4 audit reports in `docs/audits/` + implementation plan `gentle-booping-mitten.md`
- **KEY INSIGHT**: Two-artifact data model - `entrepreneur_briefs` (Layer 1) vs `founders_briefs` (Layer 2)

**Changes (2026-01-15 - Late Session):**
- **Architectural Improvements**: Supabase Realtime + unified stage config (from plan `snappy-hugging-lollipop.md`)
- Added Supabase Realtime subscription for instant onboarding progress updates (eliminates 1200ms polling delay)
- Created `lib/onboarding/stages-config.ts` as single source of truth for all 7 stages
- New `useOnboardingSession` hook with Realtime subscription + connection status tracking
- Added feature flag `NEXT_PUBLIC_ONBOARDING_REALTIME` (enabled by default, can disable)
- Fixed Stage 6 missing `available_channels` data topic
- Removed duplicate `CONVERSATION_STAGES` from `/api/onboarding/message/route.ts`
- Removed duplicate stage names from `OnboardingWizardV2.tsx` (now uses `getStageName()`)
- Local migration file: `db/migrations/0010_enable_onboarding_realtime.sql`
- Realtime publication includes only scalar columns (excludes large JSONB for performance)
- Connection status UI: yellow banner + reconnect button when WebSocket disconnects
- Build verified: `pnpm build` succeeds with all changes

**Changes (2026-01-15 - Evening Session):**
- **Onboarding UX Overhaul**: Implemented fixes for 9 UX issues from dogfooding (PENDING VERIFICATION)
- Fixed message truncation: Changed flex overflow handling (`min-h-0`, removed `overflow-hidden`)
- Fixed Send button reliability: Added explicit `form.requestSubmit()` handler
- Added question highlighting: Questions in AI responses now highlighted in accent color
- Enhanced progress display: Collapsible section showing topics being collected
- Added loading time estimate: "(usually 3-5 seconds)" on typing indicator
- Fixed dead-end states: Added mandatory "always end with question" rule to AI prompt
- Added stage navigation: Completed stages now clickable to review past Q&A (new `StageReviewModal.tsx`)
- Fixed save consistency: Increased delay to 1200ms + added "Saving..." indicator
- Build verified: `pnpm build` succeeds with all changes

**Changes (2026-01-15 - Morning Session):**
- **Groq Integration Complete**: Switched onboarding to Groq via OpenRouter for 3x speed, 91% cost savings
- Model: `meta-llama/llama-3.3-70b-instruct` with forced Groq provider routing
- Fixed Claude meta-commentary bug ("Let me assess...") with prompt engineering
- Fixed Netlify build failure (removed `maxSteps` property not in AI SDK types)
- Installed OpenRouter CLI tools (`llm`, `openrouter-cli`) for command-line access
- Updated CLAUDE.md with CLI tools reference (Netlify, Supabase, Modal, OpenRouter)
- Created user-level `~/.claude/CLAUDE.md` for cross-repo CLI documentation
- Production tested: Onboarding with Alex working correctly on Groq

**Changes (2026-01-14 - Evening Session):**
- **CRITICAL FIX**: Root cause of progress/stage issues discovered and fixed
- **Root Cause**: Prompt told AI "Write text FIRST, then call tools", but code's `prepareStep` disabled tools after step 1 text
- **Solution**: Updated `onboarding-prompt.ts` to instruct "Call tools FIRST, then write text"
- **Impact**: Unlocks entire Phase 0 → Phase 1 pipeline (tools now track progress, trigger completion)
- Fixed scroll position (added requestAnimationFrame for reliable scrolling)
- Fixed typing indicator redundancy (removed Send button spinner, kept "Thinking..." dots)
- Added auto-expanding textarea (resizes to content, caps at 200px)

**Changes (2026-01-14 - Morning Session):**
- Fixed Founder onboarding UX bugs found during dogfooding
- Progress tracking race condition resolved (800ms delay before status refetch)
- Empty AI response validation added
- Dashboard now shows "Continue Session" card for active onboarding sessions
- Save & Exit now properly pauses session (new /api/onboarding/pause endpoint)
- AI tool execution forced with toolChoice: 'required'
- Progress display fixed ("Stage X of 7" instead of "0/7 stages")
- Stage completion toast notifications added
- Redundant X exit button removed from sidebar

**Previous (2026-01-12):**
- Dogfooding methodology enshrined in CLAUDE.md files
- Founder journey verified (login, dashboard, projects, approvals)
- Consultant journey verified (login, clients, client projects)
- RLS policy deployed for consultant client project access
- Phase 0-1 HITL approvals tested and working
- Test data created (StartupAI + Elias Food Imports projects)

**Previous (2025-12-05):**
- Added Upstream Architecture Change notice
- Updated CrewAI status: Flow → 3-Crew migration
