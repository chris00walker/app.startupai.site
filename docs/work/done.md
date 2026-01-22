---
purpose: "Private technical source of truth for recently delivered work"
status: "active"
last_reviewed: "2026-01-22"
---

# Recently Delivered

## January 2026

### User Journey Documentation Complete (Jan 22)
| Item | Status | Notes |
|------|--------|-------|
| Support Journey Map | ✅ Done | US-S01-S05: Help, tickets, GDPR flows |
| Offboarding Journey Map | ✅ Done | US-O01-O05: Cancellation, exit survey, reactivation |
| Billing Journey Map | ✅ Done | US-B01-B10: Payment lifecycle, dunning, plan changes |
| Notification Journey Map | ✅ Done | US-N01-N05: In-app, email, preferences, escalation |
| Founder Trial Journey Map | ✅ Done | Trial onboarding through conversion |
| Account Settings Journey Map | ✅ Done | US-AS01-AS05: Profile, security, 2FA, devices |
| User Stories Update | ✅ Done | Added 30 new stories, total now 82 |
| Journey Test Matrix Update | ✅ Done | Added 6 matrices, 10 test files listed |
| User Personas Update | ✅ Done | Added Account Lifecycle + Billing States |
| E2E Test Stubs (5 files) | ✅ Done | 23-27.spec.ts with 146 test stubs |

**Problem Solved**: Critical documentation gaps for cross-cutting concerns (Help/Support, Offboarding, Billing, Notifications, Account Settings) that affected all 5 user types.

**Files Created:**
- `docs/user-experience/support-journey-map.md` - 5 phases, US-S01-S05
- `docs/user-experience/offboarding-journey-map.md` - 5 phases, US-O01-O05
- `docs/user-experience/billing-journey-map.md` - 6 phases, US-B01-B10
- `docs/user-experience/notification-journey-map.md` - 5 phases, US-N01-N05
- `docs/user-experience/founder-trial-journey-map.md` - 4 phases
- `docs/user-experience/account-settings-journey-map.md` - 5 phases, US-AS01-AS05
- `frontend/tests/e2e/23-support.spec.ts` - 19 test stubs
- `frontend/tests/e2e/24-offboarding.spec.ts` - 25 test stubs
- `frontend/tests/e2e/25-billing.spec.ts` - 44 test stubs
- `frontend/tests/e2e/26-notifications.spec.ts` - 27 test stubs
- `frontend/tests/e2e/27-account-settings.spec.ts` - 31 test stubs

**Files Modified:**
- `docs/user-experience/user-stories.md` - Added 30 new stories (S, O, B, N, AS groups)
- `docs/testing/journey-test-matrix.md` - Added 6 matrices, coverage now 38%
- `docs/user-experience/user-personas.md` - Added lifecycle states and billing states

**Impact**: Enables TDD for all cross-cutting user experiences. Coverage increased from 52 to 82 user stories. All 5 user types now have documented paths for support, billing, and account management.

---

### Project Archive/Delete Feature (Jan 14)
| Item | Status | Notes |
|------|--------|-------|
| API route for project management | ✅ Done | GET + PATCH + DELETE `/api/projects/[id]` |
| Hook mutations | ✅ Done | `archiveProject`, `unarchiveProject`, `deleteProject` in useProjects |
| Settings Projects tab | ✅ Done | Founder-only tab with archive/restore/delete UI |
| Impact counts display | ✅ Done | Real counts from hypotheses, evidence, experiments, reports |
| Type-to-confirm deletion | ✅ Done | AlertDialog with project name confirmation |
| Toast notifications | ✅ Done | Sonner toasts for success/error feedback |

**Problem Solved**: Founders had no way to archive or delete projects from the platform.

**Files Created:**
- `frontend/src/app/api/projects/[id]/route.ts` - GET + PATCH + DELETE endpoints
- `frontend/src/components/settings/ProjectsTab.tsx` - Projects management UI

**Files Modified:**
- `frontend/src/hooks/useProjects.ts` - Added mutation functions + includeArchived option
- `frontend/src/pages/settings.tsx` - Added 7th tab (Projects) for Founders via useRoleInfo()

**Documentation Updated:**
- `docs/features/project-client-management.md` - Feature specification
- `docs/features/wiring-matrix.md` - Status changed to "wired"
- `docs/features/feature-inventory.md` - Status changed to "active"
- `docs/features/ui-entrypoints.md` - Status changed to "wired"

**Impact**: Founders can now manage their projects from Settings - archive to hide from dashboard, restore archived projects, or permanently delete with cascade.

---

### Client Archive Feature (Jan 14)
| Item | Status | Notes |
|------|--------|-------|
| Database migration | ✅ Done | `archived_clients` junction table with RLS |
| API route | ✅ Done | PATCH `/api/clients/[id]/archive` |
| Hook mutations | ✅ Done | `archiveClient`, `unarchiveClient` in useClients |
| Settings Clients tab | ✅ Done | Consultant-only tab with archive/restore UI |
| Info card (not danger zone) | ✅ Done | Blue info card explaining non-destructive nature |

**Problem Solved**: Consultants had no way to manage their client portfolio visibility.

**Critical Constraint**: Archiving a client does NOT affect Founder data - it only hides the client from the Consultant's portfolio view.

**Files Created:**
- `frontend/src/app/api/clients/[id]/archive/route.ts` - PATCH endpoint with ownership verification
- `frontend/src/components/settings/ClientsTab.tsx` - Clients management UI

**Files Modified:**
- `frontend/src/hooks/useClients.ts` - Added archive mutations + includeArchived option + ClientInfo interface
- `frontend/src/pages/settings.tsx` - Added Clients tab for Consultants via useRoleInfo()

**Database Changes:**
- Created `archived_clients` table (junction table for consultant-client archive relationships)
- RLS policy: Consultants can only manage their own archived relationships

**Impact**: Consultants can now hide completed or inactive client relationships from their portfolio view without affecting the client's actual data.

---

## November 2025

### Alex UX Improvements (Nov 30)
| Item | Status | Notes |
|------|--------|-------|
| Project creation routing fix | ✅ Done | "Create Your First Project" now routes to Alex (`/onboarding/founder`) |
| Session management | ✅ Done | "Start New Conversation" button + resume indicator |
| Team awareness | ✅ Done | Alex knows about Sage and the 6 AI founders |
| Abandon session API | ✅ Done | `POST /api/onboarding/abandon` endpoint |
| Comprehensive test coverage | ✅ Done | 108 unit tests + 4 E2E tests |

**Problem Solved**: Users were bypassing Alex entirely via `/projects/new` quick wizard. No way to start fresh conversations.

**Files Created:**
- `frontend/src/app/api/onboarding/abandon/route.ts` - Session abandon endpoint
- `frontend/src/__tests__/api/onboarding/abandon/route.test.ts` - 10 API tests
- `frontend/src/__tests__/pages/founder-dashboard.test.tsx` - 10 routing tests
- `frontend/src/__tests__/lib/ai/onboarding-prompt.test.ts` - 37 prompt tests
- `frontend/src/components/onboarding/__tests__/OnboardingSidebar.test.tsx` - 27 component tests
- `frontend/src/components/onboarding/__tests__/OnboardingWizardV2.test.tsx` - 24 wizard tests

**Files Modified:**
- `frontend/src/pages/founder-dashboard.tsx` - Button routing to `/onboarding/founder`
- `frontend/src/components/onboarding/OnboardingSidebar.tsx` - `onStartNew`, `isResuming` props
- `frontend/src/components/onboarding/OnboardingWizardV2.tsx` - Session management logic
- `frontend/src/lib/ai/onboarding-prompt.ts` - Team context + Sage handoff
- `frontend/src/app/api/onboarding/start/route.ts` - Persona metadata (supervisor/team)
- `frontend/tests/e2e/02-onboarding-flow.spec.ts` - 4 new E2E session tests

**Impact**: Founders now have clear path to Alex for deep strategic conversations + ability to restart if needed.

---

### Public APIs for Marketing Site (Nov 30)
| Item | Status | Notes |
|------|--------|-------|
| Activity Feed API | ✅ Done | `GET /api/v1/public/activity` - anonymized agent activities |
| Metrics API | ✅ Done | `GET /api/v1/public/metrics` - platform + founder statistics |
| Database migration | ✅ Done | `public_activity_log` table with indexes (applied 2025-11-30) |
| Webhook activity logging | ✅ Done | CrewAI webhook now generates activity entries |

**Migration**: `20251130000001_public_activity_log.sql` - Supabase migration applied via MCP tool

**Files Created:**
- `frontend/src/db/schema/public-activity-log.ts` - Drizzle schema
- `frontend/src/app/api/v1/public/activity/route.ts` - Activity Feed API
- `frontend/src/app/api/v1/public/metrics/route.ts` - Metrics API

**Files Modified:**
- `frontend/src/app/api/crewai/webhook/route.ts` - Activity logging integration
- `frontend/src/db/schema/index.ts` - Export new schema

**Impact**: Unblocks marketing site Phase 4 - can now display real agent activity and trust metrics.

---

### PostHog Instrumentation (Nov 30)
| Item | Status | Notes |
|------|--------|-------|
| PostHog event tracking | ✅ Partial | ~12 events actively wired (17 types defined) |
| Signup tracking | ✅ Done | signup_started, signup_completed, signup_initiated_oauth, signup_failed |
| Onboarding funnel tracking | ✅ Done | session_started, stage_advanced, message_sent, exited_early, completed |
| CrewAI analysis tracking | ✅ Done | analysis_started, analysis_completed, analysis_failed |
| UI interaction tracking | ✅ Done | button_clicked, report_exported, dashboard_tab_switched, gate_alert_* |

**Coverage Gaps (see backlog.md):** login, logout, dashboard_viewed, project_*, evidence_*, canvas_* events defined but not implemented

**Commit**: `73510ec feat(analytics): wire PostHog instrumentation across user journey`

**Files Modified** (9):
- `src/lib/analytics.ts` - Extended ProductEvent type, added tracking helpers
- `src/components/onboarding/OnboardingWizardV2.tsx` - Funnel tracking
- `src/components/layout/AppSidebar.tsx` - Logout tracking
- `src/pages/founder-dashboard.tsx` - Page view + tab switch tracking
- `src/app/project/[id]/{analysis,report,evidence}/page.tsx` - Page views
- `src/components/reports/export/PDFExporter.tsx` - Export tracking

**Impact**: Clears the only remaining P0 blocker for Phase Alpha.

---

### Late November Completions (Nov 28-29)
| Item | Status | Notes |
|------|--------|-------|
| E2E test infrastructure fix | ✅ Done | Dashboard test timeouts fixed, parallel queries, API mocks |
| Accessibility WCAG 2.1 AA foundation | ✅ Done | Skip links, ARIA labels, keyboard navigation |
| CrewAI Report Viewer component | ✅ Done | Comprehensive report display for analysis results |
| Evidence Explorer with D-F-V metrics | ✅ Done | Unified evidence exploration, surfaces unused CrewAI fields |
| VPC Strategyzer-style SVG canvas | ✅ Done | Animated fit lines connecting pains↔relievers, gains↔creators |

**Commits**: `e417bae`, `b25e25a`, `bd743c8`, `870e713`, `2fe1cca`, `0cf17ca`

---

### Security Hardening (Nov 17)
| Item | Status | Notes |
|------|--------|-------|
| Database security migrations | ✅ Done | 16 migrations applied - RLS + function search_path fixes |
| RLS enabled on user_profiles | ✅ Done | 5 policies active, critical gap closed |
| RLS enabled on clients table | ✅ Done | 5 policies active, consultant-ownership model |
| SECURITY DEFINER functions secured | ✅ Done | 8 functions fixed with `SET search_path` |
| Trigger functions secured | ✅ Done | 6 trigger functions with deterministic behavior |

**Report**: See [Security Audit](../archive/audits/security-audit.md) - 0 critical issues remaining

---

### CrewAI Integration Infrastructure (Nov 26)
| Item | Status | Notes |
|------|--------|-------|
| CrewAI webhook infrastructure | ✅ Done | Unified `/api/crewai/webhook` endpoint |
| Results display UI | ✅ Done | `ValidationResultsSummary` wired to dashboard |
| Flywheel learning tables | ✅ Done | pgvector tables + search functions deployed |
| HITL approval system | ✅ Done | Approval requests table + API routes |
| Consultant onboarding integration | ✅ Done | Profile persistence + AI analysis webhook |
| CrewAI state_schemas.py validation | ✅ Done | Fixed Pydantic model validation issues |

**Status**: CrewAI Phase 2D complete (~85%), 18 tools implemented

---

### Verification & Audits Complete (Nov 28)
| Item | Status | Notes |
|------|--------|-------|
| TypeScript-Pydantic alignment | ✅ Verified | 97% alignment - all core models match |
| CrewAI E2E data flow | ✅ Verified | 6/7 flows connected (Webhook → DB → UI) |
| Strategyzer UX methodology | ✅ Verified | 97% alignment with Strategyzer/TBI frameworks |
| Schema alignment across layers | ✅ Verified | TypeScript ↔ Pydantic ↔ Supabase in sync |

**Reports**:
- [TypeScript-Pydantic Alignment](../archive/audits/typescript-pydantic-alignment.md)
- [CrewAI E2E Data Flow](../archive/audits/crewai-data-flow-verification.md)
- [Strategyzer UX Audit](../archive/audits/strategyzer-ux-audit.md)
- [Integration QA Summary](../archive/audits/CREWAI-FRONTEND-INTEGRATION-QA.md)

---

### VPC & Canvas Tools (Nov 24-25)
| Item | Status | Notes |
|------|--------|-------|
| VPC visualization components | ✅ Done | Read-only + editable variants |
| Full CRUD operations on VPC | ✅ Done | Create, edit, delete customer profiles & value maps |
| Validation state persistence | ✅ Done | All fields stored in Supabase |
| CrewAI Modal client migration | ✅ Done | Updated to new API structure |

---

### AI Founder & Signal Systems (Nov 26-27)
| Item | Status | Notes |
|------|--------|-------|
| HITL Approval System UI | ✅ Done | 9 approval types with decision workflows |
| Innovation Physics Signals | ✅ Done | D-F-V gauges with phase tracking |
| AI Founder Attribution | ✅ Done | 6 AI Founders with status tracking |
| BMC-Viability-VPC orchestration | ✅ Done | Unified signals integration |

---

## October 2025

| Date | Item | Links / Notes |
| --- | --- | --- |
| 2025-10-26 | Private docs realigned with live code (specs, overview, status) | Internal PR (pending) capturing updates to `docs/specs/*` and `docs/specs/*`; unblock spec-driven tests. |
| 2025-10-24 | Supabase onboarding migrations applied | https://github.com/chris00walker/app.startupai.site/pull/411 |
| 2025-10-18 | Onboarding wizard UI launched with accessibility scaffold | https://github.com/chris00walker/app.startupai.site/pull/405 |
