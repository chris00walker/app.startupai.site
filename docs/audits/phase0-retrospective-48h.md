> **RETROSPECTIVE UPDATE (2026-01-16)**: This audit's recommendation for "backend-driven progression" has been **IMPLEMENTED** as the Two-Pass Architecture. See [ADR-004](../../../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md). The tool-based assumptions throughout this document are now **SUPERSEDED** - tools (`assessQuality`, `advanceStage`, `completeOnboarding`) have been removed entirely.

---

Plan archaeology and git forensics are complete. No code changes made.

**Plan Archaeology (Last 48 Hours)**
- `/home/chris/.claude/plans/gentle-booping-mitten.md` (Jan 15 16:14)  
  Problem: advanceStage not called, Save & Exit doesn’t pause, `stage_progress` always 0.  
  Solution: backend auto-advance after `assessQuality`; check pause API response + block redirect on failure; explicitly set `stage_progress`.  
  Reasoning: prior fixes assumed LLM could conditionally chain tools; move logic to backend + make fields explicit.  
  Files: `frontend/src/app/api/chat/route.ts`, `frontend/src/components/onboarding/OnboardingWizardV2.tsx`, `docs/work/in-progress.md`.

- `/home/chris/.claude/plans/replicated-painting-lecun.md` (Jan 15 15:05)  
  Problem: `/api/onboarding/status` missing completion data; `useOnboardingSession` has no retry logic.  
  Solution: include `stage_data` in status response and return `completion`; add retry + polling fallback + reconnect in hook.  
  Reasoning: fallback fetch should trigger CrewAI modal; Realtime failures shouldn’t stall progress.  
  Files: `frontend/src/app/api/onboarding/status/route.ts`, `frontend/src/hooks/useOnboardingSession.ts`.

- `/home/chris/.claude/plans/snappy-hugging-lollipop.md` (Jan 15 11:58)  
  Problem: 1200ms polling delay; duplicated stage config in multiple files.  
  Solution: Supabase Realtime (new migration + hook), reduce delay; unify stage config in `stages-config.ts`.  
  Reasoning: real-time updates reduce lag; single source of truth avoids drift.  
  Files: `supabase/migrations/..._enable_onboarding_realtime.sql`, `frontend/src/hooks/useOnboardingSession.ts`, `frontend/src/components/onboarding/OnboardingWizardV2.tsx`, `frontend/src/components/onboarding/OnboardingSidebar.tsx`, `frontend/src/lib/ai/onboarding-prompt.ts`, `frontend/src/app/api/chat/route.ts`, `frontend/src/lib/onboarding/stages-config.ts`.

- `/home/chris/.claude/plans/snappy-hugging-lollipop-agent-a67a519.md` (Jan 15 11:53)  
  Problem: Netlify compatibility for the Realtime + shared-config plan.  
  Solution: assessment only; recommends connection status + reconnect logic.  
  Reasoning: Supabase Realtime is client-side WebSocket; no Netlify infra changes needed.  
  Files: none explicitly; recommendations target `frontend/src/hooks/useOnboardingSession.ts` and `frontend/src/components/onboarding/OnboardingWizardV2.tsx`.

- `/home/chris/.claude/plans/eventual-swinging-russell.md` (Jan 14 20:04)  
  Problem: tools not called (`assessQuality`, `advanceStage`, `completeOnboarding`).  
  Solution: instrumentation in chat route; add direct OpenAI + `generateText` test endpoints; isolate SDK/provider/config.  
  Reasoning: identify root cause instead of repeated guessing.  
  Files: `src/app/api/chat/route.ts`, `src/app/api/test/direct-openai/route.ts`, `src/app/api/test/generate-text/route.ts`.

- `/home/chris/.claude/plans/fluffy-sleeping-nova.md` (Jan 14 13:25)  
  Problem: PAUSED/HITL ignored; Founder’s Brief not shown; redirect to empty gate.  
  Solution: handle PAUSED state in wizard; add Brief review component; add approval_id lookup in status API; adjust routing.  
  Reasoning: align with master architecture; provide user agency and transparency.  
  Files: `src/components/onboarding/OnboardingWizardV2.tsx`, `src/components/onboarding/FoundersBriefReview.tsx`, `src/app/api/crewai/status/route.ts`.

- `/home/chris/.claude/plans/twinkling-chasing-blanket.md` (Jan 14 09:44)  
  Problem: Consultant Client Archive feature missing (non-Phase 0).  
  Solution: junction table, archive API, hook updates, settings UI.  
  Reasoning: separate archive state without touching founder records.  
  Files: `frontend/src/app/api/clients/[id]/archive/route.ts`, `frontend/src/components/settings/ClientsTab.tsx`, `frontend/src/hooks/useClients.ts`, `frontend/src/pages/settings.tsx`, migration.

**Plan → Problem → Files → Overlapping Issues**
| Plan | Problem Claimed | Files Changed | Overlapping Issues |
|---|---|---|---|
| gentle-booping-mitten | stage stuck, Save & Exit, `stage_progress` | `frontend/src/app/api/chat/route.ts`, `frontend/src/components/onboarding/OnboardingWizardV2.tsx`, `docs/work/in-progress.md` | Tool calls, stage progression, pause, progress |
| replicated-painting-lecun | status API gap, Realtime retry | `frontend/src/app/api/onboarding/status/route.ts`, `frontend/src/hooks/useOnboardingSession.ts` | Progress updates, fallback status |
| snappy-hugging-lollipop | polling delay, duplicated config | `supabase/migrations/...`, `frontend/src/hooks/useOnboardingSession.ts`, `frontend/src/components/onboarding/OnboardingWizardV2.tsx`, `frontend/src/components/onboarding/OnboardingSidebar.tsx`, `frontend/src/lib/ai/onboarding-prompt.ts`, `frontend/src/app/api/chat/route.ts`, `frontend/src/lib/onboarding/stages-config.ts` | Progress updates, stage config |
| snappy-hugging-lollipop-agent-a67a519 | Netlify readiness | none (recommendations) | Realtime reliability |
| eventual-swinging-russell | tools not called | `src/app/api/chat/route.ts`, `src/app/api/test/direct-openai/route.ts`, `src/app/api/test/generate-text/route.ts` | Tool calls, stage progression |
| fluffy-sleeping-nova | HITL approval missing | `src/components/onboarding/OnboardingWizardV2.tsx`, `src/components/onboarding/FoundersBriefReview.tsx`, `src/app/api/crewai/status/route.ts` | Onboarding completion flow |
| twinkling-chasing-blanket | client archive | `frontend/src/app/api/clients/[id]/archive/route.ts`, `frontend/src/components/settings/ClientsTab.tsx`, `frontend/src/hooks/useClients.ts`, `frontend/src/pages/settings.tsx` | None (non-Phase 0) |

---

**Git Forensics**

`git log --oneline --since="48 hours ago"` (repo root):  
`c1cf745`, `34dc6bd`, `2d7d39d`, `488d454`, `46c086d`, `9d25a9a`, `41b5869`, `cd06e4a`, `0b97ea1`, `6a975f0`, `7a0888b`, `0a4bafd`, `901bb7b`, `fb1b188`, `f25f33d`, `e83a01f`, `4bd8b8e`, `3312b05`, `7927e8c`, `990518e`, `a068a10`, `45d7ee5`, `cd25405`, `f3f77e0`, `8faa961`, `1a3be08`, `56da3e8`, `3a8bf4b`, `d31738c`, `c7abe7d`, `2ef2da7`, `4e058c8`, `9e6b426`, `bc362c8`.

**Changes by target file**

`frontend/src/app/api/chat/route.ts`  
- `bc362c8`: removed demo/test user bypass and in-memory sessions; always use real Supabase session.  
- `d31738c`: set `toolChoice: 'required'`; added empty-text early return (later removed).  
- `1a3be08`: switched to `toDataStreamResponse()` (data-stream protocol).  
- `8faa961`: set `toolChoice: 'auto'`; added error handler to `toDataStreamResponse()`.  
- `f3f77e0`: replaced `toDataStreamResponse()` with `toTextStreamResponse()`.  
- `cd25405`: reverted to `toUIMessageStreamResponse()` with `onError`.  
- `45d7ee5`: added `prepareStep()` + `stopWhen(stepCountIs(2))` to force tool-then-text flow.  
- `3312b05`: `prepareStep()` forces `toolChoice: 'required'` for step 1 and `none` after; added warning if no tools.  
- `4bd8b8e`: added `prepareStep` logging and `onFinish` tool-call warnings.  
- `e83a01f`: fixed off-by-one in `prepareStep` (stepNumber 0-indexed).  
- `f25f33d`: removed early return on empty text; only append assistant message if text; added DB update logging and `.select()`.  
- `901bb7b`: switched provider to OpenRouter (`createOpenRouter`).  
- `7a0888b`: removed forced multi-step pattern; `toolChoice: 'auto'`, added `maxSteps: 3` (later removed).  
- `6a975f0`: removed `maxSteps` (type mismatch).  
- `cd06e4a`: tool descriptions now “silent” to prevent narration.  
- `9d25a9a`: OpenRouter provider routing to Groq via `extraBody`.  
- `2d7d39d`: removed `ONBOARDING_STAGES` import (config moved).

`frontend/src/components/onboarding/OnboardingWizardV2.tsx`  
- `bc362c8`: removed demo-mode mock responses and demo session initialization.  
- `d31738c`: added `/api/onboarding/pause` call on exit; added 800ms delay before refetch; stage-complete toast; `forceNew` URL param and minimum loading time.  
- `56da3e8`: added HITL state handling, Brief fetch, approval flow, routing to `/analysis` and `/gate`.  
- `1a3be08`: stream parsing changed to data-stream protocol (“0:” prefix).  
- `8faa961`: added parsing for error/tool_call/finish events; added stream logging.  
- `f3f77e0`: simplified parsing for `toTextStreamResponse()` (raw text).  
- `cd25405`: reverted parsing to `toUIMessageStreamResponse()` SSE `data: {type:text-delta}`.  
- `45d7ee5`: toast on empty stream text (AI only called tools).  
- `488d454`: introduced StageReviewModal; added `isSaving` + 1200ms delay; stage review click; stage progress data stub.  
- `2d7d39d`: integrated `useOnboardingSession` Realtime, shared stage config, 300ms grace delay; connection banner.  
- `34dc6bd`: added 500ms delay + `refetchSessionStatus()` fallback after send.

`frontend/src/lib/ai/onboarding-prompt.ts`  
- `d31738c`: made tool usage mandatory and explicit (assess/advance/complete).  
- `8faa961`: changed to “text first, then tools.”  
- `a068a10`: flipped to “tools first, then text” to align with multi-step flow.  
- `cd06e4a`: removed FIRST/THEN framing; emphasize silent background tools.  
- `488d454`: added mandatory “end with a question” rule.  
- `2d7d39d`: replaced inline stage config with re-exports from `frontend/src/lib/onboarding/stages-config.ts`.

`frontend/src/app/api/onboarding/*/route.ts`  
- `bc362c8`: removed test/demo session handling in status and abandon routes.  
- `d31738c`: added `/api/onboarding/pause`; status now supports “latest active/paused” lookup + `last_activity`.  
- `3a8bf4b`: `/api/onboarding/start` includes fallback `agentIntroduction` and `firstQuestion` on resume.  
- `56da3e8`: added `/api/onboarding/brief`.  
- `4bd8b8e`: added `/api/onboarding/debug` for diagnostics.  
- `2d7d39d`: `/api/onboarding/message` uses shared stage config (`getStageConfig`).  
- `c1cf745`: `/api/onboarding/status` selects `stage_data` and returns `completion`.

**Which commits claimed to fix the same issue (and how they differed)**  
- Tool calls / advanceStage not called  
  - Prompt ordering toggles: `8faa961` (text-first) → `a068a10` (tools-first) → `cd06e4a` (remove ordering, silent tools) in `frontend/src/lib/ai/onboarding-prompt.ts`.  
  - Enforcement toggles: `d31738c` (toolChoice required) → `8faa961` (auto) → `3312b05` (required in step 1) → `7a0888b` (auto again) in `frontend/src/app/api/chat/route.ts`.  
  - Multi-step mechanics: `45d7ee5` (prepareStep + stopWhen) → `e83a01f` (stepNumber fix) → `7a0888b` (removed prepareStep).  
  - “Tools called but not saved”: `f25f33d` removed empty-text early return to preserve tool results.  
  - Provider swaps: `901bb7b` (OpenRouter default Claude) → `9d25a9a` (force Groq) in `frontend/src/app/api/chat/route.ts`.  
  Net effect: repeated alternation between enforcement vs autonomy, plus provider changes and stream handling changes.

- Stream visibility / AI response missing  
  - Backend stream format toggles: `1a3be08` (toDataStreamResponse) → `f3f77e0` (toTextStreamResponse) → `cd25405` (back to toUIMessageStreamResponse) in `frontend/src/app/api/chat/route.ts`.  
  - Frontend parser toggles to match: `1a3be08` (“0:” parsing) → `f3f77e0` (raw text) → `cd25405` (SSE `data: {text-delta}`) in `frontend/src/components/onboarding/OnboardingWizardV2.tsx`.

- Progress tracking / update reliability  
  - UI delays/refetch: `d31738c` (800ms delay + refetch) → `488d454` (1200ms + isSaving) → `2d7d39d` (300ms, rely on Realtime) → `34dc6bd` (re-add fallback refetch).  
  - Backend progress fallback: `3a8bf4b` (message-based minimum `overall_progress`).

---

**Pattern Analysis – Phase 0 Issues**

**A. Chat Interface Issues (counts from last 48h commits + plans)**
- “advanceStage not called” fixes: 10 implemented changes (`d31738c`, `8faa961`, `a068a10`, `45d7ee5`, `3312b05`, `e83a01f`, `f25f33d`, `7a0888b`, `901bb7b`, `9d25a9a`) + 1 diagnostic plan (`eventual-swinging-russell.md`) + 1 new plan proposing backend auto-advance (`gentle-booping-mitten.md`).  
- “Save & Exit / pause” fixes: 1 implemented (`d31738c` added `/api/onboarding/pause` + call) + 1 planned fix (`gentle-booping-mitten.md` adds response check and blocking redirect).  
- “stage_progress / progress tracking” fixes: 5 implemented adjustments (`d31738c`, `3a8bf4b`, `2d7d39d`, `34dc6bd`, `c1cf745`) + 1 planned backend fix (`gentle-booping-mitten.md`). No explicit `stage_progress` update exists in `frontend/src/app/api/chat/route.ts` (confirmed by absence of `stage_progress` in that file).

**B. UI/UX Issues**
- UI state management issues addressed: race-condition refetch delays (`d31738c`, `488d454`), Realtime vs fallback (`2d7d39d`, `34dc6bd`), HITL state transitions (`56da3e8`), resume fallback (`3a8bf4b`).  
- Component rendering/display issues fixed: message truncation + flex overflow (`488d454`), sidebar stage list overflow (`1a3be08`), stage review modal (`488d454`), question highlighting and markdown formatting (`488d454`, `1a3be08`).  
- Navigation/routing issues: post-completion routing to `/project/{id}/gate` vs `/analysis` (`56da3e8`), Save & Exit routing (`d31738c`), removal of demo routing (`bc362c8`).

**C. Cross-Cutting Analysis (with evidence)**
1. Wrong assumptions  
   - “LLM can chain tools conditionally” is contradicted by repeated prompt/toolChoice toggles and the plan’s root-cause note (`gentle-booping-mitten.md`).  
   - “toolChoice required guarantees tools + text” proved false; `d31738c` → `8faa961` reverted because required blocked text, then `3312b05` reintroduced forced tools.  
   - “Streaming format is stable” was false; backend toggled between `toDataStreamResponse`, `toTextStreamResponse`, `toUIMessageStreamResponse` with matching parser flips (`frontend/src/app/api/chat/route.ts`, `frontend/src/components/onboarding/OnboardingWizardV2.tsx`).  
   - “Realtime alone is enough” proved false; fallback refetch reintroduced in `34dc6bd`.

2. Symptoms vs root causes  
   - Most changes were symptomatic (prompt edits, toolChoice toggles, provider swaps, UI delays).  
   - Root cause is now articulated in `gentle-booping-mitten.md`: tool sequencing depends on LLM decisions but stage advancement needs deterministic logic.

3. Deeper architectural issue  
   - Phase 0 progress/state is LLM-driven instead of deterministic; progression logic is split across prompt, API, UI; and `stage_progress` isn’t explicitly written. This makes regressions likely and debuggability weak.

4. Incremental fix vs refactor  
   - Evidence suggests incremental prompt/toolChoice tweaks regress quickly. A targeted refactor that moves progression rules to backend (and treats tools as optional) is more likely to stick.

5. “Permanently solved” Phase 0 looks like  
   - Backend-owned state machine: stage advancement, `stage_progress`, and completion determined server-side; LLM only provides content/assessments.  
   - UI reads from DB state (Realtime optional), not from assumed LLM behavior.  
   - Streaming protocol locked with contract tests to prevent parse mismatches.

6. Guardrails to prevent regressions  
   - Integration tests that assert stage changes + `stage_progress` update after `assessQuality`.  
   - Contract tests for stream protocol (backend ↔ frontend).  
   - Monitoring on tool-call rate vs stage advancement (alerts when tools are called but no stage change).  
   - Single source of truth for stage config (already started).

**Summary Table**
| Issue Category | Times “Fixed” | Root Cause Identified? | Still Broken? |
|---|---:|---|---|
| Tool calls / advanceStage | 10 commits + 1 plan | Partially (`gentle-booping-mitten.md`) | Likely yes (plan cites stuck sessions) |
| Save & Exit / pause | 1 commit + 1 plan | Not fully | Likely yes (no response check; plan cites active status) |
| `stage_progress` / progress tracking | 5 commits + 1 plan | Not yet | Yes (`frontend/src/app/api/chat/route.ts` does not set `stage_progress`) |
| Stream visibility (AI responses) | 4 commits | Yes (format mismatch) | Risk remains (format toggled 3 times) |

---

**Decision Framework**

> **✅ IMPLEMENTED (2026-01-16)**: The recommendation below was implemented as the Two-Pass Architecture. Tools removed entirely; backend-driven `generateObject` assessment after every response. See [ADR-004](../../../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md) and [Plan: async-mixing-ritchie.md](/home/chris/.claude/plans/async-mixing-ritchie.md).

~~Recommendation: Targeted architectural refactor (backend-driven progression) rather than another prompt-only incremental fix.~~ **DONE**

~~Confidence level: Medium (≈0.65).~~ **VALIDATED**: Evidence showed repeated regressions from LLM-driven logic; backend ownership implemented.

Risk factors (now addressed):
- ~~If tool results are still unreliable or missing, backend auto-advance may not trigger as expected.~~ **RESOLVED**: Tools removed; backend always runs assessment.
- ~~Stage thresholds/config drift unless the single source of truth is enforced everywhere.~~ **RESOLVED**: `stages-config.ts` is single source of truth.
- ~~Stream protocol mismatches could still mask tool results and progress in UI.~~ **RESOLVED**: No tools to mask; streaming is conversation-only.

Success criteria (to verify):
- For a new onboarding session: stage advances when coverage crosses threshold; `stage_progress` is non-zero; Save & Exit sets status to `paused`.
- No regressions in stream rendering (parser + stream response format stable).
- E2E test: complete stages 1–2 with deterministic advancement; verify DB updates and UI stage changes.

**STATUS**: Pending live verification with dogfooding account.
