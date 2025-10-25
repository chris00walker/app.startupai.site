---
purpose: "Private technical source of truth for rolling implementation status"
status: "active"
last_reviewed: "2025-10-26"
---

# Implementation Status (Rolling)

Master plan reference: `docs/overview/two-site-implementation-plan.md`. Update that file first; this status report summarises the same truth for quick scanning.

## Snapshot - 26 Oct 2025

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Stable | Supabase OAuth + email fallback verified after `handle_new_user` trigger migration. Session guards in App Router redirect unauthenticated access correctly. |
| Onboarding API | Live (mock responses) | `/api/onboarding/{start,message,complete}` persists sessions and briefs. AI replies remain deterministic until CrewAI orchestration is wired in. |
| CrewAI Backend | In progress | Python crew, tools, and Netlify wrapper exist; rate limiting, evidence persistence, and API orchestration remain outstanding (see plan section 2 and `docs/specs/crewai-integration.md`). |
| Database | Healthy | Migrations through `00010` applied (onboarding tables, triggers, `match_evidence`). Onboarding tables still lack Drizzle models. |
| Frontend | In progress | Conversational UI, role routing, and project creation ship. Detail pages for project, hypothesis, evidence, experiment, and report entities, plus CrewAI-backed dashboards, remain open. |
| Accessibility | Blocker | WCAG compliance gaps called out in the plan persist (missing landmarks, skip links coverage outside onboarding, aria for dashboards). |
| Analytics and Testing | In progress | PostHog hooks capture onboarding events; specification-driven tests still reference archived doc paths and need updates once docs settle. Playwright suite refresh pending. |

## Recent Work

- Restored two-site master plan into this repo (`docs/overview/two-site-implementation-plan.md`) and aligned overview/status docs to its truth.
- Supabase onboarding tables (`onboarding_sessions`, `entrepreneur_briefs`) now populated via App Router handlers; project creation auto-links sessions to `projects`.
- CrewAI Python stack lives in `backend/src/startupai` with config-driven agents and tools, plus Netlify wrapper scaffolding.
- Accessibility improvements across onboarding components (skip link, aria labels, voice input fallbacks). Broader dashboard work still required.

## Focus for Next Sprint

1. Finish CrewAI hand-off: stabilise `/.netlify/functions/crew-analyze`, persist evidence via Supabase functions, and trigger it from `POST /api/onboarding/complete`.
2. Add Drizzle models for onboarding tables and update API routes to use shared repositories instead of ad-hoc Supabase queries.
3. Update specification-driven and Playwright tests to reference the new doc paths, then expand coverage for the conversation flow and accessibility assertions.
4. Deliver critical accessibility fixes highlighted in the plan (global landmarks, dashboard aria, keyboard traps) and re-run WCAG compliance checks.

## Risks & Mitigations

- **CrewAI integration slip** - Continue shipping deterministic copy but set expectations in release notes. Track progress in the plan and keep the feature flag disabled until evidence persistence is live.
- **Data model drift** - Without Drizzle models for onboarding tables, type mismatches can sneak in. Prioritise model generation and include them in CI type-checks.
- **PII exposure when CrewAI goes live** - Implement masking rules before prompts leave Supabase. Reference `docs/archive/legacy/retention-and-pii.md` and add automated tests.
- **Rate limiting gaps** - Netlify function currently skips rate-limit enforcement. Bring the helper online before exposing to users to prevent abuse.
- **Accessibility regressions** - Areas outside the onboarding wizard still fail WCAG checks. Budget time each sprint to close high-severity items from the plan's launch checklist.

Historical audits and completion reports live in [`docs/archive/completion-reports/`](../archive/completion-reports/).
