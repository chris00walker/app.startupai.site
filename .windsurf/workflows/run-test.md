---
description: Run repository validations and tests locally in a consistent, idempotent sequence: install deps, validate docs/prompts/OpenAPI/Prisma, run unit+contract tests, then BDD. Stops on first failure and surfaces command output.
---

# run-tests

Run all local validations and tests in a consistent, idempotent sequence.

## Preconditions
- Node.js 20 installed
- Internet access for pnpm install (first run)
- Project root contains scripts: `docs:validate`, `test`, `bdd`

## What this workflow does
1. Installs dependencies deterministically
2. Validates documentation and contracts
3. Runs unit and contract tests
4. Runs a lightweight BDD sanity suite
5. Stops immediately on failure and reports the failing stage

## Steps

1) Install dependencies
- Use the terminal to run:
```bash
pnpm install
```