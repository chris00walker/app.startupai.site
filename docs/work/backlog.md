# Backlog

Prioritized by validation impact. Items testing assumptions rank higher.

## Priority Key

- **P1**: Tests a key assumption or unblocks validation
- **P2**: Improves user experience or platform quality
- **P3**: Future enhancement, nice to have

## P1: Validation-Critical

| Item | Assumption | Phase | Notes |
|------|------------|-------|-------|
| Landing page A/B test | A5 | 2 | VPD messaging resonance |
| IH community launch | A8 | 2 | Channel validation |
| Consultant marketing | A6 | 2-3 | Portfolio value proposition |
| Field-level edit tracking | A3 | 0-1 | Brief accuracy measurement |
| HITL Approval UI data source | A1 | 1 | Trust signal improvement |
| **Schema migration: Trial split** | - | 0 | `trial` → `founder_trial` + `consultant_trial` in users.ts |
| **Consultant Trial mock client system** | A6 | 2 | Lets consultants evaluate before paying $149/mo |
| **Admin user search & impersonation** | - | 1 | Support team can debug user issues without engineering |

## P2: Platform Quality

| Item | Effort | Notes |
|------|--------|-------|
| Documentation refresh | 8h | 71-day staleness gap |
| Journey-Driven Testing | 2 days | Derive tests from journey maps |
| PostHog Quick Start + HITL events | 4h | Add events for new Quick Start flow (48 types defined, 100+ calls exist) |
| VPC geometric shapes | 2-3h | Visual polish |
| HITL comment display | 2-4h | Show human_comment in UI |
| **Admin UI: Health dashboard** | 1 day | `/admin/health` - Modal/Supabase status, error rate |
| **Admin UI: Feature flags** | 1 day | `/admin/features` - Enable/disable per user or globally |
| **Admin UI: Audit logs** | 1 day | `/admin/audit` - All admin actions logged and viewable |
| **E2E tests: Admin stories (US-A01-A10)** | 2 days | 4 test files created as stubs |
| **E2E tests: Consultant Trial (US-CT01-CT05)** | 1 day | 1 test file created as stub |
| **E2E tests: Edge cases (US-E01-E06)** | 1 day | Interrupted Quick Start, timeouts, etc. |
| **E2E tests: Support (US-S01-S05)** | 1 day | `23-support.spec.ts` stub created |
| **E2E tests: Offboarding (US-O01-O05)** | 1 day | `24-offboarding.spec.ts` stub created |
| **E2E tests: Billing (US-B01-B10)** | 2 days | `25-billing.spec.ts` stub created |
| **E2E tests: Notifications (US-N01-N05)** | 1 day | `26-notifications.spec.ts` stub created |
| **E2E tests: Account Settings (US-AS01-AS05)** | 1 day | `27-account-settings.spec.ts` stub created |

## P3: Future Enhancements

| Item | Effort | Notes |
|------|--------|-------|
| PDF/PowerPoint export | 3-5 days | External sharing |
| Canvas versioning | 5-7 days | History tracking |
| Multi-segment VPC comparison | 3-5 days | Side-by-side analysis |
| Drag-and-drop VPC fit mapping | 8+h | Interactive UX |
| Internationalisation | TBD | Locale support |
| **Admin: User data export** | 2 days | GDPR compliance, support debugging |
| **Admin: Data integrity checks** | 2 days | Automated validation of user data consistency |
| **Admin: Workflow retry UI** | 1 day | Re-trigger failed CrewAI jobs without engineering |

## Completed (Move to done.md)

Items here have been delivered but not yet moved to done.md:

- ~~Quick Start Architecture~~ → Moved 2026-01-21
- ~~Two-Pass Architecture~~ → Moved 2026-01-21

## Triage Rules

1. **Does it test an assumption?** → P1
2. **Does it unblock a validation phase?** → P1
3. **Does it improve quality without testing assumptions?** → P2
4. **Is it a "nice to have" with no validation impact?** → P3

Review weekly. Promote to in-progress.md when starting work.

---

**Last Updated**: 2026-01-22
