---
purpose: "Private technical source of truth for backlog references"
status: "active"
last_reviewed: "2026-01-15"
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
| **HITL Approval UI Data Source** | 2-4h | [Phase 0 Audit](../audits/phase0-spec-alignment-report.md) | **DEFERRED from P1** - see details below |
| **Consultant Alex UX Improvements** | 4-5h | Alex UX Plan | Mirror founder improvements for consultant onboarding flow |
| VPC geometric shapes (circle/square) | 2-3h | [Strategyzer UX Audit](../reports/strategyzer-ux-audit.md) | Visual polish to match Strategyzer methodology |
| ~~VPC visual fit lines~~ | ~~4-6h~~ | ~~[Strategyzer UX Audit]~~ | ✅ Done - commit `0cf17ca` (Nov 29) |
| HITL comment display | 2-4h | [Integration QA](../audits/CREWAI-FRONTEND-INTEGRATION-QA.md) | Show `human_comment` in UI |

### HITL Approval UI Data Source (Deferred from P1) ⚠️ DO NOT FORGET

**Context**: Team audit (2026-01-15) identified two-artifact data model issue.

**Problem**: `FoundersBriefReview.tsx` reads from `entrepreneur_briefs` (Layer 1 raw extraction), but should show `founders_briefs` (Layer 2 S1-compiled output) after Modal processing.

**Current Behavior**: HITL approval shows raw Alex chat extraction instead of S1-validated brief.

**Two Options**:

| Option | Approach | Effort | Risk |
|--------|----------|--------|------|
| A (Spec-compliant) | Create `/api/founders-brief` endpoint that queries `founders_briefs` table | 2-4h | Lower long-term |
| B (Pragmatic) | Pass `approval_requests.task_output.founders_brief` directly to component | 1-2h | Tech debt |

**Recommendation**: Start with Option B (quick fix), migrate to Option A once Phase 0 stabilizes.

**Files to Modify**:
- `frontend/src/components/onboarding/FoundersBriefReview.tsx` - Update data source
- `frontend/src/app/api/onboarding/brief/route.ts` - Query `founders_briefs` instead of `entrepreneur_briefs`
- OR: `frontend/src/app/approvals/[id]/page.tsx` - Pass task_output directly

**Reference Plan**: `~/.claude/plans/gentle-booping-mitten.md` (Section C4)

**Why Deferred**: Less frequently hit path than stage progression bugs. Can ship P1 fixes first and validate the two-artifact architecture works end-to-end before updating UI.

### Consultant Alex UX Improvements (Backlog)

Repeat the Alex UX improvements for consultant onboarding (`/onboarding/consultant`):

| Task | Notes |
|------|-------|
| Route consultant dashboard CTA to Alex | Similar to founder-dashboard changes |
| Session management for consultants | Start new, resume indicator |
| Team awareness context | Alex → Sage handoff messaging |
| Test coverage | Unit + E2E tests |

**Reference**: See completed [Alex UX Improvements Plan](~/.claude/plans/frolicking-coalescing-whisper.md) for implementation pattern.

### PostHog Coverage Gaps

These events are defined in `ProductEvent` type but not implemented in user journey:

| Event | Category | Effort | Notes |
|-------|----------|--------|-------|
| user_login / user_logout | Auth | 1h | Add to auth callback/logout handlers |
| dashboard_viewed | Page Views | 30m | Add to founder-dashboard.tsx |
| analytics_viewed | Page Views | 30m | Add to analytics page |
| project_created / updated / deleted | Project Lifecycle | 2h | Add to project mutation handlers |
| evidence_uploaded | Evidence | 1h | Add to evidence upload flow |
| experiment_planned | Evidence | 1h | Add to experiment planning flow |
| canvas_completed | Canvas | 1h | Add to canvas save handlers |
| canvas_bmc_updated / vpc_updated / tbi_updated | Canvas | 2h | Add to respective canvas components |
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
| Accessibility & localisation sweep | ✅ **Completed** | WCAG 2.1 AA foundation done (Nov 28). See [done.md](done.md) |
| Rate limiting & plan telemetry | ✅ **Partial** | ~12 events wired (Nov 30). Coverage gaps in P2 above |
| Dashboard MVP (post-onboarding insights) | ✅ **Completed** | Report Viewer + Evidence Explorer done (Nov 28-29). See [done.md](done.md) |
| VPC visual fit lines | ✅ **Completed** | Strategyzer-style SVG canvas with animations (Nov 29) |
| Marketing contract parity automation | Backlog | Not yet prioritized |

---

## Backlog Triage

Backlog triage happens weekly with platform + AI platform leads. Update this table after sprint planning so docs and GitHub stay aligned.

**Next Review**: January 2026
**Last Updated**: 2026-01-15

---

## Phase 0 Audit Reports (2026-01-15)

Team audit created comprehensive documentation of Phase 0 issues:

| Report | Purpose |
|--------|---------|
| [phase0-retrospective-48h.md](../audits/phase0-retrospective-48h.md) | Git forensics of 10+ failed fixes |
| [phase0-spec-alignment-report.md](../audits/phase0-spec-alignment-report.md) | Spec vs implementation gaps |
| [phase0-alignment-task-list.md](../audits/phase0-alignment-task-list.md) | Prioritized task list |
| [phase0-spec-delta.md](../audits/phase0-spec-delta.md) | Proposed spec updates |

**Implementation Plan**: `~/.claude/plans/gentle-booping-mitten.md`
