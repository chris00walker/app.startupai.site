---
purpose: "Single source of truth for user personas and role definitions"
status: "active"
last_reviewed: "2026-01-19"
---

# User Personas & Role Definitions

**Status:** Active
**Canonical Source:** `frontend/src/db/schema/users.ts:10`

This document consolidates all user role definitions into a single source of truth. All other documentation should reference this document rather than defining roles inline.

---

## Role Hierarchy

### Canonical Definition

The authoritative role definition is the TypeScript enum:

```typescript
// frontend/src/db/schema/users.ts:10
export const userRoleEnum = pgEnum('user_role', ['admin', 'founder', 'consultant', 'trial']);
```

| Role | Description | Default Redirect |
|------|-------------|-----------------|
| `admin` | System administrator (internal) | `/consultant-dashboard` |
| `founder` | Entrepreneur validating business idea | `/founder-dashboard` |
| `consultant` | Advisor managing founder clients | `/consultant-dashboard` |
| `trial` | Free trial user with limited access | `/onboarding/founder` |

### Access Control Matrix

| Capability | Admin | Founder | Consultant | Trial |
|------------|-------|---------|------------|-------|
| Founder Experience | Yes | Yes | No | No |
| Consultant Experience | Yes | No | Yes | No |
| System Management | Yes | No | No | No |
| Onboarding (Alex) | Yes | Yes | No | Yes |
| Client Management | Yes | No | Yes | No |
| Project CRUD | Yes | Yes | No | Limited |

**Implementation:** `frontend/src/lib/auth/roles.ts`

---

## Founder Persona

### Profile

| Attribute | Value |
|-----------|-------|
| **Primary Role** | Entrepreneur or Solopreneur |
| **Age Range** | 25-45 |
| **Tech Comfort** | High (building software/SaaS products) |
| **Business Stage** | Idea validation to early traction |
| **Budget** | $49/month (Founder plan) |

### Goals & Motivations

1. **Validate business ideas** before investing significant time/money
2. **Get strategic clarity** on product-market fit
3. **Reduce risk** of building something nobody wants
4. **Access Fortune 500-quality analysis** without consulting fees
5. **Move faster** from idea to validated concept

### Pain Points

1. Uncertainty about whether the idea is worth pursuing
2. Lack of structured methodology for validation
3. Limited access to strategic expertise
4. Analysis paralysis from too many frameworks
5. Time constraints balancing building and validating

### Key Workflows

| Workflow | Entry Point | Journey Reference |
|----------|-------------|-------------------|
| AI-Guided Onboarding | `/onboarding/founder` | `founder-journey-map.md` Steps 6-11 |
| View Dashboard | `/founder-dashboard` | `founder-journey-map.md` Step 14 |
| HITL Approval | `/approvals` | `founder-journey-map.md` Step 13 |
| Project Management | `/settings` → Projects | `project-client-management.md` |
| View Analysis Results | `/founder-dashboard` → AI Analysis | `founder-journey-map.md` Step 14-15 |

### Feature Access

| Feature | Access | Notes |
|---------|--------|-------|
| Quick Start Form | Yes | Simple business idea input |
| CrewAI Analysis | Yes | Triggered after Quick Start |
| Canvas Tools | Yes | VPC, BMC, TBI |
| Project Archive/Delete | Yes | Via Settings |
| Report Generation | Yes | AI-generated strategic docs |
| Evidence Collection | Yes | Manual + AI-assisted |

---

## Consultant Persona

### Profile

| Attribute | Value |
|-----------|-------|
| **Primary Role** | Business Advisor or Consulting Firm |
| **Experience** | 5+ years advising startups/SMBs |
| **Client Load** | 5-20 active clients |
| **Value Proposition** | Scale expertise with AI assistance |
| **Budget** | $149/month (Consultant plan) |

### Goals & Motivations

1. **Serve more clients** without sacrificing quality
2. **Deliver consistent analysis** across all engagements
3. **Reduce manual research time** with AI assistance
4. **Provide professional deliverables** that impress clients
5. **Track client progress** across portfolio

### Pain Points

1. Limited time per client constrains depth of analysis
2. Manual research is repetitive across similar clients
3. Quality varies based on consultant workload
4. Difficult to scale personal expertise
5. Client progress tracking is fragmented

### Key Workflows

| Workflow | Entry Point | Journey Reference |
|----------|-------------|-------------------|
| Practice Setup | `/onboarding/consultant` | `consultant-journey-map.md` Phase 2 |
| Invite Client | Consultant Dashboard → Add Client | `consultant-journey-map.md` Phase 3 |
| View Portfolio | `/consultant-dashboard` | `consultant-journey-map.md` Phase 4 |
| Client Detail | Portfolio → Client Card | `consultant-journey-map.md` Phase 5 |
| Archive Client | `/settings` → Clients | `consultant-journey-map.md` Phase 6 |

### Feature Access

| Feature | Access | Notes |
|---------|--------|-------|
| Client Invites | Yes | Email + custom message |
| Portfolio Dashboard | Yes | All clients at a glance |
| Client Progress Tracking | Yes | D-F-V signals, stage progress |
| Client Onboarding (on behalf) | Yes | Guide clients through Alex |
| Own Project Creation | No | Consultants manage clients, not own projects |
| Client Data Modification | No | View-only; client owns their data |

### Client Relationship Model

```
Consultant (1) ────────> (N) Clients
                              │
                              ▼
                         Founder Account
                              │
                              ▼
                         Client's Projects
```

**Critical Constraint:** Archiving a client hides them from Consultant's view but **never affects** the Client's actual project data.

---

## Trial User

### Profile

| Attribute | Value |
|-----------|-------|
| **Primary Role** | Prospective Founder |
| **Status** | Evaluating platform |
| **Duration** | 14-day trial |
| **Conversion Target** | Founder plan ($49/month) |

### Restrictions

Trial users have limited access to prevent abuse while allowing meaningful evaluation.

| Action | Limit | Period | Description |
|--------|-------|--------|-------------|
| `reports.generate` | 3 | Daily | AI-generated reports per day |
| `projects.create` | 3 | Lifetime | Total projects during trial |
| `workflows.run` | 5 | Monthly | CrewAI workflow runs per month |

**Implementation:** `frontend/src/lib/auth/trial-limits.ts`

### Conversion Path

```
Trial User
    │
    ▼
Completes Onboarding
    │
    ▼
Sees Value in Analysis
    │
    ▼
Hits Usage Limit
    │
    ▼
Upgrade Prompt
    │
    ▼
Founder (paid)
```

### Feature Access

| Feature | Access | Notes |
|---------|--------|-------|
| Quick Start Form | Yes | Full access |
| CrewAI Analysis | Limited | 5 runs/month |
| Project Creation | Limited | 3 total |
| Report Generation | Limited | 3/day |
| Canvas Tools | Yes | Full access |
| Settings | Limited | Cannot delete projects |

---

## Admin Role (Internal Only)

**Note:** Admin is not a user persona. It is an internal system role for platform management.

### Purpose

- System administration and debugging
- User management and support
- Data integrity verification
- Feature flag management

### Capabilities

| Capability | Description |
|------------|-------------|
| All Founder Features | Full access to Founder experience |
| All Consultant Features | Full access to Consultant experience |
| User Management | View/modify user profiles |
| System Configuration | Environment and feature flags |
| Audit Logs | View system activity |

### Access Pattern

Admins access the platform via the Consultant dashboard (`/consultant-dashboard`) with elevated permissions enforced at the API level.

### Security Boundaries

- Admin actions are logged
- No access to user credentials
- RLS policies enforce data isolation
- Service role key required for admin operations

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`auth.md`](../specs/auth.md) | Authentication flow, OAuth, session management |
| [`project-client-management.md`](../features/project-client-management.md) | Archive/delete workflows by role |
| [`consultant-client-system.md`](../features/consultant-client-system.md) | Invite flow, client relationship model |
| [`founder-journey-map.md`](./founder-journey-map.md) | Founder 15-step journey |
| [`consultant-journey-map.md`](./consultant-journey-map.md) | Consultant 6-phase journey |
| [`user-stories.md`](./user-stories.md) | All user stories with acceptance criteria |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-19 | Initial creation - consolidated from 8 scattered sources |
