Phase 0 Spec Delta (Proposed Updates)

Target Spec
- /home/chris/projects/startupai-crew/docs/master-architecture/04-phase-0-onboarding.md

Summary of Required Spec Changes
1. Clarify progression criteria and tool behavior.
2. Align Founder's Brief schema to actual storage (or update storage to match schema).
3. Formalize completion and handoff paths (one canonical path).
4. Document pause/resume/recover and realtime behaviors.
5. Resolve Competitive Analysis contradiction.
6. Document provider choice and API surface.

Concrete Spec Deltas

A) Progression Criteria (Add)
- Add a section "Stage Progression and Thresholds" that defines:
  - Coverage thresholds per stage (or reference a single source of truth).
  - How assessQuality and advanceStage influence stage progression.
  - How stage_progress and overall_progress are computed and persisted.
  - Whether progression is LLM-driven or backend-driven.

B) Founder's Brief Data Model (Clarify or Replace)
- Clarify whether Founder's Brief is stored in entrepreneur_briefs or a new founders_briefs table.
- If keeping entrepreneur_briefs, define a mapping from FoundersBrief schema to entrepreneur_briefs fields.
- If adopting FoundersBrief schema, add required fields:
  - qa_status, key_assumptions (with risk_level, how_to_test), interview metadata.

C) Transcript Handoff (Add)
- Add requirement: conversation transcript must be passed into CrewAI flow input.
- Define format (full transcript vs summarized) and storage location.

D) Completion Path (Resolve)
- Define the canonical completion trigger:
  - Option 1: LLM tool completeOnboarding is the sole trigger.
  - Option 2: /api/onboarding/complete is the sole trigger.
- Document any non-canonical recovery paths (manual recovery only).

E) HITL Rejection/Follow-up Loop (Clarify)
- Specify behavior for NEEDS_FOLLOWUP and FAIL:
  - Loop back to Alex chat with specific follow-up questions.
  - Or route to a distinct remediation UI flow.
- Document what happens after REJECT (do not route to support-only unless specified).

F) Competitive Analysis Contradiction (Resolve)
- Either remove "not about Competitive Analysis" language or reframe Stage 5 as hypothesis capture only.
- Add explicit statement: Phase 0 captures competitive landscape assumptions but does not validate them.

G) Provider and Infrastructure (Update)
- Update Layer 1 tech stack section:
  - From "OpenAI" to "OpenRouter with provider routing (e.g., Groq)" if this is now standard.
- Note that streaming protocol and tool execution are implementation-defined and versioned.

H) API Surface (Add)
- Add a Phase 0 API contracts section that lists:
  - /api/onboarding/start, /api/chat, /api/onboarding/status, /api/onboarding/pause, /api/onboarding/abandon, /api/onboarding/complete.
  - /api/onboarding/brief (HITL display) and /api/onboarding/recover (manual recovery).
- Mark debug endpoints as non-production (if intended).

I) Realtime Behavior (Add)
- Document that realtime updates are optional and must have HTTP polling fallback.
- Define expected UI behavior when realtime is disconnected.

Out-of-Spec Behaviors to Decide
- /api/onboarding/message (Agentuity conversation path) is present but unused by the product UI.
  - Decide to deprecate or incorporate into the spec.
- /api/onboarding/recover is operational but not described in spec.
  - Decide if it is a supported admin tool or a temporary stopgap.

