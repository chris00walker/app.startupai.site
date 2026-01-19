---
purpose: "Documentation staleness audit comparing docs vs plans"
status: "completed"
last_reviewed: "2026-01-18"
---

# Documentation Staleness Audit

**Date**: 2026-01-18
**Purpose**: Compare docs/ vs ~/.claude/plans/ to identify stale documentation
**Status**: ✅ Audit complete - documentation refresh implemented

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Documentation Files | 121 |
| Active/Non-archived | 71 |
| Plans Created (Jan 2026) | 37 |
| Oldest Doc (Git Modified) | 2025-10-25 (85 days ago) |
| Oldest Plan | 2026-01-04 (14 days ago) |
| **Staleness Gap** | **71 days** |

**Critical Finding**: Documentation is 71+ days behind plan-driven development. Plans from Jan 4-18, 2026 implemented features that docs from Oct-Nov 2025 don't reflect.

---

## Staleness by Category

### 🔴 Critical: Docs Contradicting Implemented Plans

| Doc | Last Modified | Contradicting Plan | Issue |
|-----|---------------|-------------------|-------|
| `specs/api-onboarding.md` | 2025-10-28 | `async-mixing-ritchie.md` (Jan 16) | **Two-Pass Architecture not documented** - LLM tools removed, backend assessment added |
| `features/stage-progression.md` | 2025-10-30 | `gentle-booping-mitten.md` (Jan 15) | **Stage config refactored** - unified `stages-config.ts` not reflected |
| `testing/strategy.md` | 2025-12-02 | `async-bouncing-clock.md` (Jan 18) | **TDD evolved to journey-driven** - current strategy doc doesn't reflect this |
| `overview/architecture.md` | 2025-11-21 | `swirling-dancing-kay.md` (Jan 10) | **Modal migration 85% complete** - doc shows old CrewAI AMP architecture |

### 🟠 High Priority: Missing New Features

| Missing Topic | Relevant Plan | Should Be In |
|---------------|---------------|--------------|
| Consultant-Client Invite System | `prancy-tickling-quokka.md` | New spec needed |
| Realtime Subscriptions | `snappy-yawning-mango.md` | `specs/supabase.md` |
| OpenRouter/Groq Integration | (in-progress.md notes) | `specs/api-onboarding.md` |
| ADR-005 State-First Architecture | `shiny-growing-sprout.md` | New ADR needed |
| HITL Approval Flows | `precious-kindling-balloon.md` | `features/` |

### 🟡 Medium Priority: Outdated But Not Blocking

| Doc | Last Modified | Staleness | Issue |
|-----|---------------|-----------|-------|
| `specs/frontend-components.md` | 2025-10-25 | 85 days | New components added (StageReviewModal, etc.) |
| `specs/data-schema.md` | 2025-10-25 | 85 days | Missing `founders_briefs` table (Layer 2) |
| `public-interfaces/marketing-contracts.md` | 2025-10-25 | 85 days | API contracts evolved |
| `user-experience/onboarding-journey-map.md` | 2025-11-30 | 49 days | Two-Pass Architecture changes UX flow |

### ✅ Recently Updated (No Action Needed)

| Doc | Last Modified | Notes |
|-----|---------------|-------|
| `work/in-progress.md` | 2026-01-16 | Active tracking doc |
| `work/cross-repo-blockers.md` | 2026-01-16 | Current |
| `audits/phase0-*.md` | 2026-01-16 | Recent audit |
| `work/backlog.md` | 2026-01-15 | Current |
| `work/roadmap.md` | 2026-01-18 | Just updated |

---

## Plan → Doc Gap Analysis

### Completed Plans Without Doc Updates

| Plan | Completed | Missing Doc Update |
|------|-----------|-------------------|
| `async-mixing-ritchie.md` - Two-Pass Architecture | Jan 16 | `specs/api-onboarding.md` not updated |
| `precious-rolling-newt.md` - Cross-Repo Sync | Jan 8 | Process not documented |
| `elegant-growing-newt.md` - Dogfooding Methodology | Jan 12 | Added to CLAUDE.md only, not docs/ |

### In-Progress Plans Needing Doc Stubs

| Plan | Status | Needs |
|------|--------|-------|
| `swirling-dancing-kay.md` - Modal Migration | 85% | Architecture overview update |
| `bright-brewing-truffle.md` - Skills/Agents | Phase 1 | New `docs/features/skills-system.md` |
| `prancy-tickling-quokka.md` - Consultant-Client | Planning | New feature spec |

---

## Frontmatter Hygiene Issues

### Missing Status Field (30 files)

These files lack the `status:` frontmatter field:

```
specs/accessibility-standards.md
specs/product-requirements.md
specs/mvp-specification.md
incidents/SYSTEM_ENGINEER_HANDOFF.md
incidents/TROUBLESHOOTING.md
incidents/nextjs-module-bundling-2025-10-31.md
incidents/oauth-fix-2025-10-22.md
incidents/ONBOARDING_FAILURE_ANALYSIS.md
incidents/ONBOARDING_FIX_INSTRUCTIONS.md
testing/E2E_TEST_IMPLEMENTATION.md
testing/README.md
testing/TESTING_CHECKLIST.md
testing/e2e-guide.md
testing/specification-driven-implementation.md
reports/security-audit.md
reports/typescript-pydantic-alignment.md
reports/strategyzer-ux-audit.md
reports/crewai-data-flow-verification.md
reports/ui-crewai-wiring-audit.md
audits/CREWAI-FRONTEND-INTEGRATION-QA.md
audits/phase0-*.md (5 files)
ops/environments.md
overview/business-overview.md
features/stage-progression.md
user-experience/onboarding-journey-map.md
status/MIGRATION_COMPLETE.md
status/MIGRATION_SUMMARY.md
status/linting.md
```

### Inconsistent Date Formats

| File | Frontmatter | Git Date | Issue |
|------|-------------|----------|-------|
| `specs/api-onboarding.md` | 2025-10-28 | 2026-01-12 | Frontmatter not updated |
| `overview/platform-overview.md` | 2025-11-21 | 2026-01-12 | Frontmatter not updated |
| `overview/architecture.md` | 2025-11-21 | 2026-01-12 | Frontmatter not updated |

---

## Archive Analysis

### Archive Structure (50 files)

| Folder | Count | Purpose | Action |
|--------|-------|---------|--------|
| `archive/legacy/` | 33 | Deprecated stubs | Keep as-is |
| `archive/completion-reports/` | 10 | Historical records | Keep as-is |
| `archive/aspirational-contracts/` | 1 | Deprecated spec | Keep as-is |
| `archive/*.md` | 6 | Mixed historical | Review for deletion |

### Recommended Archive Additions

Move these to `archive/` (no longer accurate):
- `specs/data-schema.md` → Replace with auto-generated from Drizzle
- `testing/specification-driven.md` → Superseded by journey-driven approach

---

## Prioritized Refresh Recommendations

### Immediate (This Week)

| Priority | Doc | Action | Effort |
|----------|-----|--------|--------|
| P0 | `specs/api-onboarding.md` | Rewrite for Two-Pass Architecture | 2h |
| P0 | Create `adrs/adr-0004-two-pass-architecture.md` | Document ADR | 1h |
| P0 | Create `adrs/adr-0005-state-first-loop.md` | Document ADR | 1h |
| P1 | `overview/architecture.md` | Update for Modal, remove CrewAI AMP | 2h |
| P1 | `specs/data-schema.md` | Add `founders_briefs`, update relationships | 1h |

### Short-Term (Next 2 Weeks)

| Priority | Doc | Action | Effort |
|----------|-----|--------|--------|
| P1 | `features/stage-progression.md` | Update for unified config | 1h |
| P1 | `testing/strategy.md` | Add journey-driven testing section | 2h |
| P2 | `specs/supabase.md` | Add Realtime subscriptions | 1h |
| P2 | `user-experience/onboarding-journey-map.md` | Update for Two-Pass flow | 2h |
| P2 | Create `features/consultant-client-system.md` | New feature spec | 3h |

### Backlog (As Features Complete)

| Doc | Trigger | Action |
|-----|---------|--------|
| `features/skills-system.md` | `bright-brewing-truffle.md` completion | Create new |
| `specs/modal-integration.md` | `swirling-dancing-kay.md` completion | Create new |
| All 30 files | - | Add `status:` frontmatter |

---

## Metrics to Track

### Documentation Health KPIs

| Metric | Current | Target |
|--------|---------|--------|
| Avg doc age (active) | 62 days | <30 days |
| Docs with status field | 76% | 100% |
| Plans with matching doc | ~40% | 90% |
| Staleness gap | 71 days | <14 days |

### Review Cadence

- **Work tracking docs**: Weekly (already happening)
- **Specs**: Monthly or on feature completion
- **Architecture**: Quarterly or on major change
- **ADRs**: On each architecture decision

---

## Next Steps

1. [ ] Create ADR-0004 and ADR-0005 from completed plans
2. [ ] Rewrite `specs/api-onboarding.md` for Two-Pass
3. [ ] Update `overview/architecture.md` for Modal
4. [ ] Add frontmatter to 30 files (batch script)
5. [ ] Schedule monthly doc review

---

**Created**: 2026-01-18
**Owner**: @documentation
**Review**: Monthly
