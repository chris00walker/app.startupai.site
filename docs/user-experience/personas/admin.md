---
purpose: "Admin persona profile, responsibilities, and access"
status: "active"
last_reviewed: "2026-01-22"
---

# Admin Persona

## Admin Persona

### Profile

| Attribute | Value |
|-----------|-------|
| **Primary Role** | Platform Administrator / Support Staff |
| **Team Size** | 1-3 internal staff |
| **Tech Comfort** | High (debugging, database queries, log analysis) |
| **Work Context** | Supporting users, maintaining platform health |
| **Accountability** | User success, platform uptime, data integrity |

### Behavioral Profile

| Dimension | Value |
|-----------|-------|
| **Decision Style** | Methodical, investigative, evidence-based |
| **Risk Tolerance** | Low (protecting user data and platform stability) |
| **Learning Preference** | Documentation, runbooks, peer knowledge transfer |
| **Tool Adoption** | Pragmatic - adopts tools that reduce support burden |
| **Information Sources** | Error logs, user reports, monitoring dashboards |

### Psychographics

| Attribute | Value |
|-----------|-------|
| **Primary Motivation** | Helping users succeed, keeping platform healthy |
| **Core Fear** | Data loss, security breach, unresolved user issues |
| **Success Definition** | Fast resolution times, happy users, stable platform |
| **Frustration Triggers** | Poor observability, missing audit trails, undocumented edge cases |
| **Delight Triggers** | Self-serve solutions, clear dashboards, proactive issue detection |

### Goals & Motivations

1. **Resolve user issues quickly** without requiring engineering escalation
2. **Monitor platform health** and catch problems before users report them
3. **Maintain data integrity** across all user accounts and projects
4. **Enable safe experimentation** via feature flags and controlled rollouts
5. **Ensure compliance** with audit trails and access controls

### Pain Points

1. Limited visibility into user state without database queries
2. No easy way to "see what the user sees" for debugging
3. Manual processes for common support tasks
4. Fragmented information across logs, database, and monitoring tools
5. Lack of proactive alerting for user-impacting issues

### Key Workflows

| Workflow | Entry Point | Journey Reference |
|----------|-------------|-------------------|
| User Support | `/admin/users` | `admin-journey-map.md` Phase 1 |
| Impersonation | `/admin/users/:id/impersonate` | `admin-journey-map.md` Phase 2 |
| System Health | `/admin/health` | `admin-journey-map.md` Phase 3 |
| Feature Flags | `/admin/features` | `admin-journey-map.md` Phase 4 |
| Audit Logs | `/admin/audit` | `admin-journey-map.md` Phase 5 |
| Billing Support | `/admin/users/:id/billing` | `admin-journey-map.md` Phase 6 |
| Data Operations | `/admin/data` | `admin-journey-map.md` Phase 6 |

### Feature Access

| Feature | Access | Notes |
|---------|--------|-------|
| User Search & Lookup | Yes | Find users by email, ID, or project |
| User Impersonation | Yes | View platform as specific user (read-only) |
| Project State Inspection | Yes | View any project's current state |
| Workflow Retry | Yes | Re-trigger failed CrewAI jobs |
| Feature Flag Management | Yes | Enable/disable features per user or globally |
| Audit Log Access | Yes | View all system activity |
| Billing Management | Yes | Retry payments, issue refunds/credits, grant grace |
| Data Export | Yes | Export user data for support/compliance |
| User Role Changes | Yes | Upgrade trial to paid, fix role issues |
| Bulk Operations | Yes | With approval workflow for destructive actions |

### Admin Sub-Segments

The Admin persona encompasses distinct sub-segments with different primary responsibilities:

#### Support Admin

| Attribute | Value |
|-----------|-------|
| **Primary Focus** | User issue resolution |
| **Key Need** | Fast access to user context |
| **Pain Point** | "I need to see exactly what the user is seeing" |
| **Platform Adaptation** | User lookup, impersonation, state inspection |
| **Escalation Path** | → Engineering for bugs, → Data Admin for integrity issues |

#### Operations Admin

| Attribute | Value |
|-----------|-------|
| **Primary Focus** | Platform health and reliability |
| **Key Need** | Proactive monitoring and alerting |
| **Pain Point** | "I want to know about problems before users do" |
| **Platform Adaptation** | Health dashboards, job monitoring, error aggregation |
| **Escalation Path** | → Engineering for infrastructure, → Support for user comms |

#### Data Admin

| Attribute | Value |
|-----------|-------|
| **Primary Focus** | Data integrity and compliance |
| **Key Need** | Audit trails and safe data operations |
| **Pain Point** | "I need to fix data issues without making things worse" |
| **Platform Adaptation** | Audit logs, data export, integrity checks |
| **Escalation Path** | → Engineering for schema issues, → Legal for compliance |

#### Billing Admin

| Attribute | Value |
|-----------|-------|
| **Primary Focus** | Billing issue resolution |
| **Key Need** | Clear policy controls and safe billing actions |
| **Pain Point** | "I need to resolve billing fast without refund mistakes" |
| **Platform Adaptation** | Billing tab, refund/credit controls, audit trail |
| **Escalation Path** | → Finance for policy exceptions, → Engineering for Stripe failures |

### Security Boundaries

| Boundary | Enforcement |
|----------|-------------|
| All admin actions logged | Audit trail with actor, action, target, timestamp |
| No access to user credentials | Passwords, tokens never exposed |
| Impersonation is read-only | Cannot modify data while impersonating |
| Destructive actions require confirmation | Two-step process with impact preview |
| RLS policies enforced | Admin uses service role with explicit grants |
| Session timeouts | 30-minute idle timeout for admin sessions |

---
