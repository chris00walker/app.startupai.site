# ADR-003: Backend Greenfield v2; Frontend Salvage & Refactor

- Status: Accepted
- Date: 2025-08-08

## Context
- The legacy backend (`backend/`) is tightly coupled to Mongo/Mongoose and ad-hoc route shapes.
- Target architecture is ML/AI-first, GCP-native, with Postgres/Prisma, OpenAPI-driven gateway, OTEL/Prometheus, and hexagonal ports/adapters.
- Canonical machine-readable sources exist: `docs/architecture/20-contracts/openapi-gateway.yaml`, `docs/engineering/30-data/prisma-schema.prisma`, and `docs/engineering/20-system/module-boundaries.md`.
- We require deterministic, idempotent prompt packs and CI validation.

## Decision
- Archive legacy backend as `backend_legacy/` and implement a greenfield backend v2 under `backend/` aligned with the canonical contracts and Prisma.
- Salvage the frontend: keep Next.js/TypeScript structure; replace `src/services/api.ts` with a typed client generated from the OpenAPI spec and refactor usage incrementally.

## Consequences
- Faster convergence to contract-first, observable, and secure runtime.
- Minimal risk of carrying over brittle Mongo/Mongoose patterns.
- Clear migration seam: frontend can be switched to backend v2 via feature flag while we iterate.

## Implementation Notes
- Non-destructive move: `git mv backend backend_legacy`.
- Backend v2 layout (hexagonal):
  - `backend/server/routes/*` (generated from OpenAPI + validation)
  - `backend/app/ports/*`, `backend/app/services/*`
  - `backend/adapters/prisma/*`
  - `backend/observability/*` (OTEL + metrics)
- No `mongoose` or `MONGODB_URI`; use `DATABASE_URL` with Prisma.
- BDD/TDD: thin-slice covers `/api/health` and one domain endpoint backed by Postgres.

## Rollback
- Revert the move: `git mv backend_legacy backend` and revert commits.

## Related
- Prompt Standard: `docs/prompts/standards/prompt_design_standard.md`
- Thin Slice Pack: `docs/prompts/packs/thin_slice_build.md`
