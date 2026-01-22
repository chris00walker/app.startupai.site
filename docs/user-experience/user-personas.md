---
purpose: "Single source of truth for user personas and role definitions"
status: "active"
last_reviewed: "2026-01-22"
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

## Founder Persona

### Profile

| Attribute | Value |
|-----------|-------|
| **Primary Role** | Entrepreneur or Solopreneur |
| **Age Range** | 25-45 |
| **Tech Comfort** | High (building software/SaaS products) |
| **Business Stage** | Idea validation to early traction |
| **Budget** | $49/month (Founder plan) |

### Behavioral Profile

| Dimension | Value |
|-----------|-------|
| **Decision Style** | Fast iteration, "fail fast" mentality |
| **Risk Tolerance** | High (left stable employment for this) |
| **Learning Preference** | Self-directed, prefers doing over reading |
| **Tech Adoption** | Early adopter, comfortable with beta products |
| **Information Sources** | Twitter/X, podcasts, indie hacker communities |

### Psychographics

| Attribute | Value |
|-----------|-------|
| **Primary Motivation** | Independence, building something meaningful |
| **Core Fear** | Wasting months/years on an idea nobody wants |
| **Success Definition** | Paying customers + personal freedom |
| **Frustration Triggers** | Slow processes, corporate-speak, unclear ROI |
| **Delight Triggers** | Fast results, actionable insights, feeling understood |

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

### Founder Sub-Segments

The Founder persona encompasses several distinct sub-segments with different needs:

#### First-Time Founder

| Attribute | Value |
|-----------|-------|
| **Experience** | 0 prior startups, often leaving corporate |
| **Key Need** | Structured methodology, validation confidence |
| **Pain Point** | "I don't know what I don't know" |
| **Platform Adaptation** | Extended onboarding tooltips, methodology explanations |
| **Support Level** | High-touch, proactive check-ins |

#### Serial Founder

| Attribute | Value |
|-----------|-------|
| **Experience** | 2+ prior startups (exits or failures) |
| **Key Need** | Speed and efficiency, skip basics |
| **Pain Point** | "Don't waste my time with beginner content" |
| **Platform Adaptation** | Skip-ahead options, power-user shortcuts |
| **Support Level** | Low-touch, self-serve preferred |

#### Technical Founder

| Attribute | Value |
|-----------|-------|
| **Background** | Engineering, product, or technical PM |
| **Key Need** | Go-to-market validation (not technical feasibility) |
| **Pain Point** | "I can build anything, but will anyone buy it?" |
| **Platform Adaptation** | API access, data export, technical integrations |
| **Support Level** | Documentation-first, community forums |

#### Non-Technical Founder

| Attribute | Value |
|-----------|-------|
| **Background** | Domain expert, business, sales, or operations |
| **Key Need** | Technical feasibility translation |
| **Pain Point** | "How do I know if this can actually be built?" |
| **Platform Adaptation** | Plain-language explanations, visual outputs |
| **Support Level** | Human support access, consultant recommendations |

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

### Behavioral Profile

| Dimension | Value |
|-----------|-------|
| **Decision Style** | Methodical, values proven frameworks |
| **Risk Tolerance** | Moderate (protects professional reputation) |
| **Learning Preference** | Structured courses, peer learning, case studies |
| **Tech Adoption** | Pragmatic adopter, needs clear ROI |
| **Information Sources** | Industry publications, professional networks, conferences |

### Psychographics

| Attribute | Value |
|-----------|-------|
| **Primary Motivation** | Scale impact without burning out |
| **Core Fear** | Delivering inconsistent quality, client failure |
| **Success Definition** | Client outcomes + sustainable practice |
| **Frustration Triggers** | Tools that don't integrate, unreliable AI |
| **Delight Triggers** | Clients succeeding, time saved on repetitive work |

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

## Trial Users

Trial users are prospective customers evaluating the platform. There are two distinct trial types matching the two paid tiers.

---

### Founder Trial (`founder_trial`)

#### Profile

| Attribute | Value |
|-----------|-------|
| **Primary Role** | Prospective Founder |
| **Status** | Evaluating platform for personal use |
| **Duration** | 14-day trial |
| **Conversion Target** | Founder plan ($49/month) |

#### Goals

1. **Evaluate if StartupAI can validate my idea** before committing $49/mo
2. **Experience the Quick Start and AI analysis** to see quality of output
3. **Understand the methodology** (VPD, Canvas tools) before paying
4. **Compare to alternatives** (doing it myself, hiring consultant, other tools)

#### Restrictions

| Action | Limit | Period | Description |
|--------|-------|--------|-------------|
| `reports.generate` | 3 | Daily | AI-generated reports per day |
| `projects.create` | 3 | Lifetime | Total projects during trial |
| `workflows.run` | 5 | Monthly | CrewAI workflow runs per month |

**Implementation:** `frontend/src/lib/auth/trial-limits.ts`

#### Conversion Path

```
Founder Trial
    │
    ▼
Completes Quick Start Onboarding
    │
    ▼
Sees AI Analysis Results
    │
    ▼
Hits Usage Limit OR Trial Expires
    │
    ▼
Upgrade Prompt → Founder ($49/mo)
```

#### Feature Access

| Feature | Access | Notes |
|---------|--------|-------|
| Quick Start Form | Yes | Full access |
| CrewAI Analysis | Limited | 5 runs/month |
| Project Creation | Limited | 3 total |
| Report Generation | Limited | 3/day |
| Canvas Tools | Yes | Full access |
| Dashboard | Yes | Full access |
| Settings | Limited | Cannot delete projects |
| HITL Approvals | Yes | For their projects |

---

### Consultant Trial (`consultant_trial`)

#### Profile

| Attribute | Value |
|-----------|-------|
| **Primary Role** | Prospective Consultant |
| **Status** | Evaluating platform for client practice |
| **Duration** | 14-day trial |
| **Conversion Target** | Consultant plan ($149/month) |

#### Goals

1. **Evaluate if StartupAI can scale my practice** before committing $149/mo
2. **Test the client management workflow** with mock clients
3. **See the portfolio dashboard** to understand multi-client oversight
4. **Assess deliverable quality** that I would present to real clients
5. **Compare margin potential** vs. current referral model

#### Restrictions

| Action | Limit | Period | Description |
|--------|-------|--------|-------------|
| `clients.create_mock` | 2 | Lifetime | Mock clients for testing |
| `clients.invite_real` | 0 | - | Cannot invite real clients |
| `reports.generate` | 5 | Daily | AI-generated reports per day |
| `workflows.run` | 10 | Monthly | CrewAI workflow runs per month |

**Implementation:** `frontend/src/lib/auth/trial-limits.ts`

#### Mock Client System

Consultant trial users can create "mock clients" to test the full workflow without involving real people:

| Mock Client Attribute | Value |
|----------------------|-------|
| **Creation** | Admin-generated sample data |
| **Business Ideas** | Pre-populated with 3 diverse examples |
| **Validation State** | Various stages (Phase 1, Phase 2, etc.) |
| **Purpose** | Let consultant experience portfolio view |

#### Conversion Path

```
Consultant Trial
    │
    ▼
Completes Practice Setup (Onboarding)
    │
    ▼
Receives 2 Mock Clients (pre-populated)
    │
    ▼
Explores Portfolio Dashboard
    │
    ▼
Tests Client Detail View
    │
    ▼
Sees Client Management Workflow
    │
    ▼
Upgrade Prompt → Consultant ($149/mo)
```

#### Feature Access

| Feature | Access | Notes |
|---------|--------|-------|
| Practice Setup | Yes | Full onboarding |
| Portfolio Dashboard | Yes | With mock clients |
| Client Detail View | Yes | View-only on mock data |
| Mock Client Creation | Limited | 2 mock clients |
| Real Client Invites | No | Blocked until upgrade |
| Quick Start for Client | Yes | On mock clients only |
| White-Label Export | No | Upgrade required |
| Client Archive/Restore | Yes | On mock clients |

#### Conversion Triggers

| Trigger | Response |
|---------|----------|
| Attempts to invite real client | Upgrade prompt with value prop |
| Creates 3rd mock client | Upgrade prompt |
| Trial day 10 | Email reminder with portfolio screenshot |
| Trial expiration | "Your mock clients are waiting" email |

---

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

## Negative Personas (Anti-Personas)

These are user types we explicitly do **not** design for. Recognizing them helps avoid feature creep and misaligned expectations.

### The Tire Kicker

| Attribute | Value |
|-----------|-------|
| **Behavior** | Creates account, explores, never commits |
| **Motivation** | Curiosity, benchmarking competitors |
| **Why Not a Target** | Will never convert regardless of features |
| **How to Identify** | Multiple projects started, none past Phase 1 |
| **Platform Response** | Standard trial limits, no special retention |

### The Enterprise PM

| Attribute | Value |
|-----------|-------|
| **Behavior** | Needs procurement approval, IT security review |
| **Motivation** | Innovation theater for large company |
| **Why Not a Target** | Sales cycle incompatible with self-serve model |
| **How to Identify** | Corporate email, SSO/SAML requests, legal review asks |
| **Platform Response** | Redirect to "Contact Sales" (future enterprise tier) |

### The Academic Researcher

| Attribute | Value |
|-----------|-------|
| **Behavior** | Studies the platform, no commercial intent |
| **Motivation** | Research paper, teaching material |
| **Why Not a Target** | No path to paid conversion |
| **How to Identify** | .edu email, asks about methodology citations |
| **Platform Response** | Read-only access, academic partnership inquiry |

### The Get-Rich-Quick Seeker

| Attribute | Value |
|-----------|-------|
| **Behavior** | Wants validation to "prove" predetermined idea |
| **Motivation** | Confirmation bias, not genuine learning |
| **Why Not a Target** | Unreceptive to negative evidence, high support burden |
| **How to Identify** | Rejects all pivot suggestions, disputes AI findings |
| **Platform Response** | Clear expectation-setting in onboarding |

### The Competitor Scout

| Attribute | Value |
|-----------|-------|
| **Behavior** | Signs up to analyze our AI outputs and methodology |
| **Motivation** | Competitive intelligence gathering |
| **Why Not a Target** | Extractive behavior, no commercial intent |
| **How to Identify** | Competitor domain email, screenshot-heavy sessions |
| **Platform Response** | Standard access (nothing to hide), no special treatment |

---

## Account Lifecycle States

> **Added (2026-01-22)**: Lifecycle states affect what users can do and how they experience the platform.

### Lifecycle State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCOUNT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Signup  │───>│  Trial   │───>│  Active  │                  │
│  │          │    │(14 days) │    │  (Paid)  │                  │
│  └──────────┘    └────┬─────┘    └────┬─────┘                  │
│                       │               │                         │
│                       │               │                         │
│                       ▼               ▼                         │
│                  ┌──────────┐    ┌──────────┐                  │
│                  │ Expired  │    │Cancelled │                  │
│                  │ (No Pay) │    │(by User) │                  │
│                  └────┬─────┘    └────┬─────┘                  │
│                       │               │                         │
│                       │               │                         │
│                       ▼               ▼                         │
│                  ┌──────────────────────────┐                  │
│                  │      Grace Period        │                  │
│                  │      (30 days)           │                  │
│                  └────────────┬─────────────┘                  │
│                               │                                 │
│                               ▼                                 │
│                  ┌──────────────────────────┐                  │
│                  │    Retention Period      │                  │
│                  │      (60 days)           │                  │
│                  └────────────┬─────────────┘                  │
│                               │                                 │
│                               ▼                                 │
│                  ┌──────────────────────────┐                  │
│                  │      Purged              │                  │
│                  │   (Data Deleted)         │                  │
│                  └──────────────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lifecycle State Definitions

| State | Description | User Access | Duration | Next State |
|-------|-------------|-------------|----------|------------|
| `signup` | User creating account | None (in progress) | Minutes | `trial` |
| `trial` | Evaluating platform | Limited features | 14 days | `active` or `expired` |
| `active` | Paid, current subscription | Full features | Ongoing | `cancelled` or `past_due` |
| `past_due` | Payment failed | Full (grace) | 14 days | `active` or `suspended` |
| `suspended` | Multiple payment failures | Read-only | 16 days | `active` or `cancelled` |
| `cancelled` | User cancelled | Degrades over time | See retention | `reactivated` or `purged` |
| `expired` | Trial ended, no payment | Read-only | 30 days | `active` or `retention` |
| `grace_period` | Post-cancel access | Read-only | 30 days | `retention` |
| `retention` | Data kept, no access | None | 60 days | `purged` or `reactivated` |
| `purged` | Data deleted | None | Permanent | N/A |

### State Transitions

| From | To | Trigger |
|------|----|---------|
| `signup` | `trial` | Account creation complete |
| `trial` | `active` | Payment successful |
| `trial` | `expired` | 14 days passed, no payment |
| `active` | `cancelled` | User cancels subscription |
| `active` | `past_due` | Payment fails |
| `past_due` | `active` | Payment recovered |
| `past_due` | `suspended` | 14 days, no recovery |
| `suspended` | `active` | Payment recovered |
| `suspended` | `cancelled` | 30 days, no recovery |
| `cancelled` | `grace_period` | Automatic (immediate) |
| `expired` | `grace_period` | Automatic (immediate) |
| `grace_period` | `retention` | 30 days passed |
| `retention` | `purged` | 90 days total since cancel |
| Any pre-purge | `active` | User reactivates |

---

## Billing States

> **Added (2026-01-22)**: Billing states determine subscription and payment status.

### Billing State Definitions

| State | Description | User Experience | Admin Actions |
|-------|-------------|-----------------|---------------|
| `trialing` | In free trial | See trial limits, upgrade prompts | Monitor engagement |
| `active` | Subscription current | Full access, auto-renew | Normal support |
| `past_due` | Payment failed, retrying | Warning banners, payment prompts | Manual retry option |
| `suspended` | Multiple failures | Read-only access | Payment recovery, manual upgrade |
| `cancelled` | User cancelled | Access until period end | Win-back eligibility |
| `incomplete` | Checkout abandoned | Incomplete signup | Nudge to complete |
| `paused` | User-requested pause | Read-only, skipped billing | Resume available |

### Billing Events

| Event | Trigger | User Notification | System Action |
|-------|---------|-------------------|---------------|
| `subscription.created` | First payment success | Welcome email | Set `active` state |
| `subscription.updated` | Plan change | Confirmation email | Update plan, prorate |
| `subscription.cancelled` | User cancels | Cancellation email | Set `cancelled`, start grace |
| `invoice.payment_succeeded` | Renewal payment | Receipt email | Continue `active` |
| `invoice.payment_failed` | Card declined | Failure email + banner | Start dunning, set `past_due` |
| `customer.subscription.paused` | User pauses | Pause confirmation | Set `paused`, skip invoices |
| `customer.subscription.resumed` | User resumes | Resume confirmation | Set `active`, resume invoicing |

### Dunning Schedule

| Day | Action | Email | Access |
|-----|--------|-------|--------|
| 0 | First failure | "Payment failed" | Full |
| 1 | Retry #1 | - | Full |
| 3 | Retry #2 | "Reminder" | Full |
| 7 | Retry #3 | "Urgent" | Full |
| 14 | Final retry | "Final warning" | Full |
| 14 | Suspend | "Suspended" | Read-only |
| 30 | Cancel | "Cancelled" | Grace period |

**Implementation:** Stripe Billing Smart Retries + custom dunning emails via Resend

---

## Cross-References

| Document | What It Covers |
|----------|---------------|
| [`auth.md`](../specs/auth.md) | Authentication flow, OAuth, session management |
| [`project-client-management.md`](../features/project-client-management.md) | Archive/delete workflows by role |
| [`consultant-client-system.md`](../features/consultant-client-system.md) | Invite flow, client relationship model |
| [`founder-journey-map.md`](./founder-journey-map.md) | Founder 15-step journey |
| [`founder-trial-journey-map.md`](./founder-trial-journey-map.md) | Founder trial 4-phase journey |
| [`consultant-journey-map.md`](./consultant-journey-map.md) | Consultant 6-phase journey |
| [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) | Consultant trial 4-phase journey |
| [`admin-journey-map.md`](./admin-journey-map.md) | Admin 6-phase journey |
| [`support-journey-map.md`](./support-journey-map.md) | Support and GDPR flows |
| [`offboarding-journey-map.md`](./offboarding-journey-map.md) | Cancellation and churn flows |
| [`billing-journey-map.md`](./billing-journey-map.md) | Payment lifecycle |
| [`notification-journey-map.md`](./notification-journey-map.md) | Notification delivery |
| [`account-settings-journey-map.md`](./account-settings-journey-map.md) | Profile and security |
| [`user-stories.md`](./user-stories.md) | All user stories with acceptance criteria |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | **Lifecycle Expansion:** Added Account Lifecycle States section with state diagram and transitions; Added Billing States section with dunning schedule |
| 2026-01-22 | **Major Update:** Expanded Admin to full persona with sub-segments; Split Trial into `founder_trial` and `consultant_trial` with mock client system |
| 2026-01-21 | Added behavioral/psychographic profiles, founder sub-segments, negative personas |
| 2026-01-19 | Initial creation - consolidated from 8 scattered sources |
