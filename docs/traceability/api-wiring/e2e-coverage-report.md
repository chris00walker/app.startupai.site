# API Wiring - E2E Coverage Report

Generated: 2026-01-28T21:45:44.249Z

## Summary

- Routes with E2E coverage: 6
- Routes without E2E coverage: 97
- E2E mocks with no matching route: 41
- Wildcard mocks (not validated): 3

## E2E Mocks Without Matching Routes

These mocks may be testing routes that do not exist or have incorrect patterns.

- `**/api/projects*` in `frontend/tests/e2e/11-project-lifecycle.spec.ts:55`
- `**/api/projects/*/archive` in `frontend/tests/e2e/11-project-lifecycle.spec.ts:72`
- `**/api/projects/*/restore` in `frontend/tests/e2e/11-project-lifecycle.spec.ts:97`
- `**/api/consultant/clients*` in `frontend/tests/e2e/12-client-lifecycle.spec.ts:59`
- `**/api/consultant/clients/*/restore` in `frontend/tests/e2e/12-client-lifecycle.spec.ts:101`
- `**/api/consultant/clients/*/resend-invite` in `frontend/tests/e2e/12-client-lifecycle.spec.ts:126`
- `**/api/user/trial-status` in `frontend/tests/e2e/13-trial-limits.spec.ts:76`
- `**/api/user/profile*` in `frontend/tests/e2e/13-trial-limits.spec.ts:97`
- `**/api/projects*` in `frontend/tests/e2e/13-trial-limits.spec.ts:150`
- `**/api/user/profile*` in `frontend/tests/e2e/13-trial-limits.spec.ts:535`
- `**/api/user/trial-status` in `frontend/tests/e2e/13-trial-limits.spec.ts:591`
- `**/api/approvals*` in `frontend/tests/e2e/14-hitl-extended.spec.ts:123`
- `**/api/hitl/approve` in `frontend/tests/e2e/14-hitl-extended.spec.ts:157`
- `**/api/approvals*` in `frontend/tests/e2e/14-hitl-extended.spec.ts:800`
- `**/api/approvals*` in `frontend/tests/e2e/14-hitl-extended.spec.ts:823`
- `**/api/hitl/approve` in `frontend/tests/e2e/14-hitl-extended.spec.ts:846`
- `**/api/approvals*` in `frontend/tests/e2e/15-pivot-workflows.spec.ts:90`
- `**/api/hitl/pivot-options*` in `frontend/tests/e2e/15-pivot-workflows.spec.ts:211`
- `**/api/hitl/pivot-decision` in `frontend/tests/e2e/15-pivot-workflows.spec.ts:229`
- `**/api/approvals*` in `frontend/tests/e2e/15-pivot-workflows.spec.ts:882`
- `**/api/user/trial-status` in `frontend/tests/e2e/22-consultant-trial.spec.ts:69`
- `**/api/consultant/clients` in `frontend/tests/e2e/22-consultant-trial.spec.ts:87`
- `**/api/help/articles**` in `frontend/tests/e2e/23-support.spec.ts:59`
- `**/api/support/tickets**` in `frontend/tests/e2e/23-support.spec.ts:78`
- `**/api/subscription**` in `frontend/tests/e2e/24-offboarding.spec.ts:59`
- `**/api/subscription**` in `frontend/tests/e2e/24-offboarding.spec.ts:77`
- `**/api/billing/history**` in `frontend/tests/e2e/25-billing.spec.ts:64`
- `**/api/subscription**` in `frontend/tests/e2e/25-billing.spec.ts:96`
- `**/api/subscription**` in `frontend/tests/e2e/25-billing.spec.ts:114`
- `**/api/notifications**` in `frontend/tests/e2e/26-notifications.spec.ts:59`
- `**/api/notifications/preferences**` in `frontend/tests/e2e/26-notifications.spec.ts:100`
- `**/api/user/profile**` in `frontend/tests/e2e/27-account-settings.spec.ts:59`
- `**/api/user/login-history**` in `frontend/tests/e2e/27-account-settings.spec.ts:86`
- `**/api/user/2fa**` in `frontend/tests/e2e/27-account-settings.spec.ts:118`
- `**/api/projects/${projectId}/validation*` in `frontend/tests/e2e/client-dashboard.spec.ts:71`
- `**/api/projects/${projectId}/evidence*` in `frontend/tests/e2e/client-dashboard.spec.ts:98`
- `**/.netlify/functions/gate-evaluate` in `frontend/tests/e2e/helpers/api-mocks.ts:46`
- `**/rest/v1/projects*` in `frontend/src/__tests__/e2e/backend-integration.spec.ts:273`
- `**/.netlify/functions/*` in `frontend/src/__tests__/e2e/backend-integration.spec.ts:406`
- `**/.netlify/functions/crew-analyze` in `frontend/src/__tests__/e2e/backend-integration.spec.ts:422`
- `**/api/tasks**` in `frontend/src/__tests__/e2e/user-journeys.spec.ts:234`

## Routes Without E2E Coverage

Consider adding E2E tests for these routes.

- `/api/admin/ad-platforms/[id]/health` (POST)
- `/api/admin/ad-platforms/[id]` (GET, PATCH, DELETE)
- `/api/admin/ad-platforms/[id]/status` (PATCH)
- `/api/admin/ad-platforms/connect` (POST, PUT)
- `/api/admin/ad-platforms` (GET, POST)
- `/api/admin/audit` (GET)
- `/api/admin/features` (GET, POST, PATCH)
- `/api/admin/health` (GET)
- `/api/admin/users/[id]/billing/credit` (POST)
- `/api/admin/users/[id]/billing/refund` (POST)
- `/api/admin/users/[id]/billing/retry` (POST)
- `/api/admin/users/[id]/billing` (GET)
- `/api/admin/users/[id]/export` (POST, GET)
- `/api/admin/users/[id]/impersonate` (POST, DELETE, GET)
- `/api/admin/users/[id]/integrity` (POST, GET)
- `/api/admin/users/[id]` (GET, PATCH)
- `/api/admin/users` (GET)
- `/api/admin/workflows/[id]/retry` (POST)
- `/api/admin/workflows` (GET)
- `/api/ads/campaigns/[id]/metrics` (GET, POST)
- ... and 77 more

## Wildcard Mocks (Informational)

These wildcard patterns match multiple routes and are not validated against the inventory.

- `**/api/projects/**`
- `**/api/crewai/**`
- `**/api/**`
