# Consultant Dashboard Amendment Plan

**Date:** September 2, 2025  
**Purpose:** Transform consultant dashboard from single-project workflow management to portfolio-focused
governance platform  
**Strategic Alignment:** Evidence-Led Strategy Platform v1 specification

---

## Current State Analysis

### Existing Implementation

The current consultant dashboard (`/dashboard`) is designed as a **single-project workflow management tool** with:

- Active AI workflows for individual clients
- Canvas generation tracking
- Recent activity feed
- Metrics focused on workflow completion rates

### Strategic Misalignment

- **Gap 1:** Portfolio vs. Project Focus — Current dashboard manages individual workflows, not multiple client portfolios
- **Gap 2:** Missing Governance — No gate policy management, audit trails, or override controls
- **Gap 3:** Wrong Persona Fit — Built for workflow operators, not Lead Consultants or Program Managers
- **Gap 4:** No Evidence Framework — Missing hypothesis management, evidence validation, and gate enforcement

---

## Target State Vision

### Primary Personas Served

1. **Lead Consultant (LC)** — Portfolio orchestration, gate decisions, evidence validation
2. **Program Manager (PM)** — Multi-project oversight, governance enforcement, risk management
3. **Client Stakeholder (CS)** — Report access, transparency into validation process

### Core Capabilities Required

- **Portfolio Management** — Multi-client project overview with stage progression
- **Gate Governance** — Policy configuration, gate attempts, override management
- **Evidence Oversight** — Cross-project evidence quality, citation tracking
- **Audit & Compliance** — Tamper-evident logs, governance trail
- **Report Generation** — Client deliverables with transparent reasoning

---

## Amendment Strategy

### Phase 1: Portfolio Foundation

**Timeline:** Week 1-2  
**Scope:** Transform single-project view to multi-project portfolio

#### 1.1 Portfolio Overview Dashboard

```typescript
// New primary view replacing current workflow cards
interface PortfolioProject {
  id: string
  clientName: string
  stage: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE'
  gateStatus: 'Pending' | 'Passed' | 'Failed'
  riskBudget: { planned: number; actual: number; delta: number }
  lastActivity: string
  assignedConsultant: string
  evidenceQuality: number // 0-1 score
  nextGateDate?: string
}
```

**Components to Build:**

- `PortfolioGrid` — Card layout showing all client projects
- `StageProgressIndicator` — Visual timeline (Discovery → Feasibility → Viability → Scale)
- `RiskBudgetWidget` — Traffic light system for budget vs. actual
- `ProjectHealthScore` — Composite metric (evidence quality + gate readiness)

#### 1.2 Portfolio Metrics

Replace workflow metrics with portfolio KPIs:

- **Active Projects by Stage** — Distribution across validation gates
- **Gate Pass Rate** — Success rate by gate type and consultant
- **Average Cycle Time** — Time spent in each validation stage
- **Evidence Coverage** — Percentage of hypotheses with supporting evidence
- **Override Rate** — Frequency of gate bypasses (governance metric)

### Phase 2: Gate Governance System

**Timeline:** Week 3-4  
**Scope:** Implement hard gates, policy management, override controls

#### 2.1 Gate Policy Editor

```typescript
interface GatePolicy {
  gate: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY'
  criteria: {
    minExperiments: number
    strengthMix: { weak: number; medium: number; strong: number }
    thresholds: Record<string, number> // CTR, signup rate, etc.
    requiredEvidence: string[] // interview, analytics, etc.
  }
  overrideRoles: string[]
  approvalChain: string[]
}
```

**Components to Build:**

- `PolicyEditor` — JSON-based configuration with form UI
- `GateCriteriaPreview` — Real-time validation of policy changes
- `OverrideRequestForm` — Structured rationale capture
- `ApprovalQueue` — Pending override requests for Program Managers

#### 2.2 Gate Scorecard Management

Transform from project-level to portfolio-level gate oversight:

- **Gate Attempt History** — All attempts across projects with outcomes
- **Failing Criteria Analysis** — Common failure patterns by gate type
- **Override Audit Trail** — Who, when, why for all gate bypasses
- **Policy Impact Analysis** — Effect of policy changes on pass rates

### Phase 3: Evidence & Audit Framework

**Timeline:** Week 5-6  
**Scope:** Evidence quality oversight and governance compliance

#### 3.1 Evidence Quality Dashboard

```typescript
interface EvidenceMetrics {
  totalEvidence: number
  evidenceByType: Record<'interview' | 'desk' | 'analytics' | 'experiment', number>
  averageRecency: number // days since collection
  citationAccuracy: number // percentage of claims with valid citations
  contradictionRate: number // conflicting evidence percentage
}
```

**Components to Build:**

- `EvidenceQualityMatrix` — Heat map by project and evidence type
- `CitationTracker` — Unused evidence, over-cited sources
- `ContradictionAlerts` — Conflicting evidence across projects
- `EvidenceRecommendations` — AI-suggested evidence gaps

#### 3.2 Audit Log & Compliance

```typescript
interface AuditEvent {
  id: string
  timestamp: string
  eventType: string
  actor: string
  projectId: string
  payload: any
  payloadHash: string // tamper-evident
  approver?: string // for overrides
}
```

**Components to Build:**

- `AuditLogViewer` — Filterable chronological events
- `ComplianceReports` — Automated governance summaries
- `TamperDetection` — Hash verification alerts
- `GovernanceMetrics` — Override frequency, approval times

### Phase 4: Program Manager Tools

**Timeline:** Week 7-8  
**Scope:** Portfolio oversight and risk management capabilities

#### 4.1 Risk Management Dashboard

- **Portfolio Risk Heat Map** — Projects by risk level and stage
- **Revert Risk Analysis** — Projects likely to move backwards
- **Resource Allocation** — Consultant workload and capacity
- **Client Health Scores** — Engagement and satisfaction metrics

#### 4.2 Performance Analytics

- **Consultant Performance** — Gate pass rates, cycle times by individual
- **Client Success Patterns** — Which validation approaches work best
- **Evidence Effectiveness** — Which evidence types predict success
- **Policy Optimization** — Recommended gate criteria adjustments

---

## Implementation Roadmap

### Week 1-2: Portfolio Foundation

- [ ] Replace workflow cards with portfolio project grid
- [ ] Implement stage progression indicators
- [ ] Add risk budget widgets
- [ ] Create portfolio metrics dashboard

### Week 3-4: Gate Governance

- [ ] Build gate policy editor with JSON schema
- [ ] Implement override request workflow
- [ ] Create approval queue for Program Managers
- [ ] Add gate attempt history tracking

### Week 5-6: Evidence & Audit

- [ ] Build evidence quality monitoring
- [ ] Implement citation tracking system
- [ ] Create audit log viewer with hash verification
- [ ] Add compliance reporting tools

### Week 7-8: Program Manager Tools

- [ ] Create risk management dashboard
- [ ] Build consultant performance analytics
- [ ] Implement client health scoring
- [ ] Add policy optimization recommendations

---

## Technical Architecture

### Data Model Extensions

```typescript
// New entities required
interface ConsultantPortfolio {
  consultantId: string
  projects: PortfolioProject[]
  policies: GatePolicy[]
  overrides: OverrideRequest[]
}

interface OverrideRequest {
  id: string
  projectId: string
  gate: string
  requestedBy: string
  rationale: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
}
```

### API Endpoints

```bash
GET /api/portfolio/:consultantId - Portfolio overview
GET /api/policies - Gate policies for consultant
PUT /api/policies/:policyId - Update gate policy
POST /api/overrides - Request gate override
GET /api/audit/:projectId - Audit trail
GET /api/analytics/portfolio - Portfolio metrics
```

### Component Architecture

- **Layout:** Extend `DashboardLayout` with portfolio navigation
- **State Management:** Add portfolio context provider
- **Data Fetching:** Portfolio-aware hooks and queries
- **Permissions:** Role-based component rendering

---

## Success Metrics

### Portfolio Management

- **Metric:** Projects visible per consultant increases from 1 to 5-15
- **Target:** 100% of consultants can view all assigned projects
- **Timeline:** Week 2

### Gate Governance

- **Metric:** Gate override rate decreases by 30%
- **Target:** <10% of gate attempts require overrides
- **Timeline:** Week 6

### Evidence Quality

- **Metric:** Citation accuracy increases to >90%
- **Target:** All reports have verifiable evidence links
- **Timeline:** Week 8

### Compliance

- **Metric:** Audit trail completeness reaches 100%
- **Target:** All governance actions logged and traceable
- **Timeline:** Week 8

---

## Risk Mitigation

### Technical Risks

- **Data Migration:** Gradual rollout with feature flags
- **Performance:** Pagination and lazy loading for large portfolios
- **Integration:** Maintain backward compatibility with existing APIs

### User Adoption Risks

- **Training:** Guided tours for new portfolio interface
- **Change Management:** Parallel deployment with opt-in beta
- **Feedback Loop:** Weekly consultant interviews during rollout

### Governance Risks

- **Policy Conflicts:** Version control for gate policies
- **Override Abuse:** Escalation paths and audit alerts
- **Compliance Gaps:** Automated validation of governance rules

---

## Conclusion

This amendment transforms the consultant dashboard from a **workflow management tool** to a **portfolio
governance platform**, aligning with the strategic vision of evidence-led validation. The phased approach
ensures minimal disruption while delivering immediate value through improved portfolio visibility and
governance controls.

**Next Steps:**

1. Stakeholder review and approval
2. Technical architecture validation
3. Phase 1 development kickoff
4. User testing with Lead Consultants
