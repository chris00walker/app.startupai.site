---
purpose: "Private technical source of truth for rolling implementation status"
status: "active"
last_reviewed: "2025-10-27"
---

# Implementation Status (Rolling)

Master plan reference: `../startupai.site/docs/technical/two-site-implementation-plan.md` (lives in marketing repo). Update that file first; this status report summarises the same truth for quick scanning.

## Snapshot - 27 Oct 2025

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | Stable | Supabase OAuth + email fallback verified after `handle_new_user` trigger migration. Session guards in App Router redirect unauthenticated access correctly. |
| Onboarding API | Live (CrewAI connected) | `/api/onboarding/{start,message,complete}` persists sessions and briefs. `POST /api/onboarding/complete` now forwards to `/api/analyze`, enforces plan limits, waits for CrewAI, and stores reports/evidence. Message replies remain deterministic until streaming is enabled. |
| CrewAI Backend | Connected (v1) | Python crew runs via Netlify with JWT auth + rate limiting. Structured payload returns to Next.js for persistence. Conversation hand-off & masking remain open items (see plan section 2 and `docs/specs/crewai-integration.md`). |
| Database | Healthy | Migrations through `00010` applied (onboarding tables, triggers, `match_evidence`). Onboarding tables still lack Drizzle models. |
| Frontend | In progress | Conversational UI, role routing, and project creation ship. Onboarding completion & project wizard now surface CrewAI deliverables; detail pages for project, hypothesis, evidence, experiment, and report entities remain open. |
| Accessibility | Blocker | Onboarding wizard now aligns with refreshed WCAG spec, but broader dashboard landmarks/skip links/ARIA gaps from the plan still need resolution. |
| Analytics and Testing | In progress | PostHog hooks capture onboarding events; specification-driven tests still reference archived doc paths and need updates once docs settle. Playwright suite refresh pending. |

## Recent Work

- Restored two-site master plan into marketing repo (`../startupai.site/docs/technical/two-site-implementation-plan.md`) and aligned overview/status docs to its truth.
- Completed `/api/analyze` App Router handler: enforces plan/trial limits, proxies the Netlify function, and persists CrewAI reports/evidence/brief updates via service-role Supabase.
- Hardened `netlify/functions/crew-analyze.py`: active rate limiting, structured payload, and normalized insight/evidence scaffolding for downstream persistence.
- Updated onboarding completion + project wizard flows to call `/api/analyze`, show progress/error states, and surface CrewAI summaries on project gate dashboards.
- Accessibility improvements across onboarding components (skip link, aria labels, voice input fallbacks). Broader dashboard work still required.
- Synced WCAG compliance spec with the refreshed onboarding layout and captured the linting deferral in `docs/archive/status/linting.md`.

## Focus for Next Sprint

1. Extend CrewAI into the live conversation (`/api/onboarding/message`): replace deterministic replies with streamed Crew output and reconcile guardrails (typing indicators, retries).
2. Generate Drizzle models for onboarding tables and refactor API routes to use shared repositories instead of ad-hoc Supabase calls (critical for type safety + reusability).
3. Refresh specification-driven + Playwright tests for the new `/api/analyze` contract and CrewAI deliverable surfaces; add regression coverage for plan limit enforcement.
4. Deliver critical accessibility fixes highlighted in the plan (global landmarks, dashboard aria, keyboard traps) and re-run WCAG compliance checks.

## Risks & Mitigations

- **CrewAI quality & masking** - CrewAI now runs end-to-end; ensure prompt masking and QA pipelines land before exposing sensitive projects. Reference `docs/archive/legacy/retention-and-pii.md` and add automated redaction tests.
- **Data model drift** - Without Drizzle models for onboarding tables, type mismatches can sneak in. Prioritise model generation and include them in CI type-checks.
- **PII exposure when CrewAI goes live** - Implement masking rules before prompts leave Supabase. Reference `docs/archive/legacy/retention-and-pii.md` and add automated tests.
- **Rate limiting coverage** - Netlify-side limiter protects individual users but does not yet cover distributed workloads. Evaluate Redis/Supabase Functions for shared counters before public launch.
- **Accessibility regressions** - Areas outside the onboarding wizard still fail WCAG checks. Budget time each sprint to close high-severity items from the plan's launch checklist.

Historical audits and completion reports live in [`docs/archive/completion-reports/`](../archive/completion-reports/).
