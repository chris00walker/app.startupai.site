---
purpose: "Consultant persona profile, motivations, workflows, and access"
status: "active"
last_reviewed: "2026-01-22"
---

# Consultant Persona

> **Portfolio Holder Context (2026-02-03)**: The Consultant persona is part of the broader "Portfolio Holder" umbrella that encompasses five relationship types: advisory, capital, program, service, and ecosystem. "Consultant" remains the UI label while "Portfolio Holder" is the architectural umbrella. See [portfolio-holder-vision.md](../../specs/portfolio-holder-vision.md) for the complete marketplace vision.

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

### Portfolio Holder Umbrella

The Consultant persona is one of five relationship types under the Portfolio Holder umbrella:

| Relationship Type | Description | Pricing Tier |
|-------------------|-------------|--------------|
| **Advisory** | Coaches, mentors, fractional executives | Advisor ($199/mo) |
| **Capital** | Angels, VCs, family offices | Capital ($499/mo) |
| **Program** | Accelerators, incubators | Capital ($499/mo) |
| **Service** | Lawyers, accountants, agencies | Advisor ($199/mo) |
| **Ecosystem** | Coworking, startup communities | Advisor ($199/mo) |

### Marketplace Features

Verified consultants (paid Advisor or Capital tier) gain access to:

| Feature | Description |
|---------|-------------|
| **Founder Directory** | Browse opt-in founders with validated ideas |
| **RFQ Board** | View and respond to founder requests for capital/advice |
| **Connection Requests** | Request or accept connections with founders |
| **Evidence Access** | View founder validation evidence after connection |

See [portfolio-holder.md](../stories/portfolio-holder.md) for complete marketplace user stories.

---
