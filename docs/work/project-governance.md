# StartupAI Project Governance

**Status**: Draft v2.2 | **Created**: 2026-01-29 | **Updated**: 2026-01-31 | **Approved By**: Pending final sign-off

**Process**: This document was created through a leadership team meeting with input from product-strategist, system-architect, domain-expert-vpd, and project-manager. Unresolved conflicts are flagged for founder decision.

---

## 1. Team Roster (18 Specialists)

### Leadership Team (4 members)
Accountable for strategic decisions and cross-team coordination.

| Agent | Role | Primary Responsibilities |
|-------|------|-------------------------|
| **project-manager** | Swarm Orchestrator (Entry Point) | Task coordination, resource allocation, status reporting |
| **product-strategist** (Lead) | Product Vision | Validation priorities, assumption testing, pivot decisions |
| **system-architect** | Technical Architecture | Architecture decisions, API design, system integration |
| **domain-expert-vpd** | VPD Methodology | Framework compliance, evidence quality, methodology governance |

### Design Team (4 members)
Responsible for user experience and visual design.

| Agent | Role | Primary Responsibilities |
|-------|------|-------------------------|
| **ui-designer** (Lead) | Interface Design | Component design, design system, shadcn/ui implementation |
| **ux-designer** | User Experience | Journey maps, personas, usability testing |
| **visual-designer** | Visual Design | Brand consistency, color, typography |
| **graphic-designer** | Graphics & Assets | Icons, illustrations, marketing visuals |

### Engineering Team (6 members)
Responsible for implementation and infrastructure.

| Agent | Role | Primary Responsibilities |
|-------|------|-------------------------|
| **frontend-dev** (Lead) | Frontend Development | Next.js, React, component implementation |
| **backend-dev** | Backend Development | API routes, business logic, Supabase |
| **data-engineer** | Data Architecture | Drizzle schemas, migrations, data pipelines |
| **ai-engineer** | AI Integration | CrewAI flows, Modal functions, MCP tools |
| **platform-eng** | Infrastructure | Modal deployment, Netlify, cross-repo sync |
| **security-eng** | Security | Auth, RLS policies, secrets management |

### Quality Team (4 members)
Responsible for quality assurance and documentation.

| Agent | Role | Primary Responsibilities |
|-------|------|-------------------------|
| **qa-engineer** (Lead) | Quality Assurance | E2E testing, dogfooding, friction checks |
| **tech-writer** | Documentation | Doc maintenance, API docs, user guides |
| **content-strat** | Content Strategy | Messaging, copy, content consistency |
| **data-analyst** | Analytics | PostHog events, metrics, funnel analysis |

---

## 2. RACI Matrix

**Legend**:
- **R** = Responsible (does the work)
- **A** = Accountable (single owner, makes final decisions)
- **C** = Consulted (provides input before decisions)
- **I** = Informed (kept updated on progress)

### Current Sprint Items (WIP: 4/5)

| Work Item | R | A | C | I | Notes |
|-----------|---|---|---|---|-------|
| **Apply pending migrations** | data-engineer | system-architect | backend-dev | project-manager | Unanimous |
| **PostHog Quick Start events** | frontend-dev | product-strategist | data-analyst, qa-engineer, domain-expert-vpd | project-manager | VPD consulted on A2 evidence design |
| **WTP pricing survey** | content-strat | product-strategist | domain-expert-vpd, data-analyst | project-manager | VPD consulted on methodology (Van Westendorp) |
| **Schema migration: Trial split** | data-engineer | system-architect | backend-dev, security-eng, domain-expert-vpd | project-manager | Moved from P1; blocks US-FT03/US-FT04 |

### P1: Validation-Critical Backlog

| Work Item | R | A | C | I | Notes |
|-----------|---|---|---|---|-------|
| **Epic 5: Template Library** | ui-designer, frontend-dev | product-strategist | ai-engineer, domain-expert-vpd, system-architect | project-manager | VPD consulted on messaging alignment with VPC |
| **Epic 6: Agent Tools Integration** | ai-engineer | system-architect | platform-eng, domain-expert-vpd, product-strategist | project-manager | Remains P1; re-evaluate at Phase 2→3 gate |
| **Landing page A/B test** | frontend-dev, content-strat | product-strategist | ui-designer, data-analyst, domain-expert-vpd | project-manager | VPD consulted on test design rigor |
| **IH community launch** | content-strat | product-strategist | qa-engineer, domain-expert-vpd | project-manager | VPD consulted on quality metrics vs vanity metrics |
| **Consultant marketing** | content-strat, graphic-designer | product-strategist | domain-expert-vpd | project-manager | Sequenced after VPC discovery (Week 2) |
| **PostHog HITL approval events** | frontend-dev | product-strategist | domain-expert-vpd, data-analyst, qa-engineer | project-manager | Moved from Current Sprint; implement after schema versioning guidance is documented |
| **HITL Approval data source & state flow** | backend-dev, frontend-dev | system-architect | domain-expert-vpd | project-manager | Data contract, state machine, persistence |
| **HITL Approval UX presentation** | frontend-dev, ux-designer | product-strategist | ui-designer, domain-expert-vpd | project-manager | Blocked on data contract; wireframes may proceed |
| **Consultant Trial mock client** | frontend-dev, ux-designer | product-strategist | qa-engineer, domain-expert-vpd | project-manager | VPD consulted on validated consultant pain |
| **US-FT03: Stripe upgrade webhook** | backend-dev | system-architect | security-eng, platform-eng | project-manager, product-strategist | Blocked by Trial split |
| **US-FT04: Post-upgrade orientation** | frontend-dev, ux-designer | product-strategist | ui-designer, content-strat, domain-expert-vpd | project-manager | VPD consulted on A4 evidence opportunity |

### Validation Milestones (Roadmap)

| Milestone | R | A | C | I | Notes |
|-----------|---|---|---|---|-------|
| **Phase 0: Quick Start** | frontend-dev | product-strategist | ux-designer | Leadership Team | Complete |
| **Phase 1: VPC Discovery** | ai-engineer | domain-expert-vpd | system-architect, product-strategist | Leadership Team | Complete (73/100 fit) |
| **Phase 2: Desirability** | content-strat, frontend-dev | product-strategist | data-analyst, domain-expert-vpd | Leadership Team | Active |
| **Phase 3: Feasibility** | platform-eng, ai-engineer | system-architect | qa-engineer, product-strategist | Leadership Team | Pending |
| **Phase 4: Viability** | data-analyst, backend-dev | product-strategist | domain-expert-vpd, system-architect | Leadership Team | Pending |
| **Phase 2 → 3 Gate** | qa-engineer | domain-expert-vpd | product-strategist, system-architect | Leadership Team | >20% conversion required |
| **Phase 3 → 4 Gate** | qa-engineer | system-architect | domain-expert-vpd, product-strategist | Leadership Team | <10min E2E required |

---

## 3. Decisions (Founder, 2026-01-30)

### Decision #1: A1 Evidence Ownership (PostHog HITL Approval Events)

- **Accountable**: domain-expert-vpd for event schema design and schema changes
- **Accountable**: product-strategist for interpretation of A1 outcomes
- **Schema control**: Schema is locked per test card version. Mid-test schema changes require VPD approval and create a new schema/test card version. Evidence is segmented by version.

---

### Decision #2: Consultant Marketing vs VPC Validation

- **Approach**: Sequence (Week 1 discovery → Week 2 low-cost marketing)

| Track | Owner | Duration | Output |
|-------|-------|----------|--------|
| **VPC Discovery** | ux-designer + content-strat | 1 week | 5-8 consultant interviews, jobs/pains/gains map |
| **Low-cost marketing test** | content-strat | 1 week | IH/LinkedIn posts, landing page variant, $200 ad spend |

- **Scale criteria**:
  - Discovery surfaces >=3 pains that align with current messaging
  - Landing conversion hits 2-3% and responses match the pain statements
  - If discovery contradicts messaging, pause spend and iterate copy

---

### Decision #3: HITL Approval UI Accountability

- **Split into two work items**:
  - HITL Approval data source & state flow — A: system-architect, C: domain-expert-vpd
  - HITL Approval UX presentation — A: product-strategist, C: ui-designer, ux-designer, domain-expert-vpd
- **Dependency**: UX work is blocked on data contract; wireframes may proceed before contract finalization

---

### Decision #4: Epic 6 Priority

- **Decision**: Keep at P1. Re-evaluate at Phase 2 → 3 gate.

---

### Decision #5: Trial Split Priority

- **Decision**: Move Trial Split to Current Sprint. Move PostHog HITL approval events to P1 backlog until schema versioning guidance is documented. WIP remains 4/5.

---

### Decision #6: User Story Ownership (2026-01-31)

- **Issue**: User stories had split responsibility (ux-designer crafts, product-strategist prioritizes) with no single owner for the full lifecycle.
- **Risk**: Accountability gap, conflicting priorities, unclear acceptance criteria ownership.
- **Decision**: **product-strategist** owns user stories end-to-end (Accountable). **ux-designer** is Consulted and informs stories via journey maps and personas.
- **Rationale**: Single owner eliminates handoff friction; UX research remains an input, not a bottleneck.

---

## 4. Ownership Rules

### Single Accountable Owner (SAO) Principle

Every work item MUST have exactly ONE accountable owner. This owner:
1. Makes final decisions when disagreements arise
2. Is responsible for escalating blockers
3. Reports status to project-manager weekly
4. Can delegate Responsible work but not Accountability

### Ownership Assignment Guidelines (Agreed by Leadership)

| Work Category | Default Accountable | Rationale |
|---------------|---------------------|-----------|
| **User stories** | product-strategist (C: ux-designer) | Owns backlog; UX informs via journey maps |
| Validation assumptions (A1-A8) outcomes | product-strategist | Owns product vision |
| Validation evidence design & integrity | domain-expert-vpd | Owns framework methodology |
| VPD phase gate decisions | domain-expert-vpd | Owns methodology compliance |
| Architecture decisions | system-architect | Owns technical direction |
| Task coordination & process | project-manager | Owns execution cadence |
| Schema and data model changes | system-architect | Owns data model integrity |
| Cross-repo dependencies | platform-eng (R), system-architect (A) | Technical integration |

### Escalation Path (Agreed)

```
Agent (Responsible)
    ↓ blocked or disagreement
Team Lead (Design/Engineering/Quality)
    ↓ cross-team conflict
Leadership Team (product-strategist, system-architect, domain-expert-vpd)
    ↓ strategic/methodology conflict
Founder (Final arbiter)
```

---

## 5. Communication Plan (Proposed by project-manager)

### Weekly Cadence

| Day | Activity | Participants | Duration | Output |
|-----|----------|--------------|----------|--------|
| **Monday 10am** | Sprint Planning | Leadership Team | 30 min | Sprint goals, blocker identification |
| **Wednesday 2pm** | Leads Sync | Team leads + PM (parallel) | 20 min | Unblock stalled work |
| **Friday 4pm** | Sprint Review & Retro | Leadership + Team leads | 45 min | WORK.md updated, next sprint queued |

### Status Reporting

| Report | Frequency | Owner | Audience |
|--------|-----------|-------|----------|
| Sprint Status | Weekly (Friday) | project-manager | Founder |
| Validation Progress (A1-A8) | Weekly (Friday) | product-strategist | Founder, domain-expert-vpd |
| Technical Health | Weekly (Friday) | system-architect | Founder, project-manager |
| Evidence Integrity | Weekly (Friday) | domain-expert-vpd | Leadership Team |

### Escalation Tiers

| Tier | Scope | Decision Time | Examples |
|------|-------|---------------|----------|
| **1: Team** | WIP overload, timeline mismatch | 2-4 hours | Reshuffle priorities, scope negotiation |
| **2: Leadership** | Assumption gates, major scope change | Monday standup | Pivot decision, schema risk |
| **3: Founder** | External blockers, PMF risk | Same day | Stripe account, fundamental assumption failure |

### Notification Matrix

| Event | Inform |
|-------|--------|
| Work item started | project-manager |
| Work item blocked | Accountable owner + project-manager |
| Work item completed | Accountable owner + project-manager |
| Sprint goal at risk | Leadership Team + Founder |
| Assumption test results | product-strategist + domain-expert-vpd + Founder |
| Schema change proposed | system-architect + data-engineer |
| VPD compliance issue | domain-expert-vpd + Founder |
| Production incident | system-architect + platform-eng + Founder |

---

## 6. Decision Rights

### HITL Checkpoint Approvals (10 canonical)

These decisions require human (founder) approval before AI agents can proceed.

| Checkpoint | Phase | AI Recommender | Human Approver |
|------------|-------|----------------|----------------|
| `approve_brief` | 1 | Sage | Founder |
| `approve_discovery_output` | 1 | Compass | Founder |
| `approve_experiment_plan` | 1 | Guardian | Founder |
| `approve_pricing_test` | 1 | Ledger | Founder |
| `approve_campaign_launch` | 2 | Forge + Pulse | Founder |
| `approve_spend_increase` | 2 | Guardian | Founder |
| `approve_desirability_gate` | 2 | Guardian | Founder |
| `approve_feasibility_gate` | 3 | Guardian | Founder |
| `approve_viability_gate` | 4 | Guardian | Founder |
| `request_human_decision` | 4 | Synthesis | Founder |

### Agent Decision Authority

| Decision Type | Can Decide | Must Escalate |
|---------------|------------|---------------|
| Implementation approach | R (Responsible agent) | Novel patterns, breaking changes |
| Component selection | Team Lead | New dependencies, license changes |
| API design | system-architect | Breaking changes, cross-repo impact |
| Schema changes | system-architect | Breaking changes, data migration |
| Deployment | platform-eng | Production issues, rollbacks |
| Methodology interpretation | domain-expert-vpd | VPD framework changes |
| Feature prioritization | product-strategist | Scope changes, new epics |
| Resource allocation | project-manager | Tool purchases |

### Approval Thresholds

| Action | Approval Required |
|--------|-------------------|
| Merge to main | qa-engineer quality gate pass |
| Production deploy | platform-eng + system-architect |
| Schema migration | system-architect + data-engineer |
| New epic creation | product-strategist + Founder |
| ADR (Architecture Decision) | system-architect + Leadership Team |
| Cross-repo change | platform-eng + affected repo owners |
| Pivot recommendation | domain-expert-vpd + product-strategist + Founder |

---

## 7. Quality Gates

Before any work is marked complete:

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes (unit tests)
- [ ] `pnpm test:e2e` passes (if UI change)
- [ ] `pnpm schema:fk:ci` passes (if schema change)
- [ ] Story annotations added (`@story US-XXX`)
- [ ] Accountable owner has signed off
- [ ] Evidence design validated by domain-expert-vpd (if testing assumption)

---

## 8. Methodology Governance (Added per domain-expert-vpd)

### Assumption-to-Work Mapping

Every work item testing an assumption (A1-A8) requires:
1. **Test card review** - domain-expert-vpd verifies work measures what test card specifies
2. **Evidence threshold** - explicit success/failure criteria before work starts
3. **Evidence preservation** - how qualitative/quantitative data persists

| Assumption | Test Card Metric | Evidence Threshold |
|------------|------------------|-------------------|
| A1: Trust AI | Approval rate at HITL checkpoints | >70% = validated, <40% = invalidated |
| A2: Quick Start converts | Start → complete rate | >60% = validated |
| A3: AI extracts context | Brief accuracy (field edits) | <20% major edits = validated |
| A4: WTP for platform | Pricing survey WTP median | >$29/mo = validated |
| A5: VPD resonates | Landing page CTR | >3% = validated |
| A6: Consultants see value | Trial → paid conversion | >10% = validated |
| A7: AI Founders messaging | A/B test lift | >20% lift = validated |
| A8: IH is right channel | IH signup quality score | >50% complete Phase 1 = validated |

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| [WORK.md](./WORK.md) | Sprint status and backlog |
| [PROJECT-PLAN.md](./PROJECT-PLAN.md) | Master plan, assumptions, test cards, evidence |
| [cross-repo-blockers.md](./cross-repo-blockers.md) | Ecosystem dependencies |
| [approval-workflows.md](../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) | HITL checkpoint patterns |
| [09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) | Ecosystem status |

---

## Appendix: Leadership Team Meeting Notes (2026-01-29)

### Participants
- product-strategist
- system-architect
- domain-expert-vpd
- project-manager (facilitator)

### Key Outcomes
1. RACI matrix drafted with 3 unresolved conflicts escalated to Founder
2. Communication cadence agreed (Mon/Wed/Fri rhythm)
3. Escalation tiers defined (Team → Leadership → Founder)
4. Evidence thresholds added for all 8 assumptions
5. Two priority escalations raised (Epic 6, Trial Split)

### Decisions Logged (Founder, 2026-01-30)
- Decision #1: VPD accountable for A1 schema design/changes; product-strategist accountable for interpretation; schema versioning required for mid-test changes
- Decision #2: Sequence consultant VPC discovery (Week 1) then low-cost marketing (Week 2), with scale criteria and pause rules
- Decision #3: Split HITL Approval into data source/state flow (A: system-architect) and UX presentation (A: product-strategist); UX blocked on data contract
- Decision #4: Epic 6 remains P1; re-evaluate at Phase 2 → 3 gate
- Decision #5: Trial Split moved to Current Sprint; PostHog HITL approval events moved to P1 backlog

---

**Draft Version**: 2.1
**Next Review**: After Phase 2 → 3 gate or major scope change
**Approved By**: _Pending final sign-off_
