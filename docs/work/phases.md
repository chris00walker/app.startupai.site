---
purpose: "Private technical source of truth for current engineering phases"
status: "active"
last_reviewed: "2025-11-21"
---

# Engineering Phases

## Phase Alpha - CrewAI Delivery & Onboarding Hardening (Active)
- Enable Netlify CrewAI workflow and persist structured outputs (entrepreneur brief, validation plan, evidence summary).
- Backfill dashboards with onboarding-derived data, including brief quality scores and recommended next steps.
- Tighten analytics + accessibility budgets (voice controls, keyboard flows, screen reader polish).
- Owners: Platform Engineering (lead), AI Platform (crew orchestration), Design Systems (accessibility).

**Blocked by**: CrewAI Phase 1 completion (see `cross-repo-blockers.md`)
- Results display UI requires CrewAI outputs persisted to Supabase
- See `startupai-crew/docs/work/phases.md` for Phase 1 completion criteria

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
