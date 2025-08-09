# Backend v2 (Greenfield) – Hexagonal, Contract‑First

This directory hosts the greenfield backend aligned with:

- OpenAPI gateway: `docs/architecture/20-contracts/openapi-gateway.yaml`
- Prisma schema: `docs/engineering/30-data/prisma-schema.prisma`
- Module boundaries: `docs/engineering/20-system/module-boundaries.md`
- Observability: `docs/engineering/20-system/observability.md`

## Layout (target)

```
backend/
  server/
    index.ts
    routes/               # generated from OpenAPI + validation
  app/
    ports/                # OrchestrationPort, PolicyPort, RenderPort, etc.
    services/             # domain services (pure logic)
  adapters/
    prisma/               # Postgres access via Prisma
    providers/            # external provider adapters (OpenAI/Vertex, etc.)
  observability/
    otel.ts
    metrics.ts            # /metrics (Prometheus)
  prisma/
    schema.prisma         # or reuse canonical schema via path
    migrations/
```

## Thin Slice scope

- `/api/health` returns 200.
- One domain endpoint wired to Postgres via Prisma.
- OTEL metrics endpoint exposed.
- Validated by CI: OpenAPI lint, Prisma validate, unit + contract tests, BDD smoke.

## Notes

- No `mongoose` or `MONGODB_URI`. Use `DATABASE_URL` with Prisma.
- Follow Prompt Design Standard: `docs/prompts/standards/prompt_design_standard.md`.
- See ADR‑003 for the archive/salvage decision.
