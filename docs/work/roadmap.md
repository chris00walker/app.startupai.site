---
purpose: "Private technical source of truth for engineering roadmap"
status: "active"
last_reviewed: "2026-01-18"
---

# Roadmap

## Q4 2025: CrewAI-enabled onboarding

**Status: 70% Complete** (as of Nov 28, 2025)

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Netlify workflow launch | ⚠️ Pending | E2E tests blocked; CI/CD not ready |
| Supabase evidence persistence | ✅ Done | Webhook persists 80+ fields. Flywheel tables deployed. |
| CrewAI integration | ✅ Done | Phase 2D complete (~85%), 18 tools, real web research |
| Onboarding dashboards | ⚠️ Partial | Core signals displayed; full reports not visible to users |
| Spec-driven tests | 🔄 In Progress | GH Issue #189, fixtures being updated |
| Accessibility polish | ❌ Not Started | P0 launch blocker (8-10 hours) |

**Remaining Q4 Work:**
1. Fix E2E test infrastructure (4-6h) - enables launch
2. Complete accessibility (8-10h) - legal compliance
3. Build CrewAI Report Viewer (5-7 days) - show full analysis results

**Q1 2026 Testing Priority:**
- **Journey-Driven Testing (P1)** - Derive tests from journey maps, not code mechanics
- Current 824+ unit tests provide low confidence (mock-heavy)
- Need acceptance test layer verifying user outcomes
- See `in-progress.md` for implementation phases

**Cross-Reference**: See [in-progress.md](in-progress.md) for current priorities

---

## Q1 2026: Evidence ledger & founder insights

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Evidence search UI (pgvector) | Planned | Tables deployed, UI not built |
| Experiment tracking | Planned | Part of Evidence Explorer |
| Automated validation plan updates | Planned | Depends on CrewAI Report Viewer |
| Analytics dashboards | Planned | PostHog + Supabase metrics |

**Dependencies**: Requires Q4 P0/P1 items complete

---

## Q2 2026: Advisor & workspace expansion

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Multi-workspace support | Planned | - |
| Advisor-facing reports/export | Planned | PDF/PowerPoint export in backlog |
| Billing + plan upgrade path | Planned | - |
| Marketing contract automation | Planned | - |

---

## TBD: Internationalisation & compliance

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Localised onboarding copy | Planned | - |
| Data residency review | Planned | - |
| Enhanced audit logs | Planned | CrewAI prompts and responses |

---

## Current Trajectory

**Platform Completion**: 65-70%

```
                 Q4 2025           Q1 2026          Q2 2026
                    │                 │                 │
Infrastructure ━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 95%
Database       ━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%
Authentication ━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Working
Frontend UI    ━━━━━━━━━━◉━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 70%
AI Integration ━━━━━━━━◉━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60%
CrewAI Output  ━━━━━━━━━━━━━━━━━━━━━━━━━◉━━━━━━━━━━━━━━━ 40%
Accessibility  ━━━━━━━━━━━━━━━◉━━━━━━━━━━━━━━━━━━━━━━━━━ 0%
                    │                 │                 │
             Current Focus      Evidence UI        Advisor
```

**Key Insight**: Infrastructure is solid (95-100%), but user-facing features are lagging (40-70%). The critical gap is displaying CrewAI's analysis results to users.

---

Roadmap is reviewed monthly with product + marketing. Update deliverables once backlog items graduate into committed work.

**Last Updated**: 2026-01-18
