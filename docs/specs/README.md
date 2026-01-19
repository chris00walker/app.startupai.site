---
purpose: "Index for technical specifications"
status: "active"
last_reviewed: "2026-01-19"
---

# Technical Specifications

Technical truth for the StartupAI product platform. These documents describe **how things work**.

> **Cross-Service Architecture**: Lives in `startupai-crew/docs/master-architecture/` (canonical source of truth).

## API Contracts

| Spec | Purpose |
|------|---------|
| [api-onboarding.md](api-onboarding.md) | Onboarding session lifecycle, chat endpoints |
| [api-approvals.md](api-approvals.md) | HITL approval workflow endpoints |
| [api-consultant.md](api-consultant.md) | Consultant onboarding and client management |
| [api-crewai.md](api-crewai.md) | Modal/CrewAI integration and webhooks |

## Architecture & Infrastructure

| Spec | Purpose |
|------|---------|
| [architecture.md](architecture.md) | Redirect to canonical source in startupai-crew |
| [auth.md](auth.md) | Authentication flows, Supabase Auth, PKCE |
| [slos.md](slos.md) | Service level objectives |

## Data Layer

| Spec | Purpose |
|------|---------|
| [data-schema.md](data-schema.md) | Database schema, Drizzle models, RLS policies |
| [supabase.md](supabase.md) | Supabase configuration, triggers, functions |

## Frontend

| Spec | Purpose |
|------|---------|
| [frontend-components.md](frontend-components.md) | Component catalog, Shadcn patterns |
| [accessibility-standards.md](accessibility-standards.md) | WCAG 2.1 AA compliance requirements |

## Integration

| Spec | Purpose |
|------|---------|
| [phase-mapping.md](phase-mapping.md) | CrewAI phase spec-to-code alignment |

## Conventions

- **Single source of truth**: Don't duplicate content from `startupai-crew/docs/master-architecture/`
- **Code is truth**: Specs describe what the code does, not what we wish it did
- **last_reviewed**: Update when verifying against codebase
- **Kebab-case**: All file names use lowercase with hyphens
