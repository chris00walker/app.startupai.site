---
purpose: "Private technical source of truth for backlog references"
status: "active"
last_reviewed: "2025-11-28"
---

# Backlog

## Status Key
- **Completed** → Moved to [done.md](done.md)
- **Promoted** → Moved to [in-progress.md](in-progress.md)
- **Backlog** → Future work, not yet prioritized

---

## P2: Medium Priority (Nice to Have)

| Item | Effort | Source | Notes |
|------|--------|--------|-------|
| VPC geometric shapes (circle/square) | 2-3h | [Strategyzer UX Audit](../reports/strategyzer-ux-audit.md) | Visual polish to match Strategyzer methodology |
| VPC visual fit lines | 4-6h | [Strategyzer UX Audit](../reports/strategyzer-ux-audit.md) | SVG lines connecting pains↔relievers, gains↔creators |
| HITL comment display | 2-4h | [Integration QA](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) | Show `human_comment` in UI |
| Realtime subscription for useCrewAIState() | 1-2h | [E2E Data Flow](../reports/crewai-data-flow-verification.md) | Subscribe to Supabase Realtime for live updates |
| "Sync to CrewAI" action for VPC edits | 2-3h | [E2E Data Flow](../reports/crewai-data-flow-verification.md) | User edits → trigger CrewAI re-analysis |
| Realtime updates for approvals history | 2-3h | [E2E Data Flow](../reports/crewai-data-flow-verification.md) | Live approval status updates |
| Assumption Map page | 1-2 days | [Integration QA](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) | Risk visibility dashboard |
| Metrics Dashboard (CAC, LTV, margins) | 2-3 days | [Integration QA](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) | Business intelligence from CrewAI data |

---

## P3: Future Enhancements

| Item | Effort | Source | Notes |
|------|--------|--------|-------|
| PDF/PowerPoint export | 3-5 days | [Integration QA](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) | External sharing of analysis results |
| Canvas versioning | 5-7 days | [Integration QA](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) | History tracking for VPC/BMC changes |
| Multi-segment VPC comparison | 3-5 days | [Integration QA](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) | Side-by-side segment analysis |
| Drag-and-drop VPC fit mapping | 8+h | [Strategyzer UX Audit](../reports/strategyzer-ux-audit.md) | Interactive fit mapping UX |
| Evidence history preservation | 2-3 days | [E2E Data Flow](../reports/crewai-data-flow-verification.md) | INSERT vs UPSERT or history table |
| Internationalisation & localisation | TBD | Original backlog | Translate onboarding copy, locale support |

---

## Completed / Promoted Items

The following items from the original backlog have been addressed:

| Item | Status | Notes |
|------|--------|-------|
| CrewAI persistence and deliverable schema | ✅ **Completed** | Webhook persists 80+ fields. See [done.md](done.md) |
| Drizzle support for onboarding tables | 📤 **Promoted to P1** | Part of spec-driven test refresh. GH Issue #189 |
| Accessibility & localisation sweep | 📤 **Promoted to P0** | WCAG 2.1 AA is launch blocker. See [in-progress.md](in-progress.md) |
| Rate limiting & plan telemetry | 📤 **Promoted to P0** | PostHog instrumentation. GH Issue #175 |
| Dashboard MVP (post-onboarding insights) | 📤 **Promoted to P1** | CrewAI Report Viewer + Dashboard insights. See [in-progress.md](in-progress.md) |
| Marketing contract parity automation | Backlog | Not yet prioritized |

---

## Backlog Triage

Backlog triage happens weekly with platform + AI platform leads. Update this table after sprint planning so docs and GitHub stay aligned.

**Next Review**: December 2025
**Last Updated**: 2025-11-28
