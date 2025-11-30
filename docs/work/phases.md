---
purpose: "Private technical source of truth for current engineering phases"
status: "active"
last_reviewed: "2025-11-30"
---

# Engineering Phases

## Phase Alpha - CrewAI Delivery & Onboarding Hardening (Active - 85%)

**Completed:**
- ✅ CrewAI webhook persists structured outputs to Supabase
- ✅ CrewAI Report Viewer displays validation results
- ✅ Evidence Explorer with D-F-V metrics
- ✅ VPC Strategyzer canvas with animated fit lines
- ✅ PostHog instrumentation (~12 events across user journey)
- ✅ Public APIs for marketing (Activity Feed + Metrics)
- ✅ Accessibility foundation (WCAG 2.1 AA - 70%)
- ✅ E2E test infrastructure fixed

**Remaining:**
- Dashboard integration with remaining mock data
- PostHog coverage gaps (13+ events not implemented)
- Screen reader polish

**Status**: CrewAI Phase 2D complete (~85%), 18 tools implemented

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
