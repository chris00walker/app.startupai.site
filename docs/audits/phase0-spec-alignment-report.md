---
purpose: "Phase 0 spec alignment report (pre-Two-Pass audit)"
status: "completed"
last_reviewed: "2026-01-16"
---

> **RETROSPECTIVE UPDATE (2026-01-16)**: This audit's gap analysis has been partially addressed by the Two-Pass Architecture. See [ADR-004](../../../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md). Key changes:
> - **Tools REMOVED**: `assessQuality`, `advanceStage`, `completeOnboarding` no longer exist
> - **Dual completion paths RESOLVED**: Backend-driven assessment is now the single path
> - **Stage progression criteria DEFINED**: `quality-assessment.ts` + `stages-config.ts`
> - **Remaining gaps**: `entrepreneur_briefs` vs `founders_briefs` schema alignment still needed (Layer 1 vs Layer 2 data model is by design, not a bug)

---

# Phase 0 Spec Alignment Report

Spec Source
- Master spec: /home/chris/projects/startupai-crew/docs/master-architecture/04-phase-0-onboarding.md

Master Architecture Spec (Phase 0) - Extracted
- Purpose and goals: Transform the founder's raw idea into a structured Founder's Brief (prime artifact) that informs Phase 1+; Alex collects, CrewAI validates.
- Inputs: Alex chat transcript plus extracted business context (Layer 1 output).
- Outputs: Validated Founder's Brief + QA status; HITL approval required for exit.
- Stages: 7 stages (Welcome & Introduction, Customer Discovery, Problem Definition, Solution Validation, Competitive Analysis, Resources & Constraints, Goals & Next Steps).
- Progression criteria: Not explicitly specified in spec (no thresholds or tool logic described).
- Data model requirements: Founder's Brief schema with identity, idea, hypotheses, assumptions, success criteria, founder context, QA status, interview metadata.
- UI/UX requirements: Real-time streaming chat; HITL approval screen with 6 sections, hypothesis labels, checkboxes, approve/request changes.
- Integration with Phase 1+: After approve_founders_brief, proceed to Phase 1 (VPC Discovery).
- CrewAI flow: OnboardingCrew with O1/GV1/GV2/S1; intent_gate with NEEDS_FOLLOWUP/FAIL/PASS and loop/approval; legitimacy must be verified before exit.

Implementation Inventory (What Phase 0 Does Today)
- Database schema
  - onboarding_sessions table with status, current_stage, stage_progress, overall_progress, conversation_history, stage_data, ai_context in supabase/migrations/00009_onboarding_schema.sql.
  - entrepreneur_briefs table with business/problem/solution/etc fields in supabase/migrations/00009_onboarding_schema.sql.
  - consultant_onboarding_sessions exists in supabase/migrations/00012_consultant_onboarding_sessions.sql.
- API routes
  - /api/onboarding/start: creates/resumes session, plan limits, returns initial prompt metadata in frontend/src/app/api/onboarding/start/route.ts.
  - /api/chat: streaming chat with tools; updates stage_data and overall_progress; can create project + kickoff Modal workflow on completeOnboarding tool in frontend/src/app/api/chat/route.ts.
  - /api/onboarding/complete: server-side completion path; creates entrepreneur brief, kicks off Modal workflow, marks session complete in frontend/src/app/api/onboarding/complete/route.ts.
  - /api/onboarding/status: returns session progress; includes completion if completed in frontend/src/app/api/onboarding/status/route.ts.
  - /api/onboarding/pause and /api/onboarding/abandon: session state transitions in frontend/src/app/api/onboarding/pause/route.ts and frontend/src/app/api/onboarding/abandon/route.ts.
  - /api/onboarding/brief: fetch brief for HITL UI in frontend/src/app/api/onboarding/brief/route.ts.
  - /api/onboarding/recover: manual recovery of stuck completed sessions in frontend/src/app/api/onboarding/recover/route.ts.
  - /api/onboarding/message: Agentuity/Crew agent conversation API (not used by OnboardingWizard) in frontend/src/app/api/onboarding/message/route.ts.
- Components
  - frontend/src/components/onboarding/OnboardingWizardV2.tsx: main UI; calls /api/onboarding/start, /api/chat, /api/onboarding/complete, /api/onboarding/status, /api/onboarding/pause.
  - frontend/src/components/onboarding/FoundersBriefReview.tsx: HITL approval UI, uses EntrepreneurBrief schema and derives assumptions.
  - frontend/src/components/onboarding/OnboardingSidebar.tsx and frontend/src/components/onboarding/ConversationInterfaceV2.tsx: chat + progress display.
- AI integration
  - System prompt in frontend/src/lib/ai/onboarding-prompt.ts ~~with tool usage requirements and~~ "always end with a question". **Tools removed in Two-Pass Architecture.**
  - Chat route uses Vercel AI SDK + OpenRouter; ~~tools are assessQuality, advanceStage, completeOnboarding~~ **tools REMOVED**. Backend runs `assessConversationQuality()` after each response instead.
  - **NEW**: `frontend/src/lib/onboarding/quality-assessment.ts` - deterministic assessment module with `generateObject`.
- Stage config
  - Unified config and thresholds in frontend/src/lib/onboarding/stages-config.ts.

Gap Analysis

> **UPDATE (2026-01-16)**: Gaps marked with ✅ have been addressed by Two-Pass Architecture.

| Spec Requirement | Implementation Status | Gap/Drift Description |
|---|---|---|
| Two-layer architecture (Alex chat + CrewAI) | ✅ **RESOLVED** | ~~Present, but there are two completion paths.~~ Now single backend-driven path via `quality-assessment.ts`. |
| Layer 1 tech: Vercel AI SDK + OpenAI | Diverged | Uses Vercel AI SDK + OpenRouter/Groq. This is an accepted deviation (documented in spec). |
| 7 stages (names) | Aligned | Stage names and counts match in frontend/src/lib/onboarding/stages-config.ts. |
| Stage progression criteria defined | ✅ **RESOLVED** | ~~Spec does not define thresholds.~~ Now defined in `stages-config.ts` (70-85%) and enforced by `quality-assessment.ts`. |
| Output: transcript + extracted context | ✅ **RESOLVED** | `extractedData` merged into `stage_data.brief` after every assessment. |
| CrewAI flow with intent_gate loops | Partial | HITL approval supported, but no UI for NEEDS_FOLLOWUP/FAIL loop-back to interview. |
| Founder's Brief schema as specified | Partial | `entrepreneur_briefs` = Layer 1 (Alex raw extraction), `founders_briefs` = Layer 2 (CrewAI validated). This is **by design**, not a bug. |
| Hypotheses marked as NOT VALIDATED | Partial | UI shows HYPOTHESIS badges but data model lacks explicit validation_status fields per spec. |
| HITL approval UI (6 sections + checkboxes + approve/request) | Partial | UI exists in frontend/src/components/onboarding/FoundersBriefReview.tsx, but fields map to EntrepreneurBrief, not spec's Founder's Brief schema. |
| Exit criteria: approval + legitimacy verified | Partial | Approval exists, but legitimacy verification is only in CrewAI output; no explicit gate in product UI. |
| Integration to Phase 1 VPC Discovery | Partial | After approval, redirect to /project/{id}/analysis (progress view). Explicit Phase 1 start gate not visible in product code. |
| Founder + consultant flows (same stages) | Aligned | /onboarding/founder and /onboarding/consultant routes exist, same wizard in frontend/src/app/onboarding/founder/page.tsx and frontend/src/app/onboarding/consultant/page.tsx. |
| Data model for assumptions with how_to_test | Missing | No field for assumption risk/how_to_test in entrepreneur_briefs or stage_data. |
| Spec "Phase 0 is NOT about Competitive Analysis" vs Stage 5 | Diverged | Spec contradicts itself (includes Competitive Analysis stage); implementation includes Competitive Analysis stage. |
| Ad-hoc APIs not in spec | Diverged | /api/onboarding/recover, /api/onboarding/debug, /api/onboarding/message are not in master spec. |

Root Cause Hypothesis
1. Spec clarity: High-level architecture and HITL UI are clear, but progression criteria, data storage mapping, and API contracts are under-specified.
2. Implementation drift: Provider swaps (OpenAI to OpenRouter/Groq), dual completion flows, and ad-hoc recovery endpoints likely arose from reliability issues and incident fixes, not from spec.
3. Missing spec: Pause/resume behavior, realtime progress, plan limits, recovery paths, and stream protocol are implementation-specific with no spec coverage.
4. Contradictions: "Not about Competitive Analysis" conflicts with Stage 5; output schema is detailed but database schema does not reflect it.

Alignment Recommendations (Prioritized)
1. Fix-to-spec for core artifacts and flow
   - Implement Founder's Brief schema (or map existing entrepreneur_briefs to match spec) and include QAStatus, assumptions with risk/how_to_test, and interview metadata.
   - Pass conversation transcript into buildFounderValidationInputs so CrewAI receives Layer 1 output.
2. Clarify spec where behavior is ambiguous
   - Add explicit progression criteria, minimum quality thresholds, and how tools drive stage advancement.
   - Resolve the Competitive Analysis contradiction (either scope it or rename stage to "Competitive Landscape Hypothesis").
3. Resolve dual completion paths
   - Pick a single canonical completion mechanism (tool-driven or /api/onboarding/complete) and document it in the spec.
4. Document and formalize deviations
   - Update spec to reflect OpenRouter/Groq provider choice and the actual API surface (pause, recover, status, etc.) if accepted as permanent.
5. HITL loop-back behavior
   - If spec is authoritative, implement REJECT/NEEDS_FOLLOWUP loop-back to Alex chat instead of support fallback.

Source of Truth Guidance
- Use spec-as-source-of-truth for artifacts, HITL gating, and transcript handoff.
- Update spec where operational realities are stable (provider choice, pause/recover endpoints, realtime behavior).
