---
purpose: "Consultant persona profile, motivations, workflows, and access"
status: "active"
last_reviewed: "2026-01-22"
---

# Consultant Persona

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
