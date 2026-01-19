---
purpose: "Documentation index for the StartupAI product platform"
status: "active"
last_reviewed: "2026-01-18"
---

# StartupAI App Documentation

## Quick Start

For new contributors, start with:
1. **[CLAUDE.md](../CLAUDE.md)** - Project memory and commands
2. **[work/phases.md](work/phases.md)** - Current development phases
3. **[work/in-progress.md](work/in-progress.md)** - Active work items

## Directory Structure

| Section | Summary |
| --- | --- |
| [`overview/`](overview/) | Platform architecture, business context, and architecture references |
| [`specs/`](specs/) | Technical specifications (auth, data schema, APIs, components) |
| [`adrs/`](adrs/) | Architectural Decision Records (local to this repo) |
| [`features/`](features/) | Feature specifications (stage progression, consultant system) |
| [`work/`](work/) | Phases, roadmap, backlog, and in-progress items |
| [`testing/`](testing/) | Testing strategy, E2E guides, journey-driven testing |
| [`status/`](status/) | Implementation status and release notes |
| [`incidents/`](incidents/) | Issue analysis and troubleshooting |
| [`reports/`](reports/) | Security audits and data flow verification |
| [`audits/`](audits/) | Integration audits and documentation reviews |
| [`ops/`](ops/) | Environment configuration, SLOs, and runbooks |
| [`public-interfaces/`](public-interfaces/) | Marketing contracts and API exports |
| [`user-experience/`](user-experience/) | Journey maps and UX documentation |
| [`archive/`](archive/) | Deprecated docs (historical reference only) |

## Key Documents

### Architecture

| Document | Purpose |
| --- | --- |
| [overview/architecture.md](overview/architecture.md) | System architecture (Two-Pass, Modal, HITL) |
| [overview/architecture-references.md](overview/architecture-references.md) | Links to master ADRs in startupai-crew |

> **Master Architecture**: `startupai-crew/docs/master-architecture/` contains the ecosystem source of truth including ADR-004 (Two-Pass) and ADR-005 (State-First Loop).

### API Specifications

| Document | Routes | Purpose |
| --- | --- | --- |
| [specs/api-onboarding.md](specs/api-onboarding.md) | 11 | Onboarding chat and session APIs |
| [specs/api-consultant.md](specs/api-consultant.md) | 8 | Consultant and client management |
| [specs/api-crewai.md](specs/api-crewai.md) | 5 | CrewAI/Modal integration webhooks |
| [specs/api-approvals.md](specs/api-approvals.md) | 3 | HITL approval workflow |

### Data & Components

| Document | Purpose |
| --- | --- |
| [specs/data-schema.md](specs/data-schema.md) | Database schema (Layer 1/2 briefs, Realtime) |
| [specs/frontend-components.md](specs/frontend-components.md) | Component architecture |
| [specs/supabase.md](specs/supabase.md) | Supabase configuration and Realtime |

### Features

| Document | Purpose |
| --- | --- |
| [features/stage-progression.md](features/stage-progression.md) | 7-stage onboarding system |
| [features/consultant-client-system.md](features/consultant-client-system.md) | Invite and client management |

### Testing

| Document | Purpose |
| --- | --- |
| [testing/strategy.md](testing/strategy.md) | Test pyramid and journey-driven testing |
| [testing/specification-driven.md](testing/specification-driven.md) | Spec-driven testing (evolving to JDTD) |

### Work Tracking

| Document | Purpose |
| --- | --- |
| [work/in-progress.md](work/in-progress.md) | Active work items |
| [work/cross-repo-blockers.md](work/cross-repo-blockers.md) | Cross-repo dependencies |
| [work/backlog.md](work/backlog.md) | Backlog items |
| [work/done.md](work/done.md) | Completed work |

## Cross-References

| Repository | Purpose |
| --- | --- |
| **startupai-crew** | CrewAI Flows on Modal (5-flow/14-crew/45-agent engine) |
| **startupai.site** | Marketing site and lead capture |

### Master Architecture (Do Not Duplicate)

The following ADRs live in `startupai-crew/docs/master-architecture/` and should NOT be duplicated:

- **ADR-004**: Two-Pass Onboarding Architecture
- **ADR-005**: State-First Synchronized Loop
- **reference/modal-configuration.md**: Modal deployment config
- **reference/api-contracts.md**: Cross-service API contracts

---
**Last Updated**: 2026-01-18
