---
purpose: "Index and ID allocation for agent user stories"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
---

# Agent User Stories

AI agent stories organized by phase, designed for JDTD (Journey-Driven Test Development) effectiveness with rich CrewAI design validation.

## Design Philosophy

Each story validates at **two levels**:

### Level 1: CrewAI Design Quality
- Agent role is **specific and specialized** (not generic)
- Agent goal includes **outcome and success criteria**
- Agent backstory creates **coherent persona**
- Tools **match agent specialization**
- Tasks are **single-purpose with explicit I/O** (80/20 rule)

### Level 2: Business Behavior
- State changes occur correctly
- Schema contracts are satisfied
- HITL checkpoints trigger appropriately
- Errors are handled gracefully

## Story ID Allocation

| Prefix | Meaning | Phase | Count | File |
|--------|---------|-------|-------|------|
| `US-AB` | Agent Brief | Phase 1 Stage A | 3 | `phase-1-brief-generation.md` |
| `US-AD` | Agent Discovery | Phase 1 Stage B | 10 | `phase-1-vpc-discovery.md` |
| `US-ADB` | Agent Desirability | Phase 2 | 5 | `phase-2-desirability.md` |
| `US-AFB` | Agent Feasibility | Phase 3 | 3 | `phase-3-feasibility.md` |
| `US-AVB` | Agent Viability | Phase 4 | 5 | `phase-4-viability.md` |
| `US-AH` | Agent HITL Checkpoint | Cross-phase | 10 | `hitl-checkpoints.md` |

**Total: 36 stories**

## Story Files

| File | Stories | Purpose |
|------|---------|---------|
| [phase-1-brief-generation.md](./phase-1-brief-generation.md) | US-AB01-03 | Founder's Brief generation from Quick Start |
| [phase-1-vpc-discovery.md](./phase-1-vpc-discovery.md) | US-AD01-10 | VPC Discovery crews and fit assessment |
| [phase-2-desirability.md](./phase-2-desirability.md) | US-ADB01-05 | Landing pages, ads, desirability signal |
| [phase-3-feasibility.md](./phase-3-feasibility.md) | US-AFB01-03 | Technical feasibility assessment |
| [phase-4-viability.md](./phase-4-viability.md) | US-AVB01-05 | Unit economics and final synthesis |
| [hitl-checkpoints.md](./hitl-checkpoints.md) | US-AH01-10 | All 10 HITL checkpoint patterns |

## Test File Mapping

| Story Prefix | E2E Test File | Unit Test Location |
|--------------|---------------|-------------------|
| `US-AB` | `30-agent-brief-generation.spec.ts` | `startupai-crew/src/crews/onboarding/` |
| `US-AD` | `31-agent-vpc-discovery.spec.ts` | `startupai-crew/src/crews/discovery/` |
| `US-ADB` | `32-agent-desirability.spec.ts` | `startupai-crew/src/crews/desirability/` |
| `US-AFB` | `33-agent-feasibility.spec.ts` | `startupai-crew/src/crews/feasibility/` |
| `US-AVB` | `34-agent-viability.spec.ts` | `startupai-crew/src/crews/viability/` |
| `US-AH` | `35-agent-hitl-checkpoints.spec.ts` | Various |

## Master Architecture References

- [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) - All 43 agent configs
- [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) - Pydantic state models
- [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - HITL patterns
- [tool-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-specifications.md) - MCP tool specs

## Migration Notes

**Superseded Files** (archived):
- `agent-journeys.md` (US-AJ01-07) → Replaced by US-AB, US-AD, US-ADB, US-AFB, US-AVB
- `agent-specs.md` (US-AG01-14) → Absorbed into phase-specific files

**Key Improvements**:
- Stories organized by phase instead of mixed
- Rich schema references in every story
- Explicit CrewAI design validation criteria
- Clear test file mappings
- Full HITL checkpoint coverage (10/10)

---

**Last Updated**: 2026-01-23
