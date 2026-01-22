---
purpose: "Canonical role definitions and access control matrix"
status: "active"
last_reviewed: "2026-01-22"
last_updated: "2026-01-22"
---

# Role Definitions

**Status:** Active
**Canonical Source (target):** `docs/user-experience/roles/role-definitions.md`
**Implementation Reference:** `frontend/src/db/schema/users.ts:10` (trial split pending)

This document consolidates all user role definitions into a single source of truth. All other documentation should reference this document rather than defining roles inline.

---

## Role Hierarchy

### Canonical Definition

The required role definition (pending schema update) is the TypeScript enum:

```typescript
// Target schema (pending migration)
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'founder',
  'consultant',
  'founder_trial',
  'consultant_trial'
]);
```

**Current schema:** `trial` remains in production until the migration adds `founder_trial` and `consultant_trial`.

| Role | Description | Default Redirect |
|------|-------------|-----------------|
| `admin` | Platform administrator and support staff | `/admin-dashboard` |
| `founder` | Entrepreneur validating business idea | `/founder-dashboard` |
| `consultant` | Advisor managing founder clients | `/consultant-dashboard` |
| `founder_trial` | Prospective founder evaluating platform | `/trial/founder/` |
| `consultant_trial` | Prospective consultant evaluating platform | `/trial/consultant/` |

### Access Control Matrix

| Capability | Admin | Founder | Consultant | Founder Trial | Consultant Trial |
|------------|-------|---------|------------|---------------|------------------|
| Founder Experience | Yes | Yes | No | Limited | No |
| Consultant Experience | Yes | No | Yes | No | Limited |
| System Management | Yes | No | No | No | No |
| Support Access | Yes | Yes | Yes | Limited | Limited |
| Onboarding | Yes | Yes | Yes | Yes | Yes |
| Client Management | Yes | No | Yes | No | Limited |
| Project CRUD | Yes | Yes | No | Limited | No |
| Mock Client Creation | No | No | No | No | Yes |

**Support Access (Limited):** Knowledge base + contact support + ticket tracking; no priority SLA.
**Trial intent:** Stored as `trial_intent` (founder_trial|consultant_trial) and used for default routing to `/trial/founder/` or `/trial/consultant/` before upgrade.

**Implementation (current):** `frontend/src/lib/auth/roles.ts` (trial split pending)

---
