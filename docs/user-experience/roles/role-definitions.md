---
purpose: "Canonical role definitions and access control matrix"
status: "active"
last_reviewed: "2026-01-22"
---

# Role Definitions

**Status:** Active
**Canonical Source:** `frontend/src/db/schema/users.ts:10`

This document consolidates all user role definitions into a single source of truth. All other documentation should reference this document rather than defining roles inline.

---

## Role Hierarchy

### Canonical Definition

The authoritative role definition is the TypeScript enum:

```typescript
// frontend/src/db/schema/users.ts:10
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'founder',
  'consultant',
  'founder_trial',
  'consultant_trial'
]);
```

| Role | Description | Default Redirect |
|------|-------------|-----------------|
| `admin` | Platform administrator and support staff | `/admin-dashboard` |
| `founder` | Entrepreneur validating business idea | `/founder-dashboard` |
| `consultant` | Advisor managing founder clients | `/consultant-dashboard` |
| `founder_trial` | Prospective founder evaluating platform | `/onboarding/founder` |
| `consultant_trial` | Prospective consultant evaluating platform | `/onboarding/consultant` |

### Access Control Matrix

| Capability | Admin | Founder | Consultant | Founder Trial | Consultant Trial |
|------------|-------|---------|------------|---------------|------------------|
| Founder Experience | Yes | Yes | No | Limited | No |
| Consultant Experience | Yes | No | Yes | No | Limited |
| System Management | Yes | No | No | No | No |
| User Support | Yes | No | No | No | No |
| Onboarding | Yes | Yes | Yes | Yes | Yes |
| Client Management | Yes | No | Yes | No | Limited |
| Project CRUD | Yes | Yes | No | Limited | No |
| Mock Client Creation | No | No | No | No | Yes |

**Implementation:** `frontend/src/lib/auth/roles.ts`

---
