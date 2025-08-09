# Behavior-Driven Development (BDD) in this repo

BDD is a collaboration/specification practice that connects business intent to executable checks. It is not an architecture style.

- Business intent → scenarios in ubiquitous language (Gherkin)
- Architecture contracts → OpenAPI operations, policy DSL, module boundaries
- Engineering → acceptance tests, contract tests, CI stage-gates

## Where things live

- Features (Gherkin): `features/`
  - Example: `features/platform/export_canvas.feature`
- Step definitions: `tests/e2e/steps/`
- Test support (hooks, world): `tests/e2e/support/`
- Contracts:
  - OpenAPI: `docs/architecture/20-contracts/openapi-gateway.yaml`
  - Policy DSL: `docs/architecture/20-contracts/policy-dsl.yaml`

## Running BDD locally

- Default (skip work-in-progress):

  ```bash
  npm run bdd
  ```

- Include WIP scenarios:

  ```bash
  npm run bdd:wip
  ```

## CI gating (incremental)

- Add a job that runs `npm run bdd` for tagged thin-slice scenarios once endpoints exist.
- Keep scenarios tagged with `@wip` until the implementation is ready.

## Mapping scenarios → system

- Each feature scenario should reference corresponding OpenAPI `operationId` and data setup via Prisma (post-migration).
- Steps perform real HTTP calls to the backend and assert responses using OpenAPI schemas.
- Optional: store evidence (logs/artifacts) under `docs/evaluation/`.

## Notes

- Keep scenarios precise and stable; prefer examples over adjectives.
- Pin tool versions in devDependencies for determinism.
