---
purpose: "Index for feature specifications"
status: "active"
last_reviewed: "2026-01-19"
---

# Feature Specifications

Product feature documentation for the StartupAI product platform. These documents describe **what things do**.

## Feature Registry

| Document | Purpose |
|----------|---------|
| [feature-inventory.md](feature-inventory.md) | Exhaustive code-derived inventory of all features |
| [wiring-matrix.md](wiring-matrix.md) | UI -> Hook -> API -> Data wiring status |
| [ui-entrypoints.md](ui-entrypoints.md) | Navigation structure and page map |

## Feature Specifications

| Document | Purpose |
|----------|---------|
| [consultant-client-system.md](consultant-client-system.md) | Consultant-client relationship features |
| [project-client-management.md](project-client-management.md) | Project archive/delete, client management |
| [stage-progression.md](stage-progression.md) | Onboarding stage progression logic |

## Templates

| Document | Purpose |
|----------|---------|
| [feature-template.md](feature-template.md) | Template for documenting new features |

## Status Legend

Used in `feature-inventory.md` and `wiring-matrix.md`:

| Status | Meaning |
|--------|---------|
| `active` | Wired to Next.js route or API, working |
| `wired` | Full UI -> API -> Data path functional |
| `partial` | Some wiring exists but incomplete |
| `legacy` | Pages Router or legacy code, still reachable |
| `demo` | Uses demo/placeholder data |
| `stub` | Endpoint exists but returns no-op |
| `broken` | Non-functional, needs repair |
| `planned` | Documented but not implemented |

## Conventions

- **Code is truth**: Features are derived from codebase, not aspirational
- **Status tracking**: Update status when code changes
- **Cross-references**: Link to user stories in `../user-experience/stories/README.md`
- **Test mapping**: Reference E2E tests in `../testing/journey-test-matrix.md`
