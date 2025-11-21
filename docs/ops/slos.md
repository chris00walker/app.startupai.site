---
purpose: "Private technical source of truth for SLOs and non-functional targets"
status: "active"
last_reviewed: "2025-10-25"
---

# SLOs & Non-Functional Targets

| Service / Capability | Target | Measurement | Instrumentation |
| --- | --- | --- | --- |
| Auth redirect success | 99.9% success / rolling 30d | Completed OAuth redirect / total auth attempts | Supabase auth logs + PostHog `auth_redirect_success` event from `frontend/src/lib/analytics` |
| Onboarding API latency | p95 < 1.8s | `POST /api/onboarding/message` end-to-end duration | App Router timing middleware + PostHog timer event (`api_call` hook) |
| Onboarding completion rate | > 65% of started sessions | Sessions marked `status = 'completed'` / sessions started per week | Supabase query + PostHog funnel (stage events) |
| CrewAI workflow SLA | 95% < 6 min once enabled | Time between workflow enqueue and evidence persist | TODO: Netlify function logging + Supabase job table (planned) |
| Dashboard SSR | p95 < 400ms | Time to First Byte for `app/(authenticated)/projects/*` | Next.js instrumentation (custom report via analytics hooks) |
| Core Web Vitals | LCP < 2.2s, INP < 200ms, CLS < 0.1 | Lighthouse CI + Web Vitals events (`frontend/src/lib/analytics/hooks.ts`) | Netlify build step + PostHog Web Vitals capture |

## Operational Notes

- App Router endpoints export timing data via the analytics hooks; ensure new handlers keep calling `trackEvent('api_call', ...)` so latency dashboards stay accurate.
- Trial usage counters enforce rate limits. Alerting will hook into Supabase functions once we add a cron to flag users nearing plan limits.
- CrewAI SLA is forward-looking. Until the Netlify function writes results we log mock execution time but do not alert. Instrument real durations before GA.

## Non-Functional Goals

- **Accessibility**: follow WCAG 2.1 AA. Voice input has a screen-reader fallback, skip links are present on `onboarding/page.tsx`, and components emit aria labels for progress states.
- **Reliability**: Supabase triggers keep `updated_at` columns accurate. Add health checks for `match_evidence` once CrewAI leverages vector search.
- **Privacy**: PII stays inside Supabase. Prior to CrewAI rollout, implement prompt sanitisation (see TODO in `specs/crewai-integration.md`).
- **Observability**: Logging is centralised via Netlify function stdout + Supabase logs. PostHog captures user-visible issues; augment with structured logs once CrewAI integration is live.

Open follow-ups:
- Add automated report that joins `onboarding_sessions` with PostHog completion events to track funnel health.
- Implement alerting for Supabase function failures (especially `create_onboarding_session` and `upsert_entrepreneur_brief`).
- Wire CrewAI job telemetry into the status dashboard before exposing it to users.
