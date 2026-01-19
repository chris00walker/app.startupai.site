---
purpose: "Matrix mapping journey steps to user stories and E2E tests"
status: "active"
last_reviewed: "2026-01-19"
---

# Journey-Test Coverage Matrix

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
| Step 5: Welcome | US-T01 | `02-onboarding-flow.spec.ts` | "should start and access onboarding interface" | Covered |
| Step 6-11: AI Conversation | US-F01 | `02-onboarding-flow.spec.ts` | "should progress through Stage 1-7" | Covered |
| Step 6-11: Stage Indicators | US-F01 | `08-ui-indicators.spec.ts` | "should show initial question count" | Covered |
| Step 12: Workflow Trigger | US-F01 | `02-onboarding-flow.spec.ts` | "should complete 7-stage onboarding" | Covered |
| Step 13: HITL Approvals | US-F03 | `05-hitl-approval-flow.spec.ts` | "should display approval stats cards" | Covered |
| Step 14: Results Dashboard | US-F02 | `04-founder-analysis-journey.spec.ts` | "should display founder dashboard" | Covered |
| Step 14: View Canvases | US-F06 | `04-founder-analysis-journey.spec.ts` | "should display VPC content in Canvases tab" | Covered |
| Step 14: AI Attribution | US-F02 | `03-founder-attribution.spec.ts` | "should display founder status panel" | Covered |
| Step 15: Action Planning | US-F06 | `04-founder-analysis-journey.spec.ts` | "should navigate between dashboard tabs" | Covered |
| Session Resume | US-F07 | `07-adr005-persistence.spec.ts` | "should preserve conversation history after refresh" | Covered |
| Start New Conversation | US-F08 | `02-onboarding-flow.spec.ts` | "should show Start New Conversation option" | Covered |
| Archive Project | US-F04 | - | - | **Gap** |
| Delete Project | US-F05 | - | - | **Gap** |

---

## Consultant Journey Matrix

**Journey Map:** [`consultant-journey-map.md`](../user-experience/consultant-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Test Description | Status |
|---------------|--------------|------------|---------------|------------------|--------|
| Phase 1 | Step 1-4: Signup & Auth | N/A | `01-login.spec.ts` | "Consultant user can login" | Covered |
| Phase 2 | Step 5-7: Practice Setup | US-C01 | `09-consultant-practice-setup.spec.ts` | "should complete consultant practice setup" | Covered |
| Phase 3 | Step 8: Dashboard Intro | US-C03 | `06-consultant-portfolio.spec.ts` | "should navigate to consultant dashboard" | Covered |
| Phase 3 | Step 9: Create Invite | US-C02 | `10-consultant-client-onboarding.spec.ts` | "should show Add Client option" | Covered |
| Phase 3 | Step 10: Client Accepts | US-C02 | - | Invite acceptance flow | Partial |
| Phase 3 | Step 11: Onboard in Person | US-C07 | `10-consultant-client-onboarding.spec.ts` | "should complete 7-stage for client" | Covered |
| Phase 4 | Step 12: Portfolio View | US-C03 | `06-consultant-portfolio.spec.ts` | "should display portfolio grid" | Covered |
| Phase 4 | Step 13: Portfolio Metrics | US-C03 | `06-consultant-portfolio.spec.ts` | "should display portfolio metrics" | Covered |
| Phase 5 | Step 14: Client Detail | US-C04 | `06-consultant-portfolio.spec.ts` | "should click client card and navigate" | Covered |
| Phase 5 | Step 15: HITL Monitoring | US-C04 | `05-hitl-approval-flow.spec.ts` | "should show client pending approvals" | Covered |
| Phase 6 | Step 16: Archive Client | US-C05 | - | - | **Gap** |
| Phase 6 | Step 17: Restore Client | US-C05 | - | - | **Gap** |
| Phase 6 | Step 18: Client Unlink | N/A | - | Client-initiated | N/A |
| - | Resend Invite | US-C06 | - | - | **Gap** |

---

## Trial User Journey Matrix

| Journey Step | User Story | E2E Test File | Test Description | Status |
|--------------|------------|---------------|------------------|--------|
| Trial Signup | US-T01 | `01-login.spec.ts` | Authentication redirect | Covered |
| Start Onboarding | US-T01 | `02-onboarding-flow.spec.ts` | "should start onboarding" | Covered |
| View Trial Limits | US-T02 | - | - | **Gap** |
| Upgrade to Founder | US-T03 | - | - | **Gap** |

---

## E2E Test File Summary

| Test File | Spec Count | Stories Covered | Primary Focus |
|-----------|------------|-----------------|---------------|
| `00-smoke.spec.ts` | 3 | - | Infrastructure health |
| `01-login.spec.ts` | 6 | Cross-cutting | Authentication flows |
| `02-onboarding-flow.spec.ts` | 14 | US-F01, US-F08, US-T01 | Founder onboarding |
| `03-founder-attribution.spec.ts` | 9 | US-F02 | AI Founder display |
| `04-founder-analysis-journey.spec.ts` | 14 | US-F02, US-F06 | Dashboard & analysis |
| `05-hitl-approval-flow.spec.ts` | 13 | US-F03, US-C04 | Approval workflows |
| `06-consultant-portfolio.spec.ts` | 15 | US-C03, US-C04 | Portfolio management |
| `07-adr005-persistence.spec.ts` | 14 | US-F07 | Session persistence |
| `08-ui-indicators.spec.ts` | 8 | US-F01 | Progress indicators |
| `09-consultant-practice-setup.spec.ts` | 4 | US-C01 | Consultant setup |
| `10-consultant-client-onboarding.spec.ts` | 6 | US-C02, US-C07 | Client onboarding |
| **Total** | **106** | **12 of 18** | |

---

## Gap Analysis Summary

### Stories Without E2E Coverage

| Story ID | Title | Priority | Recommended Test File |
|----------|-------|----------|----------------------|
| US-F04 | Archive Project | Medium | New: `11-project-lifecycle.spec.ts` |
| US-F05 | Delete Project | Medium | New: `11-project-lifecycle.spec.ts` |
| US-C05 | Archive Client | Medium | New: `12-client-lifecycle.spec.ts` |
| US-C06 | Resend Client Invite | Low | Extend: `10-consultant-client-onboarding.spec.ts` |
| US-T02 | View Trial Limits | High | New: `13-trial-limits.spec.ts` |
| US-T03 | Upgrade to Founder | High | New: `13-trial-limits.spec.ts` |

### Coverage Statistics

| Category | Stories | Covered | Gaps | Coverage % |
|----------|---------|---------|------|------------|
| Founder | 8 | 6 | 2 | 75% |
| Consultant | 7 | 5 | 2 | 71% |
| Trial | 3 | 1 | 2 | 33% |
| **Total** | **18** | **12** | **6** | **67%** |

### Priority Recommendations

1. **High Priority:** Trial limits and upgrade flow (US-T02, US-T03)
   - Critical for conversion funnel
   - Affects revenue
   - Create `13-trial-limits.spec.ts`

2. **Medium Priority:** Project lifecycle (US-F04, US-F05)
   - User-facing Settings functionality
   - Data integrity critical
   - Create `11-project-lifecycle.spec.ts`

3. **Medium Priority:** Client lifecycle (US-C05)
   - Consultant workflow completeness
   - Create `12-client-lifecycle.spec.ts`

4. **Low Priority:** Resend invite (US-C06)
   - Edge case in invite flow
   - Extend existing test file

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
| 2026-01-19 | Initial creation - coverage matrix with gap analysis |
