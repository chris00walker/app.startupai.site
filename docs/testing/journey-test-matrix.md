---
purpose: "Matrix mapping journey steps to user stories and E2E tests"
status: "active"
last_reviewed: "2026-01-23"
architectural_pivot: "2026-01-20"
---

# Journey-Test Coverage Matrix

> **Architectural Pivot (2026-01-20)**: Phase 0 was simplified to Quick Start. The 7-stage AI conversation code has been deleted. See [ADR-006](../../../startupai-crew/docs/adr/006-quick-start-architecture.md).

**Status:** Active
**Stories Reference:** [`stories/README.md`](../user-experience/stories/README.md)

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

**Journey Map:** [`founder-journey-map.md`](../user-experience/journeys/founder/founder-journey-map.md)

| Journey Step | User Story | E2E Test File | Test Description | Status |
|--------------|------------|---------------|------------------|--------|
| Step 1-4: Signup & Auth | US-AU01 | `01-login.spec.ts` | Authentication flows | Covered |
| Step 5: Quick Start Form | US-F01, US-FT01 | `16-quick-start-founder.spec.ts` | "should submit Quick Start form" | Covered |
| Step 5: Optional Hints | US-F01 | `16-quick-start-founder.spec.ts` | "should expand and use hint fields" | Covered |
| Step 6: Phase 1 Starts | US-F01 | `16-quick-start-founder.spec.ts` | "should redirect to dashboard after submit" | Covered |
| Step 7: HITL Approvals | US-F03 | `05-hitl-approval-flow.spec.ts` | "should display approval stats cards" | Covered |
| Step 8: Results Dashboard | US-F02 | `04-founder-analysis-journey.spec.ts` | "should display founder dashboard" | Covered |
| Step 8: View Canvases | US-F06 | `04-founder-analysis-journey.spec.ts` | "should display VPC content in Canvases tab" | Covered |
| Step 8: AI Attribution | US-F02 | `03-founder-attribution.spec.ts` | "should display founder status panel" | Covered |
| Step 9: Action Planning | US-F06 | `04-founder-analysis-journey.spec.ts` | "should navigate between dashboard tabs" | Covered |
| Step 9: Hypotheses Management | US-F17 | `28-hypotheses.spec.ts` | "should create, edit, and delete hypotheses" | Gap |
| Step 6-7: Progress Indicators | US-F08 | `04-founder-analysis-journey.spec.ts` | "should show phase progress indicators" | Covered |
| Step 6: Activity Feed | US-F09 | `04-founder-analysis-journey.spec.ts` | "should update activity feed" | Covered |
| Step 7: Error Handling | US-F10 | `04-founder-analysis-journey.spec.ts` | "should handle phase errors gracefully" | Covered |
| Archive Project | US-F04 | `11-project-lifecycle.spec.ts` | "should archive project when confirmed" | Covered |
| Delete Project | US-F05 | `11-project-lifecycle.spec.ts` | "should delete project permanently when confirmed" | Covered |

---

## Consultant Journey Matrix

**Journey Map:** [`consultant-journey-map.md`](../user-experience/journeys/consultant/consultant-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Test Description | Status |
|---------------|--------------|------------|---------------|------------------|--------|
| Phase 1 | Step 1-4: Signup & Auth | US-AU01 | `01-login.spec.ts` | "Consultant user can login" | Covered |
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

## Consultant Trial Journey Matrix

> **Added (2026-01-22)**: New matrix for consultant trial experience with mock clients.

**Journey Map:** [`consultant-trial-journey-map.md`](../user-experience/journeys/trials/consultant-trial-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Trial Signup | US-CT01 | `22-consultant-trial.spec.ts` | Gap |
| Phase 1 | Practice Setup | US-CT01 | `22-consultant-trial.spec.ts` | Gap |
| Phase 2 | View Mock Clients | US-CT02 | `22-consultant-trial.spec.ts` | Gap |
| Phase 2 | View Trial Status | US-CT04 | `22-consultant-trial.spec.ts` | Gap |
| Phase 3 | Attempt Real Invite | US-CT03 | `22-consultant-trial.spec.ts` | Gap |
| Phase 4 | Upgrade to Paid | US-CT05 | `22-consultant-trial.spec.ts` | Gap |
| Phase 4 | Post-Upgrade Orientation | US-CT06 | `22-consultant-trial.spec.ts` | Gap |

---

## Founder Trial Journey Matrix

> **Added (2026-01-22)**: New matrix for founder trial experience.

**Journey Map:** [`founder-trial-journey-map.md`](../user-experience/journeys/trials/founder-trial-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Trial Signup | US-FT01 | `16-quick-start-founder.spec.ts` | Covered |
| Phase 2-3 | Trial Limits | US-FT02 | `13-trial-limits.spec.ts` | Covered |
| Phase 4 | Upgrade to Paid | US-FT03 | `13-trial-limits.spec.ts` | Covered |
| Phase 4 | Post-Upgrade Orientation | US-FT04 | `13-trial-limits.spec.ts` | Gap |

---

## Admin Journey Matrix

> **Added (2026-01-22)**: New matrix for platform administration workflows.

**Journey Map:** [`admin-journey-map.md`](../user-experience/journeys/platform/admin-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Admin Login | US-A11 | `19-admin-user-management.spec.ts` | Gap |
| Phase 1 | User Search | US-A01 | `19-admin-user-management.spec.ts` | Gap |
| Phase 1 | View User Profile | US-A02 | `19-admin-user-management.spec.ts` | Gap |
| Phase 1 | Change User Role | US-A08 | `19-admin-user-management.spec.ts` | Gap |
| Phase 2 | Impersonate User | US-A03 | `19-admin-user-management.spec.ts` | Gap |
| Phase 3 | Retry Failed Workflow | US-A04 | `20-admin-operations.spec.ts` | Gap |
| Phase 3 | View System Health | US-A05 | `20-admin-operations.spec.ts` | Gap |
| Phase 4 | Manage Feature Flags | US-A06 | `20-admin-operations.spec.ts` | Gap |
| Phase 5 | View Audit Logs | US-A07 | `21-admin-audit.spec.ts` | Gap |
| Phase 6 | Export User Data | US-A09 | `21-admin-audit.spec.ts` | Gap |
| Phase 6 | Data Integrity Check | US-A10 | `21-admin-audit.spec.ts` | Gap |
| Phase 6 | Manage Billing Issues | US-A12 | `21-admin-audit.spec.ts` | Gap |

---

## Founder Trial Journey Matrix

> **Added (2026-01-22)**: New matrix for founder trial experience.

**Journey Map:** [`founder-trial-journey-map.md`](../user-experience/journeys/trials/founder-trial-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Trial Signup & Onboarding | US-FT01 | `02-onboarding-flow.spec.ts` | Covered |
| Phase 1 | Quick Start Form | US-FT01 | `16-quick-start-founder.spec.ts` | Covered |
| Phase 2 | View Trial Dashboard | US-FT02 | `13-trial-limits.spec.ts` | Covered |
| Phase 2 | View Trial Limits | US-FT02 | `13-trial-limits.spec.ts` | Covered |
| Phase 3 | Review HITL Checkpoint | US-F03 | `14-hitl-extended.spec.ts` | Covered |
| Phase 4 | Upgrade to Founder | US-FT03 | `13-trial-limits.spec.ts` | Covered |

---

## Support Journey Matrix

> **Added (2026-01-22)**: New matrix for support and GDPR flows.

**Journey Map:** [`support-journey-map.md`](../user-experience/journeys/platform/support-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Access Help Center | US-S02 | `23-support.spec.ts` | Gap |
| Phase 1 | Search Knowledge Base | US-S02 | `23-support.spec.ts` | Gap |
| Phase 2 | Submit Support Request | US-S01 | `23-support.spec.ts` | Gap |
| Phase 3 | Track Support Ticket | US-S03 | `23-support.spec.ts` | Gap |
| Phase 4 | Request Data Export | US-S04 | `23-support.spec.ts` | Gap |
| Phase 5 | Delete Account | US-S05 | `23-support.spec.ts` | Gap |

---

## Offboarding Journey Matrix

> **Added (2026-01-22)**: New matrix for cancellation and churn flows.

**Journey Map:** [`offboarding-journey-map.md`](../user-experience/journeys/platform/offboarding-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Cancel Subscription | US-O01 | `24-offboarding.spec.ts` | Gap |
| Phase 2 | Complete Exit Survey | US-O02 | `24-offboarding.spec.ts` | Gap |
| Phase 3 | View Data Retention | US-O03 | `24-offboarding.spec.ts` | Gap |
| Phase 4 | Reactivate Account | US-O04 | `24-offboarding.spec.ts` | Gap |
| Phase 5 | Win-Back Response | US-O05 | `24-offboarding.spec.ts` | Gap |

---

## Billing Journey Matrix

> **Added (2026-01-22)**: New matrix for payment lifecycle.

**Journey Map:** [`billing-journey-map.md`](../user-experience/journeys/platform/billing-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | View Billing History | US-B01 | `25-billing.spec.ts` | Gap |
| Phase 1 | Download Invoice | US-B02 | `25-billing.spec.ts` | Gap |
| Phase 2 | Update Payment Method | US-B03 | `25-billing.spec.ts` | Gap |
| Phase 3 | Handle Payment Failure | US-B04 | `25-billing.spec.ts` | Gap |
| Phase 3 | Resume After Recovery | US-B10 | `25-billing.spec.ts` | Gap |
| Phase 4 | Change Plan | US-B06 | `25-billing.spec.ts` | Gap |
| Phase 4 | Switch Billing Cycle | US-B09 | `25-billing.spec.ts` | Gap |
| Phase 5 | View Tax Invoice | US-B07 | `25-billing.spec.ts` | Gap |
| Phase 6 | Request Refund | US-B05 | `25-billing.spec.ts` | Gap |
| Phase 6 | Apply Promo Code | US-B08 | `25-billing.spec.ts` | Gap |

---

## Marketing Funnel Journey Matrix

> **Added (2026-01-22)**: New matrix for pre-signup marketing touchpoints. Cross-repo: stories documented in app.startupai.site, implementation in startupai.site.

**Journey Map:** [`founder-journey-map.md`](../user-experience/journeys/founder/founder-journey-map.md) Steps 1-4

| Journey Step | User Story | E2E Test File | Status |
|--------------|------------|---------------|--------|
| Landing Page Value Props | US-MF01 | Cross-repo (marketing site) | Gap |
| Pricing Page | US-MF02 | Cross-repo (marketing site) | Gap |
| Signup Form | US-MF03 | Cross-repo (marketing site) | Gap |

---

## Notification Journey Matrix

> **Added (2026-01-22)**: New matrix for notification delivery.

**Journey Map:** [`notification-journey-map.md`](../user-experience/journeys/platform/notification-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Receive In-App Notification | US-N01 | `26-notifications.spec.ts` | Gap |
| Phase 2 | Receive Email Notification | US-N02 | `26-notifications.spec.ts` | Gap |
| Phase 3 | Manage Preferences | US-N03 | `26-notifications.spec.ts` | Gap |
| Phase 4 | Escalation Alert | US-N04 | `26-notifications.spec.ts` | Gap |
| Phase 5 | Unsubscribe | US-N05 | `26-notifications.spec.ts` | Gap |

---

## Account Settings Journey Matrix

> **Added (2026-01-22)**: New matrix for profile and security.

**Journey Map:** [`account-settings-journey-map.md`](../user-experience/journeys/platform/account-settings-journey-map.md)

| Journey Phase | Journey Step | User Story | E2E Test File | Status |
|---------------|--------------|------------|---------------|--------|
| Phase 1 | Update Profile | US-AS01 | `27-account-settings.spec.ts` | Gap |
| Phase 2 | Change Password | US-AS02 | `27-account-settings.spec.ts` | Gap |
| Phase 3 | Enable 2FA | US-AS03 | `27-account-settings.spec.ts` | Gap |
| Phase 4 | View Login History | US-AS04 | `27-account-settings.spec.ts` | Gap |
| Phase 5 | Manage Devices | US-AS05 | `27-account-settings.spec.ts` | Gap |

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
| `02-onboarding-flow.spec.ts` | 14 | US-F01, US-FT01 | Legacy onboarding (to be updated) |
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
| `13-trial-limits.spec.ts` | 20 | US-FT02, US-FT03 | Trial limits & upgrade |
| `14-hitl-extended.spec.ts` | 24 | US-H01-H09 | Extended HITL checkpoints |
| `15-pivot-workflows.spec.ts` | 22 | US-P01-P04 | Pivot decision workflows |
| `16-quick-start-founder.spec.ts` | 8 | US-F01, US-FT01 | **NEW:** Founder Quick Start flow |
| `17-quick-start-consultant.spec.ts` | 8 | US-C07 | **NEW:** Consultant Quick Start for clients |
| **Total** | **222** | **31 of 82** | See Coverage Statistics below |

---

## Gap Analysis Summary

> **Updated 2026-01-22**: Reflects expanded story count (82 total) with 51 gaps.

### Core Stories Covered (31 of 82)

The original core stories plus HITL and Pivot workflows are fully covered.

#### Core User Stories (US-F, US-C, US-FT)

| Story ID | Title | Test File | Status |
|----------|-------|-----------|--------|
| US-F04 | Archive Project | `11-project-lifecycle.spec.ts` | ✅ Covered |
| US-F05 | Delete Project | `11-project-lifecycle.spec.ts` | ✅ Covered |
| US-C05 | Archive Client | `12-client-lifecycle.spec.ts` | ✅ Covered |
| US-C06 | Resend Client Invite | `12-client-lifecycle.spec.ts` | ✅ Covered |
| US-FT02 | View Trial Limits | `13-trial-limits.spec.ts` | ✅ Covered |
| US-FT03 | Upgrade to Founder | `13-trial-limits.spec.ts` | ✅ Covered |

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

> **Updated 2026-01-22**: Quality audit remediation - added Marketing Funnel, split F08, removed H03.

| Category | Stories | Covered | Gaps | Coverage % |
|----------|---------|---------|------|------------|
| Founder (US-F) | 10 | 10 | 0 | 100% |
| Consultant (US-C) | 7 | 7 | 0 | 100% |
| Founder Trial (US-FT) | 4 | 3 | 1 | 75% |
| Consultant Trial (US-CT) | 6 | 0 | 6 | 0% |
| Admin (US-A) | 12 | 0 | 12 | 0% |
| HITL (US-H) | 8 | 8 | 0 | 100% |
| Pivot (US-P) | 4 | 4 | 0 | 100% |
| Edge Case (US-E) | 6 | 0 | 6 | 0% |
| Support (US-S) | 5 | 0 | 5 | 0% |
| Offboarding (US-O) | 5 | 0 | 5 | 0% |
| Billing (US-B) | 10 | 0 | 10 | 0% |
| Notification (US-N) | 5 | 0 | 5 | 0% |
| Account Settings (US-AS) | 5 | 0 | 5 | 0% |
| Marketing Funnel (US-MF) | 3 | 0 | 3 | 0% |
| **Total** | **90** | **32** | **58** | **36%** |

### New Test Files Needed

| Test File | Stories | Priority |
|-----------|---------|----------|
| `18-edge-cases.spec.ts` | US-E01-E06 | P2 |
| `19-admin-user-management.spec.ts` | US-A01, US-A02, US-A03, US-A08, US-A11 | P1 |
| `20-admin-operations.spec.ts` | US-A04, US-A05, US-A06 | P1 |
| `21-admin-audit.spec.ts` | US-A07, US-A09, US-A10, US-A12 | P2 |
| `22-consultant-trial.spec.ts` | US-CT01-CT06 | P1 |
| `23-support.spec.ts` | US-S01-S05 | P1 |
| `24-offboarding.spec.ts` | US-O01-O05 | P2 |
| `25-billing.spec.ts` | US-B01-B10 | P0 (Critical) |
| `26-notifications.spec.ts` | US-N01-N05 | P2 |
| `27-account-settings.spec.ts` | US-AS01-AS05 | P2 |
| Marketing site tests (cross-repo) | US-MF01-MF03 | P2 |

### Completed Priorities

1. ~~**P0 - Critical:** Founder's Brief and Final Decision (US-H01, US-H09)~~ ✅ DONE
   - Covered in `14-hitl-extended.spec.ts`

2. ~~**P1 - High:** All Phase Gate checkpoints (US-H06, US-H07, US-H08)~~ ✅ DONE
   - Covered in `14-hitl-extended.spec.ts`
   - Note: US-H03 was removed per ADR-006 (Quick Start architecture)

3. ~~**P1 - High:** Pivot flows (US-P01, US-P02)~~ ✅ DONE
   - Covered in `15-pivot-workflows.spec.ts`

4. ~~**High Priority:** Trial limits and upgrade flow (US-FT02, US-FT03)~~ ✅ DONE
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
| [`stories/README.md`](../user-experience/stories/README.md) | Story definitions and acceptance criteria |
| [`strategy.md`](./strategy.md) | Testing strategy and approach |
| [`e2e-guide.md`](./e2e-guide.md) | E2E test implementation guide |
| [`founder-journey-map.md`](../user-experience/journeys/founder/founder-journey-map.md) | Founder journey steps |
| [`founder-trial-journey-map.md`](../user-experience/journeys/trials/founder-trial-journey-map.md) | Founder trial journey |
| [`consultant-journey-map.md`](../user-experience/journeys/consultant/consultant-journey-map.md) | Consultant journey phases |
| [`consultant-trial-journey-map.md`](../user-experience/journeys/trials/consultant-trial-journey-map.md) | Consultant trial journey |
| [`admin-journey-map.md`](../user-experience/journeys/platform/admin-journey-map.md) | Admin journey phases |
| [`support-journey-map.md`](../user-experience/journeys/platform/support-journey-map.md) | Support and GDPR flows |
| [`offboarding-journey-map.md`](../user-experience/journeys/platform/offboarding-journey-map.md) | Cancellation and churn |
| [`billing-journey-map.md`](../user-experience/journeys/platform/billing-journey-map.md) | Payment lifecycle |
| [`notification-journey-map.md`](../user-experience/journeys/platform/notification-journey-map.md) | Notification delivery |
| [`account-settings-journey-map.md`](../user-experience/journeys/platform/account-settings-journey-map.md) | Profile and security |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | **CROSS-CUTTING JOURNEYS**: Added 6 new journey matrices (Founder Trial, Support, Offboarding, Billing, Notification, Account Settings). Added 30 new stories. Coverage dropped to 38% pending 10 new test files. |
| 2026-01-22 | **PERSONA EXPANSION**: Added Admin (10 stories) and Consultant Trial (5 stories) matrices; Renamed Trial to Founder Trial; Coverage dropped from 100% to 60% pending new test files |
| 2026-01-20 | **QUICK START IMPLEMENTATION COMPLETE**: Created `16-quick-start-founder.spec.ts` and `17-quick-start-consultant.spec.ts`. Legacy conversation code deleted. |
| 2026-01-19 | **QUICK START PIVOT**: Multiple tests deprecated (7-stage conversation, session persistence, stage indicators). New tests needed for Quick Start form and `approve_discovery_output` checkpoint. |
| 2026-01-19 | **100% COVERAGE ACHIEVED** - All 31 user stories now have E2E tests |
| 2026-01-19 | Created `11-project-lifecycle.spec.ts` - US-F04, US-F05 covered |
| 2026-01-19 | Created `12-client-lifecycle.spec.ts` - US-C05, US-C06 covered |
| 2026-01-19 | Created `13-trial-limits.spec.ts` - US-FT02, US-FT03 covered |
| 2026-01-19 | Created `15-pivot-workflows.spec.ts` - US-P01 through US-P04 covered |
| 2026-01-19 | Created `14-hitl-extended.spec.ts` - all 9 HITL stories now covered (US-H01-H09) |
| 2026-01-19 | Coverage improved from 42% to 68% (21 of 31 stories) |
| 2026-01-19 | Added HITL Checkpoint Matrix (10 checkpoints) and Pivot Flow Matrix (4 pivots) |
| 2026-01-19 | Updated gap analysis with 13 new stories (US-H01-H09, US-P01-P04) |
| 2026-01-19 | Initial creation - coverage matrix with gap analysis |
