---
purpose: "Private technical source of truth for feature documentation templates"
status: "active"
last_reviewed: "2025-12-01"
---

# Feature Template

Each feature folder should include:

- `feature.md` – Scope, acceptance criteria, risks.
- `test-plan.md` – Critical scenarios, automation coverage.
- `checklist.md` – Migrations, flags, docs, analytics.
- `delivery-notes.md` – Release summary, links to PRs/issues.

## Example: Onboarding Integration

```
work/features/onboarding-crewai/
  feature.md        # 7-stage AI onboarding with Vercel AI SDK
  test-plan.md      # E2E tests for conversation flow
  checklist.md      # Database migrations, env vars
  delivery-notes.md # PR #42, deployed Nov 2025
```

**Acceptance Criteria Example:**
- [ ] User can complete 7-stage onboarding flow
- [ ] Conversation persists across sessions
- [ ] Entrepreneur brief generated on completion
- [ ] Error handling for AI failures

## Ecosystem Context

- **Master Architecture**: `startupai-crew/docs/master-architecture/`
- **API Contracts**: `startupai-crew/docs/master-architecture/reference/api-contracts.md`
- **Approval Workflows**: `startupai-crew/docs/master-architecture/reference/approval-workflows.md`
