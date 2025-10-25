---
purpose: "Private technical source of truth for architecture diagrams"
status: "active"
last_reviewed: "2025-10-26"
---

# Architecture

This diagram accompanies the canonical plan (`docs/overview/two-site-implementation-plan.md`). Update the plan first, then keep this view in sync.

```
Marketing Next.js (startupai.site)
        |  CTA with plan param
        v
Signup & Auth (Supabase OAuth + PKCE)
        |  sets session cookie
        v
Application Next.js (App Router)
        |  /api/onboarding/* routes persist to Supabase
        |
        |--> Supabase Postgres + Functions (onboarding_sessions, entrepreneur_briefs, evidence)
        |      |
        |      `--> pgvector + match_evidence() for CrewAI evidence lookup
        |
        `--> Netlify Functions / Python CrewAI (planned)
               | writes reports + evidence back via service role
               v
Dashboards & Reports (Next.js pages + PostHog analytics)
```

## System Flow

1. Marketing pages capture plan context and hand off to `/signup`. Authentication completes via Supabase (`frontend/src/app/auth` routes) and drops users into the application App Router scope.
2. The onboarding wizard lives entirely inside the App Router (`/onboarding`). API handlers under `frontend/src/app/api/onboarding/*` handle session creation, message processing, and completion. All state mutates `onboarding_sessions` and `entrepreneur_briefs` in Supabase.
3. Once CrewAI is connected, `POST /api/onboarding/complete` will enqueue a Netlify function (`/.netlify/functions/crew-analyze`) that loads the Python crew (`backend/src/startupai/crew.py`) and writes structured evidence and recommendations back into Supabase.
4. Dashboards and future advisor views consume Supabase data via server components. Analytics events are pushed to PostHog through `frontend/src/lib/analytics` so we can monitor the funnel end-to-end.

## Shared Services

- **Supabase Auth and Database**: single Postgres instance powers auth, onboarding, evidence ledger, and rate limiting.
- **Netlify**: hosts serverless functions today (CrewAI placeholder, gate evaluation). Also manages environment variables for backend workloads.
- **PostHog**: marketing and product analytics share the same workspace. Event capture happens in client components; runbooks live in the private marketing repo.
- **CrewAI Python Backend**: currently manual/CLI only. Will move behind Netlify once rate-limiting and evidence persistence are production ready.

## Known Risks

- CrewAI orchestration is still decoupled. The Netlify function needs completion before we can claim end-to-end AI deliverables.
- Onboarding APIs write directly to Supabase with service-role credentials; ensure rotated keys propagate to Netlify and Next.js before expiry.
- pgvector search is only available via the stored procedure today. We lack app-side usage, so future dashboard experiences must call the function via Supabase RPC.
- Accessibility and performance budgets rely on shared components; regressions often originate from new wizard features. Track LCP/INP via Lighthouse automation during CI and follow blockers in the plan.

Refer to ADRs in [`docs/adrs`](../adrs) for historical architecture decisions.
