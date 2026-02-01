# StartupAI Product App Work Tracker

**Status**: ~85% Complete (Phase Alpha) | **Last Updated**: 2026-01-31

> **Master Plan**: See [PROJECT-PLAN.md](PROJECT-PLAN.md) for critical path, milestones, and how this work connects to market launch.

---

## Maintenance Rules

> **This file is the SINGLE SOURCE OF TRUTH for work status.**
>
> 1. **Update cadence**: Review every Friday EOD or when sprint changes
> 2. **WIP limit**: Max 5 items in "Current Sprint"
> 3. **Promotion**: Move items from Backlog → Current Sprint when WIP allows
> 4. **Completion**: Move finished items to "Recently Completed", then to done.md after 2 weeks
> 5. **No duplication**: Items appear in ONE section only (never in both backlog and current sprint)

---

## Platform Status

| Metric | Value |
|--------|-------|
| Deployment | Production on Netlify |
| Database | Supabase operational |
| Stories | 187 total, 0 gaps |
| E2E Tests | 47 spec files |
| Unit Tests | 66 test files |

---

## Current Sprint (WIP: 4/5)

| Item | Owner | Status | Assumption | Notes |
|------|-------|--------|------------|-------|
| Apply pending migrations | @supabase | Ready | - | - |
| PostHog Quick Start events | @frontend | Ready | A2 | Quick Start flow tracking |
| PostHog HITL approval events | @frontend | Ready | A1 | Trust signal measurement |
| WTP pricing survey | @product | Ready | A4 | Willingness-to-pay research |

---

## Next Up (Pull when WIP allows)

1. Field-level edit tracking (A3) - Brief accuracy measurement
2. Documentation refresh - 71-day staleness gap
3. Journey-Driven Testing - Derive tests from journey maps
4. Phase 2 Desirability experiments

---

## Recently Completed (Jan 2026)

| Item | Date | Notes |
|------|------|-------|
| Quick Start Architecture (ADR-006) | 2026-01-19 | Replaced 7-stage AI with 30-sec form |
| Two-Pass Architecture (ADR-004) | 2026-01-16 | Deterministic backend assessment |
| Project Archive/Delete | 2026-01-14 | Founder project management |
| Client Archive | 2026-01-14 | Consultant portfolio management |
| Admin Dashboard (Epic 11) | 2026-01-26 | All 12 stories complete (US-A01-A12) |
| Extended Founder Features | 2026-01-26 | US-F12-F16 complete |
| Core Founder Journey | 2026-01-26 | 11 stories complete (US-F01-F10, US-F17) |

---

## Backlog

### P1: Validation-Critical

| Item | Assumption | Phase | Notes |
|------|------------|-------|-------|
| **Epic 5: Template Library** | A5 | 2 | Landing pages, ad creatives, surveys |
| **Epic 6: Agent Tools Integration** | A5 | 2 | Connect ad tools to Phase 2 agents |
| Landing page A/B test | A5 | 2 | VPD messaging resonance |
| IH community launch | A8 | 2 | Channel validation |
| Consultant marketing | A6 | 2-3 | Portfolio value proposition |
| HITL Approval UI data source | A1 | 1 | Trust signal improvement |
| Schema migration: Trial split | - | 0 | `trial` → `founder_trial` + `consultant_trial` |
| Consultant Trial mock client | A6 | 2 | Evaluate before paying $149/mo |
| US-FT03: Stripe upgrade webhook | - | 0 | Blocked by trial split |
| US-FT04: Post-upgrade orientation | - | 0 | Blocked by US-FT03 |

### P2: Platform Quality

| Item | Effort | Notes |
|------|--------|-------|
| Documentation refresh | 8h | 71-day staleness gap |
| Journey-Driven Testing | 2 days | Derive tests from journey maps |
| VPC geometric shapes | 2-3h | Visual polish |
| HITL comment display | 2-4h | Show human_comment in UI |
| E2E tests: Consultant Trial | 1 day | US-CT01-CT05 |
| E2E tests: Edge cases | 1 day | US-E01-E06 |
| E2E tests: Support | 1 day | US-S01-S05 |
| E2E tests: Offboarding | 1 day | US-O01-O05 |
| E2E tests: Billing | 2 days | US-B01-B10 |
| E2E tests: Notifications | 1 day | US-N01-N05 |
| E2E tests: Account Settings | 1 day | US-AS01-AS05 |

### P3: Future Enhancements

| Item | Effort | Notes |
|------|--------|-------|
| US-F11: Manual project wizard | 2-4h | Legacy, Quick Start preferred |
| PDF/PowerPoint export | 3-5 days | External sharing |
| Canvas versioning | 5-7 days | History tracking |
| Multi-segment VPC comparison | 3-5 days | Side-by-side analysis |
| Drag-and-drop VPC fit mapping | 8+h | Interactive UX |
| Internationalisation | TBD | Locale support |

### Blocked (External Dependencies)

| Item | Blocker | Notes |
|------|---------|-------|
| Stripe env vars in Netlify | No Stripe account | Add keys after account setup |
| Ad Platform OAuth | No Meta/Google/TikTok accounts | Need business accounts |
| Ad Spend Monitoring | Blocked by OAuth | Requires connected accounts |
| Ad Platform Health | Blocked by OAuth | Requires live API connections |

---

## Assumption Reference

| ID | Assumption | Phase | Status | Spec |
|----|------------|-------|--------|------|
| A1 | Founders trust AI recommendations | 0-1 | Testing | - |
| A2 | Quick Start converts to engagement | 0 | Testing | - |
| A3 | AI extracts accurate business context | 0-1 | Testing | - |
| A4 | WTP for validation platform | 2-4 | Testing | - |
| A5 | VPD methodology resonates | 2 | Untested | - |
| A6 | Consultants see portfolio value | 2-3 | Untested | - |
| A7 | "AI Founders" messaging attracts | 2 | Untested | - |
| A8 | IH community is right channel | 2 | Untested | - |
| A9 | Portfolio Holders will pay | Future | Gated (A6) | [Vision](../specs/portfolio-holder-vision.md) |
| A10 | Portfolio Holders will mandate usage | Future | Gated (A9) | [Vision](../specs/portfolio-holder-vision.md) |
| A11 | One cohort has most urgent pain | Future | Gated (A6) | [Vision](../specs/portfolio-holder-vision.md) |

---

## Related Documents

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| [PROJECT-PLAN.md](../PROJECT-PLAN.md) | **Critical path, milestones, dependencies** | Weekly |
| [done.md](done.md) | Complete delivery history | When items move from "Recently Completed" |
| [roadmap.md](roadmap.md) | Validation phase progress | Monthly |
| [cross-repo-blockers.md](cross-repo-blockers.md) | Ecosystem dependencies | As needed |
| [README.md](README.md) | Folder purpose and allowed file types | As needed |
| [portfolio-holder-vision.md](../specs/portfolio-holder-vision.md) | Future expansion (A9-A11) | As needed |

**Authoritative ecosystem status**: See [startupai-crew/docs/master-architecture/09-status.md](../../startupai-crew/docs/master-architecture/09-status.md)

---

**Key Focus**: Complete validation infrastructure before scaling.
