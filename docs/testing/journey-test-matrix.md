---
purpose: "Matrix mapping journey steps to user stories and E2E tests"
status: "active"
last_reviewed: "2026-01-20"
architectural_pivot: "2026-01-20"
---

# Journey-Test Coverage Matrix

> **Architectural Pivot (2026-01-20)**: Phase 0 was simplified to Quick Start. The 7-stage AI conversation code has been deleted. See [ADR-006](../../../startupai-crew/docs/adr/006-quick-start-architecture.md).

**Status:** Active
**Stories Reference:** [`user-stories.md`](../user-experience/user-stories.md)

This matrix maps each journey step to its corresponding user story and E2E test, enabling gap analysis and test-driven development.

---

## Matrix Legend

| Symbol | Meaning |
|--------|---------|
| Covered | E2E test exists and covers the story |
| Gap | Story exists but no E2E test coverage |
| Partial | E2E test exists but only covers part of the story |
| N/A | Not applicable (infrastructure, cross-cutting) |

---

## Founder Journey Matrix

**Journey Map:** [`founder-journey-map.md`](../user-experience/founder-journey-map.md)

| Journey Step | User Story | E2E Test File | Test Description | Status |
|--------------|------------|---------------|------------------|--------|
| Step 1-4: Signup & Auth | N/A (cross-cutting) | `01-login.spec.ts` | Authentication flows | Covered |
| Step 5: Quick Start Form | US-F01, US-T01 | `16-quick-start-founder.spec.ts` | "should submit Quick Start form" | Covered |
| Step 5: Optional Hints | US-F01 | `16-quick-start-founder.spec.ts` | "should expand and use hint fields" | Covered |
| Step 6: Phase 1 Starts | US-F01 | `16-quick-start-founder.spec.ts` | "should redirect to dashboard after submit" | Covered |
| Step 7: HITL Approvals | US-F03 | `05-hitl-approval-flow.spec.ts` | "should display approval stats cards" | Covered |
| Step 8: Results Dashboard | US-F02 | `04-founder-analysis-journey.spec.ts` | "should display founder dashboard" | Covered |
| Step 8: View Canvases | US-F06 | `04-founder-analysis-journey.spec.ts` | "should display VPC content in Canvases tab" | Covered |
| Step 8: AI Attribution | US-F02 | `03-founder-attribution.spec.ts` | "should display founder status panel" | Covered |
| Step 9: Action Planning | US-F06 | `04-founder-analysis-journey.spec.ts` | "should navigate between dashboard tabs" | Covered |
| Archive Project | US-F04 | `11-project-lifecycle.spec.ts` | "should archive project when confirmed" | Covered |
| Delete Project | US-F05 | `11-project-lifecycle.spec.ts` | "should delete project permanently when confirmed" | Covered |

---

## Consultant Journey Matrix

**Journey Map:** [`consultant-journey-map.md`](../user-experience/consultant-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Test Description | Status |
|---------------|--------------|------------|---------------|------------------|--------|
| Phase 1 | Step 1-4: Signup & Auth | N/A | `01-login.spec.ts` | "Consultant user can login" | Covered |
| Phase 2 | Step 5-7: Practice Setup | US-C01 | `09-consultant-practice-setup.spec.ts` | "should redirect to dashboard" | Covered |
| Phase 3 | Step 8: Dashboard Intro | US-C03 | `06-consultant-portfolio.spec.ts` | "should navigate to consultant dashboard" | Covered |
| Phase 3 | Step 9: Create Invite | US-C02 | `10-consultant-client-onboarding.spec.ts` | "should show Add Client option" | Covered |
| Phase 3 | Step 10: Client Accepts | US-C02 | - | Invite acceptance flow | Partial |
| Phase 3 | Step 11: Quick Start for Client | US-C07 | `17-quick-start-consultant.spec.ts` | "should submit Quick Start for client" | Covered |
| Phase 3 | Step 11: Client Selection | US-C07 | `17-quick-start-consultant.spec.ts` | "should display client selection" | Covered |
| Phase 4 | Step 12: Portfolio View | US-C03 | `06-consultant-portfolio.spec.ts` | "should display portfolio grid" | Covered |
| Phase 4 | Step 13: Portfolio Metrics | US-C03 | `06-consultant-portfolio.spec.ts` | "should display portfolio metrics" | Covered |
| Phase 5 | Step 14: Client Detail | US-C04 | `06-consultant-portfolio.spec.ts` | "should click client card and navigate" | Covered |
| Phase 5 | Step 15: HITL Monitoring | US-C04 | `05-hitl-approval-flow.spec.ts` | "should show client pending approvals" | Covered |
| Phase 6 | Step 16: Archive Client | US-C05 | `12-client-lifecycle.spec.ts` | "should archive client when confirmed" | Covered |
| Phase 6 | Step 17: Restore Client | US-C05 | `12-client-lifecycle.spec.ts` | "should restore archived client" | Covered |
| Phase 6 | Step 18: Client Unlink | N/A | - | Client-initiated | N/A |
| - | Resend Invite | US-C06 | `12-client-lifecycle.spec.ts` | "should resend invite successfully" | Covered |

---

## Trial User Journey Matrix

| Journey Step | User Story | E2E Test File | Test Description | Status |
|--------------|------------|---------------|------------------|--------|
| Trial Signup | US-T01 | `01-login.spec.ts` | Authentication redirect | Covered |
| Start Onboarding | US-T01 | `02-onboarding-flow.spec.ts` | "should start onboarding" | Covered |
| View Trial Limits | US-T02 | `13-trial-limits.spec.ts` | "should display trial status card on dashboard" | Covered |
| Upgrade to Founder | US-T03 | `13-trial-limits.spec.ts` | "should initiate Stripe checkout" | Covered |

---

## HITL Checkpoint Matrix

**Spec Reference:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md), [`phase-transitions.md`](../specs/phase-transitions.md)

| Phase | Checkpoint | User Story | E2E Test File | Status |
|-------|------------|------------|---------------|--------|
| Phase 1 | `approve_brief` | US-H01 | `14-hitl-extended.spec.ts` | Covered |
| Phase 1 | `approve_discovery_output` | US-H01 | `14-hitl-extended.spec.ts` | Covered |
| Phase 1 | `approve_experiment_plan` | US-H02 | `14-hitl-extended.spec.ts` | Covered |
| Phase 1 | `approve_pricing_test` | US-H02 | `14-hitl-extended.spec.ts` | Covered |
| Phase 2 | `campaign_launch` | US-H04 | `14-hitl-extended.spec.ts` | Covered |
| Phase 2 | `spend_increase` | US-H05 | `14-hitl-extended.spec.ts` | Covered |
| Phase 2 | `gate_progression` (D) | US-H06 | `14-hitl-extended.spec.ts` | Covered |
| Phase 3 | `gate_progression` (F) | US-H07 | `14-hitl-extended.spec.ts` | Covered |
| Phase 4 | `gate_progression` (V) | US-H08 | `14-hitl-extended.spec.ts` | Covered |
| Phase 4 | `final_decision` | US-H09 | `14-hitl-extended.spec.ts` | Covered |

---

## Pivot Flow Matrix

**Spec Reference:** [`phase-transitions.md`](../specs/phase-transitions.md), [`pivot-workflows.md`](../specs/pivot-workflows.md)

| Pivot Type | Trigger Condition | User Story | E2E Test File | Status |
|------------|-------------------|------------|---------------|--------|
| Segment Pivot | Problem resonance <30% | US-P01 | `15-pivot-workflows.spec.ts` | Covered |
| Value Pivot | Zombie ratio ≥70% | US-P02 | `15-pivot-workflows.spec.ts` | Covered |
| Feature Downgrade | Feasibility ORANGE | US-P03 | `15-pivot-workflows.spec.ts` | Covered |
| Strategic Pivot | Viability MARGINAL | US-P04 | `15-pivot-workflows.spec.ts` | Covered |

---

## E2E Test File Summary

| Test File | Spec Count | Stories Covered | Primary Focus |
|-----------|------------|-----------------|---------------|
| `00-smoke.spec.ts` | 3 | - | Infrastructure health |
| `01-login.spec.ts` | 6 | Cross-cutting | Authentication flows |
| `02-onboarding-flow.spec.ts` | 14 | US-F01, US-T01 | Legacy onboarding (to be updated) |
| `03-founder-attribution.spec.ts` | 9 | US-F02 | AI Founder display |
| `04-founder-analysis-journey.spec.ts` | 14 | US-F02, US-F06 | Dashboard & analysis |
| `05-hitl-approval-flow.spec.ts` | 13 | US-F03, US-C04 | Approval workflows |
| `06-consultant-portfolio.spec.ts` | 15 | US-C03, US-C04 | Portfolio management |
| `07-adr005-persistence.spec.ts` | 14 | - | Session persistence (legacy, may be removed) |
| `08-ui-indicators.spec.ts` | 8 | - | Progress indicators (legacy, may be removed) |
| `09-consultant-practice-setup.spec.ts` | 4 | US-C01 | Consultant setup |
| `10-consultant-client-onboarding.spec.ts` | 6 | US-C02 | Client onboarding (invites) |
| `11-project-lifecycle.spec.ts` | 16 | US-F04, US-F05 | Project archive & delete |
| `12-client-lifecycle.spec.ts` | 18 | US-C05, US-C06 | Client archive & resend |
| `13-trial-limits.spec.ts` | 20 | US-T02, US-T03 | Trial limits & upgrade |
| `14-hitl-extended.spec.ts` | 24 | US-H01-H09 | Extended HITL checkpoints |
| `15-pivot-workflows.spec.ts` | 22 | US-P01-P04 | Pivot decision workflows |
| `16-quick-start-founder.spec.ts` | 8 | US-F01, US-T01 | **NEW:** Founder Quick Start flow |
| `17-quick-start-consultant.spec.ts` | 8 | US-C07 | **NEW:** Consultant Quick Start for clients |
| **Total** | **222** | **31 of 31** | |

---

## Gap Analysis Summary

### All Stories Now Covered

All 31 user stories now have E2E test coverage.

#### Original Stories (US-F, US-C, US-T)

| Story ID | Title | Test File | Status |
|----------|-------|-----------|--------|
| US-F04 | Archive Project | `11-project-lifecycle.spec.ts` | ✅ Covered |
| US-F05 | Delete Project | `11-project-lifecycle.spec.ts` | ✅ Covered |
| US-C05 | Archive Client | `12-client-lifecycle.spec.ts` | ✅ Covered |
| US-C06 | Resend Client Invite | `12-client-lifecycle.spec.ts` | ✅ Covered |
| US-T02 | View Trial Limits | `13-trial-limits.spec.ts` | ✅ Covered |
| US-T03 | Upgrade to Founder | `13-trial-limits.spec.ts` | ✅ Covered |

#### HITL Checkpoint Stories (US-H)

| Story ID | Title | Test File | Status |
|----------|-------|-----------|--------|
| US-H01 | Review Brief (Stage A) | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H01b | Review Discovery Output (Stage B) | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H02 | Approve Experiment Plan | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H04 | Approve Campaign Launch | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H05 | Approve Budget Increase | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H06 | Review Desirability Gate | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H07 | Review Feasibility Gate | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H08 | Review Viability Gate | `14-hitl-extended.spec.ts` | ✅ Covered |
| US-H09 | Make Final Decision | `14-hitl-extended.spec.ts` | ✅ Covered |

#### Pivot Flow Stories (US-P)

| Story ID | Title | Test File | Status |
|----------|-------|-----------|--------|
| US-P01 | Approve Segment Pivot | `15-pivot-workflows.spec.ts` | ✅ Covered |
| US-P02 | Approve Value Pivot | `15-pivot-workflows.spec.ts` | ✅ Covered |
| US-P03 | Approve Feature Downgrade | `15-pivot-workflows.spec.ts` | ✅ Covered |
| US-P04 | Approve Strategic Pivot | `15-pivot-workflows.spec.ts` | ✅ Covered |

### Coverage Statistics

| Category | Stories | Covered | Gaps | Coverage % |
|----------|---------|---------|------|------------|
| Founder (US-F) | 8 | 8 | 0 | 100% |
| Consultant (US-C) | 7 | 7 | 0 | 100% |
| Trial (US-T) | 3 | 3 | 0 | 100% |
| HITL (US-H) | 9 | 9 | 0 | 100% |
| Pivot (US-P) | 4 | 4 | 0 | 100% |
| **Total** | **31** | **31** | **0** | **100%** |

### Completed Priorities

1. ~~**P0 - Critical:** Founder's Brief and Final Decision (US-H01, US-H09)~~ ✅ DONE
   - Covered in `14-hitl-extended.spec.ts`

2. ~~**P1 - High:** All Phase Gate checkpoints (US-H03, US-H06, US-H07, US-H08)~~ ✅ DONE
   - Covered in `14-hitl-extended.spec.ts`

3. ~~**P1 - High:** Pivot flows (US-P01, US-P02)~~ ✅ DONE
   - Covered in `15-pivot-workflows.spec.ts`

4. ~~**High Priority:** Trial limits and upgrade flow (US-T02, US-T03)~~ ✅ DONE
   - Covered in `13-trial-limits.spec.ts`

5. ~~**Medium Priority:** Project lifecycle (US-F04, US-F05)~~ ✅ DONE
   - Covered in `11-project-lifecycle.spec.ts`

6. ~~**Medium Priority:** Client lifecycle (US-C05, US-C06)~~ ✅ DONE
   - Covered in `12-client-lifecycle.spec.ts`

7. ~~**P2 - Medium:** Pivot downgrade flows (US-P03, US-P04)~~ ✅ DONE
   - Covered in `15-pivot-workflows.spec.ts`

---

## Cross-References

| Document | Purpose |
|----------|---------|
| [`user-stories.md`](../user-experience/user-stories.md) | Story definitions and acceptance criteria |
| [`strategy.md`](./strategy.md) | Testing strategy and approach |
| [`e2e-guide.md`](./e2e-guide.md) | E2E test implementation guide |
| [`founder-journey-map.md`](../user-experience/founder-journey-map.md) | Founder journey steps |
| [`consultant-journey-map.md`](../user-experience/consultant-journey-map.md) | Consultant journey phases |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-20 | **QUICK START IMPLEMENTATION COMPLETE**: Created `16-quick-start-founder.spec.ts` and `17-quick-start-consultant.spec.ts`. Legacy conversation code deleted. |
| 2026-01-19 | **QUICK START PIVOT**: Multiple tests deprecated (7-stage conversation, session persistence, stage indicators). New tests needed for Quick Start form and `approve_discovery_output` checkpoint. |
| 2026-01-19 | **100% COVERAGE ACHIEVED** - All 31 user stories now have E2E tests |
| 2026-01-19 | Created `11-project-lifecycle.spec.ts` - US-F04, US-F05 covered |
| 2026-01-19 | Created `12-client-lifecycle.spec.ts` - US-C05, US-C06 covered |
| 2026-01-19 | Created `13-trial-limits.spec.ts` - US-T02, US-T03 covered |
| 2026-01-19 | Created `15-pivot-workflows.spec.ts` - US-P01 through US-P04 covered |
| 2026-01-19 | Created `14-hitl-extended.spec.ts` - all 9 HITL stories now covered (US-H01-H09) |
| 2026-01-19 | Coverage improved from 42% to 68% (21 of 31 stories) |
| 2026-01-19 | Added HITL Checkpoint Matrix (10 checkpoints) and Pivot Flow Matrix (4 pivots) |
| 2026-01-19 | Updated gap analysis with 13 new stories (US-H01-H09, US-P01-P04) |
| 2026-01-19 | Initial creation - coverage matrix with gap analysis |
