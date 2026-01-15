Phase 0 Alignment Task List (No Code Changes Executed)

P0 - Spec Decisions (Documentation)
- [ ] Decide canonical completion trigger (tool-driven vs /api/onboarding/complete) and update Phase 0 spec accordingly.
- [ ] Resolve Competitive Analysis contradiction; define whether Stage 5 is hypothesis capture only.
- [ ] Define progression criteria and thresholds; document source of truth for stage thresholds.
- [ ] Decide whether Founder's Brief schema or entrepreneur_briefs is the canonical data model.

P1 - Spec Updates (Documentation)
- [ ] Add "Stage Progression and Thresholds" section to 04-phase-0-onboarding.md.
- [ ] Add "Transcript Handoff" requirement (format and storage).
- [ ] Add "API Contracts" section listing Phase 0 endpoints and their roles.
- [ ] Add "Realtime Behavior" section (fallback requirements, UI expectations).
- [ ] Update Layer 1 provider section to reflect OpenRouter/provider routing if accepted as standard.
- [ ] Add HITL rejection/follow-up behavior and loop-back requirements.

P2 - Implementation Alignment (Code Work, Not Started)
- [ ] Ensure conversation transcript is passed to buildFounderValidationInputs.
- [ ] Align FoundersBriefReview UI to the spec schema or update spec to match entrepreneur_briefs.
- [ ] Add missing Founder's Brief fields (qa_status, assumptions with risk/how_to_test, interview metadata) or map them explicitly.
- [ ] Consolidate completion path to the chosen canonical trigger.
- [ ] Implement explicit handling for NEEDS_FOLLOWUP/FAIL outcomes (loop to Alex chat).

P3 - Cleanup and De-risking (Code Work, Not Started)
- [ ] Document /api/onboarding/recover as admin-only or deprecate if not required.
- [ ] Decide on /api/onboarding/message (Agentuity flow) and either adopt or deprecate.
- [ ] Add contract tests for stream protocol between /api/chat and OnboardingWizardV2.
- [ ] Add integration tests for stage progression, stage_progress updates, and pause behavior.

Dependencies
- Spec decisions in P0 must be made before code alignment work in P2.
- Data model decision (FoundersBrief vs entrepreneur_briefs) gates UI and CrewAI input changes.
