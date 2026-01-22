---
purpose: "Trial user profiles, restrictions, and conversion paths"
status: "active"
last_reviewed: "2026-01-22"
last_updated: "2026-01-22"
---

# Trial Personas

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
| Help Center & Support | Limited | Knowledge base + support form |
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
| Help Center & Support | Limited | Knowledge base + support form |

#### Conversion Triggers

| Trigger | Response |
|---------|----------|
| Attempts to invite real client | Upgrade prompt with value prop |
| Creates 3rd mock client | Upgrade prompt |
| Trial day 10 | Email reminder with portfolio screenshot |
| Trial expiration | "Your mock clients are waiting" email |

---
