# Specification: Narrative Layer Architecture

**Status**: Draft v1.5 | **Updated**: 2026-02-04 | **Owner**: product-strategist
**Depends On**: `portfolio-holder-vision.md` v3.0, `03-methodology.md`, `02-organization.md`
**Approved By**: Pending Founder Review

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Rationale](#design-rationale)
3. [Problem Statement](#problem-statement)
4. [The 10-Slide Narrative Framework](#the-10-slide-narrative-framework)
5. [Narrative Layer Architecture](#narrative-layer-architecture)
6. [Database Schema Additions](#database-schema-additions)
7. [API Contracts](#api-contracts)
8. [Friendship Loop Integration](#friendship-loop-integration)
9. [Dual-Format Evidence Package Design](#dual-format-evidence-package-design)
10. [Evidence Integrity System](#evidence-integrity-system)
11. [Frontend Components](#frontend-components)
12. [CrewAI Report Compiler Modifications](#crewai-report-compiler-modifications)
13. [Validation Requirements](#validation-requirements)
14. [Implementation Roadmap](#implementation-roadmap)
15. [Design Considerations](#design-considerations)
16. [Resolved Design Questions](#resolved-design-questions)
17. [Open Questions](#open-questions)
18. [Decision Log](#decision-log)
19. [Glossary](#glossary)
20. [References](#references)
21. [Changelog](#changelog)

---

## Executive Summary

StartupAI's validation engine produces rigorous VPD evidence (Value Proposition Canvases, competitor maps, experiment results, Fit Scores, HITL checkpoint records). The Portfolio Holder marketplace consumes that evidence as de-risked deal flow. However, a critical translation layer is missing between **"I have rigorous validation data"** and **"I can compellingly communicate why this matters to someone with capital."**

This specification defines a **Narrative Layer** that transforms existing VPD validation outputs into investor-ready narrative artifacts. The architecture draws on the 10-slide pitch framework from _Get Backed_ (Baehr & Loomis, HBR Press) and adapts the Friendship Loop relational methodology to StartupAI's three connection flows.

**Core principle**: The Narrative Layer does not generate new data. It **re-renders existing validation evidence** through a storytelling lens optimized for capital provider consumption.

**Strategic value**: Founders get investor-ready artifacts without additional work. Portfolio Holders get narrative-structured deal flow backed by methodology-verified evidence. The marketplace flywheel accelerates because both sides extract more value from the same underlying data.

---

## Design Rationale

### Origin: The Get Backed Framework

This specification draws heavily from _Get Backed: Craft Your Story, Build the Perfect Pitch Deck, and Launch the Venture of Your Dreams_ by Evan Baehr and Evan Loomis (Harvard Business Review Press, 2015). The book is a foundational text for startup founders, focusing on a dual-track approach to fundraising:

1. **The Artifact**: Developing a narrative-driven, 10-slide pitch deck based on real-world examples from 15 ventures that raised $150M+
2. **The Relationship**: Implementing the "Friendship Loop" to transition from cold outreach to warm investor relationships

While published in 2015, its emphasis on storytelling over spreadsheets and building relational capital remains highly relevant in today's hyper-selective venture environment.

### The Translation Gap

The intersection of Get Backed's methodology with the Portfolio Holder marketplace vision closes a critical gap in the Founder journey that had not been explicitly addressed.

StartupAI's VPD validation engine produces **evidence** — Value Proposition Canvases, competitor maps, experiment results, Fit Scores, HITL checkpoint records. The Portfolio Holder marketplace consumes that evidence as de-risked deal flow. But there was a missing translation layer between "I have rigorous validation data" and "I can compellingly communicate why this matters to someone with capital."

**VCs don't read Value Proposition Canvases. They read decks and hear stories.**

The validation evidence exists in Strategyzer artifact format — perfect for methodology practitioners but not how capital providers consume information. The Narrative Layer provides that translation.

### Why This Works: CrewAI Output Mapping

When overlaying Baehr and Loomis's 10-slide structure against existing CrewAI outputs, the coverage is remarkable:

| Get Backed Slide | CrewAI Source | Data Available |
|------------------|---------------|----------------|
| Problem | Pulse customer profile | Top-ranked pains, unmet jobs |
| Solution | VPC pain relievers + gain creators | Direct mapping |
| Traction | Validation Agent DO-evidence | Behavioral data, experiment results |
| Customer/Market | Pulse market sensing | TAM/SAM/SOM, segments |
| Competition | Competitor Analyst | Positioning map, differentiators |
| Business Model | Ledger viability assessment | BMC, unit economics |
| Use of Funds | 3-tier validation roadmap | Costed experiments |
| Cover, Overview | Sage synthesis | **New capability needed** |
| Team | Founder input | **Scaffolded self-input needed** |

**9 of 10 essential slides can be populated entirely from existing validation data.** No new data collection required — only narrative re-rendering.

The practical implication: StartupAI can build a Pitch Deck Generator that doesn't ask founders to start from a blank slide. Instead, it assembles a narrative-driven deck from validation evidence they've already generated. That's fundamentally different from Canva templates or Slidebean's AI — those tools help you make slides. **StartupAI helps you make the case, backed by real evidence.**

### The Friendship Loop Inversion

Baehr and Loomis's Friendship Loop — the progression from cold outreach to warm relationship before any ask — maps to StartupAI's three connection flows, but with a **critical inversion**.

In the traditional Friendship Loop, the burden is entirely on the founder to build the relationship. They research investors, find warm introductions, nurture the connection, and eventually pitch. Warm intros are gatekeeping mechanisms that favor founders with network privilege.

**StartupAI inverts this dynamic.** Through the Founder Directory and RFQ Board, Portfolio Holders come to founders who have already demonstrated rigor. The evidence package *is* the warm introduction. When a capital provider sees a Fit Score of 0.85 with 12 completed customer interviews and 3 validated experiments, the relationship temperature starts warm because trust has been pre-established through methodology.

This isn't just "pre-warming relationships through evidence." It's **democratizing access to capital** by making evidence the currency of trust, not relationships. A founder without Stanford connections but with strong DO-evidence gets the same marketplace visibility as a founder with a Y Combinator network.

| Traditional Friendship Loop | StartupAI Equivalent |
|-----------------------------|----------------------|
| Research investors manually | Publish validated evidence; self-select PHs |
| Find warm introductions | Evidence package *is* the introduction |
| Nurture relationship before ask | Ongoing validation progress = relationship nurturing |
| Pitch with static deck | Living evidence + narrative auto-updated |

### The Dual-Format Moat

The strategic defensibility of this architecture lies in the **dual-format Evidence Package**:

- **Narrative without evidence** = another pitch deck tool (competitors exist: Canva, Slidebean, Tome)
- **Evidence without narrative** = methodology artifacts VCs won't consume
- **Narrative + evidence** = defensible differentiation

Competitors can copy the pitch deck generator. They cannot copy the evidence layer, because that requires the full VPD methodology, CrewAI pipeline, HITL checkpoints, and DO/SAY evidence classification. The dual-format design (tabs for Pitch Narrative / Validation Evidence / Integrity) makes every claim verifiable.

**Marketing positioning**: "Every claim is evidence-backed. Click to verify."

### Narrative Velocity: Beyond Static Decks

Get Backed was designed for a world where the pitch deck is a static artifact delivered in a meeting. StartupAI operates differently — evidence is living, continuously updated, and consumed asynchronously.

The Narrative Layer's real power isn't the 10-slide artifact. It's **narrative velocity** — the trajectory of improvement visible over time. A Portfolio Holder watching a founder's narrative evolve over 6 weeks (Fit Score improving, new experiments completing, hypotheses being validated or pivoted) is seeing execution in real-time. That's more signal than any static deck provides.

The underlying narrative architecture — problem, evidence of problem severity, solution, evidence of solution fit, market opportunity, execution plan — should be a shared layer that manifests differently depending on audience and context:

- The pitch deck is one rendering
- The Evidence Package is another
- The RFQ posting is another
- The Founder Directory card is another

All draw from the same narrative layer, all backed by the same evidence.

### Risk: Narrative Quality ≠ Validation Quality

One caution worth explicit acknowledgment: a founder with weak evidence but strong storytelling instincts might produce a more "readable" narrative than a founder with strong evidence but poor communication skills. If the marketplace rewards narrative polish over evidence rigor, we've created a new form of signal pollution.

**Mitigations in this specification**:
- Narrative quality is NOT included in Fit Score (Fit Score measures validation rigor only)
- Evidence strength indicators displayed alongside narrative (DO-direct / DO-indirect / SAY)
- DO/SAY weights surfaced explicitly in Traction slide
- Guardian alignment checks prevent narrative from overstating evidence
- Provenance badges show whether narrative is AI-generated or founder-edited

The marketplace should reward founders who do the validation work, not founders who write compelling copy about work they haven't done.

---

## Problem Statement

### The Translation Gap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CURRENT STATE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CrewAI Agents          Validation Artifacts        Portfolio Holders     │
│  ─────────────          ────────────────────        ─────────────────     │
│  Pulse (Market)    →    Customer Profile (VPD)                           │
│  Forge (Build)     →    Feasibility Assessment       ??? GAP ???         │
│  Ledger (Viability)→    Business Model Canvas                            │
│  Sage (Strategy)   →    Strategy Synthesis                               │
│                                                                          │
│  OUTPUT FORMAT: Strategyzer methodology artifacts                        │
│  CONSUMER EXPECTATION: Narrative-driven pitch + evidence                 │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                        TARGET STATE                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CrewAI Agents     →    Validation Artifacts    →    Narrative Layer     │
│                         (methodology format)         (investor format)   │
│                              │                            │              │
│                              ▼                            ▼              │
│                     ┌─────────────────┐       ┌──────────────────┐      │
│                     │ Evidence Package │       │  Pitch Narrative  │      │
│                     │ (for rigor)      │       │  (for persuasion) │      │
│                     └─────────────────┘       └──────────────────┘      │
│                              │                            │              │
│                              └──────────┬─────────────────┘              │
│                                         ▼                                │
│                              ┌──────────────────┐                        │
│                              │ Portfolio Holder   │                       │
│                              │ sees BOTH formats  │                       │
│                              └──────────────────┘                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Matters Now

| Market Dynamic                      | Implication                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| AI-heavy deal flow saturation       | Every pitch claims AI. VPD evidence + narrative structure cuts through noise           |
| Hyper-selective seed rounds         | 2025-2026 pre-seed bar = 2020 seed bar. Evidence-backed narratives are table stakes    |
| Async investor consumption          | VCs review deals asynchronously. Narrative must stand alone without founder presenting |
| Portfolio Holder marketplace launch | Evidence packages need dual-format (rigor + story) to maximize marketplace value       |

---

## The 10-Slide Narrative Framework

### Source Methodology

The _Get Backed_ 10-slide framework (Baehr & Loomis, HBR Press, 2015) structures investor communication around narrative arcs rather than data dumps. Each slide serves a specific persuasive function in a sequence designed to build conviction.

### Mapping to Existing CrewAI Outputs

The following mapping demonstrates that **9 of 10 essential slides can be populated entirely from existing validation data**. The Cover page is a separate title card preceding the essential ten. No new data collection is required — only narrative re-rendering.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│              10-SLIDE FRAMEWORK → CREWAI OUTPUT MAPPING                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  SLIDE              SOURCE AGENT          SOURCE ARTIFACT       COVERAGE      │
│  ─────              ────────────          ───────────────       ────────      │
│  Cover (title card) Sage + Founder        Strategy Synthesis    PARTIAL *     │
│  ─── THE ESSENTIAL TEN ──────────────────────────────────────────────────    │
│  1. Overview        Sage                  Cross-agent synthesis  PARTIAL *    │
│  2. Opportunity     Pulse                 Market Sensing         FULL         │
│                                           + TAM/SAM/SOM                       │
│  3. Problem         Pulse                 Customer Profile       FULL         │
│                                           (Jobs/Pains)                        │
│  4. Solution        Pulse + Forge         VPC Pain Relievers     FULL         │
│                                           + Gain Creators                     │
│  5. Traction        Validation Agent      DO-Evidence            FULL         │
│                                           + Experiment Results                │
│  6. Customer        Pulse                 Customer Profile       FULL         │
│                                           (Segments/Personas)                 │
│  7. Competition     Competitor Analyst    Competitor Map          FULL         │
│  8. Business Model  Ledger               BMC + Unit Economics    FULL         │
│  9. Team            Founder Input         Onboarding Data        PARTIAL **   │
│  10. Use of Funds   Validation Agent      3-Tier Roadmap         FULL         │
│                                           (costed experiments)                │
│                                                                               │
│  * Requires narrative synthesis (new capability)                              │
│  ** Requires founder self-input scaffolding                                   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Slide-by-Slide Specification

#### Cover (Title Card — precedes the essential ten)

| Field           | Source                             | Generation Method                             |
| --------------- | ---------------------------------- | --------------------------------------------- |
| Venture Name    | `entrepreneur_briefs.company_name` | Direct pull                                   |
| Tagline         | Sage synthesis                     | NEW: Generate from VPC core value proposition |
| Visual Identity | Founder upload or AI-generated     | Optional; placeholder if absent               |
| Contact Info    | `user_profiles`                    | Direct pull                                   |

**Narrative function**: First impression. Must communicate "what we do" in ≤10 words. This is the title card — it sets the stage but is not counted among the essential ten.

**Generation prompt context**: Sage receives the complete VPC and generates a tagline that connects the primary customer pain to the primary gain creator in plain language. No jargon. No buzzwords.

**Tagline tone guidance**: Use active verbs and specific outcomes. The founder's voice should feel present.
- Good: "Reduce last-mile delivery costs by 40%"
- Good: "Help mid-market retailers compete with Amazon on speed"
- Avoid: "The future of logistics"
- Avoid: "AI-powered supply chain optimization"

#### Slide 1: Overview

| Field                | Source           | Generation Method                         |
| -------------------- | ---------------- | ----------------------------------------- |
| One-paragraph thesis | Sage synthesis   | NEW: 3-sentence narrative arc             |
| Key metrics snapshot | Validation Agent | Pull top 3 evidence data points           |
| Ask (if applicable)  | Founder input    | Optional field in onboarding or dashboard |

**Narrative function**: The "elevator pitch" — the entire story in 30 seconds. This is the single slide an investor reads if they read nothing else.

**Structure**: [Problem in the world] → [Our unique approach] → [Evidence it works] → [What we need next].

**Generation prompt context**: Sage synthesizes across all agent outputs to produce a 3-sentence thesis. Sentence 1 = problem severity (from Pulse). Sentence 2 = solution uniqueness (from Forge + VPC). Sentence 3 = traction evidence (from Validation Agent DO-data).

#### Slide 2: Opportunity

| Field                    | Source               | Generation Method                            |
| ------------------------ | -------------------- | -------------------------------------------- |
| TAM / SAM / SOM          | Pulse market sensing | Market sizing data                           |
| Market growth trajectory | Pulse                | Growth rate + timing                         |
| Why now                  | Sage synthesis       | Macro trends enabling this venture           |
| Market tailwinds         | Pulse                | Regulatory, technological, behavioral shifts |

**Narrative function**: Show the investor the _size and timing_ of the opportunity. This is the "is this market big enough to matter?" slide. Separated from Customer (Slide 6) because Opportunity answers "how big?" while Customer answers "for whom?"

**Data source detail**:

- `market_sensing.tam`, `market_sensing.sam`, `market_sensing.som` → market sizing
- `market_sensing.growth_rate` → trajectory
- Sage synthesizes macro context from Pulse market data into a "why now" narrative

#### Slide 3: Problem

| Field                  | Source                    | Generation Method                 |
| ---------------------- | ------------------------- | --------------------------------- |
| Primary customer pain  | `customer_profiles.pains` | Top-ranked pain by severity       |
| Pain severity evidence | Validation Agent          | Interview quotes, behavioral data |
| Market context         | Pulse                     | Market size affected by this pain |
| Status quo alternative | Competitor Analyst        | Current workaround or competitor  |

**Narrative function**: Make the investor _feel_ the problem. Data proves it exists; narrative makes it urgent.

**Data source detail**:

- `customer_profiles.pains[]` → ranked by severity score
- `evidence[]` where `evidence_type = 'interview'` → pull verbatim quotes illustrating pain
- `gate_scores.desirability` → quantified pain validation score

#### Slide 4: Solution

| Field                       | Source             | Generation Method                          |
| --------------------------- | ------------------ | ------------------------------------------ |
| Value proposition statement | VPC                | Pain Relievers + Gain Creators → narrative |
| How it works                | Forge feasibility  | Technical approach in plain language       |
| Key differentiator          | Competitor Analyst | Unique positioning vs. alternatives        |
| Fit Score                   | Validation Agent   | `fit_scores.problem_solution_fit`          |

**Narrative function**: Show how the solution directly addresses the problem from Slide 3. The connection must be explicit and evidence-backed.

#### Slide 5: Traction

| Field                    | Source             | Generation Method                      |
| ------------------------ | ------------------ | -------------------------------------- |
| DO-evidence (behavioral) | Validation Agent   | Signup rates, LOIs, usage data         |
| Experiment results       | Validation Agent   | Completed experiments + outcomes       |
| Interview count          | Evidence table     | Count of `evidence_type = 'interview'` |
| HITL checkpoint progress | Approval workflows | Checkpoints completed / total          |

**Narrative function**: This is StartupAI's **killer differentiator**. Traditional pitch decks claim traction with vanity metrics. StartupAI provides methodology-verified behavioral evidence. The narrative must frame this distinction explicitly.

**Evidence hierarchy** (display in this order):

1. DO-direct evidence (weight 1.0): Paying customers, signed contracts
2. DO-indirect evidence (weight 0.8): LOIs, waitlist signups, prototype usage
3. SAY evidence (weight 0.3): Interview responses, survey data

#### Slide 6: Customer

| Field                  | Source              | Generation Method                   |
| ---------------------- | ------------------- | ----------------------------------- |
| Customer segments      | `customer_profiles` | Segment definitions from onboarding |
| Customer persona       | Customer Profile    | Jobs-to-be-done summary             |
| Behavioral insights    | Validation Agent    | Interview-derived patterns          |
| Segment prioritization | Sage synthesis      | Which segment first and why         |

**Narrative function**: Show the investor _who specifically_ the product serves. This is the "do you know your customer?" slide. Separated from Opportunity (Slide 2) because Customer answers "for whom?" while Opportunity answers "how big?"

**Data source detail**:

- `customer_profiles.jobs[]` → Jobs-to-be-done
- `customer_profiles.pains[]` + `customer_profiles.gains[]` → full persona
- `evidence[]` where `evidence_type = 'interview'` → behavioral patterns from primary research

#### Slide 7: Competition

| Field                 | Source             | Generation Method        |
| --------------------- | ------------------ | ------------------------ |
| Competitive landscape | Competitor Analyst | Positioning map          |
| Key differentiators   | Competitor Analyst | Feature/value comparison |
| Unfair advantage      | Sage synthesis     | Moat analysis            |

**Narrative function**: Position against alternatives honestly. Investors respect founders who understand their competitive landscape rather than claiming "no competition."

#### Slide 8: Business Model

| Field                 | Source | Generation Method             |
| --------------------- | ------ | ----------------------------- |
| Revenue model         | Ledger | BMC revenue streams           |
| Unit economics        | Ledger | CAC, LTV, margins             |
| Pricing strategy      | Ledger | Pricing model + rationale     |
| Path to profitability | Ledger | Financial projections summary |

**Narrative function**: Show the investor how money flows. Evidence-backed unit economics from Ledger carry more weight than founder projections.

#### Slide 9: Team

| Field                    | Source           | Generation Method                           |
| ------------------------ | ---------------- | ------------------------------------------- |
| Founder bio              | Founder input    | Scaffolded form during onboarding           |
| Relevant experience      | Founder input    | Pre-structured fields                       |
| Advisory board           | Founder input    | Optional                                    |
| HITL coachability signal | HITL checkpoints | Checkpoint completion rate + responsiveness |

**Narrative function**: Show who is behind the venture. The HITL coachability signal is unique to StartupAI — it provides behavioral evidence that the founder responds to feedback, iterates, and executes. Team precedes Use of Funds because investors back _people_ before they evaluate _budgets_.

**Scaffolding requirement**: The Team slide requires founder self-input not currently collected during onboarding. Add an optional "Founder Profile" section to the dashboard or post-validation flow with fields for: professional background (text, 200 char), domain expertise (tags), previous ventures (optional), LinkedIn URL.

#### Slide 10: Use of Funds

| Field                | Source           | Generation Method                        |
| -------------------- | ---------------- | ---------------------------------------- |
| Funding ask          | Founder input    | Amount + instrument (SAFE, equity, etc.) |
| Allocation breakdown | Validation Agent | 3-tier roadmap costed by category        |
| Milestones           | Validation Agent | What each experiment unlocks             |
| Timeline             | Validation Agent | Experiment sequence with dates           |

**Narrative function**: The closing slide — show the investor exactly what their capital buys. Framed as validation experiments, not vague "product development" buckets. Placed last because the ask is most compelling _after_ the investor knows the team (Slide 9) and has full context.

**Key innovation**: Traditional "use of funds" slides show pie charts. StartupAI's version shows a **validation experiment roadmap** — each dollar maps to a specific hypothesis being tested, with clear success/failure criteria. This demonstrates founder rigor.

#### Pivot Narrative Handling

The VPD methodology treats hypothesis invalidation as valuable learning, not failure. When a founder correctly identifies that a hypothesis is false based on evidence, this demonstrates rigor and founder discipline. The narrative layer must reflect this philosophy.

**When a project has invalidated hypotheses**, the narrative should:

1. **Celebrate the pivot** - Frame invalidations as "validated learning" that strengthened the venture's direction
2. **Show evidence-driven decision making** - Explain what evidence led to the invalidation
3. **Connect to current direction** - Demonstrate how the pivot informed the current strategy

**Example pivot narrative in Overview slide**:

> "Our initial hypothesis that SMBs would pay for automated invoicing was invalidated through 12 customer interviews — SMBs valued cash flow forecasting 3x more than invoicing automation. This evidence-driven pivot refined our focus to cash flow management, where we achieved 0.85 problem-solution fit."

**Narrative velocity considerations**:

- Pivot count should not penalize founders in marketplace visibility
- A project with 2 validated hypotheses and 1 invalidated hypothesis demonstrates more rigor than a project with 2 validated hypotheses and no invalidations explored
- The `pivot_count` metric captures learning velocity, not failure rate

---

## Narrative Layer Architecture

### System Design

The Narrative Layer is NOT a separate agent. It is an **additional output format** from the existing CrewAI pipeline, generated by extending the Report Compiler agent's responsibilities.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NARRATIVE LAYER ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EXISTING PIPELINE (no changes)                                          │
│  ───────────────────────────────                                         │
│  Onboarding → Pulse → Forge → Ledger → Competitor → Validation          │
│                                                                          │
│                          │                                               │
│                          ▼                                               │
│              ┌──────────────────────┐                                    │
│              │   Report Compiler     │                                   │
│              │   (EXTENDED)          │                                   │
│              └──────────┬───────────┘                                    │
│                         │                                                │
│           ┌─────────────┼─────────────┐                                  │
│           ▼             ▼             ▼                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐                       │
│  │ Strategyzer │ │ Pitch      │ │ Evidence       │                       │
│  │ Artifacts   │ │ Narrative  │ │ Package        │                       │
│  │ (existing)  │ │ (NEW)      │ │ (NEW)          │                       │
│  └────────────┘ └────────────┘ └────────────────┘                       │
│       │               │               │                                  │
│       │          ┌────┴────┐     ┌────┴────┐                            │
│       │          ▼         ▼     ▼         ▼                            │
│       │    JSON Schema  PDF   JSON Schema  PDF                           │
│       │    (renderable) Export (renderable) Export                        │
│       │                                                                  │
│       ▼                                                                  │
│  Founder Dashboard                                                       │
│  (methodology view)                                                      │
│                                                                          │
│  Pitch Narrative + Evidence Package →                                    │
│  Portfolio Holder Dashboard                                              │
│  (investor view)                                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Report Compiler Extension

**Current responsibility**: Compile agent outputs into structured Strategyzer artifact reports.

**Extended responsibility**: Additionally generate a `pitch_narrative` JSON object and an `evidence_package` JSON object from the same underlying data.

**No new agents required.** The Report Compiler already has access to all agent outputs. The extension adds two new output schemas and narrative synthesis prompts to its task configuration.

### Output Schemas

#### Pitch Narrative Schema

```typescript
interface PitchNarrative {
  version: string; // Schema version
  generated_at: string; // ISO timestamp
  project_id: string; // FK to projects table

  // Cover (title card — precedes the essential ten)
  cover: {
    venture_name: string;
    tagline: string; // ≤10 words, AI-generated
    contact: {
      founder_name: string;
      email: string;
      linkedin_url?: string;
    };
  };

  // --- THE ESSENTIAL TEN (ordered per Get Backed framework) ---

  // Slide 1: Overview
  overview: {
    thesis: string; // 3-sentence narrative arc
    key_metrics: MetricSnapshot[]; // Top 3 evidence data points
    ask?: {
      // Optional funding ask
      amount: number;
      instrument: string; // "SAFE" | "equity" | "convertible_note"
      use_summary: string; // One-sentence purpose
    };
  };

  // Slide 2: Opportunity
  opportunity: {
    tam: MarketSize;
    sam: MarketSize;
    som: MarketSize;
    growth_trajectory: string; // Market growth rate + timing
    why_now: string; // Macro trends enabling this venture
    market_tailwinds: string[]; // Regulatory, tech, behavioral shifts
  };

  // Slide 3: Problem
  problem: {
    primary_pain: string; // Top-ranked pain, narrative form
    severity_score: number; // 0-1 from gate_scores
    evidence_quotes: string[]; // Top 3 interview quotes
    market_context: string; // Size of affected market
    status_quo: string; // Current alternative / workaround
  };

  // Slide 4: Solution
  solution: {
    value_proposition: string; // Narrative-form VP statement
    how_it_works: string; // Plain-language technical description
    key_differentiator: string; // vs. competition
    fit_score: number; // 0-1 problem-solution fit
  };

  // Slide 5: Traction
  traction: {
    evidence_summary: string; // Narrative summary of all evidence
    do_direct: EvidenceItem[]; // Weight 1.0 evidence
    do_indirect: EvidenceItem[]; // Weight 0.8 evidence
    say_evidence: EvidenceItem[]; // Weight 0.3 evidence
    interview_count: number;
    experiment_count: number;
    hitl_completion_rate: number; // Checkpoints completed / total
    display_config: {
      evidence_order: ['do_direct', 'do_indirect', 'say_evidence']; // Render order
      show_weights: boolean; // Always true for PH view
      visual_emphasis: {
        do_direct: 'primary';   // Green, large text, checkmark icon
        do_indirect: 'secondary'; // Blue, normal text, partial-check icon
        say_evidence: 'tertiary'; // Gray, smaller text, quote icon, italic
      };
    };
  };

  // Slide 6: Customer
  customer: {
    segments: CustomerSegment[];
    persona_summary: string; // Jobs-to-be-done narrative
    behavioral_insights: string[]; // Interview-derived patterns
    segment_prioritization: string; // Which segment first and why
  };

  // Slide 7: Competition
  competition: {
    landscape_summary: string; // Narrative positioning
    competitors: Competitor[];
    unfair_advantage: string;
  };

  // Slide 8: Business Model
  business_model: {
    revenue_model: string; // Narrative description
    unit_economics: UnitEconomics;
    pricing_strategy: string;
    path_to_profitability: string;
  };

  // Slide 9: Team
  team: {
    founders: FounderProfile[];
    advisors?: AdvisorProfile[];
    coachability_score: number; // From HITL checkpoint data
  };

  // Slide 10: Use of Funds
  use_of_funds: {
    total_ask?: number;
    allocations: FundAllocation[]; // Mapped to validation experiments
    milestones: Milestone[];
    timeline_weeks: number;
  };

  metadata: {
    methodology: "VPD";
    evidence_strength: "SAY" | "DO-indirect" | "DO-direct";
    overall_fit_score: number;
    validation_stage: string; // Current gate
    last_updated: string;
    pivot_count: number;           // Number of hypotheses invalidated
    latest_pivot?: {
      original_hypothesis: string;
      invalidation_evidence: string;
      new_direction: string;
      pivot_date: string;
    };
  };
}

interface EvidenceItem {
  type: "DO-direct" | "DO-indirect" | "SAY";
  description: string;
  metric_value?: string;
  source: string; // Interview, experiment, behavioral
  weight: number;
}

interface MetricSnapshot {
  label: string;
  value: string;
  evidence_type: "DO-direct" | "DO-indirect" | "SAY";
}

interface FundAllocation {
  category: string; // e.g., "Customer Discovery", "MVP Build"
  amount: number;
  percentage: number;
  hypothesis_tested: string; // Which assumption this validates
  success_criteria: string;
}

interface Milestone {
  name: string;
  target_date: string;
  experiments: string[]; // Experiments that must complete
  unlocks: string; // What achieving this enables
}

interface MarketSize {
  value: number;
  unit: 'USD' | 'users' | 'transactions';
  timeframe: 'annual' | 'monthly';
  source: string;  // Citation for the market size data
  confidence: 'estimated' | 'researched' | 'verified';
}

interface CustomerSegment {
  name: string;
  description: string;
  size_estimate: number;
  priority: 'primary' | 'secondary' | 'tertiary';
  jobs_to_be_done: string[];
  key_pains: string[];
}

interface Competitor {
  name: string;
  category: 'direct' | 'indirect' | 'substitute';
  strengths: string[];
  weaknesses: string[];
  market_position: string;
  differentiation: string;  // How we differ from this competitor
}

interface UnitEconomics {
  cac: number;              // Customer Acquisition Cost
  ltv: number;              // Lifetime Value
  ltv_cac_ratio: number;
  gross_margin_percent: number;
  payback_period_months: number;
  assumptions: string[];    // Key assumptions behind these numbers
}

interface FounderProfile {
  name: string;
  role: string;
  professional_summary: string;  // 200 char max
  domain_expertise: string[];
  linkedin_url?: string;
  previous_ventures?: {
    name: string;
    role: string;
    outcome: string;
    year: number;
  }[];
}

interface AdvisorProfile {
  name: string;
  role: string;
  organization: string;
  relevance: string;  // Why this advisor is valuable
}

interface AgentVersion {
  agent_name: string;
  version: string;
  run_timestamp: string;
}

/**
 * Evidence Classification Note:
 *
 * The narrative layer uses a DO/SAY classification (behavioral vs stated):
 * - DO-direct (weight 1.0): Paying customers, signed contracts
 * - DO-indirect (weight 0.8): LOIs, waitlist signups, prototype usage
 * - SAY (weight 0.3): Interview responses, survey data
 *
 * This is SEPARATE from the existing evidence.strength field ('weak'|'medium'|'strong')
 * which measures confidence in the evidence itself.
 *
 * Implementation: Add `evidence_category: 'DO-direct'|'DO-indirect'|'SAY'` column
 * to the evidence table. The narrative layer aggregates both dimensions.
 */
```

#### Evidence Package Schema

```typescript
interface EvidencePackage {
  version: string;
  generated_at: string;
  project_id: string;
  founder_id: string;

  // Portfolio Holder sees both formats
  pitch_narrative: PitchNarrative; // Storytelling format
  validation_evidence: {
    // Methodology format
    vpc: ValuePropositionCanvas;
    customer_profile: CustomerProfile;
    competitor_map: CompetitorMap;
    bmc: BusinessModelCanvas;
    experiment_results: ExperimentResult[];
    gate_scores: GateScores;
    hitl_record: HITLRecord;
  };

  // Integrity metadata
  integrity: {
    evidence_hash: string; // SHA-256 of all evidence data
    methodology_version: string; // VPD version used
    agent_versions: AgentVersion[]; // Which agent versions produced this
    last_hitl_checkpoint: string; // Most recent human review
    fit_score_algorithm: string; // Version of scoring algorithm
  };

  // Access control
  access: {
    shared_with: string[]; // Portfolio Holder IDs
    shared_at: string;
    connection_type: RelationshipType;
    founder_consent: boolean; // Must be true
    opt_in_timestamp: string;
  };
}
```

---

## Database Schema Additions

### New Tables

```sql
-- Pitch narratives generated from validation data
CREATE TABLE pitch_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Narrative content (JSON matching PitchNarrative schema)
  narrative_data JSONB NOT NULL,              -- Current narrative (may be edited)
  baseline_narrative JSONB NOT NULL,          -- Original AI-generated narrative (never modified)

  -- Editing provenance
  is_edited BOOLEAN DEFAULT FALSE,            -- True if founder has modified baseline
  edit_history JSONB DEFAULT '[]',            -- Array of {timestamp, field, old_value, new_value}
  alignment_status VARCHAR(20) DEFAULT 'verified',  -- 'verified' | 'flagged' | 'pending'
  alignment_issues JSONB DEFAULT '[]',        -- Array of Guardian-detected issues

  -- Generation metadata
  generation_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  source_evidence_hash VARCHAR(64) NOT NULL,  -- SHA-256 of input evidence
  agent_run_id VARCHAR(100),                  -- CrewAI run that produced this

  -- Staleness tracking
  is_stale BOOLEAN DEFAULT FALSE,             -- True when source evidence changes
  stale_severity VARCHAR(10) DEFAULT 'hard',  -- 'soft' or 'hard'
  stale_reason TEXT,                          -- Which evidence changed

  -- Verification security (see "Verification Endpoint Security" section)
  verification_token UUID DEFAULT gen_random_uuid(),  -- For public verification URL (full UUID entropy)
  verification_request_count INTEGER DEFAULT 0,       -- Track verification requests for abuse detection

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_project_narrative UNIQUE (project_id)
);

-- Narrative version history for founder learning
CREATE TABLE narrative_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id UUID NOT NULL REFERENCES pitch_narratives(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Snapshot at this version
  narrative_data JSONB NOT NULL,
  source_evidence_hash VARCHAR(64) NOT NULL,
  fit_score_at_version DECIMAL(3,2),

  -- Change context
  trigger_reason TEXT,                        -- What caused regeneration
  evidence_changes JSONB,                     -- Summary of evidence changes since previous version

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_narrative_version UNIQUE (narrative_id, version_number)
);

-- Evidence packages shared with Portfolio Holders
CREATE TABLE evidence_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  founder_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Package content
  pitch_narrative_id UUID REFERENCES pitch_narratives(id),
  evidence_data JSONB NOT NULL,               -- Validation artifacts snapshot
  integrity_hash VARCHAR(64) NOT NULL,

  -- Access control
  is_public BOOLEAN DEFAULT FALSE,            -- Visible in Founder Directory
  founder_consent BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which Portfolio Holders have accessed which packages
CREATE TABLE evidence_package_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_package_id UUID NOT NULL REFERENCES evidence_packages(id),
  portfolio_holder_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES consultant_clients(id),

  -- Access tracking
  first_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  view_duration_seconds INTEGER DEFAULT 0,

  -- Feedback (Phase 3)
  feedback_requested BOOLEAN DEFAULT FALSE,
  feedback_areas TEXT[],                      -- Areas where PH wants more evidence

  CONSTRAINT unique_package_holder UNIQUE (evidence_package_id, portfolio_holder_id)
);

-- Founder profile data for Team slide (not in onboarding)
CREATE TABLE founder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Professional background
  professional_summary VARCHAR(500),
  domain_expertise TEXT[],                    -- Tag array
  previous_ventures JSONB,                   -- [{name, role, outcome, year}]
  linkedin_url VARCHAR(255),
  years_experience INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_founder_profile UNIQUE (user_id)
);
```

### RLS Policies

```sql
-- Pitch narratives: only the founder can see their own
CREATE POLICY "Founders can view own narratives"
  ON pitch_narratives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Founders can update own narratives"
  ON pitch_narratives FOR UPDATE
  USING (auth.uid() = user_id);

-- Evidence packages: founder + connected Portfolio Holders
CREATE POLICY "Founders can view own packages"
  ON evidence_packages FOR SELECT
  USING (auth.uid() = founder_id);

CREATE POLICY "Connected PHs can view shared packages"
  ON evidence_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultant_clients cc
      WHERE cc.consultant_id = auth.uid()
        AND cc.founder_id = evidence_packages.founder_id
        AND cc.connection_status = 'active'
    )
    OR (
      is_public = TRUE
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
          AND up.consultant_verification_status = 'verified'
      )
    )
  );

-- Evidence package access: only the PH who accessed
CREATE POLICY "PHs can view own access records"
  ON evidence_package_access FOR SELECT
  USING (auth.uid() = portfolio_holder_id);

-- Founder profiles: public read for verified PHs, write for owner
CREATE POLICY "Verified PHs can view founder profiles"
  ON founder_profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.consultant_verification_status = 'verified'
    )
  );

CREATE POLICY "Founders can manage own profile"
  ON founder_profiles FOR ALL
  USING (auth.uid() = user_id);
```

### Indexes

```sql
-- GIN index for JSONB queries on narrative_data
CREATE INDEX idx_pitch_narratives_narrative_data ON pitch_narratives USING GIN (narrative_data);

-- Composite index to support RLS policy checking consultant-founder connections
CREATE INDEX idx_consultant_clients_connection_lookup
  ON consultant_clients(consultant_id, client_id, connection_status);

-- Index to support RLS policy checking consultant verification status
CREATE INDEX idx_user_profiles_consultant_verification
  ON user_profiles(id, consultant_verification_status);

-- Index for staleness queries on pitch narratives
CREATE INDEX idx_pitch_narratives_staleness ON pitch_narratives(project_id, is_stale);

-- Index for version history queries
CREATE INDEX idx_narrative_versions_lookup ON narrative_versions(narrative_id, version_number);
```

**Note on JSONB Size Monitoring**: The `edit_history` column stores an array of edit records that grows unboundedly with founder edits. At scale (Phase 4+), consider implementing an archival strategy that moves older edit records to a separate `edit_history_archive` table, keeping only the most recent N entries in the primary column. Monitor JSONB column sizes via `pg_column_size()` and alert if average size exceeds 100KB per row.

### Schema Modifications to Existing Tables

```sql
-- Add to projects table
ALTER TABLE projects
  ADD COLUMN narrative_generated_at TIMESTAMPTZ,
  ADD COLUMN narrative_is_stale BOOLEAN DEFAULT TRUE,
  ADD COLUMN narrative_stale_severity VARCHAR(10) DEFAULT 'hard',  -- 'soft' or 'hard'
  ADD COLUMN narrative_stale_reason TEXT;

-- Add trigger: mark narrative stale when evidence changes (with severity)
CREATE OR REPLACE FUNCTION mark_narrative_stale()
RETURNS TRIGGER AS $$
DECLARE
  change_severity VARCHAR(10);
  change_reason TEXT;
BEGIN
  -- Determine staleness severity based on change type
  IF TG_TABLE_NAME = 'evidence' THEN
    -- New evidence is soft stale (informational)
    change_severity := 'soft';
    change_reason := 'New evidence added';
  ELSIF TG_TABLE_NAME = 'hypotheses' THEN
    -- Hypothesis status change is hard stale
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      change_severity := 'hard';
      change_reason := 'Hypothesis status changed: ' || COALESCE(OLD.status, 'none') || ' → ' || NEW.status;
    ELSE
      change_severity := 'soft';
      change_reason := 'Hypothesis updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'gate_scores' THEN
    -- Fit score change >0.1 is hard stale
    IF ABS(COALESCE(NEW.overall_fit, 0) - COALESCE(OLD.overall_fit, 0)) > 0.1 THEN
      change_severity := 'hard';
      change_reason := 'Fit Score changed significantly: ' || ROUND(OLD.overall_fit::numeric, 2) || ' → ' || ROUND(NEW.overall_fit::numeric, 2);
    ELSE
      change_severity := 'soft';
      change_reason := 'Fit Score updated';
    END IF;
  ELSIF TG_TABLE_NAME = 'validation_runs' THEN
    -- Gate passage is hard stale
    IF NEW.current_gate IS DISTINCT FROM OLD.current_gate THEN
      change_severity := 'hard';
      change_reason := 'Validation stage changed: ' || COALESCE(OLD.current_gate, 'none') || ' → ' || NEW.current_gate;
    ELSE
      change_severity := 'soft';
      change_reason := 'Validation run updated';
    END IF;
  ELSE
    change_severity := 'soft';
    change_reason := 'Related data changed';
  END IF;

  UPDATE projects
  SET
    narrative_is_stale = TRUE,
    narrative_stale_severity = CASE
      WHEN narrative_stale_severity = 'hard' THEN 'hard'  -- Don't downgrade existing hard stale
      ELSE change_severity
    END,
    narrative_stale_reason = change_reason
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_change_stales_narrative
  AFTER INSERT OR UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

CREATE TRIGGER hypothesis_change_stales_narrative
  AFTER INSERT OR UPDATE ON hypotheses
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

CREATE TRIGGER gate_score_change_stales_narrative
  AFTER INSERT OR UPDATE ON gate_scores
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

CREATE TRIGGER validation_stage_change_stales_narrative
  AFTER INSERT OR UPDATE ON validation_runs
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

-- Additional triggers for completeness (customer profile and VPC changes)
CREATE TRIGGER customer_profile_change_stales_narrative
  AFTER INSERT OR UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();

CREATE TRIGGER vpc_change_stales_narrative
  AFTER INSERT OR UPDATE ON value_proposition_canvas
  FOR EACH ROW
  EXECUTE FUNCTION mark_narrative_stale();
```

### Analytics Tables

```sql
-- Funnel events for narrative generation journey
CREATE TABLE narrative_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),

  event_type VARCHAR(50) NOT NULL,
  -- Values: 'threshold_met', 'generation_started', 'generation_completed',
  --         'narrative_viewed', 'slide_viewed', 'edit_started', 'edit_saved',
  --         'package_created', 'package_shared', 'pdf_exported'

  event_metadata JSONB,  -- {slide_number, duration_ms, edit_field, etc.}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_narrative_funnel_project ON narrative_funnel_events(project_id, event_type);
CREATE INDEX idx_narrative_funnel_time ON narrative_funnel_events(created_at);

-- Tab and slide-level engagement for evidence packages
CREATE TABLE package_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_id UUID NOT NULL REFERENCES evidence_package_access(id),

  event_type VARCHAR(50) NOT NULL,
  -- Values: 'tab_switch', 'slide_view', 'evidence_expand', 'pdf_download'

  event_value JSONB NOT NULL,
  -- {tab: 'pitch_narrative'|'validation_evidence'|'integrity',
  --  slide: 1-10, duration_ms: number}

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_package_engagement_access ON package_engagement_events(access_id);

-- Verification to connection conversion tracking
ALTER TABLE evidence_package_access
  ADD COLUMN verification_token_used UUID,  -- Links to pitch_narratives.verification_token
  ADD COLUMN source VARCHAR(50);            -- 'directory', 'connection', 'verification_url', 'direct_share'
```

---

## API Contracts

### Error Response Schema

All API endpoints return errors in a consistent format:

```typescript
interface ApiError {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable description
    details?: {             // Field-specific errors (for validation)
      [field: string]: string;
    };
  };
}
```

**Common Error Codes**:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `INSUFFICIENT_EVIDENCE` | 400 | Not enough evidence to generate narrative |
| `NARRATIVE_STALE` | 409 | Narrative is stale, regeneration recommended |
| `ALIGNMENT_FAILED` | 422 | Edit contradicts evidence (Guardian check) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

**Example error response**:
```json
{
  "error": {
    "code": "ALIGNMENT_FAILED",
    "message": "Your edit claims 'strong demand' but evidence supports 'positive indicators'",
    "details": {
      "field": "traction.evidence_summary",
      "current_evidence": "1 DO-direct, 2 DO-indirect",
      "permitted_language": ["positive indicators", "growing evidence"]
    }
  }
}
```

### Narrative Generation

```
POST /api/narrative/generate
```

**Trigger**: Called after CrewAI analysis completes, or manually by founder from dashboard.

**Request**:

```json
{
  "project_id": "uuid",
  "force_regenerate": false
}
```

**Response**:

```json
{
  "narrative_id": "uuid",
  "pitch_narrative": {
    /* PitchNarrative schema */
  },
  "is_fresh": true,
  "generated_from": {
    "evidence_count": 12,
    "interview_count": 8,
    "experiment_count": 3,
    "source_hash": "sha256..."
  }
}
```

**Logic**:

1. Check if existing narrative exists and `is_stale = false` → return cached
2. If stale or `force_regenerate = true` → gather all project evidence
3. Pass to Report Compiler with narrative synthesis prompt
4. Store result in `pitch_narratives` table
5. Set `is_stale = false`, update `source_evidence_hash`

### Evidence Package CRUD

```
POST /api/evidence-package/create
```

**Request**:

```json
{
  "project_id": "uuid",
  "is_public": false,
  "founder_consent": true
}
```

**Response**:

```json
{
  "package_id": "uuid",
  "integrity_hash": "sha256...",
  "includes": {
    "pitch_narrative": true,
    "vpc": true,
    "customer_profile": true,
    "competitor_map": true,
    "bmc": true,
    "experiments": 3,
    "gate_scores": true,
    "hitl_record": true
  }
}
```

```
GET /api/evidence-package/:id
```

**Authorization**: Founder owner OR connected Portfolio Holder with active relationship OR verified PH if package `is_public = true`.

**Response**: Full `EvidencePackage` schema (both narrative and methodology formats).

### Founder Profile CRUD

```
GET /api/founder/profile
```

**Authorization**: Authenticated founder only.

**Response**:

```json
{
  "id": "uuid",
  "professional_summary": "string",
  "domain_expertise": ["string"],
  "previous_ventures": [...],
  "linkedin_url": "string",
  "completeness_percent": 80,
  "missing_fields": ["linkedin_url"]
}
```

```
PATCH /api/founder/profile
```

**Request**:

```json
{
  "professional_summary": "10+ years in logistics tech...",
  "domain_expertise": ["logistics", "b2b-saas"],
  "linkedin_url": "https://linkedin.com/in/..."
}
```

**Response**: Updated profile object.

### Narrative Editing

```
PATCH /api/narrative/:id/edit
```

**Authorization**: Founder owner only.

**Request**:

```json
{
  "edits": [
    {
      "field": "overview.thesis",
      "new_value": "Updated thesis with founder context..."
    },
    {
      "field": "traction.evidence_summary",
      "new_value": "We spoke with 8 operations managers..."
    }
  ]
}
```

**Response (Phase 1 - Immediate)**:

```json
{
  "narrative_id": "uuid",
  "is_edited": true,
  "alignment_status": "pending",
  "edit_saved": true
}
```

**Response (Phase 2 - via Realtime)**:

After the Guardian alignment check completes (2-5 seconds), the `pitch_narratives` row is updated with:

```json
{
  "alignment_status": "verified" | "flagged",
  "alignment_issues": [
    {
      "field": "traction.evidence_summary",
      "issue": "Claims 'strong demand' but DO-evidence count is 0",
      "severity": "warning"
    }
  ]
}
```

> **Implementation note**: The Guardian alignment check involves LLM-based claim-language validation and may take 2-5 seconds. To avoid blocking the UI, edits are saved immediately with `alignment_status: "pending"`, and the Guardian check runs as a background job. The frontend should subscribe to Realtime updates on the `pitch_narratives` table to receive the final alignment status.

**Logic**:

1. Apply edits to `narrative_data` (preserving `baseline_narrative`)
2. Set `alignment_status = "pending"` and save immediately
3. Append to `edit_history` array
4. Return immediate response to founder
5. Enqueue background job: Guardian alignment check on edited fields
6. Background job updates `alignment_status` to "verified" or "flagged"
7. Supabase Realtime pushes update to subscribed clients

### Narrative Version History

```
GET /api/narrative/:id/versions
```

**Authorization**: Founder owner only.

**Response**:

```json
{
  "current_version": 4,
  "versions": [
    {
      "version_number": 4,
      "created_at": "2026-02-04T14:34:00Z",
      "fit_score": 0.78,
      "trigger_reason": "Fit Score changed significantly: 0.65 → 0.78",
      "evidence_changes": {
        "interviews_added": 3,
        "experiments_completed": 1
      }
    },
    {
      "version_number": 3,
      "created_at": "2026-01-28T10:15:00Z",
      "fit_score": 0.65,
      "trigger_reason": "Completed pricing experiment",
      "evidence_changes": {
        "experiments_completed": 1
      }
    }
  ]
}
```

```
GET /api/narrative/:id/versions/:version/diff
```

**Response**: Field-by-field diff between specified version and current (or previous version).

### External Verification

```
GET /api/verify/:short_hash
```

**Authorization**: Public (no auth required).

**Response**:

```json
{
  "status": "verified" | "updated" | "not_found",
  "generated_at": "2026-02-04T14:34:00Z",
  "venture_name": "Acme Logistics",
  "evidence_id": "a3f8c2d1e9b4",
  "current_hash_matches": true,
  "evidence_updated_at": "2026-02-04T14:34:00Z",
  "fit_score_at_generation": 0.72,
  "validation_stage_at_generation": "Solution Testing",
  "request_access_url": "/connect/request?founder=uuid"
}
```

### Portfolio Holder Feedback (Phase 3)

```
POST /api/evidence-package/:id/feedback
```

**Request**:

```json
{
  "portfolio_holder_id": "uuid",
  "feedback_areas": ["unit_economics", "customer_interviews"],
  "message": "I'd like to see more customer interview data from enterprise segment"
}
```

**Authorization**: Must have active connection to founder.

---

## Friendship Loop Integration

### Mapping to Connection Flows

The _Get Backed_ Friendship Loop (cold → warm → hot → ask) maps to StartupAI's three connection flows with a critical difference: **evidence pre-warms every relationship**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│            FRIENDSHIP LOOP → CONNECTION FLOW MAPPING                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TRADITIONAL FRIENDSHIP LOOP          STARTUPAI EQUIVALENT               │
│  ────────────────────────────          ────────────────────               │
│                                                                          │
│  1. RESEARCH (cold)                   Pre-connection Discovery           │
│     Investor researches founder       PH browses Founder Directory       │
│     via LinkedIn, events              Sees: Fit Score, evidence          │
│                                       summary, validation stage          │
│                                       EVIDENCE = WARM INTRODUCTION       │
│                                                                          │
│  2. CONNECT (warm)                    Connection Request                 │
│     Mutual introduction               Flow 2 (link-existing) or         │
│     via shared contact                Flow 3 (founder RFQ)              │
│                                       Evidence Package accompanies       │
│                                       every request automatically        │
│                                                                          │
│  3. NURTURE (hot)                     Active Relationship                │
│     Coffee meetings,                  Ongoing validation progress        │
│     value-add before ask              visible in PH dashboard:           │
│                                       - New experiments completed        │
│                                       - Hypotheses validated/pivoted     │
│                                       - HITL checkpoints passed          │
│                                       - Fit Score trajectory             │
│                                                                          │
│  4. ASK (pitch)                       Pitch Narrative Shared             │
│     Formal pitch meeting              Narrative auto-generated from      │
│     with deck                         evidence; PH already has context   │
│                                       The "ask" is informed, not cold    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pre-Connection Discovery Enhancements

When a Portfolio Holder browses the Founder Directory, each founder card should display **narrative-layer data** alongside raw metrics:

| Current Card Data  | Narrative Enhancement                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Fit Score (number) | Fit Score + one-sentence context ("Strong problem-solution fit in B2B logistics")          |
| Validation Stage   | Stage + narrative progress ("Completed customer discovery, entering solution testing")     |
| Industry tags      | Industry + problem statement ("Solving last-mile delivery cost for mid-market e-commerce") |
| Evidence count     | Evidence summary ("8 interviews, 3 experiments, 2 DO-direct signals")                      |

### Connection Request Enhancement

When a Portfolio Holder sends a connection request (Flow 2) or responds to a founder RFQ (Flow 3), the **Evidence Package is automatically attached** to the request. The founder sees:

1. Who is requesting (PH profile + relationship type)
2. Why they're interested (PH can add a message)
3. What they'll see if accepted (Evidence Package preview — the founder reviews what will be shared)

This gives the founder **informed consent** over what data is shared, addressing both privacy requirements and the trust architecture.

### Active Relationship: Living Narrative

After connection is established, the Portfolio Holder dashboard should show **narrative-formatted progress updates**, not just raw data changes:

| Raw Data Change          | Narrative Update                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `fit_score` 0.65 → 0.78  | "Problem-solution fit strengthened after 3 new customer interviews validated pain hypothesis"             |
| New experiment completed | "Completed landing page test: 47 signups from 200 visitors (23.5% conversion) validates demand"           |
| HITL checkpoint passed   | "Founder reviewed and incorporated feedback on pricing strategy — adjusted from freemium to tiered model" |
| Hypothesis pivoted       | "Original B2C hypothesis invalidated by interview evidence. Pivoted to B2B with stronger signal"          |

**Implementation**: These narrative updates are generated by a lightweight prompt that takes the raw data change event and produces a 1-2 sentence narrative summary. This runs on-demand (not via CrewAI pipeline) using the Vercel AI SDK with the same model used for onboarding chat.

---

## Dual-Format Evidence Package Design

### The Core Design Principle

Portfolio Holders receive **both** formats simultaneously. The narrative gets their attention; the evidence earns their trust.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   EVIDENCE PACKAGE: DUAL FORMAT                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─── TAB 1: PITCH NARRATIVE ──────────────────────────────────┐        │
│  │                                                               │        │
│  │  Narrative-structured 10-slide view                           │        │
│  │  Storytelling format optimized for investor consumption       │        │
│  │  Generated from validation evidence                           │        │
│  │  Exportable as PDF pitch deck                                 │        │
│  │                                                               │        │
│  │  "This is what they're building and why it matters"           │        │
│  │                                                               │        │
│  └───────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  ┌─── TAB 2: VALIDATION EVIDENCE ──────────────────────────────┐        │
│  │                                                               │        │
│  │  Raw Strategyzer artifacts:                                   │        │
│  │  • Value Proposition Canvas                                   │        │
│  │  • Customer Profile (Jobs/Pains/Gains)                        │        │
│  │  • Competitor Positioning Map                                 │        │
│  │  • Business Model Canvas                                     │        │
│  │  • Experiment Results (with DO/SAY classification)            │        │
│  │  • Gate Scores + HITL Record                                  │        │
│  │                                                               │        │
│  │  "This is the evidence behind the story"                      │        │
│  │                                                               │        │
│  └───────────────────────────────────────────────────────────────┘        │
│                                                                          │
│  ┌─── TAB 3: INTEGRITY METADATA ──────────────────────────────┐         │
│  │                                                               │        │
│  │  • Evidence hash (SHA-256)                                    │        │
│  │  • Methodology version (VPD)                                  │        │
│  │  • Agent versions that produced this                          │        │
│  │  • Last HITL checkpoint date                                  │        │
│  │  • Fit Score algorithm version                                │        │
│  │                                                               │        │
│  │  "This is why you can trust it"                               │        │
│  │                                                               │        │
│  └───────────────────────────────────────────────────────────────┘        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Export Formats

| Format                | Audience                         | Contents                              |
| --------------------- | -------------------------------- | ------------------------------------- |
| **PDF Pitch Deck**    | External investors, meetings     | 10-slide narrative + verification footer |
| **Full Evidence PDF** | Due diligence, deep review       | Narrative + all Strategyzer artifacts |
| **JSON API**          | Capital tier PHs with API access | Full EvidencePackage schema           |
| **Summary Card**      | Founder Directory browsing       | Tagline + Fit Score + top 3 metrics   |

**PDF Verification Footer**: All exported PDFs include a footer on every slide:
- Verification URL: `app.startupai.site/verify/{short-hash}`
- QR code linking to verification URL
- Generation timestamp
- Evidence ID (first 12 characters of integrity hash)

This maintains integrity guarantees when PDFs are shared outside the platform and creates a lead capture mechanism for external investors.

#### PDF Brand Guidelines

The 10-slide pitch deck is an external-facing artifact representing StartupAI to investors. PDF exports must maintain brand consistency.

**Slide Specifications**:
| Property | Value |
|----------|-------|
| Dimensions | 16:9 (1920x1080px for digital delivery) |
| Margins | 80px safe zone on all sides |
| Background | White (#FFFFFF) or brand off-white for contrast |

**Typography Stack**:
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Slide title | Inter | 600 (Semi-bold) | 32px |
| Body text | Inter | 400 (Regular) | 18px |
| Evidence items | Inter | 500 (Medium) | 16px |
| Footer/meta | Inter | 400 (Regular) | 12px |
| Fallback | System UI, -apple-system, sans-serif | — | — |

**Header/Footer Treatment**:
- **Header**: StartupAI logo (monochrome, 24px height) in top-right corner of all slides except Cover
- **Footer**: Verification URL (left), slide number (center), QR code (right, 48x48px)
- **Cover slide**: Full branded treatment with centered logo, venture name, tagline

**Cover Slide Layout** (when no visual identity uploaded):
```
+-------------------------------------------------------------+
|                                                              |
|                    [StartupAI Logo]                         |
|                                                              |
|                    VENTURE NAME                             |
|                    -------------                            |
|                    "Tagline goes here"                      |
|                                                              |
|                    Founder Name                             |
|                    founder@email.com                        |
|                                                              |
|  ---------------------------------------------------------- |
|  Verified by StartupAI | Feb 2026 | app.startupai.site/v/x |
|                                                              |
+-------------------------------------------------------------+
```

---

## Marketing Asset Specifications

The Narrative Layer produces external-facing artifacts that require consistent marketing assets for professional presentation and social sharing.

### Open Graph Assets

When verification URLs or Evidence Package links are shared externally (LinkedIn, Twitter, email), they must display branded preview cards.

**OG Image Template** (1200x630px):
```
+-----------------------------------------------------------------------------+
|                                                                              |
|  [StartupAI Logo]                                    [Fit Score Badge]      |
|                                                           0.82              |
|                                                                              |
|           VENTURE NAME                                                      |
|           ----------------------------------------                          |
|           "Tagline: Reducing last-mile delivery                             |
|            costs by 40%"                                                    |
|                                                                              |
|           Stage: Solution Testing | 12 evidence items                       |
|                                                                              |
|  -------------------------------------------------------------------------  |
|  Methodology-verified validation  *  app.startupai.site                     |
|                                                                              |
+-----------------------------------------------------------------------------+
```

**Dynamic fields**:
- `venture_name`: From pitch narrative cover
- `tagline`: From pitch narrative cover (truncate at 80 chars)
- `fit_score`: Visual badge with score (color-coded: green >0.7, yellow 0.4-0.7, gray <0.4)
- `validation_stage`: Current gate
- `evidence_count`: Total evidence items

**Generation**: Serverless function at `/api/og/evidence-package/[id]` using `@vercel/og` or `satori`. Cache generated images for 1 hour.

**Meta tags** (for Evidence Package pages):
```html
<meta property="og:image" content="https://app.startupai.site/api/og/evidence-package/{id}" />
<meta property="og:title" content="{venture_name} - Validated by StartupAI" />
<meta property="og:description" content="{tagline} | Fit Score: {fit_score}" />
<meta name="twitter:card" content="summary_large_image" />
```

### Cover Slide Placeholder

When founders have not uploaded a visual identity, the Cover slide uses a branded placeholder.

**Placeholder design**:
- Background: Subtle gradient using brand colors (primary -> accent, 5% opacity)
- Center element: Geometric pattern derived from industry tags (e.g., "logistics" -> connected nodes, "fintech" -> abstract currency symbols)
- Venture name: Large, centered, Inter 600
- Tagline: Below name, Inter 400 italic

**Industry pattern library** (Phase 2+):
| Industry Tag | Pattern Concept |
|--------------|-----------------|
| logistics | Connected route nodes |
| fintech | Abstract currency flow |
| healthtech | Pulse/vitals wave |
| saas | Cloud/stack layers |
| default | StartupAI compass motif |

**Phase 1 approach**: Use default compass motif pattern for all placeholders. Industry-specific patterns deferred to Phase 2.

### Shareable Assets

Founders should be able to download branded assets for external use.

**Available downloads** (from Founder Dashboard):
| Asset | Format | Size | Use Case |
|-------|--------|------|----------|
| Evidence Package Card | PNG | 1200x630 | LinkedIn/Twitter sharing |
| Fit Score Badge | PNG/SVG | 200x200 | Email signatures, decks |
| Verification QR Code | PNG/SVG | 400x400 | Print materials |
| "Verified by StartupAI" Badge | PNG/SVG | Multiple | External presentations |

**Download UI**: Add "Download Assets" button to Founder Dashboard narrative section, opening a modal with asset options.

### AI-Generated Visuals (Phase 4+)

**Deferred scope**: DALL-E integration for industry-specific hero images on Cover slides.

**When implemented**:
- Prompt library per industry vertical
- Brand-consistent style guide for AI generation
- Human review before publishing (founder approval)
- Storage in Supabase `design_assets` bucket

**Not in Phase 1-3**: AI-generated visuals require significant prompt engineering and quality control. The branded placeholder approach is sufficient for initial launch.

---

## Evidence Integrity System

### Why Integrity Matters

Once Portfolio Holders pay $499/month for "de-risked deal flow," the quality bar for evidence becomes a **trust contract**. If Fit Scores, DO evidence, or HITL records are gameable or inconsistent, the marketplace reputation collapses.

### Integrity Controls

| Control                        | Mechanism                                           | Enforcement                 |
| ------------------------------ | --------------------------------------------------- | --------------------------- |
| Evidence hashing               | SHA-256 of all evidence data                        | Detect tampering            |
| Methodology versioning         | VPD version locked per analysis                     | Ensure consistency          |
| Agent version tracking         | Record which agent versions produced outputs        | Reproducibility             |
| HITL checkpoint verification   | Timestamps + response content stored                | Prove human review occurred |
| Fit Score algorithm versioning | Score algorithm version recorded                    | Comparable across founders  |
| Staleness detection            | Trigger marks narrative stale when evidence changes | Prevent outdated narratives |
| Staleness severity             | Soft vs hard thresholds based on change type        | Appropriate UX urgency      |
| Narrative versioning           | Full history preserved for founder learning         | Show validation → pitch improvement |

### Staleness Threshold Model

Not all evidence changes are equal. The staleness system distinguishes between **soft stale** (informational) and **hard stale** (action required):

| Change Type | Severity | UI Treatment | Example |
|-------------|----------|--------------|---------|
| +1 interview added | Soft | "New evidence available — consider regenerating" | Added 9th interview |
| +1 experiment completed | Soft | "New evidence available — consider regenerating" | Finished landing page test |
| Hypothesis validated/invalidated | Hard | "Narrative outdated — key findings changed" | Core pain hypothesis invalidated |
| Fit Score delta >0.1 | Hard | "Narrative outdated — Fit Score significantly changed" | 0.65 → 0.78 |
| Gate passed | Hard | "Validation stage changed — narrative requires update" | Entered Solution Testing |
| Founder profile updated | Soft | "Team slide may be outdated" | Added LinkedIn URL |

**UX Behavior**:
- **Soft stale**: Informational badge, founder can dismiss or regenerate
- **Hard stale**: Warning badge, narrative still viewable but regeneration encouraged
- **Neither blocks viewing**: PHs can always see the current narrative with appropriate staleness indicator

**Staleness Accumulation**: Multiple soft changes don't automatically become hard. However, if a narrative has been soft-stale for >7 days with >3 evidence changes, the UI may suggest regeneration more prominently.

### Narrative Version History (Founder Learning)

Founders can view how their narrative has evolved over time:

```
┌─────────────────────────────────────────────────────────────┐
│  NARRATIVE EVOLUTION                                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Current: v4 (Feb 4, 2026)                                   │
│  Fit Score: 0.78 | Evidence: 12 items | Stage: Solution Test │
│                                                               │
│  ─── Timeline ───────────────────────────────────────────── │
│                                                               │
│  v4 ●━━━ Feb 4  Fit Score improved 0.65 → 0.78              │
│        │        + 3 enterprise interviews validated B2B pivot│
│        │        Traction slide strengthened significantly    │
│        │                                                     │
│  v3 ●━━━ Jan 28 Completed pricing experiment                │
│        │        + Tiered model outperformed freemium 3:1     │
│        │        Business Model slide updated                 │
│        │                                                     │
│  v2 ●━━━ Jan 15 Passed Desirability gate                    │
│        │        + 5 new interviews, hypothesis validated     │
│        │        Problem & Customer slides improved           │
│        │                                                     │
│  v1 ●━━━ Jan 8  Initial narrative generated                 │
│                 Baseline from onboarding evidence            │
│                                                               │
│  [Compare v3 → v4]  [View Full Diff]                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

This reinforces the connection between validation work and pitch quality: "When I run experiments and collect behavioral evidence, my narrative gets stronger."

### Guardian Extension

Guardian's governance role extends to evidence integrity:

| Current Guardian Role         | Extended Role                             |
| ----------------------------- | ----------------------------------------- |
| AI agent output quality gates | Evidence package integrity validation     |
| Budget guardrails             | Evidence consistency checks               |
| Policy enforcement            | Fit Score manipulation detection          |
| —                             | Narrative-evidence alignment verification |

**Narrative-Evidence Alignment Check**: When the Report Compiler generates a pitch narrative, Guardian verifies that narrative claims are supported by the underlying evidence. Flag any narrative statement that overstates the evidence (e.g., narrative says "strong product-market fit" but Fit Score is 0.45).

### Claim-Language Mapping

To enforce narrative-evidence alignment, Guardian uses a structured mapping between evidence strength and permitted narrative language.

**Mapping Table**

| Fit Score Range | DO-Direct Count | DO-Indirect Count | Permitted Language | Prohibited Language |
|-----------------|-----------------|-------------------|--------------------|--------------------|
| 0.0 - 0.39 | 0 | 0-2 | "exploring", "early signals", "initial feedback" | "validated", "proven", "strong" |
| 0.4 - 0.59 | 0-1 | 1-3 | "positive indicators", "growing evidence", "encouraging signs" | "proven", "strong demand", "confirmed" |
| 0.6 - 0.79 | 1-3 | 2-5 | "validated interest", "demonstrated demand", "solid evidence" | "proven product-market fit", "confirmed at scale" |
| 0.8+ | 3+ | 5+ | "strong validation", "proven demand", "confirmed fit" | (none - full language permitted) |

**Guardian Implementation**

Guardian checks narrative text against this mapping during three key operations:

1. **Initial narrative generation**: When Report Compiler generates narrative content, Guardian validates each claim against current evidence before the narrative is stored.

2. **Founder edit validation**: When founders modify narrative text, Guardian scans the edited content for language that exceeds what evidence permits. This ensures founder customizations maintain evidence integrity.

3. **Regeneration after evidence changes**: When evidence is added, updated, or removed, and the narrative is regenerated, Guardian re-validates all claims against the new evidence state.

**Flagging Behavior**

When narrative language exceeds what evidence permits, Guardian responds differently based on the source:

- **Auto-generated narratives**: Guardian auto-corrects to permitted language. For example, if the LLM generates "strong demand" but evidence only supports "positive indicators," Guardian downgrades the language automatically before presenting to the founder.

- **Founder edits**: Guardian flags the specific issue without auto-correcting, preserving founder agency. The flag includes actionable context:
  > "Claims 'strong demand' but evidence supports 'positive indicators'. Current evidence: 1 DO-direct, 2 DO-indirect, Fit Score 0.52. Add 2+ more DO-direct evidence to unlock this language."

**Edge Cases**

- **Mixed evidence (high DO-indirect, low DO-direct)**: Use DO-direct count as the primary gate. A founder with 10 DO-indirect pieces but 0 DO-direct cannot claim "validated demand." Rationale: behavioral evidence from actual users (DO-direct) is the strongest signal; indirect evidence alone may indicate interest without true validation.

- **Recent pivot**: Allow "pivoted based on evidence" and "adjusted direction following validation" language regardless of current Fit Score. A pivot is itself a form of validation learning, and founders should be able to communicate this regardless of where the new direction stands in validation.

### External Sharing Integrity

When founders export PDFs and share them outside the platform, integrity guarantees must persist. The exported PDF includes:

1. **Verification URL**: `app.startupai.site/verify/{short-hash}`
2. **QR code**: Links to the same verification URL
3. **Generation timestamp**: Embedded in footer
4. **Integrity hash**: First 12 characters visible as "Evidence ID"

**Verification Page** (public, no auth required):

```
┌─────────────────────────────────────────────────────────────┐
│  EVIDENCE VERIFICATION                                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Narrative: "Acme Logistics"                                  │
│  Generated: February 4, 2026 at 2:34 PM UTC                  │
│  Evidence ID: a3f8c2d1e9b4                                   │
│                                                               │
│  Status: ✓ VERIFIED                                          │
│                                                               │
│  This narrative was generated by StartupAI from validated    │
│  evidence. The underlying data has not changed since         │
│  generation.                                                  │
│                                                               │
│  ─── OR ───                                                  │
│                                                               │
│  Status: ⚠ EVIDENCE UPDATED                                  │
│                                                               │
│  This narrative was generated on February 4, 2026.           │
│  The founder has since added new validation evidence.        │
│  Request connection to see the latest Evidence Package.      │
│                                                               │
│  [Request Access to Full Evidence Package]                   │
│                                                               │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│  About StartupAI Evidence Packages                           │
│  Evidence Packages combine investor-ready narratives with    │
│  methodology-verified validation data. Learn more →          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Lead capture**: External investors landing on the verification page are warm leads for the marketplace. The "Request Access" CTA creates a connection request flow.

**API Endpoint**:

```
GET /api/verify/{short-hash}
```

**Response** (public, unauthenticated):
```json
{
  "status": "verified" | "updated" | "not_found",
  "generated_at": "2026-02-04T14:34:00Z",
  "venture_name": "Acme Logistics",
  "evidence_id": "a3f8c2...d1e9b4",
  "current_hash_matches": true,
  "evidence_updated_at": "2026-02-04T14:34:00Z",
  "validation_stage_at_generation": "Solution Testing"
}
```

**Note**: `fit_score_at_generation` is intentionally excluded from the public response. See Security section below.

#### Verification Endpoint Security

The public verification endpoint requires careful security design to prevent abuse while maintaining utility.

**Hash Generation**:

The verification URL uses a full UUID token rather than a truncated SHA-256 hash:

| Approach | Entropy | Attack Surface |
|----------|---------|----------------|
| Truncated SHA-256 (12 chars) | ~48 bits | Enumerable with ~280 trillion attempts |
| Full UUID v4 | 122 bits | Computationally infeasible to enumerate |

- Generate a separate random UUID as `verification_token` (not derived from content)
- Store in `pitch_narratives` table alongside the integrity hash
- URL format: `app.startupai.site/verify/{verification_token}`
- The `evidence_id` displayed to users remains the truncated SHA-256 for readability

**Rate Limiting**:

```
Per IP Address:
- 100 requests per minute (burst limit)
- 1,000 requests per hour (sustained limit)

Response when exceeded:
HTTP 429 Too Many Requests
Retry-After: <seconds until reset>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <unix timestamp>
```

Implementation: Use Upstash Redis with sliding window algorithm (compatible with Netlify Edge Functions).

**Response Sanitization**:

The public endpoint intentionally omits sensitive data:

| Field | Public | Authenticated | Rationale |
|-------|--------|---------------|-----------|
| `status` | Yes | Yes | Core verification purpose |
| `generated_at` | Yes | Yes | Timestamp verification |
| `venture_name` | Yes | Yes | Already on the PDF |
| `evidence_id` | Truncated | Full | Prevent hash collision attacks |
| `validation_stage` | Yes | Yes | General context |
| `fit_score` | No | Yes | Competitive intelligence risk |
| `narrative_content` | No | No | Never exposed via verification |
| `evidence_details` | No | Yes | Requires founder consent |

Why exclude Fit Score from public response:
- Investors could systematically verify shared PDFs to compare founders
- Creates competitive pressure on founders to delay sharing until score improves
- Score is contextual (methodology stage affects meaning)

**Logging and Monitoring**:

All verification requests are logged for security analysis:

```typescript
interface VerificationLog {
  timestamp: string;           // ISO 8601
  ip_address: string;          // Hashed for privacy after 30 days
  verification_token: string;  // Which narrative was verified
  user_agent: string;          // Browser/client identification
  referrer: string | null;     // Where the request originated
  result: 'verified' | 'updated' | 'not_found' | 'rate_limited';
}
```

Alerting thresholds:
- **>10 unique IPs verifying same token in 24h**: Flag for review (potential wide distribution)
- **>50 requests from single IP in 1h**: Temporary block, notify security
- **Burst of not_found requests**: Potential enumeration attempt

---

## Frontend Components

### User-Facing Terminology

Internal technical terms must be translated to user-friendly language in all UI copy. This mapping ensures consistency across the Narrative Layer interface.

| Internal Term | User-Facing Term | Context |
|---------------|------------------|---------|
| Soft stale | "Minor updates available" | Staleness indicator |
| Hard stale | "Regeneration recommended" | Staleness indicator |
| Alignment check | "Evidence match" | Edit validation |
| Alignment verified | "All claims supported by your evidence" | Edit status |
| Alignment flagged | "Some claims may overstate your evidence" | Edit status |
| Evidence gap | "Add evidence to strengthen this slide" | Slide status |
| Coachability score | "Feedback responsiveness" | Team slide metric |
| Baseline narrative | "Original AI draft" | Edit comparison |

**Implementation note**: Copy constants should be defined in `frontend/src/lib/constants/` to maintain consistency. Never expose internal terminology directly in component JSX.

### Empty States

Before a founder has completed sufficient validation to generate a narrative, the dashboard shows an encouraging empty state that guides them toward generation eligibility.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PITCH NARRATIVE                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Complete your validation to unlock your pitch narrative.               │
│                                                                          │
│  Your evidence will automatically become a 10-slide investor deck.      │
│                                                                          │
│  Progress toward narrative generation:                                  │
│  ████████░░░░░░░░░░░░  40% complete                                    │
│                                                                          │
│  [x] Problem hypothesis defined                                         │
│  [x] Solution hypothesis defined                                        │
│  [ ] 5+ customer interviews (you have 2)                               │
│  [ ] 1+ experiment completed                                            │
│  [x] Fit Score calculated                                               │
│                                                                          │
│  [Preview what your narrative could look like]                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tone**: Warm and guiding. The empty state should feel like encouragement, not a blocker. The preview link shows a sample narrative structure (with placeholder content) so founders understand what they're working toward.

### Founder Dashboard Additions

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FOUNDER DASHBOARD — New Narrative Section                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─── Pitch Narrative Card ──────────────────────────────────┐          │
│  │                                                            │          │
│  │  Status: ● Up to date                                      │          │
│  │          ○ Minor updates available                        │          │
│  │          ○ Regeneration recommended                       │          │
│  │  Source: AI-generated | Founder-edited ✓                  │          │
│  │  Last updated: Feb 4, 2026 | Version: 4                   │          │
│  │                                                            │          │
│  │  [Preview]  [Edit]  [Regenerate]  [Export PDF]  [History] │          │
│  │                                                            │          │
│  │  ┌─ Tagline Preview ─────────────────────────────┐        │          │
│  │  │ "Reducing last-mile delivery costs for          │        │          │
│  │  │  mid-market e-commerce by 40%"                  │        │          │
│  │  └─────────────────────────────────────────────────┘        │          │
│  │                                                            │          │
│  └────────────────────────────────────────────────────────────┘          │
│                                                                          │
│  ┌─── Evidence Package Card ─────────────────────────────────┐          │
│  │                                                            │          │
│  │  Sharing: ○ Private  ● Shared with 2 Portfolio Holders    │          │
│  │  Directory: ○ Opted out  ● Opted in (visible to verified) │          │
│  │                                                            │          │
│  │  [Manage Sharing]  [Preview as PH]                        │          │
│  │                                                            │          │
│  └────────────────────────────────────────────────────────────┘          │
│                                                                          │
│  ┌─── Founder Profile Card ──────────────────────────────────┐          │
│  │                                                            │          │
│  │  Completeness: ████████░░ 80%                             │          │
│  │  Missing: LinkedIn URL                                     │          │
│  │                                                            │          │
│  │  [Edit Profile]                                            │          │
│  │                                                            │          │
│  └────────────────────────────────────────────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### First-Run Narrative Experience

The first narrative generation is a milestone moment for founders. This section defines the UX for guiding founders through their first pitch narrative.

**Trigger Conditions**:
- First validation gate passed (Desirability Gate), OR
- 5+ evidence items collected (interviews, experiments, or market research)
- No existing pitch narrative for the project

**Flow**:

1. **Dashboard Prompt Card** - Appears when trigger conditions met
2. **One-Click Generation** - Single CTA with clear expectations
3. **Loading State** - Progress indicator with meaningful status messages
4. **Celebratory First View** - Guided highlights of generated content
5. **Next Step CTA** - Clear action to refine or share

**Prompt Card Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  YOUR PITCH NARRATIVE IS READY                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Based on your validation evidence, we can now generate an               │
│  investor-ready pitch narrative.                                         │
│                                                                          │
│  Your evidence includes:                                                 │
│  - 8 customer interviews                                                 │
│  - 3 completed experiments                                               │
│  - Problem-Solution Fit Score: 0.72                                     │
│                                                                          │
│  [Generate My Pitch Narrative]                                          │
│                                                                          │
│  This will create a 10-slide narrative from your validation data.       │
│  You can edit and refine it after generation.                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Loading State Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CRAFTING YOUR NARRATIVE                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ████████████░░░░░░░░░░░░░░░░░░  Analyzing 8 interviews...              │
│                                                                          │
│  Transforming your validation evidence into a compelling story.         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Loading State Messages** (cycle through):
- "Analyzing 8 interviews..."
- "Synthesizing experiment results..."
- "Crafting your problem statement..."
- "Building your traction story..."
- "Generating slide content..."
- "Finalizing your narrative..."

**Celebratory First View**:

After generation completes, the founder sees their narrative with guided highlights:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  YOUR PITCH NARRATIVE                                              v1   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Narrative generated from your validation evidence                      │
│                                                                          │
│  ┌─ What's in your narrative ──────────────────────────────────────────┐│
│  │                                                                      ││
│  │  [1] Problem           Based on 8 interview pain points             ││
│  │  [2] Solution          Mapped to validated hypotheses               ││
│  │  [3] Traction          3 experiments with measurable results        ││
│  │  [4] Business Model    Derived from pricing experiment              ││
│  │  ...                                                                 ││
│  │                                                                      ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  [Preview Full Narrative]    [Edit & Personalize]                       │
│                                                                          │
│  Tip: Your narrative is already backed by evidence. Personalize it      │
│  with your unique story and insights.                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Interaction Specification**:

| Trigger | Action | Result |
|---------|--------|--------|
| Click "Generate My Pitch Narrative" | POST to `/api/narrative/generate` | Loading state, then celebratory view |
| Generation completes | Redirect to narrative view | Show celebratory first-view overlay |
| Click "Preview Full Narrative" | Navigate to `/projects/[id]/narrative` | Full 10-slide view |
| Click "Edit & Personalize" | Navigate to narrative editor | Slide-by-slide editor |
| Dismiss prompt card | Set `narrative_prompt_dismissed` flag | Card hidden until new trigger |

**Error States**:

| Error | Display | Recovery |
|-------|---------|----------|
| Insufficient evidence | "Add more validation evidence to generate a narrative" | Link to evidence collection |
| Generation timeout | "Generation is taking longer than expected" | "Check back in a few minutes" link |
| Generation failed | "We couldn't generate your narrative" | Retry button + support link |

**Accessibility Notes**:
- Progress bar has `aria-live="polite"` for screen reader updates
- Loading messages announced via `aria-label` changes
- Generate button disabled during loading with `aria-disabled="true"`
- Focus management: after generation, focus moves to narrative preview

### Narrative Editor (Founder)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  EDIT NARRATIVE                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Editing: Slide 5 — Traction                                            │
│                                                                          │
│  ┌─── Original AI draft ─────────────────────────────────────────────┐  │
│  │ "8 customer interviews validated the core pain hypothesis.          │ │
│  │  3 experiments completed with positive signals."                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─── Your Edit ──────────────────────────────────────────────────────┐ │
│  │ "We spoke with 8 operations managers at mid-market logistics        │ │
│  │  companies across the Midwest. All 8 described last-mile cost as   │ │
│  │  their top operational pain point. 3 experiments completed:         │ │
│  │  landing page (23.5% conversion), LOI collection (5/12), and       │ │
│  │  prototype usability (4.2/5 score)."                               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Evidence match: ✓ All claims supported by your evidence                │
│  Your edit adds context (who interviewees were, geographic focus)       │
│  without overstating the evidence.                                      │
│                                                                          │
│  [Save Edit]  [Revert to Original]  [Cancel]                           │
│                                                                          │
│  ─── OR ───                                                             │
│                                                                          │
│  Evidence match: ⚠ Some claims may overstate your evidence              │
│  Issue: Edit claims "strong demand" but DO-direct evidence count is 0. │
│  Suggestion: Use "early positive signals" instead.                      │
│                                                                          │
│  [Save Anyway (will show flagged badge to PHs)]  [Revise Edit]         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Regeneration with Edit Preservation

When founders click "Regenerate" after evidence changes, they need clarity about what happens to their edits. This section defines the UX for preserving founder customizations during regeneration.

**The Problem**: Founders invest time personalizing their narrative. Regeneration could discard that work, creating frustration and distrust.

**The Solution**: Give founders explicit control over what gets regenerated.

**Regeneration Options**:

| Option | Behavior | Use Case |
|--------|----------|----------|
| **Keep my edits** (default) | Only regenerate slides/sections without founder edits. Update evidence citations and metrics. | Most common - founder wants fresh data but keeps their voice |
| **Regenerate everything** | Full regeneration from scratch. Previous version saved in history. | Founder wants a clean slate or made edits they regret |

**Confirmation Dialog Wireframe**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REGENERATE NARRATIVE                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  New evidence is available since your last generation:                   │
│  - +2 customer interviews                                                │
│  - +1 completed experiment (pricing test)                                │
│  - Fit Score: 0.72 -> 0.78                                              │
│                                                                          │
│  ─── What would you like to regenerate? ────────────────────────────── │
│                                                                          │
│  ( ) Keep my edits, update evidence sections only                       │
│      Your edits on 3 slides will be preserved.                          │
│      AI-generated sections will be refreshed with new evidence.         │
│                                                                          │
│  ( ) Regenerate everything, I'll re-edit                                │
│      Start fresh. Your current version (v4) will be saved in history.  │
│                                                                          │
│  ─── Preview of changes ─────────────────────────────────────────────── │
│                                                                          │
│  Slides that will change:                                                │
│  [5] Traction        New experiment results will be added               │
│  [8] Business Model  Pricing experiment data available                  │
│                                                                          │
│  Slides with your edits (preserved if "Keep my edits"):                 │
│  [1] Overview        Your custom tagline                                │
│  [3] Problem         Your founder story addition                        │
│  [9] Team            Your background details                            │
│                                                                          │
│  [Cancel]                              [Regenerate]                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Interaction Specification**:

| Trigger | Action | Result |
|---------|--------|--------|
| Click "Regenerate" button | Show confirmation dialog | Dialog appears with options |
| Select "Keep my edits" | Set `preserve_edits: true` | Preview updates to show preserved slides |
| Select "Regenerate everything" | Set `preserve_edits: false` | Preview shows all slides will change |
| Click "Regenerate" in dialog | POST to `/api/narrative/regenerate` | Loading state, then updated view |
| Click "Cancel" | Close dialog | No changes |

**Technical Implementation**:

When `preserve_edits: true`:
1. Fetch all slides with `is_edited: true` from current narrative
2. Generate new narrative from evidence
3. For each edited slide:
   - Keep founder's `content` field
   - Update `evidence_refs` to new evidence IDs where applicable
   - Keep `is_edited: true` flag
4. For non-edited slides:
   - Replace with newly generated content
5. Increment version, save previous to history

**Error States**:

| Error | Display | Recovery |
|-------|---------|----------|
| Regeneration conflict | "Some evidence no longer supports your edits" | Show affected slides, offer to review |
| No changes needed | "Your narrative is already up to date" | Close dialog |
| Regeneration failed | "Regeneration failed" | Retry button, previous version preserved |

**Accessibility Notes**:
- Radio buttons are keyboard navigable
- Preview section has `aria-label="Changes preview"`
- Focus trapped within dialog until dismissed
- Escape key closes dialog without action

### Narrative Version History (Founder)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NARRATIVE EVOLUTION                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Current: v4 (Feb 4, 2026)                                              │
│  Fit Score: 0.78 | Evidence: 12 items | Stage: Solution Testing         │
│                                                                          │
│  Your narrative has improved significantly since v1.                    │
│  Key drivers: +3 enterprise interviews, +1 experiment, B2B pivot        │
│                                                                          │
│  ─── Timeline ──────────────────────────────────────────────────────── │
│                                                                          │
│  v4 ●━━━ Feb 4   Fit Score improved 0.65 → 0.78                        │
│       │          + 3 enterprise interviews validated B2B pivot          │
│       │          Traction slide strengthened significantly              │
│       │          [View v4]  [Compare v3 → v4]                          │
│       │                                                                 │
│  v3 ●━━━ Jan 28  Completed pricing experiment                          │
│       │          + Tiered model outperformed freemium 3:1               │
│       │          Business Model slide updated                           │
│       │          [View v3]  [Compare v2 → v3]                          │
│       │                                                                 │
│  v2 ●━━━ Jan 15  Passed Desirability gate                              │
│       │          + 5 new interviews, hypothesis validated               │
│       │          Problem & Customer slides improved                     │
│       │          [View v2]  [Compare v1 → v2]                          │
│       │                                                                 │
│  v1 ●━━━ Jan 8   Initial narrative generated                           │
│                  Baseline from onboarding evidence                      │
│                  [View v1]                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Portfolio Holder Evidence View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PORTFOLIO HOLDER — Evidence Package View                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Founder: Jane Doe | Fit Score: 0.82 | Stage: Solution Testing          │
│  Connected: Jan 15, 2026 | Relationship: Capital                        │
│  Narrative: Founder-edited · All claims supported ✓                       │
│                                                                          │
│  ┌─── [Pitch Narrative] ─── [Validation Evidence] ─── [Integrity] ──┐  │
│  │                                                                    │  │
│  │  ┌─ PITCH NARRATIVE (10-Slide View) ─────────────────────────┐    │  │
│  │  │                                                            │    │  │
│  │  │  1. Overview   2. Opportunity   3. Problem   4. Solution      │    │  │
│  │  │  5. Traction   6. Customer   7. Competition                  │    │  │
│  │  │  8. Biz Model   9. Team   10. Use of Funds                   │    │  │
│  │  │                                                            │    │  │
│  │  │  ┌─────────────────────────────────────────────────┐       │    │  │
│  │  │  │ Currently viewing: Slide 5 — Traction            │       │    │  │
│  │  │  │                                                  │       │    │  │
│  │  │  │ "8 customer interviews validated the core pain   │       │    │  │
│  │  │  │  hypothesis. 3 experiments completed:            │       │    │  │
│  │  │  │  - Landing page: 23.5% conversion (47/200)      │       │    │  │
│  │  │  │  - LOI collection: 5 signed from 12 approached  │       │    │  │
│  │  │  │  - Prototype test: 4.2/5 usability score        │       │    │  │
│  │  │  │                                                  │       │    │  │
│  │  │  │ Evidence type: DO-indirect (0.8 weight)"         │       │    │  │
│  │  │  └─────────────────────────────────────────────────┘       │    │  │
│  │  │                                                            │    │  │
│  │  │  [Download PDF Deck]  [Request More Evidence]              │    │  │
│  │  │                                                            │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─── Recent Updates ────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  Feb 3: Fit Score improved 0.65 → 0.82 after enterprise           │  │
│  │         customer interviews validated B2B pivot                    │  │
│  │  Jan 28: Completed pricing experiment — tiered model               │  │
│  │          outperformed freemium 3:1 in conversion                   │  │
│  │  Jan 20: HITL checkpoint passed — incorporated feedback            │  │
│  │          on go-to-market strategy                                  │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Evidence Visual Hierarchy

**Design Principle**: The visual treatment of evidence must reinforce the DO/SAY hierarchy, regardless of narrative phrasing. DO-direct evidence should be unmistakably prominent; SAY evidence should be visually de-emphasized.

This prevents a critical UX failure mode: SAY evidence (interview quotes, survey responses) should never visually compete with DO evidence (payments, signed contracts, behavioral data). Portfolio Holders must be able to scan the Traction slide and immediately understand which claims have the strongest evidentiary backing.

#### Hierarchy Specifications

| Evidence Type | Visual Treatment |
|---------------|------------------|
| DO-direct (1.0) | Large text (16px), primary color (green-600), checkmark icon, first position |
| DO-indirect (0.8) | Normal text (14px), secondary color (blue-600), partial-check icon, second position |
| SAY (0.3) | Smaller text (13px), muted color (gray-500), quote icon, last position, italic |

#### Visual Weight Rules

1. **Size Hierarchy**: DO-direct items use larger font size than DO-indirect, which uses larger than SAY
2. **Color Hierarchy**: DO-direct uses primary brand color (success/green), DO-indirect uses secondary (info/blue), SAY uses muted/tertiary (gray)
3. **Icon Hierarchy**:
   - DO-direct: Solid checkmark (complete confidence)
   - DO-indirect: Partial/half-filled check (strong signal)
   - SAY: Quote marks (verbal claim, needs corroboration)
4. **Position Hierarchy**: Evidence types always render in order: DO-direct first, DO-indirect second, SAY last
5. **Weight Badges**: Always show evidence weight visually (e.g., `[1.0]`, `[0.8]`, `[0.3]`) so PHs understand the methodology's confidence in each type

**Accessibility Requirements**:

- Color must not be the only differentiator. Icons (checkmark, half-check, quote) and weight badges ([1.0], [0.8], [0.3]) provide non-color cues.
- Verify color contrast meets WCAG AA standards:
  - Green-600 on white: 3.2:1 (passes for large text, add bold)
  - Blue-600 on white: 4.0:1 (passes AA)
  - Gray-500 on white: 4.6:1 (passes AA)
- Evidence weight badges must be visible by default, not only on hover.
- Screen readers should announce evidence type and weight (e.g., "DO-direct evidence, weight 1.0, 3 paying customers")

#### Traction Slide Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TRACTION                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ [checkmark] DO-DIRECT EVIDENCE                              [1.0 weight] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   * 3 paying customers ($2,400 MRR)                                     │
│   * 2 signed LOIs ($50K committed)                                      │
│                                                                          │
│ [half-check] DO-INDIRECT EVIDENCE                           [0.8 weight] │
│ ──────────────────────────────────────────────────────────────────────  │
│   * Landing page: 23.5% conversion (47/200)                             │
│   * Waitlist: 127 signups                                               │
│                                                                          │
│ [quote] SAY EVIDENCE                                        [0.3 weight] │
│ . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .  │
│   "8 interviews indicated strong interest"                              │
│   "Survey: 73% would pay $50/month"                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### CSS Token Mapping

```css
/* Evidence hierarchy tokens - mapped to brand palette for consistency */
--evidence-do-direct-color: hsl(var(--accent));        /* Validation green - represents verified behavioral evidence */
--evidence-do-direct-size: theme('fontSize.base');  /* 16px */
--evidence-do-direct-weight: theme('fontWeight.semibold');

--evidence-do-indirect-color: hsl(var(--primary));     /* Strategic blue - represents trusted indirect signals */
--evidence-do-indirect-size: theme('fontSize.sm');  /* 14px */
--evidence-do-indirect-weight: theme('fontWeight.medium');

--evidence-say-color: hsl(var(--muted-foreground));    /* Muted - de-emphasized stated evidence */
--evidence-say-size: theme('fontSize.xs');  /* 13px */
--evidence-say-weight: theme('fontWeight.normal');
--evidence-say-style: italic;
```

These colors align with the brand palette defined in `globals.css`. The semantic mapping reinforces the evidence hierarchy: accent (validation) for DO-direct, primary (trust) for DO-indirect, muted for SAY.

#### Methodology Verified Badge

A visual seal reinforcing StartupAI's methodology-backed positioning. Used on:
- PDF exports (Cover slide footer)
- Evidence Package integrity tab
- External verification page

**Design specifications**:
- Shape: Circular badge with geometric inner mark (compass-inspired, per brand)
- Colors: Accent green (#22c55e) on white, or reversed for dark backgrounds
- Sizes: 24px (inline), 48px (PDF footer), 96px (verification page hero)
- Text: "Methodology Verified" or "VPD Verified" in Inter 500

**Usage**: Badge appears alongside integrity hash and timestamp to create a trust cluster.

#### Component Implementation Notes

The `EvidenceList` component must:
1. Sort evidence by type before rendering (do_direct -> do_indirect -> say_evidence)
2. Apply type-specific styling based on the `display_config.visual_emphasis` settings
3. Always show weight badges in PH view (`display_config.show_weights = true`)
4. Founders editing can optionally hide weights in preview mode

---

## CrewAI Report Compiler Modifications

### New Task: Narrative Synthesis

Add to the Report Compiler agent's task configuration:

```yaml
narrative_synthesis_task:
  description: >
    Generate a 10-slide pitch narrative from the validation evidence
    produced by all preceding agents. The narrative must:
    1. Re-render existing evidence through a storytelling lens
    2. Follow the 10-slide framework (Overview → Use of Funds) with Cover title card
    3. Never fabricate data — only synthesize what exists
    4. Flag slides with insufficient evidence as "Evidence Gap"
    5. Prioritize DO-evidence over SAY-evidence in traction
    6. Generate tagline (≤10 words) and 3-sentence thesis
    7. Frame "Use of Funds" as validation experiments, not budget categories
    8. When hypotheses have status='invalidated', frame pivots positively:
       - State the original hypothesis clearly
       - Explain what evidence led to invalidation (this demonstrates rigor)
       - Describe the new direction and why evidence supports it
       - Use language: "validated learning", "evidence-driven pivot", "refined focus"
       - Never frame invalidation as failure - it demonstrates founder discipline

  expected_output: >
    JSON object matching the PitchNarrative schema with all 10 slides
    populated from available evidence. Slides with insufficient evidence
    must include an `evidence_gap` field describing what's missing.

  dependencies:
    - customer_research_task
    - competitor_analysis_task
    - value_design_task
    - validation_task
    - feasibility_task
    - viability_task

  output_schema: PitchNarrative
```

### New Task: Evidence Package Assembly

```yaml
evidence_package_task:
  description: >
    Assemble a complete Evidence Package combining the pitch narrative
    with raw Strategyzer artifacts and integrity metadata.
    1. Include both narrative and methodology formats
    2. Compute integrity hash (SHA-256) of all evidence data
    3. Record agent versions and methodology version
    4. Flag any narrative claims not supported by evidence
    5. Include HITL checkpoint record

  expected_output: >
    JSON object matching the EvidencePackage schema with both
    pitch_narrative and validation_evidence sections populated.

  dependencies:
    - narrative_synthesis_task
    - all validation artifact tasks

  output_schema: EvidencePackage
```

### Guardian Integrity Check

```yaml
narrative_integrity_check:
  description: >
    Verify that the pitch narrative accurately represents the underlying
    validation evidence. Check for:
    1. Overstated claims (narrative implies stronger evidence than exists)
    2. Missing qualifiers (SAY evidence presented without weight context)
    3. Fit Score consistency (narrative score matches computed score)
    4. Evidence freshness (all cited evidence is current, not stale)
    5. Methodology compliance (all artifacts follow VPD structure)

  expected_output: >
    Integrity report with pass/fail for each check, specific issues
    identified, and recommended corrections.

  dependencies:
    - narrative_synthesis_task
    - evidence_package_task
```

---

## Success Metrics

### Phase 1-2 Metrics (Founder Value)

| Metric | Definition | Target | Data Source |
|--------|------------|--------|-------------|
| Narrative Generation Rate | narratives_generated / eligible_projects | >80% | `pitch_narratives` count |
| Time-to-First-Narrative | Days from first evidence to narrative | <7 days | `created_at` timestamps |
| Founder Edit Rate | edited_narratives / total_narratives | 30-60% | `pitch_narratives.is_edited` |
| Alignment Pass Rate | verified / (verified + flagged) | >90% | `alignment_status` |
| Regeneration Lag | Days from hard-stale to regeneration | <3 days | staleness timestamps |

### Phase 3-4 Metrics (Marketplace Value)

| Metric | Definition | Target | Data Source |
|--------|------------|--------|-------------|
| Package-to-Connection | Connections from package views | >5% | `evidence_package_access` joins |
| Verification Conversion | Connections from external PDF | >2% | `verification_token_used` |
| PH Engagement Depth | Avg tabs viewed per access | >2.0 | `package_engagement_events` |
| Evidence Tab Usage | % of accesses viewing Evidence tab | >40% | `package_engagement_events` |
| Slide Attention Distribution | Views per slide (identify drop-off) | Even distribution | `slide_view` events |

### Funnel Definitions

**Narrative Generation Funnel**:
```
Evidence Threshold Met -> Generation Started -> Generation Completed -> First View -> First Edit -> Package Created -> Package Shared
```

**PH Evidence Consumption Funnel**:
```
Package Access -> Pitch Tab View -> Evidence Tab View -> Integrity Tab View -> PDF Export -> Connection Request
```

---

## Validation Requirements

### Assumption Sequence

This feature introduces two new assumptions to validate before build:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NARRATIVE LAYER ASSUMPTIONS                                             │
│                                                                          │
│  A11 (Founder Narrative Value)  →  A12 (PH Evidence Package Value)      │
│       Week 6 (post-A4)                  Week 10 (post-A6)               │
│                                                                          │
│  Existing sequence context:                                              │
│  A4 (Founder WTP $49) → A6 (Advisor WTP $199) → A9 (Capital WTP $499)  │
│                                                                          │
│  A11 runs concurrent with A6 interviews                                  │
│  A12 runs concurrent with A9 interviews                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Test Cards

#### A11: Founder Narrative Value

| Field               | Value                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| **We believe**      | Founders will find AI-generated pitch narratives valuable enough to share with investors                      |
| **To verify**       | Show narrative mock-ups to 8 founders who completed validation; collect qualitative feedback + sharing intent |
| **We measure**      | Perceived quality (1-5 scale), sharing intent (would/wouldn't share), improvement suggestions                 |
| **We are right if** | ≥6 of 8 rate quality ≥4/5 AND ≥5 of 8 express sharing intent                                                  |
| **We are wrong if** | <4 of 8 rate quality ≥4/5 OR <3 express sharing intent                                                        |
| **Time bound**      | 2 weeks (concurrent with A6 interviews)                                                                       |

#### A12: Portfolio Holder Evidence Package Value

| Field               | Value                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **We believe**      | Portfolio Holders will value dual-format evidence packages (narrative + raw evidence) over narrative alone                        |
| **To verify**       | Show evidence package mock-ups to 8 Portfolio Holders (from A9 interviews); measure perceived value vs. current deal flow sources |
| **We measure**      | Perceived value (1-5), comparison to current sources, willingness to pay premium, specific format preferences                     |
| **We are right if** | ≥5 of 8 rate value ≥4/5 AND ≥4 prefer dual-format over narrative-only                                                             |
| **We are wrong if** | <4 of 8 rate value ≥4/5 OR <3 prefer dual-format                                                                                  |
| **Time bound**      | 2 weeks (concurrent with A9 interviews)                                                                                           |

#### T1: Staleness Detection Accuracy

| Field | Value |
|-------|-------|
| **We believe** | Database triggers correctly detect evidence changes and set appropriate staleness severity |
| **To verify** | Automated test suite covering all trigger scenarios |
| **We measure** | Trigger accuracy (correct state transitions), latency (time from change to stale flag), false positive/negative rates |
| **We are right if** | 100% correct state transitions, <1s trigger latency, 0 false negatives |
| **We are wrong if** | Any false negative (stale narrative served as fresh) or trigger latency >5s |
| **Test type** | Integration test (database) |
| **Time bound** | Must pass before Phase 1 launch |

**Test scenarios**:
- Insert new evidence → soft stale
- Update hypothesis status to 'invalidated' → hard stale
- Fit Score change >0.1 → hard stale
- Fit Score change <0.1 → soft stale (no upgrade)
- Gate passage → hard stale
- Multiple soft changes → remains soft (no auto-escalation)

#### T2: Guardian Alignment Check Accuracy

| Field | Value |
|-------|-------|
| **We believe** | Guardian correctly identifies narrative edits that contradict or overstate evidence |
| **To verify** | Unit test suite with known contradiction scenarios |
| **We measure** | True positive rate (catches contradictions), false positive rate (blocks valid edits) |
| **We are right if** | ≥95% true positive rate, ≤5% false positive rate |
| **We are wrong if** | <90% true positive OR >10% false positive |
| **Test type** | Unit test (Guardian prompt + claim-language mapping) |
| **Time bound** | Must pass before Phase 2 launch |

**Test scenarios**:
- Edit claims "strong demand" with 0 DO-direct evidence → flagged
- Edit claims "positive indicators" with 0 DO-direct evidence → verified
- Edit adds founder context without changing claims → verified
- Edit removes qualifier ("some interest" → "strong interest") → flagged
- Edit with Fit Score 0.8+ using "proven demand" → verified

### E2E Test Structure

**New test file**: `frontend/tests/e2e/42-narrative-layer.spec.ts`

```typescript
// Phase 1: Narrative Generation
test.describe('Narrative Generation', () => {
  test('founder sees prompt when evidence threshold met');
  test('founder generates narrative and sees all 10 slides');
  test('founder exports PDF with verification footer');
  test('public verification URL returns valid status');
  test('narrative shows soft stale after new evidence added');
});

// Phase 2: Evidence Packages & Editing
test.describe('Evidence Packages', () => {
  test('founder enables sharing consent');
  test('founder previews package as Portfolio Holder');
  test('PH views dual-format tabs');
  test('PH sees correct provenance badges');
});

test.describe('Narrative Editing', () => {
  test('founder edits field and sees pending status');
  test('alignment check completes and shows verified');
  test('overstatement edit shows flagged status');
  test('version history shows edit diff');
});

// Phase 3: Marketplace Integration
test.describe('Marketplace Integration', () => {
  test('PH requests more evidence from founder');
  test('founder receives and acts on feedback');
  test('verification endpoint rate limits excessive requests');
});
```

**Anti-patterns to avoid** (per TESTING-GUIDELINES.md):
- No `waitForTimeout()` - use explicit waitFor conditions
- No permissive `if (visible)` guards - assert expected state
- Each test creates fresh data - no inter-test dependencies

### Evidence Gate for Build

| Evidence Type             | Requirement                                              | Weight            |
| ------------------------- | -------------------------------------------------------- | ----------------- |
| Founder quality ratings   | ≥6 of 8 rate ≥4/5                                        | SAY (0.3)         |
| Founder sharing intent    | ≥5 of 8 would share                                      | SAY (0.3)         |
| PH evidence package value | ≥5 of 8 rate ≥4/5                                        | SAY (0.3)         |
| PH dual-format preference | ≥4 of 8 prefer dual-format                               | SAY (0.3)         |
| Prototype narrative test  | ≥1 founder shares generated narrative with real investor | DO-indirect (0.8) |

---

## Implementation Roadmap

### Phase 1: Narrative Generation (Weeks 1-3)

_Aligned with: Portfolio Holder Vision Phase 1 (Founder Launch)_

- [ ] **Infrastructure setup**
  - [ ] Provision Upstash Redis instance
  - [ ] Add UPSTASH_* env vars to Netlify (all contexts)
  - [ ] Install `@react-pdf/renderer` and `qrcode` packages
  - [ ] Verify PDF generation works in Netlify Functions (test memory/timeout)
- [ ] Add `founder_profiles` table to Supabase
- [ ] Add `pitch_narratives` table with editing provenance fields
- [ ] Add `narrative_versions` table for version history
- [ ] Build Founder Profile form component (dashboard)
- [ ] Extend Report Compiler with `narrative_synthesis_task`
- [ ] Implement `PitchNarrative` schema and JSON output
- [ ] Build narrative preview component (Founder Dashboard)
- [ ] Implement soft/hard staleness detection triggers
- [ ] Add PDF export with verification footer (URL + QR code)
- [ ] Implement `/api/verify/{hash}` public endpoint
- [ ] Validate A11 (Founder Narrative Value) concurrent with A6 interviews
- [ ] **Dogfooding checkpoint**: Before Phase 1 launch
  - [ ] Generate narrative for chris00walker@proton.me test founder account
  - [ ] Export PDF and verify verification URL resolves
  - [ ] Preview evidence package as consultant account
  - [ ] Document any UX friction for iteration
- [ ] **Marketing assets**
  - [ ] Implement OG image generation endpoint (`/api/og/evidence-package/[id]`)
  - [ ] Create Cover slide placeholder design (compass motif)
  - [ ] Design "Verified by StartupAI" badge (3 sizes)

### Phase 2: Evidence Packages + Editing (Weeks 4-6)

_Aligned with: Portfolio Holder Vision Phase 2 (Advisor Tier)_

- [ ] Add `evidence_packages` table to Supabase
- [ ] Add `evidence_package_access` table to Supabase
- [ ] Implement `EvidencePackage` schema and assembly task
- [ ] Build dual-format Evidence Package viewer (tabs: Narrative / Evidence / Integrity)
- [ ] Implement RLS policies for evidence package access
- [ ] Build "Preview as PH" feature for founders
- [ ] Integrate Evidence Package with Founder Directory cards
- [ ] Add Evidence Package auto-attachment to connection requests
- [ ] Build narrative editor UI with field-level editing
- [ ] Implement Guardian alignment check for edits (`PATCH /api/narrative/:id/edit`)
- [ ] Add provenance badges to PH view (AI-generated / Founder-edited / Verified / Flagged)
- [ ] **Shareable marketing assets**
  - [ ] Add "Download Assets" modal to Founder Dashboard
  - [ ] Generate shareable Evidence Package cards

### Phase 3: Marketplace Integration (Weeks 7-10)

_Aligned with: Portfolio Holder Vision Phase 3 (Capital Tier + Marketplace)_

- [ ] Validate A12 (PH Evidence Package Value) concurrent with A9 interviews
- [ ] Implement Guardian narrative-evidence integrity checks
- [ ] Build narrative progress update generator (lightweight, Vercel AI SDK)
- [ ] Add "Request More Evidence" flow for Portfolio Holders
- [ ] Build PH feedback mechanism (`evidence_package_access.feedback_areas`)
- [ ] Implement evidence hashing and integrity metadata
- [ ] Add narrative-enhanced Founder Directory cards
- [ ] JSON API export for Capital tier PHs
- [ ] Build narrative version history UI (`GET /api/narrative/:id/versions`)
- [ ] Implement version diff view (`GET /api/narrative/:id/versions/:version/diff`)
- [ ] Implement `narrative_funnel_events` tracking
- [ ] Implement `package_engagement_events` tracking
- [ ] Build founder analytics dashboard (narrative versions, edit history)

### Phase 4: Feedback Loop + Learning (Weeks 11-14)

_Aligned with: Portfolio Holder Vision Phase 4 (Institutional Tier)_

- [ ] Build PH feedback → Founder notification flow
- [ ] Implement feedback-driven re-validation suggestions
- [ ] Add evidence package analytics (views, duration, feedback requests)
- [ ] Build marketplace quality metrics dashboard
- [ ] Implement A/B testing for narrative formats
- [ ] Add narrative evolution insights ("Your Traction slide improved after adding DO evidence")
- [ ] Build comparative context feature (Fit Score in context of stage/industry)
- [ ] Add PH-specific slide highlighting based on investment profile
- [ ] Build marketplace analytics dashboard
- [ ] Implement cohort analysis (early vs late narrative generators)
- [ ] Add verification-to-connection conversion tracking
- [ ] A/B test evidence visual hierarchy effectiveness

---

## Infrastructure Requirements

### New Dependencies

| Dependency | Purpose | Phase Required |
|------------|---------|----------------|
| Upstash Redis | Rate limiting for `/api/verify` endpoint | Phase 1 |
| PDF generation library | Export pitch deck as PDF | Phase 1 |
| QR code library | Verification QR on PDF footer | Phase 1 |

### Environment Variables

Add to Netlify environment (all contexts):

| Variable | Description | Required By |
|----------|-------------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint | Phase 1 |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | Phase 1 |

### PDF Generation Strategy

**Decision required**: Choose PDF generation approach before Phase 1 implementation.

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| `@react-pdf/renderer` | Lightweight, runs in serverless | Limited styling control | **Recommended for Phase 1** |
| Puppeteer/Playwright | Full CSS support | Memory-intensive (1GB+), slow | Phase 4 if needed |
| Modal endpoint | Offloads to existing infra | Cross-repo coordination | Alternative if React-PDF insufficient |

**Phase 1 approach**: Use `@react-pdf/renderer` with `qrcode` package for verification QR. If styling limitations become blockers, escalate to Modal-based generation in Phase 2.

### Database Migration Ordering

Migrations must be applied in this order:

1. `ALTER TABLE projects ADD COLUMN narrative_is_stale...` (add columns to projects)
2. `CREATE TABLE founder_profiles...`
3. `CREATE TABLE pitch_narratives...`
4. `CREATE TABLE narrative_versions...`
5. `CREATE TABLE evidence_packages...`
6. `CREATE TABLE evidence_package_access...`
7. `CREATE FUNCTION mark_narrative_stale()...` (create trigger function)
8. `CREATE TRIGGER...` (attach triggers - must come after function and target tables exist)
9. `CREATE INDEX...` (create indexes last)

**Rollback plan**: If staleness triggers cause performance issues:
```sql
-- Emergency rollback
DROP TRIGGER IF EXISTS evidence_change_stales_narrative ON evidence;
DROP TRIGGER IF EXISTS hypothesis_change_stales_narrative ON hypotheses;
-- ... (drop all triggers)
DROP FUNCTION IF EXISTS mark_narrative_stale();
```

### Cross-Repo Coordination

Add to `docs/work/cross-repo-blockers.md`:

| Blocker | Repo | Description | Required By |
|---------|------|-------------|-------------|
| `narrative_synthesis` run type | startupai-crew | Add to Modal `/kickoff` endpoint | Phase 1 |
| `evidence_package_task` | startupai-crew | Add to Report Compiler | Phase 2 |
| `narrative_integrity_check` | startupai-crew | Add to Guardian | Phase 2 |

---

## Design Considerations

### What This Is NOT

| Not This                                    | Why                                                             |
| ------------------------------------------- | --------------------------------------------------------------- |
| A "pitch deck builder" like Canva/Slidebean | Those help make slides; we generate the _case_ from evidence    |
| A static document generator                 | Narratives are living, stale-aware, and re-renderable           |
| A replacement for founder storytelling      | The generated narrative is a starting point, not the final word |
| A replacement for Strategyzer artifacts     | Both formats coexist; neither replaces the other                |

### Critical Design Decisions

| Decision                               | Resolution                                   | Rationale                                                    |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| New agent vs. extended Report Compiler | Extended Report Compiler                     | No new data sources needed; narrative is a rendering concern |
| Narrative format                       | JSON (renderable) + PDF (exportable)         | JSON enables dynamic rendering; PDF enables sharing          |
| Staleness model                        | Trigger-based (evidence change → stale flag) | Prevents serving outdated narratives                         |
| Evidence Package access                | Founder consent required + RLS               | Privacy, trust, GDPR alignment                               |
| Guardian extension                     | Add integrity checking to existing role      | Avoids new agent; leverages existing governance architecture |
| Friendship Loop                        | Reframe as evidence-pre-warming, not replace | StartupAI inverts the traditional dynamic                    |

---

## Resolved Design Questions

### Founder Narrative Editing — Provenance Model

**Resolution**: Allow editing with provenance tracking and alignment verification.

Founder editing serves a legitimate purpose: adding **context and voice** that the AI cannot infer. A founder might rephrase "8 interviews indicated interest" as "We spoke with 8 operations managers at mid-market logistics companies, all of whom described this pain as their top priority." That's context enrichment, not fabrication.

**Implementation**:

1. **Preserve baseline**: The original AI-generated narrative is stored as `baseline_narrative`
2. **Track edits**: Founder modifications create `edited_narrative` with diff tracking
3. **Guardian alignment check**: Runs on edited version, flags divergence from evidence
4. **Provenance badges**: PHs see clear indicators of narrative state

| Badge | Meaning | Color |
|-------|---------|-------|
| "AI-generated" | Unmodified original AI draft | Neutral |
| "Founder-edited · All claims supported" | Edits pass Guardian check | Green |
| "Founder-edited · Review suggested" | Edits diverge from evidence | Amber |

The amber flag doesn't imply fraud — it signals the PH should review the Evidence tab to understand what context the founder added. This preserves founder agency while maintaining PH trust.

**What Guardian catches**:
- Claiming "strong product-market fit" when Fit Score is 0.45
- Stating revenue figures not in evidence
- Overstating experiment success rates

**What Guardian allows**:
- Contextualizing who interviewees were
- Adding industry-specific language
- Adjusting tone and voice
- Including founder perspective on findings

### Narrative Quality in Fit Score — No

**Resolution**: Narrative quality should NOT factor into Fit Score.

Fit Score measures **validation rigor** (evidence quality, hypothesis testing, DO/SAY balance). Narrative quality is a **communication concern**, not a validation concern. Conflating them creates perverse incentives — founders optimizing for "narrative score" rather than evidence collection.

Variance in narrative quality is **acceptable signal**. A founder with strong DO evidence naturally produces a compelling Traction slide. A founder with weak SAY evidence produces a thin one. This reflects underlying validation state accurately.

If narrative quality matters for marketplace ranking (Phase 4+), create a separate "Communication Score" or "Pitch Readiness" metric. Keep Fit Score pure.

### Team Slide Data — Optional

**Resolution**: Team slide data is optional. Don't gate narrative generation on incomplete founder profile.

If `founder_profiles` data is missing, the Team slide generates with:
- Basic info from `user_profiles` (name, email)
- HITL coachability signal (always available from checkpoint data)
- `evidence_gap` field: "Founder profile incomplete — add professional background for stronger Team slide"

This encourages profile completion without blocking narrative generation.

### Financial Projections — Unit Economics Only

**Resolution**: Evidence Packages include Ledger unit economics but not full financial models.

Ledger produces validated unit economics (CAC, LTV, margins, pricing rationale). Full 5-year financial projections are:
- Not validated by the VPD methodology
- Often founder-generated speculation
- Outside the "re-rendering existing evidence" principle

If founders want financial projections in their pitch, they can add them to the exported PDF manually. The Evidence Package maintains integrity by including only methodology-verified data.

### Narrative Re-generation Cost — Acceptable

**Resolution**: Estimated ~3.5K tokens per narrative generation is acceptable.

- Input: ~2K tokens (evidence summary, VPC, customer profile, experiment results)
- Output: ~1.5K tokens (full PitchNarrative JSON)
- Cost at current rates: ~$0.01-0.02 per generation

This is negligible compared to the full CrewAI pipeline cost. Regeneration on evidence change is economically viable.

---

## Open Questions

| Question                                                     | Status           | Notes                                                            |
| ------------------------------------------------------------ | ---------------- | ---------------------------------------------------------------- |
| Should PH-specific narrative highlighting exist?             | **Phase 4**      | UI guides attention based on PH profile; narrative stays same    |
| Should comparative context show founder percentiles?         | **Phase 4**      | Context without ranking preferred; needs data volume             |
| What staleness threshold triggers hard vs soft notification? | **Needs tuning** | Initial thresholds defined; may need adjustment based on usage   |

---

## Decision Log

| Date       | Decision                                                              | Rationale                                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-04 | **Narrative Layer** as Report Compiler extension, not new agent       | No new data sources; narrative is output rendering                                                                                                                                        |
| 2026-02-04 | **Dual-format Evidence Package** (narrative + methodology)            | Narrative gets attention; evidence earns trust                                                                                                                                            |
| 2026-02-04 | **10-slide framework** adapted from _Get Backed_                      | Proven investor communication structure; maps cleanly to existing outputs                                                                                                                 |
| 2026-02-04 | **Staleness detection** via database triggers                         | Prevent outdated narratives from being served to PHs                                                                                                                                      |
| 2026-02-04 | **Guardian integrity extension**                                      | Evidence trust contract requires verification                                                                                                                                             |
| 2026-02-04 | **A11 + A12 test cards** concurrent with existing assumption sequence | Efficient validation; doesn't add timeline                                                                                                                                                |
| 2026-02-04 | **Friendship Loop reframed** as evidence-pre-warming                  | StartupAI inverts traditional relationship building                                                                                                                                       |
| 2026-02-04 | **10-slide sequence corrected** per _Get Backed_ canonical order      | Opportunity (market size/timing) distinct from Customer (persona/segments); Team before Use of Funds builds credibility before the ask; Cover is title card, not one of the essential ten |
| 2026-02-04 | **Founder editing allowed** with provenance model                     | Editing adds context/voice; Guardian alignment check catches misrepresentation; provenance badges maintain PH trust                                                                       |
| 2026-02-04 | **Narrative quality NOT in Fit Score**                                | Fit Score measures validation rigor; narrative quality is communication concern; conflating creates perverse incentives                                                                   |
| 2026-02-04 | **Soft/hard staleness thresholds**                                    | Not all evidence changes are equal; prevents perpetual staleness UX friction; appropriate urgency for each change type                                                                    |
| 2026-02-04 | **External sharing integrity** via verification URLs                  | Maintains integrity when PDF exported; creates lead capture for external investors; QR code links back to platform                                                                        |
| 2026-02-04 | **Narrative version history** for founder learning                    | Reinforces validation→pitch quality connection; shows founders how evidence improvements strengthen narrative                                                                             |
| 2026-02-04 | **Team slide optional**                                               | Don't gate narrative generation on incomplete founder profile; evidence gaps are features not blockers                                                                                    |
| 2026-02-04 | **Financial projections excluded** from Evidence Package              | Only methodology-verified data included; full projections are speculation outside VPD scope                                                                                               |

---

## Glossary

| Term                             | Definition                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Narrative Layer**              | Architecture component that re-renders VPD validation evidence into investor-optimized storytelling format                                       |
| **Pitch Narrative**              | 10-slide structured narrative generated from validation evidence. JSON schema renderable in dashboard and exportable as PDF                      |
| **Evidence Package**             | Dual-format artifact combining pitch narrative (storytelling) with raw Strategyzer artifacts (methodology). Shared with Portfolio Holders        |
| **Staleness**                    | State where source evidence has changed since narrative was last generated. Triggers re-generation                                               |
| **Soft Stale**                   | Minor evidence change (e.g., +1 interview). Informational — regeneration suggested but not required                                              |
| **Hard Stale**                   | Material evidence change (e.g., gate passed, Fit Score >0.1 delta). Regeneration strongly encouraged                                             |
| **Integrity Hash**               | SHA-256 hash of all evidence data in a package. Detects tampering or inconsistency                                                               |
| **Evidence Pre-Warming**         | StartupAI's adaptation of the Friendship Loop where validated evidence substitutes for traditional relationship-building before investor contact |
| **Narrative-Evidence Alignment** | Guardian check verifying that narrative claims are supported by underlying validation data                                                       |
| **Baseline Narrative**           | The original AI-generated narrative, preserved unchanged when founder makes edits. Used for alignment verification                               |
| **Provenance Badge**             | Visual indicator showing narrative state: "AI-generated", "Founder-edited · Verified", or "Founder-edited · Flagged"                             |
| **Verification URL**             | Public URL (`app.startupai.site/verify/{hash}`) that validates an exported PDF's integrity and freshness                                         |
| **Narrative Version**            | Historical snapshot of a narrative, created when regeneration occurs. Enables founder learning through evolution tracking                        |
| **DO-Evidence**                  | Behavioral evidence (actions taken by customers). Weight: 1.0 (direct) or 0.8 (indirect)                                                         |
| **SAY-Evidence**                 | Stated preferences or intentions from interviews/surveys. Weight: 0.3                                                                            |

---

## References

- [Portfolio Holder Vision](portfolio-holder-vision.md) — Parent specification for marketplace architecture
- [Pricing Specification](pricing.md) — Canonical pricing source
- [VPD Methodology](../../startupai-crew/docs/master-architecture/03-methodology.md) — Validation methodology
- [API Contracts](../../startupai-crew/docs/master-architecture/reference/api-contracts.md) — Existing API endpoints
- [Database Schemas](../../startupai-crew/docs/master-architecture/reference/database-schemas.md) — Current Supabase schema
- [Product Artifacts](../../startupai-crew/docs/master-architecture/reference/product-artifacts.md) — Smart canvas architecture
- [Approval Workflows](../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) — HITL checkpoints
- _Get Backed: Craft Your Story, Build the Perfect Pitch Deck, and Launch the Venture of Your Dreams_ — Baehr & Loomis, HBR Press, 2015

---

## Changelog

| Date       | Version | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-04 | 1.0     | Initial specification: narrative layer architecture, 10-slide mapping, evidence packages, database schema, API contracts, test cards, implementation roadmap                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-02-04 | 1.1     | **Framework correction**: Corrected 10-slide sequence per _Get Backed_ to: Overview, Opportunity, Problem, Solution, Traction, Customer, Competition, Business Model, Team, Use of Funds. Cover page separated as title card (not one of the essential ten). Opportunity and Customer now distinct slides (previously combined as "Customer/Market"). Team moved to slide 9, Use of Funds to slide 10. Updated TypeScript schema (`summary` → `overview`, `customer_market` split into `opportunity` + `customer`), PH wireframe, and CrewAI task config. |
| 2026-02-04 | 1.2     | **Design resolutions**: (1) Resolved founder editing with provenance model — allow editing, preserve baseline, Guardian alignment checks, provenance badges for PHs. (2) Resolved narrative quality — NOT in Fit Score; variance is acceptable signal. (3) Added soft/hard staleness thresholds to prevent UX friction. (4) Added external sharing integrity with verification URLs and QR codes. (5) Added narrative version history for founder learning. (6) Resolved Team slide as optional. (7) Resolved financial projections excluded from Evidence Package. Added `narrative_versions` table, updated `pitch_narratives` schema with editing provenance fields, added `/api/verify/{hash}` endpoint. |
| 2026-02-04 | 1.3     | **Design Rationale section**: Added comprehensive rationale documenting the Get Backed inspiration, translation gap insight, CrewAI output mapping, Friendship Loop inversion (democratizing access to capital), dual-format moat analysis, narrative velocity concept, and explicit risk acknowledgment (narrative quality ≠ validation quality). |
| 2026-02-04 | 1.4     | **Leadership team review**: Incorporated feedback from Product Strategist, Domain Expert VPD, and System Architect. Changes: (1) Fixed all FK references to use `user_profiles(id)` per codebase convention. (2) Added supporting indexes for RLS policies and JSONB queries. (3) Added claim-language mapping table for Guardian validation. (4) Added pivot narrative handling to celebrate validated learning. (5) Added verification endpoint security (UUID token, rate limiting, response sanitization). (6) Added evidence visual hierarchy specifications for DO/SAY display. |
| 2026-02-04 | 1.5     | **Full team review integration**: Incorporated feedback from 8 additional team members. Changes: (1) Added 7 missing TypeScript interfaces and evidence classification note. (2) Consolidated status indicators, added first-run experience and regeneration UX. (3) Added user-facing terminology mapping, empty states, and tagline guidance. (4) Added founder profile API, async Guardian checks, and missing staleness triggers. (5) Added technical test cards T1/T2, E2E test structure, and dogfooding checkpoint. (6) Added Infrastructure Requirements section with dependencies and migration ordering. (7) Added analytics tables, Success Metrics section, and funnel definitions. (8) Added Table of Contents, Error Response Schema, and accessibility requirements. |
