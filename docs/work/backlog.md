---
purpose: "Private technical source of truth for backlog references"
status: "active"
last_reviewed: "2025-10-25"
---

# Backlog

| Item | Tracking | Notes |
| --- | --- | --- |
| CrewAI persistence and deliverable schema | GitHub Project: App Platform Roadmap (column: Backlog) | Finalise `crew_analysis_runs` + evidence append pipeline so Netlify workers can store structured outputs. |
| Drizzle support for onboarding tables | GH Issue #189 (spec-testing follow-up) | Generate models for `onboarding_sessions`/`entrepreneur_briefs`, refactor API routes to repositories, add type-safe mocks. |
| Accessibility & localisation sweep | GitHub Project: Accessibility Improvements | Translate onboarding copy for localisation, audit voice input fallbacks, expand automated WCAG tests. |
| Rate limiting & plan telemetry | GH Issue #175 | Build scheduled job to aggregate `trial_usage_counters`, expose alerts in ops dashboard. |
| Dashboard MVP (post-onboarding insights) | GitHub Project: Evidence Ledger | Surface entrepreneur brief, validation plan, and evidence snapshots on `/projects/[id]`. Depends on CrewAI data. |
| Marketing contract parity automation | GH Issue (TBD) | Keep spec-driven tests aligned with marketing promises; automate checks against `docs/public-interfaces/marketing-contracts.md`. |

Backlog triage happens weekly with platform + AI platform leads. Update this table after sprint planning so docs and GitHub stay aligned.
