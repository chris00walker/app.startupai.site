# docs/work/ - Work Tracking Only

**Purpose**: Track work items, sprints, and delivery history for the Product App.

---

## Allowed Files

| File | Purpose |
|------|---------|
| `PROJECT-PLAN.md` | **Master plan**: critical path, milestones, engineering + validation work |
| `WORK.md` | Single source of truth: current sprint, backlog, assumptions |
| `done.md` | Completion history (items moved from WORK.md after 2 weeks) |
| `roadmap.md` | Validation phase milestones and progress |
| `cross-repo-blockers.md` | Dependencies with startupai-crew and startupai.site |
| `archive/` | Historical snapshots of work tracking files |

---

## What Does NOT Belong Here

| Doc Type | Correct Location | Example |
|----------|------------------|---------|
| Design artifacts | `docs/design/` | Figma specs, design tokens, workflow guides |
| Technical specs | `docs/specs/` | API specs, schema docs, architecture decisions |
| Feature specs | `docs/features/` | Feature requirements and acceptance criteria |
| Test documentation | `docs/testing/` | Test strategies, E2E guides |
| User experience | `docs/user-experience/` | Journey maps, personas, user stories |
| Governance docs | `docs/` (root) | Team structure, operating procedures |

---

## Maintenance Rules

From `WORK.md`:

1. **Update cadence**: Review every Friday EOD or when sprint changes
2. **WIP limit**: Max 5 items in "Current Sprint"
3. **Promotion**: Move items from Backlog → Current Sprint when WIP allows
4. **Completion**: Move finished items to "Recently Completed", then to done.md after 2 weeks
5. **No duplication**: Items appear in ONE section only

---

**Last Updated**: 2026-01-31
