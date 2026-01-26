# Backlog

Prioritized by validation impact. Items testing assumptions rank higher.

## Priority Key

- **P1**: Tests a key assumption or unblocks validation
- **P2**: Improves user experience or platform quality
- **P3**: Future enhancement, nice to have

## P1: Validation-Critical

| Item | Assumption | Phase | Notes |
|------|------------|-------|-------|
| **Epic 5: Template Library** | A5 | 2 | Landing pages, ad creatives, surveys for agent workflows |
| **Epic 6: Agent Tools Integration** | A5 | 2 | Connect ad tools to Phase 2 desirability agents |
| Landing page A/B test | A5 | 2 | VPD messaging resonance |
| IH community launch | A8 | 2 | Channel validation |
| Consultant marketing | A6 | 2-3 | Portfolio value proposition |
| Field-level edit tracking | A3 | 0-1 | Brief accuracy measurement |
| HITL Approval UI data source | A1 | 1 | Trust signal improvement |
| **Schema migration: Trial split** | - | 0 | `trial` → `founder_trial` + `consultant_trial` in users.ts |
| **Consultant Trial mock client system** | A6 | 2 | Lets consultants evaluate before paying $149/mo |
| **US-FT03: Stripe upgrade webhook** | - | 0 | Handle checkout.session.completed, update role (blocked by trial split) |
| **US-FT04: Post-upgrade orientation** | - | 0 | Welcome modal, email, badge update (blocked by US-FT03) |

## P2: Platform Quality

| Item | Effort | Notes |
|------|--------|-------|
| Documentation refresh | 8h | 71-day staleness gap |
| Journey-Driven Testing | 2 days | Derive tests from journey maps |
| PostHog Quick Start + HITL events | 4h | Add events for new Quick Start flow |
| VPC geometric shapes | 2-3h | Visual polish |
| HITL comment display | 2-4h | Show human_comment in UI |
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
| **US-F11: Manual project wizard** | 2-4h | Legacy wizard, low priority (Quick Start preferred) |
| PDF/PowerPoint export | 3-5 days | External sharing |
| Canvas versioning | 5-7 days | History tracking |
| Multi-segment VPC comparison | 3-5 days | Side-by-side analysis |
| Drag-and-drop VPC fit mapping | 8+h | Interactive UX |
| Internationalisation | TBD | Locale support |

## Blocked

Items that cannot proceed until external dependencies are resolved.

| Item | Stories | Blocker | Notes |
|------|---------|---------|-------|
| **Stripe env vars in Netlify** | US-FT03 | No Stripe account | Add `STRIPE_SECRET_KEY` to Netlify after account setup |
| **Ad Platform OAuth Integration** | US-AM01, US-AM02, US-AM03 | No Meta/Google/TikTok API accounts | Need business accounts with ad platforms |
| **Ad Spend Monitoring** | US-AM04, US-AM05 | Blocked by OAuth | Requires connected ad accounts |
| **Ad Platform Health & Errors** | US-AM06, US-AM07 | Blocked by OAuth | Requires live API connections |

## Completed (Move to done.md)

Items here have been delivered but not yet moved to done.md:

- ~~Quick Start Architecture~~ → Moved 2026-01-21
- ~~Two-Pass Architecture~~ → Moved 2026-01-21
- **Admin Dashboard (Epic 11)** - All 12 stories complete (US-A01-A12)
  - User search & impersonation (US-A01, US-A03)
  - Health dashboard (US-A05)
  - Feature flags (US-A06)
  - Audit logs (US-A07)
  - User data export (US-A09)
  - Data integrity checks (US-A10)
  - Workflow retry UI (US-A04)
  - Billing management (US-A12)
- **E2E tests: Admin stories (US-A01-A12)** - 3 test files with real tests
- **Core Founder Journey** - 11 stories complete (US-F01-F10, US-F17)
  - Quick Start onboarding (US-F01)
  - Dashboard view (US-F02)
  - HITL checkpoints (US-F03)
  - Project archive/delete (US-F04, US-F05)
  - AI analysis results (US-F06)
  - Quick Start hints (US-F07)
  - Phase progress (US-F08, US-F09, US-F10)
  - Hypotheses management (US-F17)
- **Founder Trial basics** - 2 stories complete (US-FT01, US-FT02)
- **Extended Founder Features** - 5 stories complete (US-F12-F16) → Added 2026-01-26
  - Assumption Map with Strategyzer integration (US-F12)
  - Evidence Ledger with fit type filters (US-F13)
  - Evidence Explorer with timeline view (US-F14)
  - Gate Evaluation Dashboard (US-F15)
  - AI Insights feature (US-F16)
- **E2E tests: Founder features** - 4 test files (US-F12, US-F13, US-F14, US-F15, US-F16) → Added 2026-01-26

## Triage Rules

1. **Does it test an assumption?** → P1
2. **Does it unblock a validation phase?** → P1
3. **Does it improve quality without testing assumptions?** → P2
4. **Is it a "nice to have" with no validation impact?** → P3

Review weekly. Promote to in-progress.md when starting work.

---

**Last Updated**: 2026-01-26
