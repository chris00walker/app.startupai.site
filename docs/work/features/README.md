---
purpose: "Private technical source of truth for feature documentation templates"
status: "active"
last_reviewed: "2025-10-25"
---

# Feature Template

Each feature folder should include:

- `feature.md` – Scope, acceptance criteria, risks.
- `test-plan.md` – Critical scenarios, automation coverage.
- `checklist.md` – Migrations, flags, docs, analytics.
- `delivery-notes.md` – Release summary, links to PRs/issues.

Example structure:

```
work/features/onboarding-crewai/
  feature.md
  test-plan.md
  checklist.md
  delivery-notes.md
```

## Ecosystem Context

- **Master Architecture**: `startupai-crew/docs/master-architecture/`
- **API Contracts**: `startupai-crew/docs/master-architecture/reference/api-contracts.md`
- **Approval Workflows**: `startupai-crew/docs/master-architecture/reference/approval-workflows.md`
