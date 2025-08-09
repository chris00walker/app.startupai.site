# Prompt System Constraints (Non‑Negotiables)

These apply to every pack and template.

## Org & Security

- Secrets: never in repo. Use Rumble Cloud Barbican Key Manager (or Vault/OIDC role) for runtime retrieval.
- PII: encrypt at rest (AES‑256). GCP‑only PII. Log redaction enabled.
- Cloud/IaC: rumble.cloud primary; CloudFormation preferred; follow Twelve‑Factor App.
- SBOM & deps: run Snyk/npm audit; no critical vulns.

## Coding & Docs

- Style: ESLint Airbnb/PEP8 as applicable; filenames snake_case; classes PascalCase; vars camelCase.
- Tests: `tests/{unit,integration,e2e}`; BDD specs in `features/` when applicable.
- Docs: update `docs/README.md` and affected guides; diagrams in Mermaid under `docs/architecture/diagrams/*.mmd`.
- Markdown: `npm run lint:md && npm run lint:md:fix` must pass.

## SLOs & Acceptance

- Quality targets per canvas type from evaluator rubrics must be met.
- Latency/cost SLOs observed; breaches trigger Ops responses.
- Client deliverables must be attached: canvases (PDF/PNG + editable), evaluator scores + rationale, engagement brief & assumptions, evidence pack with traceability, iteration log, cost & latency report, risk & compliance summary, actionable next steps. Optional: golden tasks comparison & what‑if variants.

## Git & CI/CD

- Linear history preferred; PR required; protected main.
- CI runs: build → test → security → deploy; include markdownlint and prompts:validate.
