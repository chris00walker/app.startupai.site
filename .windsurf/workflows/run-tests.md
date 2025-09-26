# run-tests

Run all local validations and tests in a consistent, idempotent sequence.

## Description
Execute repository validations (markdown, prompts, OpenAPI, Prisma) and test suites (unit/contract and BDD). This workflow standardizes the local run so CI and developers get the same results.

## Preconditions
- Node.js 20 installed
- Network access to install pnpm packages if needed

## Steps

1) Install dependencies
- Use the terminal to run:
```bash
pnpm install
```

2) Validate docs and contracts
- Use the terminal to run:
```bash
pnpm run docs:validate
```
(Runs markdownlint, prompts validation, OpenAPI lint via @redocly/cli, and Prisma validate.)

3) Run unit & contract tests
- Use the terminal to run:
```bash
pnpm run test
```

4) Run BDD sanity suite
- Use the terminal to run:
```bash
pnpm run bdd
```

5) Optional gates (enable when ready)
- Mutation tests:
```bash
pnpm run test:mutation
```
- Performance smoke:
```bash
pnpm run test:perf
```

## Outputs
- Console output for each stage
- Test summaries

## Notes
- This workflow is idempotent and safe to rerun.
- If any command fails, stop and report the failing stage with the command output.
