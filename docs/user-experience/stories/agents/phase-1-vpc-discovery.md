---
purpose: "Phase 1 Stage B agent stories - VPC Discovery"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
phase: "1B"
crews: ["DiscoveryCrew", "CustomerProfileCrew", "ValueDesignCrew", "WTPCrew", "FitAssessmentCrew"]
agents: ["E1", "D1", "D2", "D3", "D4", "J1", "J2", "PAIN_RES", "PAIN_RANK", "GAIN_RES", "GAIN_RANK", "V1", "V2", "V3", "W1", "W2", "FIT_SCORE", "FIT_ROUTE"]
hitl_checkpoints: ["approve_experiment_plan", "approve_pricing_test", "approve_discovery_output"]
---

# Phase 1 Stage B: VPC Discovery (US-AD)

Stories for the VPC Discovery crews that build Customer Profile, Value Map, and calculate Problem-Solution Fit.

**Crews**: DiscoveryCrew, CustomerProfileCrew, ValueDesignCrew, WTPCrew, FitAssessmentCrew
**Agents**: 18 total (see header)
**HITL Checkpoints**: `approve_experiment_plan`, `approve_pricing_test`, `approve_discovery_output`
**Spec Reference**: `reference/agent-specifications.md#phase-1-vpc-discovery`

---

### US-AD01: Design Experiment Plan

**As the** E1 Experiment Designer agent,
**I want to** create a structured experiment plan from the Founder's Brief,
**So that** discovery activities are systematic and evidence-based.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- E1 role: "Experiment Designer" - specialized in test design, not execution

**Goal Quality:**
- Goal: "Design experiments that generate statistically significant evidence for key assumptions"
- Success criteria: Test Cards with clear pass/fail thresholds

**Backstory Coherence:**
- "Lean Startup practitioner with 8 years designing customer discovery experiments. Obsessive about evidence quality over vanity metrics."

**Tool-Agent Alignment:**
- TestCardTool - Generate Test Card artifacts
- LearningCardTool - Generate Learning Card artifacts
- LearningRetrievalTool - Query flywheel for past learnings

---

### Task Design Validation (80/20 Rule)

**Task: `design_experiment_plan`**
- Single purpose: Experiment design only
- Input: `FoundersBrief`, historical learnings
- Output: `ExperimentPlan`
- Quality criteria: >= 3 Test Cards, SAY/DO mix, clear metrics

---

### Business Acceptance Criteria

**Given** an approved `FoundersBrief` with key_assumptions
**When** `design_experiment_plan` task completes
**Then**:
- `ExperimentPlan.test_cards` contains >= 3 Test Cards
- Each Test Card has hypothesis, method, success_metric, threshold
- `ExperimentPlan.experiment_mix` includes both SAY and DO evidence types
- `ExperimentPlan.budget_allocation` respects user's budget constraints

**Given** the experiment plan is ready
**When** checkpoint is reached
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_experiment_plan'`
- User can approve, modify, or reject individual experiments

---

### Schemas & State

**Output Schema:** `ExperimentPlan`
```python
class ExperimentPlan(BaseModel):
    assumptions_map: AssumptionsMap  # 2x2 prioritization matrix
    test_cards: list[TestCard]  # Experiments to run (>= 3)
    experiment_mix: ExperimentMix  # SAY vs DO balance
    budget_allocation: BudgetAllocation  # Cost per experiment
    timeline: Timeline  # Execution schedule
    success_metrics: list[Metric]  # How to measure success
```

**State Transition:**
```
status='running' → status='paused', hitl_state='approve_experiment_plan'
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Unit Test | `startupai-crew/src/crews/discovery/crew.test.py` |
| Code | `@story US-AD01` in `startupai-crew/src/crews/discovery/crew.py` |
| Config | `startupai-crew/src/crews/discovery/config/agents.yaml#E1` |

---

### US-AD02: Collect SAY Evidence

**As the** D1 Customer Interview agent,
**I want to** conduct customer interviews following Mom Test methodology,
**So that** SAY evidence is collected without leading customers.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- D1 role: "Customer Interview Specialist" - Mom Test methodology expert

**Goal Quality:**
- Goal: "Extract authentic customer insights without leading questions"
- Success criteria: Verbatim quotes, behavioral patterns, job discoveries

**Backstory Coherence:**
- "Customer researcher trained in Jobs-to-be-Done methodology. Never asks 'would you buy this?' - always 'show me how you currently solve this.'"

**Tool-Agent Alignment:**
- InterviewSchedulerTool (STUB) - Schedule customer interviews
- TranscriptionTool (STUB) - Transcribe recordings
- InsightExtractorTool (STUB) - Extract insights from transcripts
- BehaviorPatternTool (STUB) - Identify behavioral patterns

---

### Business Acceptance Criteria

**Given** an approved experiment plan with SAY experiments
**When** `collect_say_evidence` task completes
**Then**:
- `SAYEvidence.interviews_conducted` >= 5
- `SAYEvidence.key_quotes` contains verbatim customer quotes
- `SAYEvidence.jobs_discovered` maps to JTBD framework
- `SAYEvidence.say_confidence_score` is between 0-1

---

### Schemas & State

**Output Schema:** `SAYEvidence`
```python
class SAYEvidence(BaseModel):
    interviews_conducted: int  # >= 5 recommended
    interview_summaries: list[InterviewSummary]
    key_quotes: list[Quote]  # Verbatim customer quotes
    jobs_discovered: list[Job]  # JTBD from interviews
    pains_discovered: list[Pain]  # Pain points mentioned
    gains_discovered: list[Gain]  # Desired gains mentioned
    behavioral_patterns: list[Pattern]  # Observed behaviors
    say_confidence_score: float  # 0-1
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD02` in `startupai-crew/src/crews/discovery/crew.py` |
| Config | `startupai-crew/src/crews/discovery/config/agents.yaml#D1` |

---

### US-AD03: Collect DO Evidence (Indirect)

**As the** D2 Observation agent,
**I want to** gather behavioral evidence from public sources,
**So that** DO-indirect evidence triangulates with SAY evidence.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- D2 role: "Market Behavior Observer" - passive evidence collection

**Goal Quality:**
- Goal: "Identify behavioral patterns in existing market behavior"
- Success criteria: Forum insights, review analysis, trend data

**Tool-Agent Alignment:**
- TavilySearchTool (EXISTS) - Web search for market research
- ForumScraperTool (STUB) - Reddit, Quora, industry forums
- ReviewAnalysisTool (STUB) - App store, G2, Capterra reviews
- SocialListeningTool (STUB) - Twitter/X, LinkedIn monitoring
- TrendAnalysisTool (STUB) - Google Trends, keyword volumes

---

### Business Acceptance Criteria

**Given** a customer segment from the Founder's Brief
**When** `collect_do_indirect_evidence` task completes
**Then**:
- `DOIndirectEvidence.forum_insights` contains relevant discussions
- `DOIndirectEvidence.review_analysis` includes sentiment and themes
- `DOIndirectEvidence.trend_data` shows search volumes and trends
- `DOIndirectEvidence.do_indirect_score` is between 0-1

---

### Schemas & State

**Output Schema:** `DOIndirectEvidence`
```python
class DOIndirectEvidence(BaseModel):
    forum_insights: list[ForumInsight]  # Forum discussions analyzed
    review_analysis: ReviewSummary  # Review sentiment and themes
    social_signals: list[SocialSignal]  # Social media indicators
    trend_data: TrendAnalysis  # Search trends, volumes
    behavioral_evidence: list[BehavioralEvidence]
    do_indirect_score: float  # 0-1
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD03` in `startupai-crew/src/crews/discovery/crew.py` |
| Config | `startupai-crew/src/crews/discovery/config/agents.yaml#D2` |

---

### US-AD04: Collect DO Evidence (Direct)

**As the** D3 CTA Test agent,
**I want to** run conversion experiments with real CTAs,
**So that** DO-direct evidence shows actual behavior, not stated intent.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- D3 role: "Conversion Experiment Specialist" - A/B testing expert

**Goal Quality:**
- Goal: "Generate statistically significant behavioral evidence through real CTAs"
- Success criteria: Conversion rates with confidence intervals

**Tool-Agent Alignment:**
- AnalyticsTool (STUB) - Track conversions, engagement
- ABTestTool (STUB) - Run A/B experiments

---

### Business Acceptance Criteria

**Given** an approved experiment plan with DO-direct experiments
**When** `collect_do_direct_evidence` task completes
**Then**:
- `DODirectEvidence.experiments_run` contains test results
- `DODirectEvidence.conversion_rates` shows CTA performance
- `DODirectEvidence.do_direct_score` is between 0-1

---

### Schemas & State

**Output Schema:** `DODirectEvidence`
```python
class DODirectEvidence(BaseModel):
    experiments_run: list[ExperimentResult]
    landing_page_metrics: LandingPageMetrics
    ad_performance: AdPerformance
    conversion_rates: dict[str, float]
    cta_click_rates: dict[str, float]
    signup_rates: dict[str, float]
    do_direct_score: float  # 0-1
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD04` in `startupai-crew/src/crews/discovery/crew.py` |
| Config | `startupai-crew/src/crews/discovery/config/agents.yaml#D3` |

---

### US-AD05: Triangulate Evidence

**As the** D4 Evidence Triangulation agent,
**I want to** synthesize SAY and DO evidence sources,
**So that** conflicting signals are identified and confidence is quantified.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- D4 role: "Evidence Triangulation Analyst" - synthesis specialist

**Goal Quality:**
- Goal: "Identify where customer words align or conflict with behavior"
- Success criteria: SAY-DO alignment score, confidence metrics

**Backstory Coherence:**
- "Data analyst who learned that customers lie to themselves. Trusts behavior over words, but values understanding the gap."

**Tool-Agent Alignment:**
- LearningCardTool (STUB) - Generate Learning Card artifacts
- LearningCaptureTool (EXISTS) - Persist learnings to flywheel

---

### Business Acceptance Criteria

**Given** SAYEvidence, DOIndirectEvidence, and DODirectEvidence
**When** `triangulate_evidence` task completes
**Then**:
- `EvidenceSynthesis.say_do_alignment` is between -1 (conflict) and 1 (alignment)
- `EvidenceSynthesis.learning_cards` capture key insights
- `EvidenceSynthesis.key_insights` lists actionable findings

---

### Schemas & State

**Output Schema:** `EvidenceSynthesis`
```python
class EvidenceSynthesis(BaseModel):
    say_evidence: SAYEvidence
    do_indirect_evidence: DOIndirectEvidence
    do_direct_evidence: DODirectEvidence
    triangulation_matrix: TriangulationMatrix
    say_do_alignment: float  # -1 to 1
    confidence_scores: ConfidenceScores
    learning_cards: list[LearningCard]
    key_insights: list[Insight]
    recommendations: list[Recommendation]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD05` in `startupai-crew/src/crews/discovery/crew.py` |
| Config | `startupai-crew/src/crews/discovery/config/agents.yaml#D4` |

---

### US-AD06: Build Customer Profile

**As the** CustomerProfileCrew,
**I want to** build the right side of the Value Proposition Canvas,
**So that** Jobs, Pains, and Gains are structured and ranked.

---

### Agent Design Validation (CrewAI Principles)

**Crew Composition:**
- J1 (JTBD Researcher) + J2 (Job Ranking)
- PAIN_RES (Pain Researcher) + PAIN_RANK (Pain Ranking)
- GAIN_RES (Gain Researcher) + GAIN_RANK (Gain Ranking)

**Specialization Pattern:**
- Research agents discover (tools: TavilySearchTool, ForumScraperTool, ReviewAnalysisTool)
- Ranking agents prioritize (pure LLM)

---

### Business Acceptance Criteria

**Given** EvidenceSynthesis from D4
**When** CustomerProfileCrew completes
**Then**:
- `CustomerProfile.jobs` contains >= 5 jobs ranked by priority
- `CustomerProfile.pains` contains >= 5 pains ranked by severity
- `CustomerProfile.gains` contains >= 5 gains ranked by relevance
- Each item has `validation_status` (validated/invalidated/untested)

---

### Schemas & State

**Output Schema:** `CustomerProfile`
```python
class CustomerProfile(BaseModel):
    segment_name: str
    segment_description: str
    jobs: list[CustomerJob]  # >= 5, ranked by priority
    pains: list[CustomerPain]  # >= 5, ranked by severity
    gains: list[CustomerGain]  # >= 5, ranked by relevance
    jobs_validated: int
    pains_validated: int
    gains_validated: int

class CustomerJob(BaseModel):
    id: str
    job_statement: str  # "When [situation], I want to [motivation] so I can [outcome]"
    job_type: JobType  # functional, social, emotional, supporting
    priority: int  # 1-10
    validation_status: ValidationStatus
    evidence_ids: list[str]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD06` in `startupai-crew/src/crews/discovery/` |
| Config | `startupai-crew/src/crews/discovery/config/` |

---

### US-AD07: Build Value Map

**As the** ValueDesignCrew,
**I want to** build the left side of the Value Proposition Canvas,
**So that** Products, Pain Relievers, and Gain Creators are designed.

---

### Agent Design Validation (CrewAI Principles)

**Crew Composition:**
- V1 (Solution Designer) - Products & Services
- V2 (Pain Reliever Designer) - Pain Relievers
- V3 (Gain Creator Designer) - Gain Creators

**Tool-Agent Alignment:**
- All use CanvasBuilderTool (STUB) for VPC visualization
- Temperature: 0.7 (creative exploration)

---

### Business Acceptance Criteria

**Given** CustomerProfile with ranked Jobs, Pains, Gains
**When** ValueDesignCrew completes
**Then**:
- `ValueMap.products_services` addresses top 3 jobs
- `ValueMap.pain_relievers` addresses top 3 pains with effectiveness rating
- `ValueMap.gain_creators` addresses top 3 gains with effectiveness rating
- Each mapping references valid CustomerProfile IDs

---

### Schemas & State

**Output Schema:** `ValueMap`
```python
class ValueMap(BaseModel):
    products_services: list[ProductService]
    pain_relievers: list[PainReliever]
    gain_creators: list[GainCreator]

class PainReliever(BaseModel):
    id: str
    description: str
    addresses_pain_id: str  # Must match CustomerProfile pain ID
    effectiveness: str  # "eliminates", "reduces", "none"
    validation_status: ValidationStatus
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD07` in `startupai-crew/src/crews/discovery/` |
| Config | `startupai-crew/src/crews/discovery/config/` |

---

### US-AD08: Validate Willingness to Pay

**As the** WTPCrew,
**I want to** test pricing hypotheses with real payment signals,
**So that** WTP is validated beyond stated intent.

---

### Agent Design Validation (CrewAI Principles)

**Crew Composition:**
- W1 (Pricing Experiment Agent) - Design pricing tests
- W2 (Payment Test Agent) - Execute payment validation

**Tool-Agent Alignment:**
- ABTestTool (STUB) - Price point A/B tests
- AnalyticsTool (STUB) - Track conversion by price

---

### Business Acceptance Criteria

**Given** ValueMap products with proposed pricing
**When** `validate_wtp` task completes
**Then**:
- `WTPEvidence.optimal_price_range` is calculated
- `WTPEvidence.price_elasticity` quantifies sensitivity
- `WTPEvidence.actual_payment_rate` shows real commitment

**Given** WTP experiment involves real payment
**When** experiment plan is ready
**Then**:
- `hitl_requests` INSERT with `checkpoint_type='approve_pricing_test'`
- User must approve before payment experiments run

---

### Schemas & State

**Output Schema:** `WTPExperiments`, `PaymentTests`
```python
class WTPExperiments(BaseModel):
    van_westendorp: VanWestendorpResults
    conjoint_analysis: ConjointResults
    ab_test_results: list[PriceABTest]
    optimal_price_range: PriceRange
    price_elasticity: float

class PaymentTests(BaseModel):
    preorder_results: PreorderResults
    crowdfunding_signals: CrowdfundingSignals
    loi_results: LOIResults
    actual_payment_rate: float
    wtp_confidence: float  # 0-1
```

**State Transition:**
```
status='running' → status='paused', hitl_state='approve_pricing_test'
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD08` in `startupai-crew/src/crews/discovery/` |
| Config | `startupai-crew/src/crews/discovery/config/` |

---

### US-AD09: Calculate Fit Score

**As the** FIT_SCORE agent,
**I want to** calculate Problem-Solution Fit score,
**So that** the discovery gate decision is quantified.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- FIT_SCORE role: "Fit Analyst" - quantitative assessment

**Goal Quality:**
- Goal: "Calculate fit score using validated VPD methodology"
- Success criteria: Numeric score 0-100, threshold >= 70 to proceed

**Tool-Agent Alignment:**
- MethodologyCheckTool (EXISTS) - Validate VPD compliance

---

### Business Acceptance Criteria

**Given** CustomerProfile, ValueMap, and WTP evidence
**When** `calculate_fit_score` task completes
**Then**:
- `FitAssessment.fit_score` is between 0-100
- `FitAssessment.fit_status` is "strong", "moderate", "weak", or "none"
- `FitAssessment.gate_ready` = true when score >= 70

---

### Schemas & State

**Output Schema:** `FitAssessment`
```python
class FitAssessment(BaseModel):
    fit_score: int  # 0-100, threshold >= 70
    fit_status: str  # strong, moderate, weak, none
    profile_completeness: float  # 0.0-1.0
    value_map_coverage: float  # 0.0-1.0
    evidence_strength: str  # strong, weak, none
    experiments_run: int
    experiments_passed: int
    gate_ready: bool
    blockers: list[str]
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD09` in `startupai-crew/src/crews/discovery/` |
| Config | `startupai-crew/src/crews/discovery/config/agents.yaml#FIT_SCORE` |

---

### US-AD10: Complete Discovery Output

**As the** FIT_ROUTE agent,
**I want to** route the discovery output to HITL or iteration,
**So that** the Phase 1 gate decision is presented for approval.

---

### Agent Design Validation (CrewAI Principles)

**Role Specificity:**
- FIT_ROUTE role: "Iteration Router" - routing decision only

**Goal Quality:**
- Goal: "Route to Phase 2 if fit >= 70, else identify iteration target"
- Success criteria: Clear routing decision with rationale

**Tool-Agent Alignment:**
- No tools - pure LLM routing logic
- Temperature: 0.2 (deterministic routing)

---

### Business Acceptance Criteria

**Given** FitAssessment with fit_score >= 70
**When** routing decision is made
**Then**:
- `IterationRouting.route_decision` = "proceed_phase_2"
- `hitl_requests` INSERT with `checkpoint_type='approve_discovery_output'`
- User reviews full VPC + Brief before Phase 2

**Given** FitAssessment with fit_score < 70
**When** routing decision is made
**Then**:
- `IterationRouting.route_decision` = "iterate_crew_X"
- `IterationRouting.iteration_target` identifies which crew to revisit
- `IterationRouting.iteration_focus` describes what to improve

---

### Schemas & State

**Output Schema:** `IterationRouting`
```python
class IterationRouting(BaseModel):
    fit_score: int
    threshold_met: bool  # fit_score >= 70
    route_decision: str  # "proceed_phase_2" or "iterate_crew_X"
    iteration_target: Optional[str]
    iteration_focus: Optional[str]
    iteration_count: int
    max_iterations_warning: bool
```

**State Transition:**
```
If threshold_met: status='running' → status='paused', hitl_state='approve_discovery_output'
If not threshold_met: iteration loop continues
```

---

### Traceability

| Artifact | Path |
|----------|------|
| E2E Test | `frontend/tests/e2e/31-agent-vpc-discovery.spec.ts` |
| Code | `@story US-AD10` in `startupai-crew/src/crews/discovery/` |
| Config | `startupai-crew/src/crews/discovery/config/agents.yaml#FIT_ROUTE` |

---

## Summary

| ID | Title | Checkpoint | Crew |
|----|-------|------------|------|
| US-AD01 | Design Experiment Plan | approve_experiment_plan | DiscoveryCrew |
| US-AD02 | Collect SAY Evidence | (internal) | DiscoveryCrew |
| US-AD03 | Collect DO Evidence (Indirect) | (internal) | DiscoveryCrew |
| US-AD04 | Collect DO Evidence (Direct) | (internal) | DiscoveryCrew |
| US-AD05 | Triangulate Evidence | (internal) | DiscoveryCrew |
| US-AD06 | Build Customer Profile | (internal) | CustomerProfileCrew |
| US-AD07 | Build Value Map | (internal) | ValueDesignCrew |
| US-AD08 | Validate WTP | approve_pricing_test | WTPCrew |
| US-AD09 | Calculate Fit Score | (internal) | FitAssessmentCrew |
| US-AD10 | Complete Discovery Output | approve_discovery_output | FitAssessmentCrew |

---

**Related Documents:**
- [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) - CustomerProfile, ValueMap, FitAssessment
- [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) - Phase 1 checkpoints
- [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) - All Phase 1 agents

---

**Last Updated**: 2026-01-23
