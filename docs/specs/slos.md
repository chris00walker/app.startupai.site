---
purpose: "Private technical source of truth for SLOs and non-functional targets"
status: "active"
last_reviewed: "2026-01-19"
---

# SLOs & Non-Functional Targets

## Current SLO Targets

| Service / Capability | Target | Measurement | Status |
| --- | --- | --- | --- |
| Auth redirect success | 99.9% / rolling 30d | OAuth callback success rate | Tracked via `user_login`, `signup_completed` events |
| Onboarding API latency | p95 < 1.8s | `/api/chat/stream` + `/api/chat/save` duration | Analytics `api_call` event (when instrumented) |
| Onboarding completion rate | > 65% of started | Sessions with `status = 'completed'` / started | `onboarding_completed` event + Supabase query |
| CrewAI workflow SLA | 95% < 6 min | Time from kickoff to results persist | Planned - not yet instrumented |
| Dashboard SSR | p95 < 400ms | TTFB for `/projects/*`, `/project/*` | Planned - not yet instrumented |
| Core Web Vitals | LCP < 2.2s, INP < 200ms, CLS < 0.1 | Lighthouse CI | Planned - not yet instrumented |

## VPD Phase SLOs (Initial Targets)

Phase-level SLOs define timeliness and completeness expectations for the validation pipeline. These are **initial targets** and remain **planned** until instrumentation is wired to `validation_runs` timestamps and CrewAI event tracking.

| Phase | Target | Measurement | Status |
| --- | --- | --- | --- |
| Phase 0 Onboarding | Brief draft p95 < 3 min | Kickoff → `entrepreneur_briefs` persisted | Planned - not yet instrumented |
| Phase 1 VPC Discovery | VPC draft p95 < 6 min; ≥5 hypotheses | Kickoff → VPC + hypotheses saved | Planned - not yet instrumented |
| Phase 2 Desirability | Test-card pack p95 < 10 min; deploy success > 95% | Kickoff → test cards + deploy result | Planned - not yet instrumented |
| Phase 3 Feasibility | Feasibility report p95 < 12 min; risk register present | Kickoff → feasibility report persisted | Planned - not yet instrumented |
| Phase 4 Viability | Viability brief p95 < 12 min; unit economics summary present | Kickoff → viability brief persisted | Planned - not yet instrumented |

## Instrumentation Status

### Implemented

| Metric | Implementation |
|--------|----------------|
| Page views | `trackPageView()` in `lib/analytics` |
| User identification | `identifyUser()` on login |
| API calls | `useAPITracking()` hook (manual) |
| Auth events | `trackAuthEvent.login()`, `.logout()`, `.signupStarted()`, `.signupCompleted()` |
| Onboarding events | `trackOnboardingEvent` with session/stage tracking |
| CrewAI events | `trackCrewAIEvent.started()`, `.completed()`, `.failed()` |
| Error tracking | `trackError()` for caught exceptions |
| Performance timing | `usePerformanceTracking()` hook |

### Not Yet Implemented

| Metric | Notes |
|--------|-------|
| Web Vitals capture | Need to add `web-vitals` package + PostHog integration |
| Server-side timing | Need Next.js instrumentation for SSR metrics |
| CrewAI job duration | Need Modal webhook timestamps |
| Automated alerting | Need Supabase function monitoring |

## Analytics Architecture

### Provider: PostHog

```typescript
// Configuration in lib/analytics/index.ts
{
  posthog: {
    apiKey: NEXT_PUBLIC_POSTHOG_KEY,
    apiHost: NEXT_PUBLIC_POSTHOG_HOST
  }
}
```

### Key Event Categories

| Category | Events |
|----------|--------|
| `authentication` | `user_login`, `user_logout`, `signup_started`, `signup_completed` |
| `onboarding` | `onboarding_session_started`, `onboarding_stage_advanced`, `onboarding_message_sent`, `onboarding_completed`, `onboarding_exited_early` |
| `ai_workflow` | `crewai_analysis_started`, `crewai_analysis_completed`, `crewai_analysis_failed` |
| `project_management` | `project_created`, `project_updated`, `project_deleted`, `project_viewed` |
| `ui_interaction` | `button_clicked`, `form_submitted`, `modal_opened`, `search_performed` |
| `engagement` | `time_on_page`, `scroll_depth` |

### Hooks for Component Tracking

```typescript
// Available in lib/analytics/hooks.ts
usePageTracking()        // Auto page views on route change
useUserIdentification()  // Auto identify on auth
usePerformanceTracking() // Measure component lifecycle
useAPITracking()         // Track API call timing
useErrorTracking()       // Track component errors
useTimeOnPage()          // Track engagement
```

## Non-Functional Goals

### Accessibility (WCAG 2.1 AA)

- **Skip links**: Present on `app/onboarding/page.tsx`
- **ARIA labels**: Progress states in onboarding components
- **Screen reader support**: Chat interface has appropriate roles
- **Status**: Partial implementation, full audit pending

### Reliability

- **Database triggers**: `set_updated_at_timestamp` maintains data consistency
- **RPC functions**: Atomic operations for multi-table updates
- **Vector search**: `match_evidence()` function for similarity queries

### Privacy

- **PII storage**: Stays inside Supabase with RLS enforcement
- **Analytics consent**: Managed via `setAnalyticsConsent()` function
- **Event queuing**: Events queue until consent given

### Observability

- **Client-side**: PostHog for user-visible metrics
- **Server-side**: Netlify function logs via stdout
- **Database**: Supabase logs for auth operations

## Operational Notes

- Analytics hooks require manual integration in components; not auto-captured
- PostHog `autocapture` is disabled for privacy; use explicit `trackEvent()` calls
- Trial usage limits enforced via `trial_usage_counters` table

## Open Tasks

- [ ] Add `web-vitals` package and PostHog integration
- [ ] Instrument server-side timing via Next.js instrumentation
- [ ] Add CrewAI job duration tracking in webhook handler
- [ ] Implement Supabase function failure alerting
- [ ] Add automated SLO dashboard in PostHog
- [ ] Complete accessibility audit

---

## Related Documentation

- **Analytics Implementation**: `frontend/src/lib/analytics/`
- **Onboarding API**: [api-onboarding.md](api-onboarding.md)
- **CrewAI Integration**: [api-crewai.md](api-crewai.md)
- **Accessibility Standards**: [accessibility-standards.md](accessibility-standards.md)
