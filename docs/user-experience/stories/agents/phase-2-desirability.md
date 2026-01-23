---
purpose: "Phase 2 agent stories - Desirability Validation"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
phase: "2"
crews: ["BuildCrew", "GrowthCrew", "GovernanceCrew"]
agents: ["F1", "F2", "F3", "P1", "P2", "P3", "G1", "G2", "G3"]
hitl_checkpoints: ["approve_campaign_launch", "approve_spend_increase", "approve_desirability_gate"]
---

# Phase 2: Desirability Validation (US-ADB)

Stories for Phase 2 crews that build landing pages, run ad campaigns, and measure desirability signal.

**Crews**: BuildCrew, GrowthCrew, GovernanceCrew
**Agents**: F1, F2, F3 (Build), P1, P2, P3 (Growth), G1, G2, G3 (Governance)
**HITL Checkpoints**: `approve_campaign_launch`, `approve_spend_increase`, `approve_desirability_gate`
**Spec Reference**: `reference/agent-specifications.md#phase-2-desirability`

---

### US-ADB01: Build Landing Page

**As the** BuildCrew,
**I want to** generate and deploy a conversion-optimized landing page,
**So that** desirability experiments have a testable artifact.

---

### Agent Design Validation (CrewAI Principles)

**Crew Composition:**
- F1 (UX/UI Designer) - Design artifacts, wireframes, component specs
- F2 (Frontend Developer) - Generate landing page HTML with Tailwind
- F3 (Backend Developer) - Deploy to Netlify

**Role Specificity:**
- F1 role: "Conversion UX Designer" - not generic "Designer"
- F2 role: "Landing Page Developer" - specialized in LP generation
- F3 role: "Deployment Specialist" - Netlify deployment expert

**Tool-Agent Alignment:**
- F1: ComponentLibraryScraperTool (STUB) - Access shadcn/ui
- F2: LandingPageGeneratorTool (LLM-Based), CodeValidatorTool (EXISTS)
- F3: LandingPageDeploymentTool (EXISTS)

---

### Task Design Validation (80/20 Rule)

**Task: `design_landing_page` (F1)**
- Single purpose: Design specification only
- Input: ValueMap, customer segment
- Output: `DesignArtifacts`

**Task: `build_landing_page` (F2)**
- Single purpose: HTML/Tailwind generation only
- Input: `DesignArtifacts`
- Output: `LandingPageBuild`

**Task: `deploy_landing_page` (F3)**
- Single purpose: Netlify deployment only
- Input: `LandingPageBuild`
- Output: `DeploymentResult`

---

### Business Acceptance Criteria

**Given** ValueMap with products/services and customer segment
**When** BuildCrew completes
**Then**:
- `LandingPageBuild.html` is valid HTML with Tailwind classes
- `LandingPageBuild.sections` includes hero, features, CTA minimum
- `LandingPageBuild.form_enabled` = true (signup form)
- `LandingPageBuild.tracking_enabled` = true (analytics JS)

**Given** landing page build succeeds
**When** `deploy_landing_page` task completes
**Then**:
- `DeploymentResult.site_url` is a valid HTTPS URL
- `DeploymentResult.deploy_status` = "success"
- `DeploymentResult.ssl_status` = "active"
- `DeploymentResult.analytics_configured` = true

---

### Schemas & State

**Output Schemas:**
```python
class LandingPageBuild(BaseModel):
    html: str  # Complete HTML with Tailwind
    sections: list[str]  # hero, features, cta, etc.
    tracking_enabled: bool
    form_enabled: bool
    validation_result: ValidationResult
    build_status: str  # "success" or "error"
    preview_url: Optional[str]

class DeploymentResult(BaseModel):
    deploy_id: str
    site_url: str  # Production URL
    deploy_status: str  # "success" or "failed"
    ssl_status: str
    analytics_configured: bool
    tracking_pixels: list[str]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/32-agent-desirability.spec.ts` |
| Unit Test | `startupai-crew/src/crews/desirability/crew.test.py` |
| Code | `@story US-ADB01` in `startupai-crew/src/crews/desirability/crew.py` |
| Config | `startupai-crew/src/crews/desirability/config/agents.yaml` |

---

### US-ADB02: Deploy Test Artifacts

**As the** F3 Backend Developer agent,
**I want to** deploy landing pages with proper analytics and tracking,
**So that** conversion data flows back to the Growth crew.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- F3 role: "Deployment Specialist" - Netlify-specific expertise

**Goal Quality:**
- Goal: "Deploy landing pages with sub-5-minute latency and 99.9% uptime"
- Success criteria: Successful deployment, analytics wired, SSL active

**Tool-Agent Alignment:**
- LandingPageDeploymentTool (EXISTS) - Deploy to Netlify

---

### Business Acceptance Criteria

**Given** a valid `LandingPageBuild`
**When** `deploy_artifacts` task completes
**Then**:
- Netlify site is created with unique subdomain
- SSL certificate is provisioned automatically
- Analytics tracking code is injected
- Form submissions route to webhook endpoint

**Given** deployment includes tracking pixels
**When** the landing page loads
**Then**:
- Meta Pixel fires on page load (if Meta campaign)
- Google Analytics tracks page views
- Form submission triggers conversion event

---

### Schemas & State

**State Persistence:**
```python
validation_runs.phase_state.desirability_evidence.landing_page_url = site_url
validation_runs.phase_state.desirability_evidence.deploy_timestamp = datetime.now()
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/32-agent-desirability.spec.ts` |
| Code | `@story US-ADB02` in `startupai-crew/src/crews/desirability/crew.py` |
| Tool | `startupai-crew/src/tools/landing_page_deployment_tool.py` |

---

### US-ADB03: Create Ad Campaigns

**As the** GrowthCrew,
**I want to** create and launch ad campaigns targeting the customer segment,
**So that** desirability can be measured with real traffic.

---

### Agent Design Validation (CrewAI Principles)

**Crew Composition:**
- P1 (Ad Creative) - Generate platform-specific ad copy
- P2 (Communications) - Execute and monitor campaigns
- P3 (Analytics) - Measure desirability signal

**Role Specificity:**
- P1 role: "Ad Creative Specialist" - platform-specific copy expert
- P2 role: "Campaign Execution Manager" - budget and A/B testing
- P3 role: "Conversion Analytics Specialist" - signal measurement

**Tool-Agent Alignment:**
- P1: AdCreativeGeneratorTool (LLM-Based), AdPlatformTool (STUB)
- P2: AdCreativeGeneratorTool, AdPlatformTool, BudgetGuardrailsTool (EXISTS)
- P3: AnalyticsTool (STUB)

---

### Task Design Validation (80/20 Rule)

**Task: `generate_ad_creatives` (P1)**
- Single purpose: Ad copy generation only
- Input: DeploymentResult, customer segment, value proposition
- Output: `AdCreatives` with platform-specific variants
- Quality criteria: Character limits respected, multiple variants

**Task: `execute_campaigns` (P2)**
- Single purpose: Campaign execution only
- Input: `AdCreatives`, budget, targeting
- Output: `CampaignExecution`
- Requires HITL: `approve_campaign_launch` before spend

---

### Business Acceptance Criteria

**Given** a deployed landing page and customer segment
**When** `generate_ad_creatives` task completes
**Then**:
- `AdCreatives.ad_variants` contains >= 3 variants per platform
- `AdCreatives.character_counts_validated` = true
- All headlines respect platform limits (Meta: 40, Google: 30)
- All descriptions respect platform limits (Meta: 125, Google: 90)

**Given** ad creatives are ready
**When** campaign launch checkpoint is reached
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_campaign_launch'`
- User reviews ad copy, targeting, and initial budget
- Campaign does NOT launch until approved

**Given** campaign is approved and running
**When** spend approaches budget threshold
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_spend_increase'`
- Campaign pauses until budget increase is approved

---

### Schemas & State

**Output Schemas:**
```python
class AdCreatives(BaseModel):
    platform: str  # meta | google | linkedin | tiktok
    ad_variants: list[AdVariant]
    headlines: list[str]  # Platform-appropriate
    descriptions: list[str]  # Platform-appropriate
    ctas: list[str]
    character_counts_validated: bool
    targeting: TargetingConfig
    budget_allocation: BudgetAllocation

class CampaignExecution(BaseModel):
    campaigns: list[Campaign]
    active_variants: list[AdVariant]
    daily_spend: dict[str, float]
    total_spend: float
    budget_remaining: float
    impressions: int
    clicks: int
    ctr: float
    cost_per_click: float
```

**State Transitions:**
```
On creative ready: status='running' → status='paused', hitl_state='approve_campaign_launch'
On budget threshold: status='running' → status='paused', hitl_state='approve_spend_increase'
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/32-agent-desirability.spec.ts` |
| Code | `@story US-ADB03` in `startupai-crew/src/crews/desirability/crew.py` |
| Config | `startupai-crew/src/crews/desirability/config/agents.yaml#P1` |

---

### US-ADB04: Measure Desirability Signal

**As the** P3 Analytics agent,
**I want to** analyze campaign performance and calculate desirability signal,
**So that** the gate decision is based on statistically significant evidence.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- P3 role: "Conversion Analytics Specialist" - statistical analysis expert

**Goal Quality:**
- Goal: "Calculate desirability signal with statistical confidence intervals"
- Success criteria: Signal strength with p-value < 0.05

**Tool-Agent Alignment:**
- AnalyticsTool (STUB) - Track and analyze metrics

---

### Task Design Validation (80/20 Rule)

**Task: `analyze_desirability_signal`**
- Single purpose: Signal calculation only
- Input: CampaignExecution, landing page metrics
- Output: `DesirabilitySignal`
- Quality criteria: Statistical significance, confidence intervals

---

### Business Acceptance Criteria

**Given** campaign has been running with sufficient data
**When** `analyze_desirability_signal` task completes
**Then**:
- `DesirabilitySignal.signal_strength` is "WEAK", "MODERATE", or "STRONG_COMMITMENT"
- `DesirabilitySignal.statistical_significance` indicates confidence
- `DesirabilitySignal.confidence_interval` provides range

**Signal Strength Mapping:**
- WEAK (NO_INTEREST): CTR < 1%, conversion < 0.5%
- MODERATE (MILD_INTEREST): CTR 1-3%, conversion 0.5-2%
- STRONG_COMMITMENT: CTR > 3%, conversion > 2%

---

### Schemas & State

**Output Schema:** `DesirabilitySignal`
```python
class DesirabilitySignal(BaseModel):
    signal_strength: str  # "WEAK", "MODERATE", "STRONG_COMMITMENT"
    metrics: DesirabilityMetrics
    conversion_funnel: ConversionFunnel
    statistical_significance: bool
    confidence_interval: tuple[float, float]
    recommendation: str
```

**Evidence Schema:**
```python
class DesirabilityEvidence(BaseModel):
    ad_impressions: int
    ad_clicks: int
    ad_signups: int
    ad_spend: float
    problem_resonance: float  # 0.0-1.0
    zombie_ratio: float  # 0.0-1.0 (interested but not committing)
    conversion_rate: float  # 0.0-1.0
    signal: Optional[ValidationSignal]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/32-agent-desirability.spec.ts` |
| Code | `@story US-ADB04` in `startupai-crew/src/crews/desirability/crew.py` |
| Config | `startupai-crew/src/crews/desirability/config/agents.yaml#P3` |

---

### US-ADB05: Evaluate Desirability Gate

**As the** GovernanceCrew,
**I want to** validate desirability artifacts and evaluate the gate,
**So that** Phase 3 only begins with verified desirability.

---

### Agent Design Validation (CrewAI Principles)

**Crew Composition:**
- G1 (QA Agent) - Methodology compliance
- G2 (Security Agent) - PII protection
- G3 (Audit Agent) - Audit trail capture

**Role Specificity:**
- G1 role: "VPD Methodology QA Specialist"
- G2 role: "Data Privacy Guardian"
- G3 role: "Compliance Auditor"

**Tool-Agent Alignment:**
- G1: MethodologyCheckTool (EXISTS), GuardianReviewTool (EXISTS)
- G2: PrivacyGuardTool (EXISTS)
- G3: LearningCaptureTool (EXISTS)

---

### Task Design Validation (80/20 Rule)

**Task: `validate_desirability_output` (G1)**
- Single purpose: QA validation only
- Output: `QAReport`

**Task: `security_review` (G2)**
- Single purpose: Security/privacy check only
- Output: `SecurityReport`

**Task: `audit_phase` (G3)**
- Single purpose: Audit capture only
- Output: `AuditReport`

---

### Business Acceptance Criteria

**Given** DesirabilitySignal indicates STRONG_COMMITMENT
**When** GovernanceCrew completes validation
**Then**:
- `QAReport.methodology_compliance` = true
- `SecurityReport.pii_found` = false (or scrubbed)
- `AuditReport.flywheel_captured` = true
- `hitl_requests` INSERT with `checkpoint_type='approve_desirability_gate'`

**Given** DesirabilitySignal indicates MILD_INTEREST
**When** gate evaluation runs
**Then**:
- Innovation Physics recommends VALUE_PIVOT
- `hitl_requests` includes pivot recommendation
- User can approve pivot or override

**Given** DesirabilitySignal indicates NO_INTEREST (WEAK)
**When** gate evaluation runs
**Then**:
- Innovation Physics recommends SEGMENT_PIVOT
- `hitl_requests` includes pivot recommendation
- User can approve pivot, try different segment, or kill

---

### Schemas & State

**Output Schemas:**
```python
class QAReport(BaseModel):
    methodology_compliance: bool
    quality_score: float  # 0-1
    issues_found: list[Issue]
    recommendations: list[str]
    gate_ready: bool

class SecurityReport(BaseModel):
    pii_found: bool
    pii_locations: list[PIILocation]
    scrubbing_performed: bool
    compliance_status: str

class AuditReport(BaseModel):
    phase_summary: PhaseSummary
    decisions_logged: list[Decision]
    evidence_chain: EvidenceChain
    compliance_attestation: bool
    audit_timestamp: datetime
    flywheel_captured: bool
```

**State Transition:**
```
On gate ready: status='running' → status='paused', hitl_state='approve_desirability_gate'
On MILD_INTEREST: pivot_recommendation='VALUE_PIVOT'
On NO_INTEREST: pivot_recommendation='SEGMENT_PIVOT'
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/32-agent-desirability.spec.ts` |
| Code | `@story US-ADB05` in `startupai-crew/src/crews/desirability/crew.py` |
| Config | `startupai-crew/src/crews/desirability/config/agents.yaml#G1` |

---

## Summary

| ID | Title | Checkpoint | Crew |
|----|-------|------------|------|
| US-ADB01 | Build Landing Page | (internal) | BuildCrew |
| US-ADB02 | Deploy Test Artifacts | (internal) | BuildCrew |
| US-ADB03 | Create Ad Campaigns | approve_campaign_launch | GrowthCrew |
| US-ADB04 | Measure Desirability Signal | approve_spend_increase | GrowthCrew |
| US-ADB05 | Evaluate Desirability Gate | approve_desirability_gate | GovernanceCrew |

---

**Related Documents:**
- [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) - DesirabilityEvidence
- [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - Phase 2 checkpoints
- [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) - Phase 2 agents

---

**Last Updated**: 2026-01-23
