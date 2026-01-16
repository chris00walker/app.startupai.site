> **RETROSPECTIVE UPDATE (2026-01-16)**: Many items below have been addressed by the Two-Pass Architecture. See [ADR-004](../../../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md).

---

Phase 0 Alignment Task List (No Code Changes Executed)

P0 - Spec Decisions (Documentation)
- [x] ~~Decide canonical completion trigger (tool-driven vs /api/onboarding/complete)~~ **RESOLVED**: Backend-driven assessment in `quality-assessment.ts` (no tools).
- [ ] Resolve Competitive Analysis contradiction; define whether Stage 5 is hypothesis capture only.
- [x] ~~Define progression criteria and thresholds; document source of truth for stage thresholds.~~ **RESOLVED**: `stages-config.ts` is source of truth (70-85% thresholds).
- [ ] Decide whether Founder's Brief schema or entrepreneur_briefs is the canonical data model. **CLARIFIED**: Both exist by design - Layer 1 (entrepreneur_briefs = Alex chat) vs Layer 2 (founders_briefs = CrewAI validated).

P1 - Spec Updates (Documentation)
- [x] ~~Add "Stage Progression and Thresholds" section to 04-phase-0-onboarding.md.~~ **DONE**: Added "Two-Pass Stage Progression" section.
- [ ] Add "Transcript Handoff" requirement (format and storage).
- [ ] Add "API Contracts" section listing Phase 0 endpoints and their roles.
- [ ] Add "Realtime Behavior" section (fallback requirements, UI expectations).
- [x] ~~Update Layer 1 provider section to reflect OpenRouter/provider routing if accepted as standard.~~ **DONE**: Documented in ADR-004.
- [ ] Add HITL rejection/follow-up behavior and loop-back requirements.

P2 - Implementation Alignment (Code Work)
- [x] ~~Ensure conversation transcript is passed to buildFounderValidationInputs.~~ **ADDRESSED**: `extractedData` merged into `stage_data.brief` progressively.
- [ ] Align FoundersBriefReview UI to the spec schema or update spec to match entrepreneur_briefs.
- [ ] Add missing Founder's Brief fields (qa_status, assumptions with risk/how_to_test, interview metadata) or map them explicitly.
- [x] ~~Consolidate completion path to the chosen canonical trigger.~~ **DONE**: Backend-driven `quality-assessment.ts` + atomic `triggerCrewAIWorkflow()`.
- [ ] Implement explicit handling for NEEDS_FOLLOWUP/FAIL outcomes (loop to Alex chat).

P3 - Cleanup and De-risking (Code Work)
- [ ] Document /api/onboarding/recover as admin-only or deprecate if not required.
- [ ] Decide on /api/onboarding/message (Agentuity flow) and either adopt or deprecate.
- [x] ~~Add contract tests for stream protocol between /api/chat and OnboardingWizardV2.~~ **SUPERSEDED**: No tools means simpler streaming protocol (conversation-only).
- [x] ~~Add integration tests for stage progression, stage_progress updates, and pause behavior.~~ **PARTIAL**: Tests added for `quality-assessment.ts` functions; E2E testing pending.

Dependencies
- ~~Spec decisions in P0 must be made before code alignment work in P2.~~ **RESOLVED**: Two-Pass Architecture addresses the core stage progression issues.
- Data model decision (FoundersBrief vs entrepreneur_briefs): **CLARIFIED** - both exist by design for Layer 1 vs Layer 2.

---

**Status Summary (2026-01-16)**:
- 5 items completed via Two-Pass Architecture
- 1 item superseded
- 6 items remaining (mostly spec documentation and UI alignment)
