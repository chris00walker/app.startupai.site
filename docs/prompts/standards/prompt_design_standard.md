# Prompt Design Standard (Deterministic Code-Generating Prompts)

This standard defines the required structure for prompts that must drive deterministic code and CI outcomes. Keep it short, enforceable, and idempotent.

## 1) Inputs (Canonical, Versioned)

List exact file paths and versions; these are the only sources of truth.

- OpenAPI: `docs/architecture/20-contracts/openapi-gateway.yaml`
- Prisma schema: `docs/engineering/30-data/prisma-schema.prisma`
- Module map: `docs/engineering/20-system/module-boundaries.md`
- Optional: Policy DSL `docs/architecture/20-contracts/policy-dsl.yaml`

Rules:
- Do not duplicate canonical artifacts; reference them.
- If information is missing, state an "Assumption:" inline and emit an ADR note.

## 2) Constraints (Hard and Non‑negotiable)

- Runtime: Node.js 20.x
- Frameworks: Express, Prisma ≥5.x
- Cloud: GCP (Cloud Run, Cloud SQL Postgres + pgvector, Secret Manager, Monitoring)
- Observability: OTEL + Prometheus per `docs/engineering/20-system/observability.md`
- Security: No Mongo; no secrets in code; Docker non‑root & read‑only FS

## 3) Outputs (Exact Paths, No Stubs)

Enumerate files to create/modify including full relative paths. Examples:

- `backend/server/routes/*.ts` (OpenAPI‑derived stubs + validation)
- `backend/prisma/schema.prisma` (if relocating) and migrations
- `tests/{unit,contract,integration}/...`
- `.github/workflows/*.yml` (if adding CI)

Each output must include a brief purpose and acceptance criteria.

## 4) Steps (Idempotent, Non‑interactive)

- Generate server stubs from OpenAPI
- Initialize Prisma, generate client, create initial migration
- Implement health + one domain endpoint
- Wire OTEL metrics; expose `/metrics`
- Update docker‑compose (local Postgres) and Cloud Run deploy script (if applicable)

Rules:
- Safe to rerun; re-generations must not corrupt previous state
- Do not rely on manual approvals mid‑flow

## 5) Validation (Must Pass)

Prompts must declare the exact commands to verify correctness:

- `npm run docs:openapi:lint`
- `npm run docs:prisma:validate`
- `npm test` (unit + contract)
- `curl http://localhost:3000/api/health` returns 200

## 6) Acceptance Criteria (Thin Slice)

- `/api/health` returns 200
- One domain endpoint hits Postgres via Prisma and returns a valid response
- OpenAPI lint passes; Prisma validate passes; unit/API smoke tests pass
- No `mongoose` or `MONGODB_URI` anywhere; Prisma is used with `DATABASE_URL`

## 7) Determinism

- Pin tool versions (devDependencies)
- Forbid arbitrary network unless explicitly listed under Inputs
- Require a dry‑run outline before file writes (when applicable)

---

Use this file as the contract for any new code‑generating prompts under `docs/prompts/packs/`.
