# Integration Health Report

**Generated**: 2026-01-28
**Status**: Complete
**Purpose**: Analyze API wiring health to inform integration traceability system design

---

## Executive Summary

This report documents the health of API integrations across the StartupAI platform, identifying:
- Orphan API calls (frontend code calling nonexistent routes)
- Dead code (implemented but unused hooks/components)
- Critical user path wiring
- Inbound/outbound API contracts
- E2E test coverage gaps

The findings will inform the design of an integration health subsystem within the traceability framework.

---

## 1. Orphan API Calls (Task #30)

**Definition**: Frontend code that calls API routes that don't exist.

### Findings

| Route Called | Caller | Classification | Recommended Action |
|--------------|--------|----------------|-------------------|
| `/api/chat/save` | `useOnboardingRecovery.ts:168` | Dead Code | Remove hook entirely |
| `/api/crewai/analyze` | `useCrewAIState.ts:430` | Dead Code | Remove `useCrewAIKickoff` function |
| `/api/onboarding/start` | Test files only | Spec Without Impl | Fix tests or implement route |
| `/api/onboarding/message` | Test files only | Spec Without Impl | Fix tests or implement route |
| `/api/onboarding/complete` | Test files only | Spec Without Impl | Fix tests or implement route |

### Analysis

**Dead Code Pattern**: Two hooks were fully implemented with tests but never integrated:
- `useOnboardingRecovery` - Intended for recovering failed chat saves
- `useCrewAIKickoff` (in `useCrewAIState.ts`) - Intended for triggering analysis

These represent ~500 lines of dead code that should be removed or properly integrated.

**Spec Without Implementation Pattern**: Tests in `__tests__/api-contracts/endpoint-validation.test.tsx` validate contracts for routes that were never implemented. This suggests either:
- Routes were designed but not built
- Routes existed and were removed without updating tests

---

## 2. Critical User Path Wiring (Task #31)

### Primary Flows (Working)

| Flow | UI Entry Point | API Route | Backend Service | Status |
|------|---------------|-----------|-----------------|--------|
| **Quick Start** | `QuickStartForm.tsx:263` | `/api/projects/quick-start` | Modal `/kickoff` | ✅ Working |
| **Webhook Receive** | N/A (inbound) | `/api/crewai/webhook` | From Modal | ✅ Working |
| **HITL Checkpoint** | N/A (inbound) | `/api/approvals/webhook` | From Modal | ✅ Working |
| **HITL Resume** | Approval UI | `/api/crewai/resume` | Modal `/resume` | ✅ Working |
| **Trial Status** | `TrialStatusCard.tsx:93` | `/api/trial/status` | Supabase direct | ✅ Working |
| **Agent Status** | `AgentStatus.tsx:95` | `/api/agents/status` | Supabase direct | ✅ Working |
| **CrewAI Retry** | `ValidationProgressTimeline.tsx:223` | `/api/crewai/retry` | Modal | ✅ Working |

### Secondary/Legacy Flows

| Flow | UI Entry Point | API Route | Notes |
|------|---------------|-----------|-------|
| **Project Create (Legacy)** | `ProjectCreationWizard.tsx:119` | `/api/projects/create` → `/api/analyze` | Superseded by Quick Start |
| **Consultant Onboarding** | `app/onboarding/consultant/page.tsx` | Redirects only | Per ADR-006, no AI conversation |

### Flow Diagram: Quick Start (Primary Path)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│ QuickStartForm  │────▶│ /api/projects/       │────▶│   Modal     │
│     .tsx        │     │    quick-start       │     │  /kickoff   │
└─────────────────┘     └──────────────────────┘     └──────┬──────┘
                                  │                         │
                                  ▼                         │
                        ┌──────────────────┐                │
                        │    Supabase      │                │
                        │  - projects      │                │
                        │  - validation_   │                │
                        │    runs          │◀───────────────┘
                        └────────┬─────────┘        (webhook)
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ /api/crewai/     │
                        │    webhook       │
                        └──────────────────┘
```

---

## 3. E2E Test Coverage (Task #32)

*Status: Complete*

### Critical Finding: E2E Tests Mock Nonexistent Routes

**46 E2E test files** mock API routes, but many mock routes that don't exist:

#### Routes Mocked That Don't Exist

| Mocked Route | Test Files | Issue |
|--------------|------------|-------|
| `/api/hitl/*` | `14-hitl-extended.spec.ts`, `15-pivot-workflows.spec.ts` | Should use `/api/crewai/resume` or `/api/approvals/*` |
| `/api/user/*` | `13-trial-limits.spec.ts`, `27-account-settings.spec.ts` | Should use `/api/trial/*` or `/api/settings/*` |
| `/api/billing/*` | `25-billing.spec.ts` | No billing routes exist |
| `/api/notifications/*` | `26-notifications.spec.ts` | No notification routes exist |
| `/api/help/*` | `23-support.spec.ts` | No help routes exist |
| `/api/support/*` | `23-support.spec.ts` | No support routes exist |
| `/api/subscription/*` | `24-offboarding.spec.ts`, `25-billing.spec.ts` | Should use `/api/stripe/*` |

#### Routes Mocked That Exist (Coverage)

| Mocked Route | Test Files | Status |
|--------------|------------|--------|
| `/api/projects*` | `11-project-lifecycle.spec.ts`, `13-trial-limits.spec.ts` | ✅ Covered |
| `/api/approvals*` | `14-hitl-extended.spec.ts`, `15-pivot-workflows.spec.ts` | ✅ Covered |
| `/api/consultant/clients*` | `12-client-lifecycle.spec.ts`, `22-consultant-trial.spec.ts` | ✅ Covered |
| `/api/stripe/create-checkout-session` | `13-trial-limits.spec.ts` | ✅ Covered |
| `/api/crewai/**` | `helpers/api-mocks.ts` | ✅ Covered |
| `/api/agents/status` | `helpers/api-mocks.ts` | ✅ Covered |

### Impact

E2E tests provide false confidence - they pass because mocks satisfy assertions, but the actual routes don't exist. When these features are implemented, the tests won't validate real behavior.

---

## 4. Inbound Webhooks (Task #33)

*Status: Complete*

### Webhook Inventory

| Endpoint | Source | Auth Method | Flow Types | Contract |
|----------|--------|-------------|------------|----------|
| `/api/crewai/webhook` | Modal | Bearer `MODAL_AUTH_TOKEN` | `founder_validation`, `consultant_onboarding`, `progress_update`, `hitl_checkpoint` | Zod schemas in `schemas.ts` |
| `/api/approvals/webhook` | Modal | Bearer `MODAL_AUTH_TOKEN` | HITL checkpoints | Inline validation |
| `/api/stripe/webhook` | Stripe | Signature (`STRIPE_WEBHOOK_SECRET`) | `checkout.session.completed`, `customer.subscription.*` | Stripe types |

### Schema Contracts (CrewAI Webhook)

```
├── founderValidationSchema     - Validation results + VPC + evidence
├── consultantOnboardingSchema  - Practice analysis + recommendations
├── progressUpdateSchema        - Real-time progress (run_id, phase, pct)
└── hitlCheckpointSchema        - Approval requests (options, recommended)
```

All schemas defined in `frontend/src/app/api/crewai/webhook/schemas.ts` with exported types.

---

## 5. Outbound API Calls (Task #34)

*Status: Complete*

### Modal API Calls

| Caller Route | Target | Method | Auth |
|--------------|--------|--------|------|
| `/api/projects/quick-start` | `MODAL_KICKOFF_URL` | POST | Bearer |
| `/api/analyze` | `MODAL_KICKOFF_URL` | POST | Bearer |
| `/api/crewai/retry` | `MODAL_KICKOFF_URL` | POST | Bearer |
| `/api/crewai/resume` | `MODAL_HITL_APPROVE_URL` | POST | Bearer |
| `/api/crewai/status` | `MODAL_STATUS_URL` | GET | Bearer |
| `/api/agents/status` | `MODAL_STATUS_URL` | GET | Bearer |
| `/api/admin/workflows/[id]/retry` | `MODAL_KICKOFF_URL` | POST | Bearer |
| `/api/consultant/onboarding/complete` | `MODAL_KICKOFF_URL` | POST | Bearer |

### Stripe API Calls

| Caller Route | SDK Method | Purpose |
|--------------|------------|---------|
| `/api/stripe/create-checkout-session` | `stripe.checkout.sessions.create()` | Payment initiation |
| `/api/stripe/webhook` | `stripe.webhooks.constructEvent()` | Verify webhook signature |

### Environment Dependencies

```
MODAL_KICKOFF_URL       - Start validation runs
MODAL_STATUS_URL        - Poll run status
MODAL_HITL_APPROVE_URL  - Resume after HITL approval
MODAL_AUTH_TOKEN        - Bearer token for all Modal calls
STRIPE_SECRET_KEY       - Stripe API access
STRIPE_WEBHOOK_SECRET   - Webhook signature verification
```

---

## 6. Route Fan-In/Fan-Out Analysis (Task #35)

*Status: Complete*

### High Fan-In Routes (Components → Route)

Most routes have 1-2 callers. Higher fan-in = higher change risk:

| Route | Caller Count | Risk |
|-------|--------------|------|
| `/api/settings/security/sessions` | 2 | Low |
| `/api/settings/preferences` | 2 | Low |
| `/api/settings/notifications` | 2 | Low |
| `/api/admin/health` | 2 | Low |

**Finding**: Fan-in is generally low - good separation of concerns.

### High Fan-Out Routes (Route → Tables/Services)

Routes with high external dependencies = higher failure blast radius:

| Route | Tables Touched | Modal Calls | Risk Level |
|-------|----------------|-------------|------------|
| `/api/crewai/webhook` | **11** | 3 | **High** |
| `/api/analyze` | 7 | 2 | Medium |
| `/api/projects/quick-start` | 4 | 2 | Medium |
| `/api/crewai/resume` | 2 | 3 | Medium |

**Critical Finding**: `/api/crewai/webhook` touches 11 database tables. Changes to this route have the highest blast radius. Consider:
- Comprehensive test coverage
- Database transaction boundaries
- Error handling for partial failures

---

## 7. Traceability System Fit Analysis (Task #36)

*Status: Complete*

### Current Traceability Architecture

```
Annotations (@story) → Generator → story-code-map.json → Lookup Skills
                              ↓
                    Subsystems: schema-drift, schema-coverage, fk-consistency
```

### Integration Health Fit Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A: Extend story-code-map** | Add api_wiring fields to existing map | Unified system | Bloats main map |
| **B: Separate map** | New `api-wiring-map.json` | Clean separation | Another file to maintain |
| **C: Quality gate only** | No map, just validation | Simple | No historical tracking |
| **D: Hybrid (Recommended)** | Subsystem + quality gate | Best of both | Moderate complexity |

### Recommended: Option D (Hybrid Subsystem)

Create `docs/traceability/api-wiring/` as a new subsystem alongside schema-drift:

```
docs/traceability/
├── README.md
├── story-code-map.json
├── schema-drift/          # Existing
├── schema-coverage.md     # Existing
└── api-wiring/            # NEW
    ├── README.md
    ├── api-wiring-map.json     # Generated
    ├── orphan-report.md        # Generated
    └── e2e-coverage-report.md  # Generated
```

---

## 8. Alternative Approaches (Task #37)

*Status: Complete*

### Alternative 1: OpenAPI/Swagger Generation

**Concept**: Generate OpenAPI spec from route files, validate against.

**Pros**: Industry standard, tooling exists
**Cons**: Overhead of maintaining spec, doesn't catch orphan calls

**Verdict**: Too heavy for current needs

### Alternative 2: TypeScript Compiler Plugin

**Concept**: Custom tsc plugin to validate fetch calls at compile time.

**Pros**: Catches errors at build
**Cons**: Complex to implement, requires TypeScript expertise

**Verdict**: Overkill, static analysis sufficient

### Alternative 3: E2E Test Assertions

**Concept**: Add assertions to E2E tests that verify route existence.

**Pros**: Validates at test time
**Cons**: Tests already mock routes, would need real calls

**Verdict**: Complementary but not sufficient alone

### Alternative 4: Runtime Instrumentation

**Concept**: Instrument fetch calls to log actual vs expected routes.

**Pros**: Catches runtime issues
**Cons**: Performance overhead, only catches what's executed

**Verdict**: Good for monitoring, not for static validation

### Conclusion

**Static analysis (Option D)** is the right approach:
- Catches issues before runtime
- No performance overhead
- Integrates with existing traceability system
- Can be added to quality gate

---

## 9. System Design (Task #38)

*Status: Complete*

### API Wiring Subsystem Design

#### Purpose

Detect and report:
1. **Orphan API Calls** - Frontend code calling routes that don't exist
2. **E2E Coverage Gaps** - Routes not covered by E2E tests (or mocking nonexistent routes)
3. **Contract Drift** - Webhook schemas out of sync with senders
4. **Dependency Graph** - Route → external service mappings

#### Architecture

```
Frontend Code              API Routes                External Services
(fetch calls)              (route.ts files)          (Modal, Stripe, etc.)
      │                          │                          │
      ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    api-wiring-scanner.ts                         │
│                                                                  │
│  1. Scan for fetch('/api/*') calls → callers[]                  │
│  2. Scan for route.ts files → routes[]                          │
│  3. Scan for webhook schemas → contracts[]                       │
│  4. Scan for outbound calls (Modal, Stripe) → dependencies[]     │
│  5. Cross-reference E2E mocks → coverage[]                       │
│  6. Generate api-wiring-map.json                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     api-wiring-map.json       │
              │     (generated, read-only)    │
              └───────────────────────────────┘
```

#### Generated Artifacts

**`api-wiring-map.json`**:
```json
{
  "routes": {
    "/api/projects/quick-start": {
      "file": "frontend/src/app/api/projects/quick-start/route.ts",
      "methods": ["POST"],
      "callers": ["frontend/src/components/onboarding/QuickStartForm.tsx:263"],
      "outbound": {
        "modal": ["kickoff"],
        "supabase": ["projects", "validation_runs", "crewai_validation_states"]
      },
      "e2e_coverage": ["16-quick-start-founder.spec.ts"],
      "stories": ["US-F01", "US-F07"]
    }
  },
  "orphans": {
    "/api/chat/save": {
      "callers": ["frontend/src/hooks/useOnboardingRecovery.ts:168"],
      "classification": "dead_code",
      "recommendation": "Remove caller"
    }
  },
  "e2e_gaps": {
    "/api/hitl/approve": {
      "mocked_in": ["14-hitl-extended.spec.ts"],
      "actual_route": null,
      "recommendation": "Update test to use /api/crewai/resume"
    }
  },
  "webhooks": {
    "/api/crewai/webhook": {
      "source": "Modal",
      "auth": "Bearer MODAL_AUTH_TOKEN",
      "schemas": ["founderValidationSchema", "progressUpdateSchema", "hitlCheckpointSchema"],
      "contract_file": "frontend/src/app/api/crewai/webhook/schemas.ts"
    }
  }
}
```

#### Commands

```bash
# Generate the wiring map
pnpm api-wiring:generate

# Validate (fail on orphans)
pnpm api-wiring:validate

# Check in CI
pnpm api-wiring:ci
```

#### Quality Gate Integration

Add to `/quality-gate` skill:

```bash
# 6. API Wiring validation
echo "🔌 Checking API wiring..."
pnpm api-wiring:ci
```

Validation rules:
- **Error**: Orphan API calls in production code (not tests)
- **Warning**: E2E tests mocking nonexistent routes
- **Warning**: Routes with no E2E coverage
- **Info**: High fan-out routes (>5 tables)

#### Implementation Priority

| Phase | Deliverable | Effort |
|-------|-------------|--------|
| **P1** | Orphan detection script | 2 hours |
| **P2** | E2E coverage analysis | 2 hours |
| **P3** | Full map generation | 4 hours |
| **P4** | Quality gate integration | 1 hour |
| **P5** | Webhook contract validation | 2 hours |

**Total: ~11 hours for full implementation**

---

## 10. Recommendations

### Immediate Actions (No System Needed)

1. **Remove Dead Code** (~1 hour)
   - Delete `useOnboardingRecovery` hook
   - Delete `useCrewAIKickoff` from `useCrewAIState.ts`
   - Remove tests for nonexistent `/api/onboarding/*` routes

2. **Fix E2E Test Mocks** (~2 hours)
   - Update `/api/hitl/*` mocks to use `/api/crewai/resume`
   - Update `/api/user/*` mocks to use actual routes
   - Remove tests for unimplemented features or mark as `skip`

### Medium-Term (Build the System)

3. **Implement P1: Orphan Detection** (~2 hours)
   - Script to scan fetch calls and verify route existence
   - Add to quality gate as error check

4. **Implement P2: E2E Coverage Analysis** (~2 hours)
   - Script to extract mocked routes from E2E tests
   - Cross-reference against actual routes
   - Generate coverage report

### Long-Term (Full System)

5. **Implement P3-P5** (~7 hours)
   - Full api-wiring-map.json generation
   - Webhook contract tracking
   - Quality gate integration

---

## Appendix A: File Locations

### Orphan Callers (Dead Code)
- `frontend/src/hooks/useOnboardingRecovery.ts:168` → `/api/chat/save`
- `frontend/src/hooks/useCrewAIState.ts:430` → `/api/crewai/analyze`

### Spec-Without-Implementation Tests
- `frontend/src/__tests__/api-contracts/endpoint-validation.test.tsx`
- `frontend/src/__tests__/production/deployment-validation.test.tsx`
- `frontend/src/__tests__/api/onboarding/start-adr005.test.ts`

### E2E Tests Mocking Nonexistent Routes
- `frontend/tests/e2e/14-hitl-extended.spec.ts` → `/api/hitl/*`
- `frontend/tests/e2e/15-pivot-workflows.spec.ts` → `/api/hitl/*`
- `frontend/tests/e2e/13-trial-limits.spec.ts` → `/api/user/*`
- `frontend/tests/e2e/27-account-settings.spec.ts` → `/api/user/*`
- `frontend/tests/e2e/25-billing.spec.ts` → `/api/billing/*`, `/api/subscription/*`
- `frontend/tests/e2e/26-notifications.spec.ts` → `/api/notifications/*`
- `frontend/tests/e2e/23-support.spec.ts` → `/api/help/*`, `/api/support/*`
- `frontend/tests/e2e/24-offboarding.spec.ts` → `/api/subscription/*`

### Critical Route Implementations
- `frontend/src/app/api/projects/quick-start/route.ts`
- `frontend/src/app/api/crewai/webhook/route.ts`
- `frontend/src/app/api/crewai/resume/route.ts`
- `frontend/src/app/api/approvals/webhook/route.ts`
- `frontend/src/app/api/stripe/webhook/route.ts`
- `frontend/src/app/api/stripe/create-checkout-session/route.ts`

### Webhook Schema Contracts
- `frontend/src/app/api/crewai/webhook/schemas.ts`

### External Service Clients
- `frontend/src/lib/crewai/modal-client.ts` - Modal API client
- `frontend/src/lib/stripe/client.ts` - Stripe SDK wrapper

---

## Appendix B: E2E Test Files (46 total)

```
frontend/tests/e2e/
├── 00-smoke.spec.ts
├── 01-login.spec.ts
├── 02-onboarding-flow.spec.ts
├── 03-founder-attribution.spec.ts
├── 04-founder-analysis-journey.spec.ts
├── 05-hitl-approval-flow.spec.ts
├── 06-consultant-portfolio.spec.ts
├── 09-consultant-practice-setup.spec.ts
├── 10-consultant-client-onboarding.spec.ts
├── 11-project-lifecycle.spec.ts
├── 12-client-lifecycle.spec.ts
├── 13-trial-limits.spec.ts
├── 14-hitl-extended.spec.ts
├── 15-pivot-workflows.spec.ts
├── 16-quick-start-founder.spec.ts
├── 17-quick-start-consultant.spec.ts
├── 18-edge-cases.spec.ts
├── 19-admin-user-management.spec.ts
├── 20-admin-operations.spec.ts
├── 21-admin-audit.spec.ts
├── 22-consultant-trial.spec.ts
├── 23-support.spec.ts
├── 24-offboarding.spec.ts
├── 25-billing.spec.ts
├── 26-notifications.spec.ts
├── 27-account-settings.spec.ts
├── 28-*.spec.ts (multiple: hypotheses, integrations, data-imports)
├── 29-*.spec.ts (platform-tooling, data-sync)
├── 30-*.spec.ts (agent-brief-generation, field-mappings)
├── 31-agent-vpc-discovery.spec.ts
├── 32-agent-desirability.spec.ts
├── 33-agent-feasibility.spec.ts
├── 34-agent-viability.spec.ts
├── 35-agent-hitl-checkpoints.spec.ts
├── 36-*.spec.ts (auto-approval, assumption-map)
├── 37-evidence-features.spec.ts
├── 38-gate-evaluation.spec.ts
├── 39-ai-insights.spec.ts
├── 40-upgrade-flow.spec.ts
├── client-dashboard.spec.ts
└── helpers/api-mocks.ts
```

---

## Appendix C: Route Inventory (96 routes)

Key route categories:

| Category | Count | Examples |
|----------|-------|----------|
| Admin | 18 | `/api/admin/users/*`, `/api/admin/workflows/*` |
| Approvals | 4 | `/api/approvals/*` |
| Consultant | 8 | `/api/consultant/onboarding/*`, `/api/consultant/invites/*` |
| CrewAI | 5 | `/api/crewai/webhook`, `/api/crewai/resume` |
| Stripe | 2 | `/api/stripe/webhook`, `/api/stripe/create-checkout-session` |
| Settings | 12 | `/api/settings/notifications`, `/api/settings/security/*` |
| Projects | 3 | `/api/projects/quick-start`, `/api/projects/create` |
| Ads | 8 | `/api/ads/campaigns/*`, `/api/ads/images/*` |
| Other | 36+ | Clients, Integrations, Imports, Mappings, VPC, etc. |
