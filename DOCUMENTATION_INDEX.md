# StartupAI Platform - Documentation Index

**Last Updated**: 2025-11-13

This document provides a structured index of all architectural and engineering documentation for the StartupAI platform.

---

## 📂 Quick Navigation

### 🟢 Current & Active
1. **[frontend/MIGRATION_COMPLETE.md](./frontend/MIGRATION_COMPLETE.md)** - ✅ Client migration + recent auth fixes (2025-11-13)
2. **[frontend/MIGRATION_SUMMARY.md](./frontend/MIGRATION_SUMMARY.md)** - ✅ Technical migration details + routing architecture

### 🔴 Critical - Read First
3. **[ONBOARDING_FAILURE_ANALYSIS.md](./ONBOARDING_FAILURE_ANALYSIS.md)** - Current system failures
4. **[ONBOARDING_TO_CREWAI_ARCHITECTURE.md](./ONBOARDING_TO_CREWAI_ARCHITECTURE.md)** - Implementation plan to fix
5. **[CONSULTANT_VS_FOUNDER_CLARIFICATION.md](./CONSULTANT_VS_FOUNDER_CLARIFICATION.md)** - User role ambiguity analysis

### 🟡 Architecture & Planning
6. **[ARCHITECTURE_RECOMMENDATIONS.md](./ARCHITECTURE_RECOMMENDATIONS.md)** - Long-term Option B vision
7. **[frontend/SYSTEM_ENGINEER_HANDOFF.md](./frontend/SYSTEM_ENGINEER_HANDOFF.md)** - ⚠️ Historical context (most issues resolved)

### 🟢 Testing & Quality
8. **[E2E_TEST_IMPLEMENTATION.md](./E2E_TEST_IMPLEMENTATION.md)** - Playwright E2E test infrastructure
9. **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing workflow and procedures

### 🟢 Reference
10. **[docs/specs/auth.md](./docs/specs/auth.md)** - Authentication specification
11. **[docs/specs/mvp-specification.md](./docs/specs/mvp-specification.md)** - MVP feature specifications
12. **[docs/](./docs/)** - Additional documentation
   - `docs/features/stage-progression.md` - Onboarding stage system design
   - `docs/engineering/database-schema-updates.md` - Database schema reference

---

## 📋 Document Summaries

### 1. ONBOARDING_FAILURE_ANALYSIS.md
**Purpose**: Forensic systems engineering analysis of why onboarding is broken

**When to read**: When you need to understand:
- Why progress shows 0% despite user completing conversation
- Why AI isn't calling tools (assessQuality, advanceStage, completeOnboarding)
- Where conversation data is actually stored
- Complete data flow: Frontend → API → Storage
- Why CrewAI workflow was never triggered

**Key sections**:
- Expected vs Actual Architecture diagrams
- Root Cause Analysis (3 primary failures)
- Data Flow: Where Your Conversation Went
- Why Information Wasn't Handed Off to CrewAI
- Required Fixes (prioritized)

**Related files**:
- `/api/chat/route.ts` - Chat API with broken tool handling
- `/lib/ai/onboarding-prompt.ts` - System prompt (weak tool instructions)
- `/components/onboarding/OnboardingWizardV2.tsx` - Frontend interface

---

### 2. ONBOARDING_TO_CREWAI_ARCHITECTURE.md
**Purpose**: Complete implementation plan to fix broken onboarding workflow

**When to read**: When you're ready to implement the fix

**Timeline**: 11 hours (~1.5 days)

**Key sections**:
- **Problem Statement** - User experience issues (screenshot evidence)
- **Current Architecture (BROKEN)** - Data flow diagrams
- **Desired Architecture (FIXED)** - Target state diagrams
- **Data Flow: Brief Schema Mapping** - Supabase ↔ CrewAI format conversion
- **Implementation Checklist**:
  - Phase 1: Fix Tool Calling (2 hours)
  - Phase 2: Add CrewAI Integration (3 hours)
  - Phase 3: Fix Frontend UX (2 hours)
- **Testing Strategy** - 3 critical tests
- **Rollback Plan** - What to do if it breaks
- **Environment Variables** - Required config

**Related files**:
- `/api/chat/route.ts` - Needs tool-calling fixes + CrewAI handler
- `/lib/crewai/client.ts` - NEW FILE to create
- `/lib/ai/onboarding-prompt.ts` - Needs stronger instructions
- `/components/onboarding/OnboardingWizardV2.tsx` - Needs analysis modal
- `/app/api/crewai/status/route.ts` - NEW FILE to create
- `supabase/migrations/00009_onboarding_schema.sql` - Database schema (already correct)

**Prerequisites**:
- Review `ONBOARDING_FAILURE_ANALYSIS.md` first
- Understand entrepreneur brief schema (covered in doc)
- Know CrewAI AMP deployment details (covered in doc)

---

### 3. ARCHITECTURE_RECOMMENDATIONS.md
**Purpose**: Original Option B vision - long-term architecture for CrewAI AMP integration

**When to read**: When planning long-term architecture decisions

**Scope**:
- Phase 1: Refactor CrewAI Crew (rename Onboarding Agent → Supervisor Agent)
- Phase 2: Frontend Integration with MCP
- Phase 3: Dashboard Results Display

**Timeline**: 11-18 hours (1-2 days)

**Key sections**:
- Executive Summary - Vision and benefits
- Current State (Option A) - What's working after streaming fix
- Target State (Option B) - Clean separation of concerns
- Implementation Phases - Detailed step-by-step
- Testing Strategy - Unit + integration tests
- Rollback Plan - How to undo changes
- Monitoring & Observability - Production monitoring
- Success Criteria - Definition of done

**Related files**:
- `~/projects/startupai-crew/src/startupai/crew.py` - CrewAI crew definition
- `~/projects/startupai-crew/config/agents.yaml` - Agent configurations
- `~/projects/startupai-crew/config/tasks.yaml` - Task configurations
- `/lib/crewai/client.ts` - CrewAI integration client (NEW)
- `/components/analysis/AnalysisResults.tsx` - Results display (NEW)

**Relationship to other docs**:
- Builds on fixes from `ONBOARDING_TO_CREWAI_ARCHITECTURE.md`
- Provides long-term vision beyond immediate fixes
- More comprehensive than just fixing broken workflow

---

### 4. SYSTEM_ENGINEER_HANDOFF.md
**Purpose**: Historical context - investigation into Forbidden errors and streaming issues

**When to read**: When you need historical context about Option A implementation

**Timeline**: Created during previous conversation (before onboarding failure discovered)

**Key sections**:
- Forbidden Error Investigation
- Option A: Quick Win (Remove Anthropic, fix streaming)
- Option B: Full Refactor (CrewAI AMP integration)
- SSE Format Parsing Fix
- MCP Server Setup

**Related files**:
- `/api/chat/route.ts` - Removed Anthropic provider
- `/api/assistant/chat/route.ts` - Removed Anthropic provider
- `/api/consultant/chat/route.ts` - Removed Anthropic provider
- `/components/onboarding/OnboardingWizardV2.tsx` - SSE parsing fix

**Historical commits**:
- 98d88e8 - "refactor: remove Anthropic provider, simplify to OpenAI-only"
- c3af469 - "fix: parse SSE format in onboarding chat instead of displaying raw stream"

---

### 6. E2E_TEST_IMPLEMENTATION.md (NEW)
**Purpose**: Comprehensive Playwright E2E testing infrastructure documentation

**When to read**: When implementing or debugging automated tests

**Key sections**:
- Test Infrastructure Setup (Playwright configuration)
- Test Files Structure (`tests/e2e/` directory layout)
- Test User Credentials (Consultant and Founder)
- Test Coverage (15 tests: 1 passing, 14 failing)
- Required UI Attributes (`data-testid` list)
- Running Tests (commands and options)
- Test Artifacts (screenshots, videos, traces)

**Current Status**:
- ✅ Playwright configured to use Chromium
- ✅ Authentication tests implemented
- ✅ Onboarding flow tests implemented
- ❌ Tests failing due to missing `data-testid` attributes
- ❌ Network idle timeout issues

**Related files**:
- `frontend/playwright.config.ts` - Playwright configuration
- `frontend/tests/e2e/01-login.spec.ts` - Authentication tests
- `frontend/tests/e2e/02-onboarding-flow.spec.ts` - Onboarding tests
- `frontend/tests/e2e/helpers/auth.ts` - Auth helper functions
- `frontend/tests/e2e/helpers/onboarding.ts` - Onboarding helper functions

---

### 7. CONSULTANT_VS_FOUNDER_CLARIFICATION.md (NEW)
**Purpose**: Analysis of user role ambiguity discovered during testing

**When to read**: When making product decisions about user workflows

**Key sections**:
- Problem Statement - Ambiguity about Consultant onboarding
- Current Observed Behavior (test findings)
- Analysis: Possible Interpretations (3 hypotheses)
  1. Consultants onboard themselves
  2. Consultants onboard their clients
  3. Consultants skip onboarding
- Impact on Testing
- Recommendations (short-term and long-term)
- Questions for User (decision points)

**Critical Discovery**:
- Consultants redirect to `/onboarding/consultant` (307 - incomplete?)
- Founders go to `/onboarding/founder` (200 - working)
- Tests cannot verify correct Consultant behavior
- Product direction unclear

**Requires Decision**:
- [ ] What is the intended Consultant user journey?
- [ ] Should Consultants see "AI Assistant" button?
- [ ] What's the relationship between Consultants and Founders?
- [ ] What happens when Consultant clicks "AI Assistant"?

---

## 🔀 Document Relationships

```
SYSTEM_ENGINEER_HANDOFF.md (Historical)
    │
    ├─> Option A (Quick Fix) ─────────> ✅ Streaming working
    │                                        │
    │                                        ├─> USER TESTED
    │                                        │       │
    │                                        │       ├─> ❌ Progress stuck at 0%
    │                                        │       ├─> ❌ No project created
    │                                        │       └─> ❌ Bad UX (empty dashboard)
    │                                        │
    │                                        └─> ONBOARDING_FAILURE_ANALYSIS.md
    │                                                    │
    │                                                    └─> Root cause analysis
    │                                                            │
    │                                                            └─> ONBOARDING_TO_CREWAI_ARCHITECTURE.md
    │                                                                    │
    │                                                                    └─> 🎯 Implementation plan
    │                                                                        (Fix + Integrate)
    │
    └─> Option B (Long-term Vision) ──> ARCHITECTURE_RECOMMENDATIONS.md
                                            │
                                            └─> Future enhancements
                                                (Supervisor Agent, MCP integration)
```

---

## 🎯 Implementation Workflow

**If you're starting fresh, follow this order:**

### Step 1: Understand the Problem
Read: `ONBOARDING_FAILURE_ANALYSIS.md`
- Understand why current system is broken
- See data flow diagrams
- Know where conversation data is stored

### Step 2: Review the Fix Plan
Read: `ONBOARDING_TO_CREWAI_ARCHITECTURE.md`
- Understand 3-phase implementation
- Review brief schema mapping
- Check environment variables

### Step 3: Implement Phase 1 (Fix Tools)
Files to modify:
- `/api/chat/route.ts` - Switch model, add toolChoice
- `/lib/ai/onboarding-prompt.ts` - Strengthen instructions

Test: Verify AI calls tools, progress updates

### Step 4: Implement Phase 2 (CrewAI Integration)
Files to create:
- `/lib/crewai/client.ts` - CrewAI API wrapper
- `/lib/crewai/types.ts` - TypeScript types
- `/app/api/crewai/status/route.ts` - Status polling

Files to modify:
- `/api/chat/route.ts` - Add completeOnboarding handler

Test: Verify CrewAI kickoff, status polling, project creation

### Step 5: Implement Phase 3 (Frontend UX)
Files to modify:
- `/components/onboarding/OnboardingWizardV2.tsx` - Add analysis modal

Test: End-to-end flow works, auto-redirect to project

### Step 6: Review Long-Term Vision
Read: `ARCHITECTURE_RECOMMENDATIONS.md`
- Understand Supervisor Agent refactor
- Plan future MCP integration
- Consider dashboard improvements

---

## 📊 File Categories

### API Routes
- `/api/chat/route.ts` - Onboarding chat (needs fixes)
- `/api/assistant/chat/route.ts` - Dashboard assistant
- `/api/consultant/chat/route.ts` - Consultant onboarding
- `/api/onboarding/status/route.ts` - Session status polling
- `/api/crewai/status/route.ts` - CrewAI workflow status (NEW)

### Components
- `/components/onboarding/OnboardingWizardV2.tsx` - Onboarding UI
- `/components/onboarding/OnboardingSidebar.tsx` - Progress sidebar
- `/components/analysis/AnalysisResults.tsx` - Results display (NEW)

### Libraries
- `/lib/ai/onboarding-prompt.ts` - System prompts
- `/lib/crewai/client.ts` - CrewAI integration (NEW)
- `/lib/crewai/types.ts` - TypeScript types (NEW)
- `/lib/supabase/server.ts` - Supabase client
- `/lib/supabase/admin.ts` - Admin client

### Database
- `supabase/migrations/00009_onboarding_schema.sql` - Onboarding tables
- Functions: `create_project_from_onboarding()`, `upsert_entrepreneur_brief()`

### CrewAI Crew
- `~/projects/startupai-crew/src/startupai/crew.py` - Crew definition
- `~/projects/startupai-crew/config/agents.yaml` - Agent configs
- `~/projects/startupai-crew/config/tasks.yaml` - Task configs

---

## 🔍 Search Guide

**Looking for...**

| What | Where |
|------|-------|
| Why onboarding is broken | `ONBOARDING_FAILURE_ANALYSIS.md` |
| How to fix onboarding | `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` |
| Long-term architecture | `ARCHITECTURE_RECOMMENDATIONS.md` |
| Historical context | `SYSTEM_ENGINEER_HANDOFF.md` |
| Brief schema mapping | `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` § Data Flow |
| Database schema | `supabase/migrations/00009_onboarding_schema.sql` |
| CrewAI crew structure | `~/projects/startupai-crew/` |
| Environment variables | `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` § Environment Variables |
| Testing strategy | `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` § Testing Strategy |
| Rollback plan | `ONBOARDING_TO_CREWAI_ARCHITECTURE.md` § Rollback Plan |

---

## 📝 Notes

### Documentation Maintenance
- This index should be updated when new architecture docs are added
- Cross-references between docs should be kept in sync
- Old docs should be moved to `docs/archive/` not deleted

### Document Versioning
- All architecture docs include creation date in header
- Major changes should update the date
- Breaking changes should create new versioned docs

## Recent Changes (2025-11-13)

### Authentication & Routing Fixes
**Documentation Updated:** `frontend/MIGRATION_COMPLETE.md`, `frontend/MIGRATION_SUMMARY.md`

**Key Changes:**
- ✅ Role-specific dashboard routing (consultants → `/consultant-dashboard`, founders → `/founder-dashboard`)
- ✅ Fixed 404 errors on login (removed hardcoded `/dashboard` route)
- ✅ Email/password and OAuth now use same role-based redirect logic
- ✅ Settings, dashboard, and client portfolio now display real user data
- ✅ Removed "Demo Mode" and "Trial Mode" banners for active accounts

**Files Modified:**
- `src/pages/dashboard.tsx` → `src/pages/consultant-dashboard.tsx`
- `src/lib/auth/roles.ts` - Updated ROLE_REDIRECTS
- `src/components/auth/LoginForm.tsx` - Added role-based redirect logic
- `src/app/auth/callback/route.ts` - Removed hardcoded fallbacks
- `src/pages/settings.tsx` - Fetch real user profile
- `src/components/layout/AppSidebar.tsx` - Updated navigation links

**Status:**
- ⚠️ RLS currently **DISABLED** on `user_profiles` - needs proper policies before re-enabling

---

**Last Updated**: 2025-11-13
**Maintained By**: Engineering Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
