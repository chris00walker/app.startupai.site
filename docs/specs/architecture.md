---
purpose: "Redirect to canonical architecture documentation"
status: "active"
last_reviewed: "2026-01-19"
---

# Architecture Overview

## Canonical Source

> **All architecture documentation lives in `startupai-crew/docs/master-architecture/`**
>
> That repository is the single source of truth for cross-service architecture.

```
startupai-crew/docs/master-architecture/
├── 01-ecosystem.md           # Three-service reality diagram
├── 02-organization.md        # C-suite → Agent hierarchy
├── 03-validation-spec.md     # Technical implementation guide
├── 04-phase-0-onboarding.md  # Phase 0 specification
├── 05-hitl-checkpoints.md    # Human-in-the-loop workflow
├── 10-dogfooding.md          # Dogfooding methodology
└── reference/                # API contracts, schemas
    ├── api-contracts.md      # Modal ↔ Product App contracts
    └── modal-configuration.md # Modal deployment config
```

### Key ADRs

| ADR | Title | Location |
|-----|-------|----------|
| ADR-004 | Two-Pass Onboarding | `startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md` |
| ADR-005 | State-First Loop | `startupai-crew/docs/adr/005-state-first-synchronized-loop.md` |

## Product-Specific Documentation

For implementation details specific to this repository, see:

| Topic | Document |
|-------|----------|
| Database schema | [data-schema.md](data-schema.md) |
| Authentication | [auth.md](auth.md) |
| Supabase config | [supabase.md](supabase.md) |
| Onboarding API | [api-onboarding.md](api-onboarding.md) |
| Consultant API | [api-consultant.md](api-consultant.md) |
| CrewAI API | [api-crewai.md](api-crewai.md) |
| Approvals API | [api-approvals.md](api-approvals.md) |
| Components | [frontend-components.md](frontend-components.md) |

## When to Update Which Repo

### Update This Repo (`app.startupai.site`)

- Product app implementation details
- API route documentation
- Frontend component specs
- UI/UX patterns
- Testing strategies

### Update Master Repo (`startupai-crew`)

- Cross-repo architecture decisions
- Data contracts between services
- ADRs (Architecture Decision Records)
- CrewAI flow specifications
- Modal deployment patterns
- Webhook payload schemas

---

**Archived**: Full architecture document moved to `archive/legacy/architecture.md` (2026-01-19)
