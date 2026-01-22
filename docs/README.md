---
purpose: "Documentation index for the StartupAI product platform"
status: "active"
last_reviewed: "2026-01-19"
---

# StartupAI App Documentation

## Quick Start

For new contributors, start with:
1. **[CLAUDE.md](../CLAUDE.md)** - Project memory and commands
2. **[work/phases.md](work/phases.md)** - Current development phases
3. **[work/in-progress.md](work/in-progress.md)** - Active work items

## Directory Structure

| Folder | Purpose |
|--------|---------|
| [`specs/`](specs/) | Technical specifications (auth, APIs, data schema, architecture) |
| [`features/`](features/) | Feature specifications and registry |
| [`testing/`](testing/) | Test strategy, E2E guides, coverage matrix |
| [`user-experience/`](user-experience/) | Journey maps, personas, user stories |
| [`work/`](work/) | Active work tracking (backlog, in-progress, done) |
| [`archive/`](archive/) | Historical/deprecated content |

## Key Documents

### Specifications (`specs/`)

| Document | Purpose |
|----------|---------|
| [auth.md](specs/auth.md) | Authentication (OAuth, JWT, RLS) |
| [data-schema.md](specs/data-schema.md) | Database schema (Layer 1/2 briefs, Realtime) |
| [supabase.md](specs/supabase.md) | Supabase configuration, RPC functions, environment |
| [architecture.md](specs/architecture.md) | Redirect to canonical source in startupai-crew |
| [api-onboarding.md](specs/api-onboarding.md) | Onboarding chat and session APIs (11 routes) |
| [api-consultant.md](specs/api-consultant.md) | Consultant and client management (8 routes) |
| [api-crewai.md](specs/api-crewai.md) | CrewAI/Modal integration webhooks (5 routes) |
| [api-approvals.md](specs/api-approvals.md) | HITL approval workflow (3 routes) |
| [frontend-components.md](specs/frontend-components.md) | Component architecture |
| [accessibility-standards.md](specs/accessibility-standards.md) | WCAG 2.2 AA compliance framework |
| [slos.md](specs/slos.md) | Service level objectives and analytics |
| [phase-mapping.md](specs/phase-mapping.md) | CrewAI phase spec-to-code alignment |

### Features (`features/`)

| Document | Purpose |
|----------|---------|
| [stage-progression.md](features/stage-progression.md) | 7-stage onboarding system |
| [consultant-client-system.md](features/consultant-client-system.md) | Invite and client management |
| [feature-inventory.md](features/feature-inventory.md) | Complete feature inventory |
| [feature-template.md](features/feature-template.md) | Template for new features |

### User Experience (`user-experience/`)

| Document | Purpose |
|----------|---------|
| [role-definitions.md](user-experience/roles/role-definitions.md) | Canonical role definitions (Founder, Consultant, Admin, Trial) |
| [personas/README.md](user-experience/personas/README.md) | Persona index and behavioral profiles |
| [stories/README.md](user-experience/stories/README.md) | Story format, coverage, and cross-references |
| [founder-journey-map.md](user-experience/journeys/founder/founder-journey-map.md) | 15-step Founder journey |
| [consultant-journey-map.md](user-experience/journeys/consultant/consultant-journey-map.md) | 6-phase Consultant journey |

### Testing (`testing/`)

| Document | Purpose |
|----------|---------|
| [strategy.md](testing/strategy.md) | Test pyramid and story-driven testing |
| [journey-test-matrix.md](testing/journey-test-matrix.md) | Story-to-test coverage matrix |
| [e2e-guide.md](testing/e2e-guide.md) | E2E testing guide |

### Work Tracking (`work/`)

| Document | Purpose |
|----------|---------|
| [in-progress.md](work/in-progress.md) | Active work items |
| [backlog.md](work/backlog.md) | Backlog items |
| [done.md](work/done.md) | Completed work |
| [phases.md](work/phases.md) | Development phases |
| [cross-repo-blockers.md](work/cross-repo-blockers.md) | Cross-repo dependencies |

### Archive (`archive/`)

Historical reference only. Contains:
- `audits/` - Past integration audits and reports
- `incidents/` - Historical issue analysis
- `status/` - Migration reports and old status tracking
- `public-interfaces/` - Legacy API exports
- `adrs/` - Local ADRs (canonical ADRs live in startupai-crew)
- `completion-reports/` - Project completion records
- `legacy/` - Deprecated documentation (includes archived `environments.md`, `architecture.md`)

## Cross-References

| Repository | Purpose |
|------------|---------|
| **startupai-crew** | CrewAI Flows on Modal (5-flow/14-crew/45-agent engine) |
| **startupai.site** | Marketing site and lead capture |

### Master Architecture (Source of Truth)

The following live in `startupai-crew/docs/master-architecture/` and should NOT be duplicated here:

- **ADR-004**: Two-Pass Onboarding Architecture
- **ADR-005**: State-First Synchronized Loop
- **reference/modal-configuration.md**: Modal deployment config
- **reference/api-contracts.md**: Cross-service API contracts

---
**Last Updated**: 2026-01-19
