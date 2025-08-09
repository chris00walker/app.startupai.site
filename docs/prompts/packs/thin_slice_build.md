# Thin Slice Build (Code-Generating Pack)

ROLE: Principal Platform Engineer (Non-interactive, Deterministic)

## Inputs (Canonical)

- OpenAPI: `docs/architecture/20-contracts/openapi-gateway.yaml`
- Prisma schema: `docs/engineering/30-data/prisma-schema.prisma`
- Module map: `docs/engineering/20-system/module-boundaries.md`
- Observability baseline: `docs/engineering/20-system/observability.md`

Rules:

- Reuse canonical sources; do not duplicate.
- If information is missing, mark "Assumption:" and emit an ADR note in `docs/engineering/90-governance/release-process.md`.

## Constraints

- Node 20.x, Express, Prisma ≥ 5.x
- GCP-native: Cloud Run, Cloud SQL Postgres (+pgvector), Secret Manager, Monitoring
- OTEL + Prometheus per `docs/engineering/20-system/observability.md`
- Security: No Mongo, no secrets in code; Docker non-root & read-only FS

## Outputs (Exact Paths)

- `backend/server/routes/*` (OpenAPI-derived stubs + validation middleware)
- `backend/server/health.js` (200 OK health)
- `backend/prisma/schema.prisma` or reuse existing schema path
- `backend/prisma/migrations/*` (initial migration)
- `tests/contract/*.test.js` (API/port contract tests)
- `tests/unit/*.test.js` (domain unit tests)
- `.github/workflows/validate-tests.yml` (already present; ensure jobs cover unit/contract/BDD)
- Updated `docker-compose.yaml` (local Postgres) and `scripts/deploy-production.sh` if needed

## Steps (Idempotent)

1) Validate OpenAPI and Prisma inputs; fail fast if missing.
2) Generate server stubs from OpenAPI into `backend/server/routes/*` (no-op if present). Add schema validation middleware.
3) Initialize Prisma in backend (if not already), generate client, and create the initial migration from the provided schema.
4) Implement `/api/health` route with 200 OK.
5) Implement one domain endpoint from OpenAPI that uses Prisma to read/write Postgres.
6) Wire OTEL metrics and expose `/metrics` (Prometheus format).
7) Update `docker-compose.yaml` to run backend + Postgres locally with `DATABASE_URL` env.
8) Add tests: API health smoke + one domain test. Keep fast and deterministic.
9) Emit a "Changed files" summary and "First-run" commands.

## Validation (Must Pass)

- OpenAPI lint: `npm run docs:openapi:lint`
- Prisma check (once Prisma is installed): `npx prisma validate && npx prisma migrate diff --from-empty --to-schema-file docs/engineering/30-data/prisma-schema.prisma`
- Unit + contract tests: `npm test`
- Health endpoint: `curl http://localhost:3000/api/health` returns 200

## Acceptance Criteria

- `/api/health` returns 200
- One domain endpoint returns a valid response using Postgres via Prisma
- OpenAPI lint passes; Prisma validate/diff passes; unit/API smoke tests pass
- No `mongoose` or `MONGODB_URI`; backend uses Prisma with `DATABASE_URL`
- OTEL metrics endpoint is exposed

## Output Format (STRICT)

1) List of changed files with exact paths.
2) Diff-style blocks for each file created/modified.
3) Commands to run locally and in CI.
4) Any assumptions and ADR notes appended.
