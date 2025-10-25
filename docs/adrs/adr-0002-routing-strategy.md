---
purpose: "Private ADR for routing consolidation strategy"
status: "active"
last_reviewed: "2025-10-25"
---

# ADR-0002: Routing Strategy

## Context

We inherited both Pages Router and App Router code paths. Maintaining both increased bundle size and complicated authentication checks.

## Decision

- Consolidate on App Router for all authenticated experiences.
- Maintain a single `middleware.ts` responsible for Supabase token refresh.
- Serve public exports via JSON rather than legacy Pages Router endpoints; fallbacks captured in [`ops/router-consolidation.md`](../ops/router-consolidation.md).

## Consequences

- ✅ Simplifies data fetching (Server Components, RSC caching).
- ✅ Provides consistent auth + layout handling.
- ⚠️ Requires marketing to update any hard-coded legacy endpoints (tracked in [`public-interfaces/marketing-contracts.md`](../public-interfaces/marketing-contracts.md)).
- ⚠️ All future features must align with component conventions in [`specs/frontend-components.md`](../specs/frontend-components.md).

Revisit only if Next.js introduces incompatible breaking changes.
