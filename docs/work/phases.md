---
purpose: "Private technical source of truth for current engineering phases"
status: "active"
last_reviewed: "2026-01-12"
---

# Engineering Phases

## Phase Alpha - CrewAI Delivery & Onboarding Hardening (Active - 92%)

**Completed:**
- ✅ CrewAI webhook persists structured outputs to Supabase
- ✅ CrewAI Report Viewer displays validation results
- ✅ Evidence Explorer with D-F-V metrics
- ✅ VPC Strategyzer canvas with animated fit lines
- ✅ PostHog instrumentation (~12 events across user journey)
- ✅ Public APIs for marketing (Activity Feed + Metrics)
- ✅ Accessibility foundation (WCAG 2.1 AA - 70%)
- ✅ E2E test infrastructure fixed
- ✅ Dogfooding methodology enshrined (2026-01-12)
- ✅ Founder dashboard verified (login, projects, approvals)
- ✅ Consultant dashboard verified (login, clients, client projects)
- ✅ RLS policy for consultants viewing client projects
- ✅ HITL approval flow working (Phase 0-1 approvals tested)
- ✅ Evidence summary display in approval detail modal
- ✅ API routes hardened (approvals list/detail, webhook, onboarding complete)
- ✅ Build verification passed (production build succeeds)

**Remaining:**
- PostHog coverage gaps (13+ events not implemented)
- Screen reader polish
- Phase 2 desirability testing (landing pages, experiments)

**Status**: Phase 0-1 HITL verified, Founder + Consultant journeys working, API routes hardened (~92%)

## Phase Beta - Evidence Ledger & Insight Dashboards (Queued)
- Expose evidence search (pgvector) and validation experiment tracking inside the app.
- Publish project overview dashboard combining Supabase data, CrewAI deliverables, and analytics metrics.
- Implement rate-limit telemetry and alerting for trial tiers.
- Dependencies: Phase Alpha completion, Drizzle models for onboarding tables.

## Phase GA - Multi-Workspace & Advisor Tooling (Planned)
- Support consultants managing multiple founder workspaces with role-based routing.
- Deliver shareable reports (PDF/Markdown) generated from CrewAI outputs.
- Integrate billing + plan upgrades across marketing and application sites.
- Requires: CrewAI reliability SLOs, workspace schema extensions, marketing alignment.
