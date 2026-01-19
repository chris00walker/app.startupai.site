---
purpose: "Private ADR documenting the two-site architecture decision"
status: "active"
last_reviewed: "2025-10-25"
---

# ADR-0001: Two-Site Architecture

## Context

Marketing needed rapid iteration on landing experiences while the application team built authenticated AI workflows. Mixing concerns in a single Next.js app created merge conflicts, longer build times, and complicated auth flows.

## Decision

We split the system into:

- `startupai.site` for public marketing, deployed independently on Netlify.
- `app.startupai.site` for the authenticated product, sharing only public APIs and Supabase resources.

Session hand-off occurs via shared Supabase project and environment variables. Marketing CTAs link to app routes with plan identifiers.

## Consequences

- ✅ Independent deploy cadence and observability per site.
- ✅ Reduced blast radius when experimenting with marketing copy.
- ⚠️ Requires careful contract management (documented in [`public-interfaces/`](../public-interfaces/)).
- ⚠️ Shared Supabase project demands strict RLS and environment hygiene.

Future changes to this decision must update marketing contracts and onboarding flows.
