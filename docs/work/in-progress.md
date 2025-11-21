---
purpose: "Private technical source of truth for active work"
status: "active"
last_reviewed: "2025-11-21"
---

# In Progress

| Item | Owner | Tracking | Notes |
| --- | --- | --- | --- |
| CrewAI Netlify integration | @ai-platform | GitHub PR #412 + follow-up task | Stabilise `/.netlify/functions/crew-analyze`, hook evidence persistence, expose health metrics before enabling in production. |
| Onboarding data modelling | @platform-eng | GH Issue #189 | Add Drizzle models + repositories for onboarding tables, update API tests, and refactor type usage in components. |
| Specification-driven test refresh | @qa-lead | GH Issue #189 (shared) | Update fixtures to reference new doc paths, expand Playwright journeys for accessibility assertions. |
| PostHog instrumentation hardening | @ops | GH Issue #175 | Ensure analytics hooks emit consistent event schemas, backfill dashboards for onboarding funnel, document alert thresholds. |
| Accessibility polish (voice + keyboard) | @design-systems | GitHub Project: Accessibility Improvements | Audit onboarding voice controls, ensure skip links and aria labels satisfy WCAG 2.1 AA. |

## Blocked Items

| Item | Owner | Blocked By | Notes |
| --- | --- | --- | --- |
| Results display UI | @platform-eng | CrewAI Phase 1 | Dashboard to show analysis results. Requires CrewAI outputs persisted to Supabase. See `cross-repo-blockers.md` |
