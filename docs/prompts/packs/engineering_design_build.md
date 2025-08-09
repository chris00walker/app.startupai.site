# Engineering Design-Build Prompt Pack

ROLE: Principal Platform Engineer & SRE Lead (Design‑Build Mode ON)

INPUTS (attach exact files)

- [Build Plan](../../engineering/build_plan.md)
- [Engineering Implementation](../../engineering/implementation.md)
- [Docker & Deployment](../../engineering/deployment/docker.md)
- [Release Notes v1.4.0](../../engineering/releases/v1.4.0.md)
- [Architecture](../../ARCHITECTURE.md)
- [OpenAPI Gateway](../../architecture/20-contracts/openapi-gateway.yaml)  # canonical, reuse not duplicate
- [Prompt Constraints](../constraints.md)

CONTEXT
We have an approved architecture (Hexagonal Modular Monolith on GCP: Cloud Run services, Cloud SQL Postgres + pgvector, Renderer, Orchestrator, Policy Router, Evaluators). Engineering must produce a build‑ready, testable, operable system aligned to SLO/cost targets and the security posture (Docker + release notes). Use Node.js 20.x LTS, npm, Prisma ≥5.x, PlantUML/Markdown lint in CI. Do not introduce MongoDB. Secrets via GCP Secret Manager.

OBJECTIVE

Refactor and finalize the engineering documentation into a single, coherent Engineering Plan Set with:

- Runnable thin‑slice
- CI/CD with quality gates
- Infra config for Cloud Run + local docker‑compose
- Testing harnesses (unit/integration/e2e/load/security)
- Operations playbooks

Everything must be deterministic and pass validation gates.

HARD CONSTRAINTS & NON‑FUNCTIONALS

- Datastore: Cloud SQL Postgres + pgvector; ORM/migrations via Prisma; schema/migrations included.
- Runtime: Node.js 20.x LTS/TypeScript; Express gateway; Headless Chromium renderer; OpenTelemetry SDK.
- Platform: GCP (Cloud Run, Cloud SQL, Pub/Sub or Cloud Tasks, Secret Manager, Cloud Monitoring/APM).
- Security: Docker non‑root, read‑only FS, drop caps, health checks; secrets from env/Secret Manager; image SBOM.
- SLOs: API p95 ≤ 3s; DB avg < 100ms; render p95 ≤ 8s; end‑to‑end canvas ≤ 30s.
- Cost: ≤ $2 per complete canvas; budgets & breakers; alert thresholds defined.
- Observability: OTel traces/logs/metrics; Prometheus metrics endpoint; APM provider toggles (env based).
- Delivery: Blue‑Green/feature‑flag rollouts; safe migrations with rollback.

OUTPUT: FILE CONTRACT (produce these exact files, fully written—no stubs)

```md
docs/engineering/
  00-overview.md
  10-requirements/
    non-functionals.md
    security-posture.md
    slos-and-budgets.md
  20-system/
    module-boundaries.md
    service-interfaces.md
    error-handling-and-retries.md
    observability.md
  30-data/
    prisma-schema.prisma
    migrations/README.md
    retention-and-pii.md
  40-api/
    openapi-gateway.md            # Document reuse of canonical spec at ../architecture/20-contracts/openapi-gateway.yaml
    contract-tests.md
  50-infra/
    docker/Dockerfile
    docker/docker-compose.yaml
    cloud-run/deploy.md
    cloud-run/env.example
    secrets-management.md
    OPTIONAL-terraform/           # if confident; else cover manual steps explicitly
  60-ci-cd/
    github-actions.sample.yml     # documented copy (runnable lives in .github/workflows/)
    quality-gates.yml             # coverage, mutation (optional), lint, SAST, SBOM, deps scan
  70-testing/
    test-strategy.md
    unit-harness.md
    integration-harness.md
    e2e-harness.md
    load-test-k6.md               # or Artillery
    security-testing.md           # ZAP/Snyk/TruffleHog
  80-operations/
    runbooks.md
    monitoring-dashboards.md
    alerting-rules.md
    incident-response.md
    backup-and-restore.md
  90-governance/
    coding-standards.md
    codeowners.md
    release-process.md
    migration-guide.md
```

DESIGN-BUILD ADDITIONS (REQUIRED)

1) Executable Preliminary Build (thin‑slice):
   - Commands to run: intake → orchestrator stub → Postgres write/read → renderer stub → PDF.
   - Cloud Run deploy: gcloud commands, CPU/mem, concurrency, Chromium flags (--no-sandbox --disable-dev-shm-usage --single-process), health checks.
   - Local docker‑compose equivalent with Postgres + services; health endpoints documented.

2) Spike Matrix (≤5 spikes, 4–8h each):
   - pgvector recall@k & query timing; renderer stability on Cloud Run; provider/model cost/latency; policy‑router fallbacks; PII boundary tests.
   - For each: Goal, Hypothesis, Success metric, Steps, Fixtures, Output artefacts, Decision unlocked (ADR reference).

3) CBOM + Unit Economics + Traffic Model:
   - Resource list + assumptions; cost/artefact at 100/1k/10k; SLO fit; two value‑engineering options per bottleneck.

4) Constructability Checklist:
   - PASS/REVISE with file/line references; fixes and ADR updates; update “changed_files” ledger.

CANONICAL SOURCES TO REUSE & NORMALIZE (do not contradict)

- Postgres + pgvector migration and stack selections from implementation.md.
- Docker hardening, non‑root, read‑only fs, health checks from docker.md; include sample healthcheck + security settings.
- Monitoring/APM choices, DB indexes, env vars, migration steps from v1.4.0.md.
- SLO & rollout strategy from build_plan.md and release notes.
- OpenAPI spec: reuse ../architecture/20-contracts/openapi-gateway.yaml (no duplicates).

REQUIRED CONTENT & SPECIFICS

- security-posture.md: Non‑root user, read‑only fs, dropped capabilities, tmpfs mounts, rate‑limit envs; sample compose security block.
- slos-and-budgets.md: Tabulate SLOs (API p95, query times, render p95, E2E), budgets (per artefact, monthly caps), breaker actions & alerts.
- module-boundaries.md: Hexagonal decomposition and ports/DTOs: Gateway, Orchestrator, Policy Router, Evaluators, Renderer, Adapters.
- service-interfaces.md: TypeScript interfaces (OrchestrationPort, EvaluationPort, RenderPort, PolicyPort), error taxonomy, idempotency.
- observability.md: OTel spans/logs/metrics; Prometheus paths; APM provider toggles; alert cooldown.
- prisma-schema.prisma: Client, Canvas, Artefact, RouterDecision with indexes; example pgvector usage.
- deploy.md: gcloud run deploy commands; mem/CPU, concurrency; healthcheck endpoints; rollout & verify steps.
- github-actions.sample.yml: stages for lint, typecheck, unit, integration (Postgres service), e2e (Playwright), load (k6/Artillery), SAST, TruffleHog, SBOM, deps scan, docker build, deploy; coverage ≥ 90%.
- test harnesses: mock OpenAI/Vertex; deterministic fixtures; performance budgets; cost assertions.
- runbooks.md: deploy/rollback, hotfix, incident triage, cost breaker, DB failover, backup/restore.

ACCEPTANCE CRITERIA (STAGE‑GATES)

- Completeness: Every file above exists with actionable content; thin‑slice runs locally & on Cloud Run.
- Consistency: SLOs/APM endpoints match release notes; Docker security matches posture.
- Buildability: docker‑compose up works; Cloud Run deploy precise; health checks pass; migrations run.
- Testability: Contract/unit/integration/E2E/load/security plans present with commands & sample specs; CI gates defined and green.
- Operability: Dashboards & alerts defined; runbooks cover incidents; backup/restore documented.
- Cost Governance: Unit economics present; breaker actions wired; thresholds defined.
- Determinism: markdownlint, prompts validate, OpenAPI lint pass; diagrams compile in CI; changed_files ledger updated.

OUTPUT FORMAT (STRICT)

1) A code‑fenced file tree of /engineering.

2) The FULL content of each file (use fenced code blocks with language identifiers: md, yaml, ts, prisma, sql, dockerfile).

3) A short self‑audit: Blocking vs non‑blocking issues; assumptions + ADR notes.

4) “First‑Run” commands for the thin‑slice (local & Cloud Run), health/APM endpoints.

5) CI: emit a runnable workflow under .github/workflows/ and place a documented copy under /engineering/60-ci-cd/.

IF INFO IS MISSING

- Make the minimum reasonable assumption, label it “Assumption” in the file, and append an ADR note in /engineering/90-governance/release-process.md.
