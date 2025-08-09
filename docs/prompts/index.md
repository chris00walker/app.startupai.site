# Prompt Packs (AI-executable)

Use these packs to run deterministic, gated work with an AI partner. Each pack defines inputs, outputs, Definition of Done, acceptance criteria, constraints, and a concrete plan.

- What to read first:
  - Constraints: [constraints.md](constraints.md)
  - Mode: [modes/design_build.md](modes/design_build.md)
  - Templates: [templates/](templates/)
  - Packs: [packs/](packs/)

## Diagram skeletons

- C4 Context: `docs/architecture/diagrams/c4_context.mmd`
- C4 Container: `docs/architecture/diagrams/c4_container.mmd`
- C4 Components (Orchestrator): `docs/architecture/diagrams/c4_components_orchestrator.mmd`
- Domain Context Map: `docs/architecture/diagrams/domain_context_map.mmd`
- Thin-Slice Sequence: `docs/architecture/diagrams/thin_slice_sequence.mmd`

## How to use

1. Pick a pack in `packs/` that matches the task.
2. Review front‑matter YAML to understand objectives, DoD, and acceptance gates.
3. Execute the "plan" steps exactly; produce the listed outputs and changed files.
4. Verify acceptance:
   - Rubrics: `docs/evaluation/rubrics.md`
   - SLOs: `docs/operations/operations.md`
   - Client deliverables: `docs/product/decision_pack.md`
5. Validate:
   - npm run prompts:validate
   - npm run lint:md && npm run lint:md:fix

## RACI

- AI: executes packs end‑to‑end, writes code/tests/docs, runs checks.
- Human: selects packs, tunes thresholds, reviews diffs/PRs, approves releases.
