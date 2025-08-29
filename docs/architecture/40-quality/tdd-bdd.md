# TDD/BDD on GCP

Contract tests at adapter boundaries; golden scenarios for VPC/BMC/TBI with evaluator thresholds. E2E smokes against Cloud Run; cost/latency assertions with SLO bounds.

## Unit

- Prompt builders, parsers, evaluators; deterministic fixtures

## Contract

- `OpenAIAdapter`/`VertexAIAdapter` wire-format, error semantics, cost reporting

## Golden tests

- Curated client scenarios with locked inputs and expected evaluator scores

## E2E

- Orchestrator happy- and failure-path through stage gates; renderer smoke tests (SVG diff tolerance)

## Non-functional

- Load/cost tests verify router respects budget caps; chaos tests for provider timeouts

Related:

- BDD details: `docs/architecture/40-quality/bdd.md`
- Golden Scenarios: `docs/architecture/40-quality/golden-scenarios.md`
- SLOs: `docs/architecture/40-quality/slos.md`

---

<!-- markdownlint-disable-next-line MD033 -->
<!-- Anchor preserved from overview.md to avoid broken links -->
<a id="behavior-driven-development-bdd-scenarios"></a>

## 🎭 Behavior-Driven Development (BDD) Scenarios

### Core User Behaviors & Acceptance Criteria

BDD scenarios define what the system should do from the user's perspective, driving architectural design and feature requirements.

#### Scenario 1: Value Proposition Canvas Generation

```gherkin
Feature: AI-Powered Value Proposition Canvas Generation
  As a strategic consultant
  I want to generate a professional Value Proposition Canvas from client input
  So that I can deliver Strategyzer-compliant strategic analysis

Scenario: Successful canvas generation for new client
  Given I have a new client with basic business information
  And the client description includes target market and challenges
  When I trigger the discovery workflow
  Then the system should execute customer jobs, pains, and gains agents
  And generate a complete Value Proposition Canvas
  And provide export options in PDF, SVG, and PNG formats
  And achieve a quality score above 85%
  And complete the process in under 3 minutes

Scenario: Canvas generation with insufficient client data
  Given I have a client with minimal business information
  When I trigger the discovery workflow
  Then the system should identify missing information
  And prompt for additional client details
  And provide guidance on required information
  And allow partial canvas generation with confidence indicators
```

#### Scenario 2: Multi-Agent Workflow Orchestration

```gherkin
Feature: Intelligent Multi-Agent Collaboration
  As a platform user
  I want AI agents to collaborate and validate each other's work
  So that I receive high-quality, consensus-driven strategic insights

Scenario: Agents reach consensus on customer analysis
  Given multiple agents are analyzing the same client
  When the Customer Jobs Agent identifies functional jobs
  And the Market Research Agent provides supporting data
  Then the agents should cross-validate findings
  And reach consensus on job prioritization
  And document the reasoning for their conclusions
  And achieve confidence scores above 80%

Scenario: Agents debate conflicting insights
  Given agents have conflicting analysis results
  When the Value Map Agent proposes solutions
  And the Validation Agent challenges feasibility
  Then the system should facilitate structured debate
  And require evidence-based arguments
  And reach resolution through weighted consensus
  And maintain audit trail of the debate process
```

#### Scenario 3: Real-Time Progress Tracking

```gherkin
Feature: Transparent Workflow Monitoring
  As a consultant managing client expectations
  I want to see real-time progress of AI workflow execution
  So that I can provide accurate updates to clients

Scenario: Workflow progress visualization
  Given a discovery workflow is executing
  When I view the workflow dashboard
  Then I should see current agent execution status
  And estimated completion time
  And quality metrics for completed agents
  And cost tracking for the workflow
  And ability to pause or modify the workflow

Scenario: Workflow failure recovery
  Given an agent fails during execution
  When the system detects the failure
  Then it should attempt automatic recovery
  And notify me of the issue
  And provide options for manual intervention
  And maintain partial results for review
```

#### Scenario 4: Canvas Collaboration & Iteration

```gherkin
Feature: Collaborative Canvas Refinement
  As a strategic consultant
  I want to collaborate with AI agents to refine canvas content
  So that I can deliver precisely tailored strategic recommendations

Scenario: Human-AI collaborative editing
  Given I have a generated Value Proposition Canvas
  When I provide feedback on specific sections
  Then the relevant agents should incorporate my feedback
  And regenerate affected canvas sections
  And maintain version history of changes
  And explain the reasoning for modifications

Scenario: Canvas quality validation
  Given a completed canvas
  When I request quality assessment
  Then the system should evaluate Strategyzer compliance
  And check internal consistency across sections
  And provide improvement recommendations
  And assign overall quality score
```

#### BDD-Driven Architecture Decisions

These scenarios influence key architectural choices:

1. Real-Time Updates: WebSocket integration for live progress tracking
2. Agent Collaboration: Debate and consensus mechanisms in agent architecture
3. Quality Assurance: Built-in validation and scoring systems
4. Export Flexibility: Multi-format rendering engine with branding support
5. Failure Recovery: Robust error handling and partial result preservation
6. Human-AI Collaboration: Interactive editing and feedback integration

---

This architecture transforms the platform into a **Strategyzer-powered visual consulting engine** that generates the rich, client-ready canvases that make strategic insights immediately actionable and shareable.
