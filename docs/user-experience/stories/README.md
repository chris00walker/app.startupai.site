---
purpose: "User story guidelines, coverage summaries, and references"
status: "active"
last_reviewed: "2026-01-22"
---

# User Stories

**Status:** Active
**Personas Reference:** [`user-personas.md`](../personas/README.md)

This document contains all user stories for the StartupAI platform. Each story includes acceptance criteria in Given/When/Then format and maps to E2E tests for verification.

---

## Story Format

```
### US-[X]##: Story Title

**As a** [Role],
**I want to** [Action],
**So that** [Business Value].

**Acceptance Criteria:**

**Given** [precondition]
**When** [action]
**Then** [expected result]

**E2E Test:** `file.spec.ts` - "test description"
**Journey Reference:** `journey-map.md` - Step/Phase X
```

---

## Coverage Summary

> **Updated 2026-01-22**: Quality audit remediation - 89 stories after US-F08 split, US-H03 removal, and new stories.

### Stories by Category

| Category | Story IDs | Total | With E2E Tests | Gaps |
|----------|-----------|-------|----------------|------|
| Founder | US-F01-F10 | 10 | 10 | 0 |
| Consultant | US-C01-C07 | 7 | 7 | 0 |
| Founder Trial | US-FT01-FT04 | 4 | 4 | 0 |
| Consultant Trial | US-CT01-CT06 | 6 | 0 | 6 |
| HITL Checkpoint | US-H01-H02, H04-H09 | 8 | 8 | 0 |
| Pivot Flow | US-P01-P04 | 4 | 4 | 0 |
| Edge Cases | US-E01-E06 | 6 | 0 | 6 |
| Admin | US-A01-A11 | 11 | 0 | 11 |
| Support | US-S01-S05 | 5 | 0 | 5 |
| Offboarding | US-O01-O05 | 5 | 0 | 5 |
| Billing | US-B01-B10 | 10 | 0 | 10 |
| Notification | US-N01-N05 | 5 | 0 | 5 |
| Account Settings | US-AS01-AS05 | 5 | 0 | 5 |
| Marketing Funnel | US-MF01-MF03 | 3 | 0 | 3 |
| **Total** | | **89** | **33** | **56** |

### E2E Test File Mapping

| Test File | Stories Covered |
|-----------|-----------------|
| `00-smoke.spec.ts` | Infrastructure (no stories) |
| `01-login.spec.ts` | Authentication (cross-cutting) |
| `02-onboarding-flow.spec.ts` | US-F01, US-F08, US-FT01 |
| `03-founder-attribution.spec.ts` | US-F02 (attribution aspect) |
| `04-founder-analysis-journey.spec.ts` | US-F02, US-F06 |
| `05-hitl-approval-flow.spec.ts` | US-F03, US-H01-H09 |
| `06-consultant-portfolio.spec.ts` | US-C03, US-C04 |
| `07-adr005-persistence.spec.ts` | US-F07 |
| `08-ui-indicators.spec.ts` | US-F01 (UI indicators) |
| `09-consultant-practice-setup.spec.ts` | US-C01 |
| `10-consultant-client-onboarding.spec.ts` | US-C02, US-C07 |
| `11-project-lifecycle.spec.ts` | US-F04, US-F05 |
| `12-client-lifecycle.spec.ts` | US-C05, US-C06 |
| `13-trial-limits.spec.ts` | US-FT02, US-FT03 |
| `14-hitl-extended.spec.ts` | US-H01-H09 |
| `15-pivot-workflows.spec.ts` | US-P01-P04 |
| `16-quick-start-founder.spec.ts` | US-F01, US-FT01 |
| `17-quick-start-consultant.spec.ts` | US-C07 |

### Gap Analysis (51 Stories Need Implementation)

Stories with test stubs created but not yet implemented:

| Category | Story IDs | Test File | Priority |
|----------|-----------|-----------|----------|
| Consultant Trial | US-CT01-CT05 | `22-consultant-trial.spec.ts` | High |
| Edge Cases | US-E01-E06 | `18-edge-cases.spec.ts` | Medium |
| Admin | US-A01-A10 | `19-21-admin-*.spec.ts` | High |
| Support | US-S01-S05 | `23-support.spec.ts` | High |
| Offboarding | US-O01-O05 | `24-offboarding.spec.ts` | Medium |
| Billing | US-B01-B10 | `25-billing.spec.ts` | Critical |
| Notification | US-N01-N05 | `26-notifications.spec.ts` | High |
| Account Settings | US-AS01-AS05 | `27-account-settings.spec.ts` | Medium |

---

## Updated Coverage Summary

> **Updated 2026-01-22**: Quality audit remediation - added US-MF, US-A11, US-FT04, US-CT06, split US-F08, removed US-H03.

### Stories by Category

| Category | Total Stories | With E2E Tests | Gaps |
|----------|---------------|----------------|------|
| Founder (US-F) | 10 | 10 | 0 |
| Consultant (US-C) | 7 | 7 | 0 |
| Founder Trial (US-FT) | 4 | 4 | 0 |
| Consultant Trial (US-CT) | 6 | 0 | 6 |
| Admin (US-A) | 11 | 0 | 11 |
| HITL Checkpoint (US-H) | 8 | 8 | 0 |
| Pivot Flow (US-P) | 4 | 4 | 0 |
| Edge Case (US-E) | 6 | 0 | 6 |
| Support (US-S) | 5 | 0 | 5 |
| Offboarding (US-O) | 5 | 0 | 5 |
| Billing (US-B) | 10 | 0 | 10 |
| Notification (US-N) | 5 | 0 | 5 |
| Account Settings (US-AS) | 5 | 0 | 5 |
| Marketing Funnel (US-MF) | 3 | 0 | 3 |
| **Total** | **89** | **33** | **56** |

### HITL Story Priority

| Story ID | Description | Priority | Blocking |
|----------|-------------|----------|----------|
| US-H01 | Review Discovery Output (Brief + VPC) | P0 | Phase 1 continuation |
| US-H02 | Approve Experiment Plan | P1 | Experiments |
| US-H04 | Approve Campaign Launch | P1 | Ads go live |
| US-H05 | Approve Budget Increase | P2 | Budget control |
| US-H06 | Review Desirability Gate | P1 | Phase 3 start |
| US-H07 | Review Feasibility Gate | P1 | Phase 4 start |
| US-H08 | Review Viability Gate | P1 | Final decision |
| US-H09 | Make Final Decision | P0 | Validation complete |

### Edge Case Story Priority

| Story ID | Description | Priority | Impact |
|----------|-------------|----------|--------|
| US-E01 | Recover from Interrupted Quick Start | P1 | User retention |
| US-E02 | Handle Concurrent Project Creation | P2 | Data integrity |
| US-E03 | Handle Invalid or Malformed Input | P1 | Security, UX |
| US-E04 | Handle Phase 1 Timeout | P1 | User confidence |
| US-E05 | Handle HITL Checkpoint Expiry | P2 | Workflow continuity |
| US-E06 | Consultant Handles Client Unlink | P3 | Relationship management |

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| [`user-personas.md`](../personas/README.md) | Role definitions for each story |
| [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) | Founder journey steps |
| [`founder-trial-journey-map.md`](../journeys/trials/founder-trial-journey-map.md) | Founder trial journey |
| [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) | Consultant journey phases |
| [`consultant-trial-journey-map.md`](../journeys/trials/consultant-trial-journey-map.md) | Consultant trial journey |
| [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) | Admin journey phases |
| [`support-journey-map.md`](../journeys/platform/support-journey-map.md) | Support and GDPR flows |
| [`offboarding-journey-map.md`](../journeys/platform/offboarding-journey-map.md) | Cancellation and churn flows |
| [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) | Payment lifecycle |
| [`notification-journey-map.md`](../journeys/platform/notification-journey-map.md) | Notification delivery |
| [`account-settings-journey-map.md`](../journeys/platform/account-settings-journey-map.md) | Profile and security |
| [`journey-test-matrix.md`](../../testing/journey-test-matrix.md) | Test coverage matrix |
| [`project-client-management.md`](../../features/project-client-management.md) | Archive/delete feature specs |
| [`consultant-client-system.md`](../../features/consultant-client-system.md) | Invite system specs |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | **Quality Audit Remediation:** P0: Fixed US-O03 retention timeline (30+60 days), US-O05 win-back emails (7/30/60/90 days), US-B04 dunning (6 stages), US-B05 refund tiers (4 tiers + US-S05 clarification), US-B07 tax registries (VIES/HMRC/ABN), US-N04 escalation (6 stages). P1: Added US-MF01-03 marketing funnel, US-A11 admin login, US-FT04/CT06 post-upgrade, enhanced US-B03 backup payment. P2: Split US-F08→F08/F09/F10, replaced faceless "User" with "any authenticated user" in US-N/AS/S sections, defined US-AS04 suspicious login criteria. Removed US-H03 reference from journey-test-matrix.md. Total stories now 89. |
| 2026-01-22 | **Major Expansion:** Added 30 new stories across 5 categories: Support (US-S01-S05), Offboarding (US-O01-O05), Billing (US-B01-B10), Notification (US-N01-N05), Account Settings (US-AS01-AS05). Total stories now 82. |
| 2026-01-22 | **Major Update:** Added 10 Admin stories (US-A01-A10), 5 Consultant Trial stories (US-CT01-CT05); Renamed Trial to Founder Trial (US-T → US-FT) |
| 2026-01-21 | Enhanced US-F08 with detailed UI criteria; added 6 edge case stories (US-E01-E06) |
| 2026-01-20 | Updated for Quick Start (ADR-006): Replaced US-F07/F08 with Quick Start stories, updated US-C01/C07, removed US-H03 |
| 2026-01-19 | Added 13 HITL/Pivot stories (US-H01-H09, US-P01-P04) derived from phase-transitions.md and hitl-approval-ui.md |
| 2026-01-19 | Initial creation - consolidated 18 user stories with acceptance criteria |
