---
purpose: "Links to master architecture - single source of truth"
status: "active"
last_reviewed: "2026-01-18"
---

# Architecture References

This document links to the **single source of truth** for StartupAI architecture. Do not duplicate content from these references - link to them instead.

## Master Architecture Location

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

## Key ADRs (Do Not Duplicate)

| ADR | Title | Location | Summary |
|-----|-------|----------|---------|
| ADR-004 | Two-Pass Onboarding | `startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md` | LLM streams (no tools), backend assesses quality |
| ADR-005 | State-First Loop | `startupai-crew/docs/adr/005-state-first-synchronized-loop.md` | Split API, atomic persistence, version locking |

### ADR-004: Two-Pass Architecture

**Problem**: Tool-based LLM progression was unreliable and unpredictable.

**Solution**:
- Pass 1: LLM streams pure conversation (no tools)
- Pass 2: Backend deterministically assesses quality

**Implementation**: See `/api/chat/stream` and `/api/chat/save` routes.

### ADR-005: State-First Synchronized Loop

**Problem**: Single `/message` endpoint mixed streaming and persistence, causing race conditions.

**Solution**:
- Split into `/api/chat/stream` (stateless) and `/api/chat/save` (atomic)
- Version locking prevents concurrent session corruption
- Frontend orchestrates two-step flow

**Implementation**: See `frontend/src/lib/onboarding/` quality assessment files.

## Modal Integration

See `startupai-crew/docs/master-architecture/reference/modal-configuration.md` for:
- Deployment configuration
- Function signatures
- Webhook authentication
- HITL checkpoint patterns

### Quick Reference

| Endpoint | Purpose |
|----------|---------|
| `POST /kickoff` | Start validation run |
| `GET /status/{run_id}` | Poll execution status |
| `POST /hitl/approve` | Resume from checkpoint |

## Phase 0 Specification

See `startupai-crew/docs/master-architecture/04-phase-0-onboarding.md` for:
- 7-stage founder journey
- Data collection requirements
- Quality signal definitions
- Brief extraction logic

## When to Update This Repo vs Master

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

## Cross-Repo Coordination

For blockers and dependencies between repos, see:
- `docs/work/cross-repo-blockers.md` (this repo)
- `startupai-crew/docs/work/cross-repo-blockers.md`
- `startupai.site/docs/work/cross-repo-blockers.md`

## Related Documentation

- **Onboarding API**: [specs/api-onboarding.md](../specs/api-onboarding.md)
- **Database Schema**: [specs/data-schema.md](../specs/data-schema.md)
- **Dogfooding**: See master architecture `10-dogfooding.md`
