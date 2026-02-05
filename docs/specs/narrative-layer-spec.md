# Specification: Narrative Layer Architecture

**Status**: Draft v3.3 | **Updated**: 2026-02-05 | **Owner**: product-strategist
**Depends On**: `portfolio-holder-vision.md` v3.0, `03-methodology.md`, `02-organization.md`
**Approved By**: Pending Founder Review

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Rationale](#design-rationale)
3. [Problem Statement](#problem-statement)
4. [The 10-Slide Narrative Framework](#the-10-slide-narrative-framework)
5. [Beyond Architecture: Story, Design, and Text](#beyond-architecture-story-design-and-text)
6. [Generation Prerequisites](#generation-prerequisites)
7. [Narrative Publication](#narrative-publication)
8. [Narrative Layer Architecture](#narrative-layer-architecture)
9. [Database Schema Additions](#database-schema-additions)
10. [API Contracts](#api-contracts)
11. [Friendship Loop Integration](#friendship-loop-integration)
12. [Dual-Format Evidence Package Design](#dual-format-evidence-package-design)
13. [Evidence Integrity System](#evidence-integrity-system)
14. [Frontend Components](#frontend-components)
15. [CrewAI Report Compiler Modifications](#crewai-report-compiler-modifications)
16. [Validation Requirements](#validation-requirements)
17. [Implementation Roadmap](#implementation-roadmap)
18. [Design Considerations](#design-considerations)
19. [Resolved Design Questions](#resolved-design-questions)
20. [Open Questions](#open-questions)
21. [Decision Log](#decision-log)
22. [Glossary](#glossary)
23. [References](#references)
24. [Changelog](#changelog)

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

**Purpose**: Capture attention, set the tone, and create "white space" for the founder to express gratitude, show passion, and mention mutual connections during a live pitch.

| Field             | Source                             | Generation Method                             |
| ----------------- | ---------------------------------- | --------------------------------------------- |
| Venture Name      | `entrepreneur_briefs.company_name` | Direct pull                                   |
| Tagline           | Sage synthesis                     | Generate from VPC core value proposition      |
| Logo              | Founder upload                     | Optional; placeholder pattern if absent       |
| Hero Image        | Founder upload                     | Optional; product/customer in action          |
| Document Type     | Fixed value                        | "Investor Briefing" (default)                 |
| Presentation Date | Generated                          | Current date when narrative generated         |
| Contact Info      | `user_profiles` + `founder_profiles` | Direct pull (see note below)                |

**Contact Info Data Sources**:
- `email`: From `user_profiles.email` (NOT `auth.users` - the user_profiles table stores email directly)
- `linkedin_url`: From `founder_profiles.linkedin_url`
- `website_url`: Founder-provided, stored in `founder_profiles` (field TBD - consider adding `company_website` column)
- `founder_name`: From `user_profiles.full_name`

**Quality Checks** (per *Get Backed*):
- Does the cover make you want to open the pitch deck?
- Does the cover visual communicate what the product is or who it serves?
- Is the logo clean and professional (the "face of the brand")?
- Is there an inviting picture of the product or customer?

**Narrative function**: First impression. Must communicate "what we do" in ≤10 words. This is the title card — it sets the stage but is not counted among the essential ten.

**Generation prompt context**: Sage receives the complete VPC and generates a tagline that connects the primary customer pain to the primary gain creator in plain language. No jargon. No buzzwords.

**Tagline tone guidance**: Use active verbs and specific outcomes. The founder's voice should feel present.
- Good: "Reduce last-mile delivery costs by 40%"
- Good: "Help mid-market retailers compete with Amazon on speed"
- Avoid: "The future of logistics"
- Avoid: "AI-powered supply chain optimization"

#### Slide 1: Overview

**Purpose**: Your "elevator pitch" — the fifteen-second version of your deck. It describes a problem you see in the world and how you are going to solve it. Give your audience a small taste of what your company does, but leave them hungry for more.

| Field                | Source              | Generation Method                                  |
| -------------------- | ------------------- | -------------------------------------------------- |
| `one_liner`          | Sage synthesis      | Single sentence: "We do X for Y by Z"              |
| `thesis`             | Sage synthesis      | 3-sentence narrative arc (Problem → Solution → Evidence) |
| `industry`           | Founder input       | What industry are you in?                          |
| `novel_insight`      | Sage synthesis      | What's unique/audacious about this approach?       |
| `key_metrics`        | Validation Agent    | Top 3 evidence data points (traction proof)        |
| `ask` (optional)     | Founder input       | Amount, instrument, use summary                    |

**What to demonstrate**:

1. **Clarity** — It should be extremely easy to understand what the company does.
2. **Swagger** — Startups are bold, audacious undertakings. Your summary of the venture should demonstrate that you have the energy and the confidence to take on something big.
3. **Passion** — If you don't care about what you're doing, no one else will.

**Quality checks** (questions this slide must answer):

- What exactly does your company do? → `one_liner` answers this
- What industry are you in? → `industry` field
- Is this a novel idea? → `novel_insight` field

**Structure**: [Problem in the world] → [Our unique approach] → [Evidence it works] → [What we need next].

**Generation prompt context**: Sage synthesizes across all agent outputs:

- `one_liner`: Extremely clear single sentence distilling the entire venture
- `thesis` Sentence 1 = problem severity (from Pulse)
- `thesis` Sentence 2 = solution uniqueness (from Forge + VPC)
- `thesis` Sentence 3 = traction evidence (from Validation Agent DO-data)
- `novel_insight`: What makes this approach different from obvious solutions?

#### Slide 2: Opportunity

**Purpose**: The 40,000-foot picture of your product's space. Describe your industry and how your business will work within it — trends, market size, and growth potential. You want investors to see the trends and market conditions that will give you an entrance into the market and a competitive position. If your audience agrees with you on how things actually are right now, they will be open to the particular problems and solutions you describe.

| Field                    | Source               | Generation Method                            |
| ------------------------ | -------------------- | -------------------------------------------- |
| `tam`                    | Pulse market sensing | Total Addressable Market                     |
| `sam`                    | Pulse market sensing | Serviceable Addressable Market               |
| `som`                    | Pulse market sensing | Serviceable Obtainable Market                |
| `growth_trajectory`      | Pulse                | Market growth rate + timing                  |
| `why_now`                | Sage synthesis       | Macro trends enabling this venture           |
| `market_tailwinds`       | Pulse                | Regulatory, technological, behavioral shifts |
| `market_confusion`       | Pulse + Sage         | Ambiguity/fragmentation creating opportunity |

**What to demonstrate**:

1. **Explosive market sectors** — By explosive, we mean growing very, very fast. The faster your market is growing, the bigger the opportunity for your venture will be.
2. **Confusion and ambiguity in the market** — A lack of clarity allows ventures to easily differentiate themselves from others.
3. **Thoroughness** — This slide is proof that you have done some serious research and really understand the market better than your audience does.

**Quality checks** (questions this slide must answer):

- What trends is your company riding? → `why_now`, `market_tailwinds`
- How big is the market? → `tam`, `sam`, `som`
- How big can your company be? → `som` + `growth_trajectory`
- What are the macro- and micro-trends that your company will be riding? → `market_tailwinds`

**Data source detail**:

- `market_sensing.tam`, `market_sensing.sam`, `market_sensing.som` → market sizing
- `market_sensing.growth_trajectory` → trajectory
- Sage synthesizes macro context from Pulse market data into a "why now" narrative
- Pulse identifies market fragmentation/confusion that creates differentiation opportunity

#### Slide 3: Problem

**Purpose**: Entrepreneurship, at its core, is about solving problems. The bigger the problem, the better. Describe the problem you are solving and how and why that problem is painful. Your audience should feel as if an injustice has been done. In a meeting, you'll know if your problem hits home when investors begin nodding their heads in agreement.

Describe the problem at a high level first and then quickly transition to a specific story of a customer to make the problem personal. People don't empathize with big, general problems; they empathize with the struggles of specific people with names and faces.

_Note: Not all companies solve new problems; some focus on solving age-old problems in a way that changes customer preferences (apparel, restaurants, consumer goods). For these ventures, focus more on Opportunity (Slide 2) rather than Problem._

| Field                  | Source                    | Generation Method                      |
| ---------------------- | ------------------------- | -------------------------------------- |
| `primary_pain`         | `customer_profiles.pains` | Top-ranked pain by severity            |
| `pain_narrative`       | Sage synthesis            | High-level description of the injustice |
| `affected_population`  | Pulse + Validation        | Large, specific number of people affected |
| `customer_story`       | Validation Agent          | Specific person's experience (name, face, struggle) |
| `why_exists`           | Sage synthesis            | Root cause — why does this problem persist? |
| `status_quo`           | Competitor Analyst        | How is it currently being addressed?   |
| `severity_score`       | Validation Agent          | 0-1 quantified pain validation score   |
| `evidence_quotes`      | Validation Agent          | Top 3 interview quotes illustrating pain |

**What to demonstrate**:

1. **A big problem in a big market** — Provide a very large and specific number of people who feel the pain of this problem every day.
2. **Deep understanding** — Confidently and empathetically display how well you understand the complex market dynamics surrounding the problem.
3. **A specific person** — Consider presenting the problem by telling a short story of a real person and how he/she experiences the problem.

**Quality checks** (questions this slide must answer):

- What is the problem? → `primary_pain`, `pain_narrative`
- How big is the problem? → `affected_population`
- Why does the problem exist? → `why_exists`
- How is the problem currently being addressed? → `status_quo`

**Data source detail**:

- `customer_profiles.pains[]` → ranked by severity score
- `evidence[]` where `evidence_type = 'interview'` → pull verbatim quotes illustrating pain
- `gate_scores.desirability` → quantified pain validation score
- Customer story synthesized from interview evidence with real names/details (with founder approval)

#### Slide 4: Solution

**Purpose**: By this point, you and your audience agree on what is happening in the industry and you have introduced a huge problem. Now, it is time to pull out all the stops. Show them your magic, your one-of-a-kind solution to the problem. You want the investors to marvel at it.

Develop use cases to demonstrate how your customer will be delighted with your solution. Make your solution as realistic and interactive as possible. Short (1-3 minute) videos, illustrations, screenshots, pictures, prototypes, samples, sketches, or demos are all great ways to show rather than tell your solution.

**Never use bullet points for your solution slide!**

| Field                       | Source             | Generation Method                          |
| --------------------------- | ------------------ | ------------------------------------------ |
| `value_proposition`         | VPC                | Pain Relievers + Gain Creators → narrative |
| `how_it_works`              | Forge feasibility  | Technical approach in plain language       |
| `key_differentiator`        | Competitor Analyst | Unique positioning vs. alternatives        |
| `use_cases`                 | Validation Agent   | Real customer delight scenarios            |
| `demo_assets`               | Founder input      | URLs to videos, screenshots, prototypes    |
| `ip_defensibility`          | Founder input      | Patents, trade secrets, moats              |
| `fit_score`                 | Validation Agent   | `fit_scores.problem_solution_fit`          |

**What to demonstrate**:

1. **Beauty** — There should be an element of elegance to your solution. It should feel like the way things should be.
2. **Surprise** — Your solution should feel like nothing your audience has ever seen.
3. **Repeatable and Scalable** — It should be evident that what you are building can be replicated across the market.
4. **Solving something painful** — It should be clear that your solution relieves a persistent pain point the customer currently experiences.
5. **Team excellence** — This is your chance to brag and show off that you have an awesome team that has built something that delights.

**Quality checks** (questions this slide must answer):

- Does it solve the customer's problems like magic? → `value_proposition`, `use_cases`
- Is the customer going to crave this product? → `use_cases`, `demo_assets`
- What will the customer's life be like once the problem is solved? → `use_cases`
- How are you going to pull this off? → `how_it_works`, `ip_defensibility`
- Is it awesome? → `demo_assets`, overall presentation

**Narrative function**: Show how the solution directly addresses the problem from Slide 3. The connection must be explicit and evidence-backed.

#### Slide 5: Traction

**Purpose**: Demonstrate that each of your assumptions about the venture is proving true and you are making significant progress. The most common way to show traction is through growing sales or users — the "hockey-stick" graph — but you can also focus on other key metrics you have identified.

Investors don't want to feel that a venture needs them. Traction helps convince an investor that the idea is going to be a success no matter what.

_Note: If you are pre-product and don't have meaningful milestones or metrics, use this slide to illustrate your sales and marketing strategy instead._

| Field                    | Source             | Generation Method                      |
| ------------------------ | ------------------ | -------------------------------------- |
| `evidence_summary`       | Sage synthesis     | Narrative summary of all evidence      |
| `growth_metrics`         | Validation Agent   | Key metrics with trend data (hockey-stick) |
| `assumptions_validated`  | Validation Agent   | Which assumptions are proving true     |
| `sales_process`          | Founder input      | How you attract, educate, qualify, close, service |
| `do_direct`              | Validation Agent   | Weight 1.0 evidence (paying customers, contracts) |
| `do_indirect`            | Validation Agent   | Weight 0.8 evidence (LOIs, signups, usage) |
| `say_evidence`           | Validation Agent   | Weight 0.3 evidence (interviews, surveys) |
| `interview_count`        | Evidence table     | Count of interview evidence            |
| `experiment_count`       | Validation Agent   | Number of completed experiments        |
| `hitl_completion_rate`   | Approval workflows | Checkpoints completed / total          |

**What to demonstrate**:

1. **A pattern of fast-growing momentum** — The hockey-stick graph. Show acceleration, not just growth.
2. **Clarity around what you are measuring and why it matters** — Don't just show numbers; explain why these metrics prove the business works.
3. **A clear sales process** — How you attract, educate, qualify, close, and provide after-sale service for your customers.

**Quality checks** (questions this slide must answer):

- Is there massive growth? → `growth_metrics`
- Where are the venture's assumptions proving true? → `assumptions_validated`, `experiment_count`
- What is the strategy to reach and close more customers? → `sales_process`

**Narrative function**: This is StartupAI's **killer differentiator**. Traditional pitch decks claim traction with vanity metrics. StartupAI provides methodology-verified behavioral evidence. The narrative must frame this distinction explicitly.

**Evidence hierarchy** (display in this order):

1. DO-direct evidence (weight 1.0): Paying customers, signed contracts
2. DO-indirect evidence (weight 0.8): LOIs, waitlist signups, prototype usage
3. SAY evidence (weight 0.3): Interview responses, survey data

#### Slide 6: Customer

**Purpose**: Demonstrate how well you know your customers and the market they represent. Describe where they live, what they like to do, and how much they'd be willing to spend. If you already have sales, use those as examples. Also describe the market — how many potential customers are out there who will want to buy your product.

| Field                    | Source              | Generation Method                        |
| ------------------------ | ------------------- | ---------------------------------------- |
| `segments`               | `customer_profiles` | Customer segment definitions             |
| `persona_summary`        | Customer Profile    | Describe the person vividly (reminds of someone they know) |
| `demographics`           | Customer Profile    | Where they live, what they do            |
| `willingness_to_pay`     | Validation Agent    | How much they'd spend                    |
| `market_size`            | Pulse               | How many people fit this description     |
| `target_percentage`      | Sage synthesis      | What % you expect to buy (0-1)           |
| `target_first`           | Sage synthesis      | Which segment you will target first      |
| `acquisition_channel`    | Founder input       | How will you reach them?                 |
| `acquisition_cost`       | Founder input / Validation | CAC estimate                      |
| `paying_customers`       | Validation Agent    | Existing revenue proof (if any)          |
| `behavioral_insights`    | Validation Agent    | Interview-derived patterns               |
| `segment_prioritization` | Sage synthesis      | Which segment first and why              |

**What to demonstrate**:

1. **The Customer** — Describe the person in a way that reminds listeners of someone they know.
2. **A clearly defined market** — Give specific numbers for how many people fit your customer description. Include how many might buy, what percentage you expect to buy, and which ones you will target first.
3. **Revenue** — It's much easier to argue there's demand for your product if you have paying customers.

**Quality checks** (questions this slide must answer):

- Who is your customer(s)? → `persona_summary`, `demographics`
- How will you reach the customer? → `acquisition_channel`
- What is the acquisition cost per customer? → `acquisition_cost`
- Is your customer willing to pay for your product or service? → `willingness_to_pay`, `paying_customers`

**Narrative function**: Show the investor _who specifically_ the product serves. This is the "do you know your customer?" slide. Separated from Opportunity (Slide 2) because Customer answers "for whom?" while Opportunity answers "how big?"

**Data source detail**:

- `customer_profiles.jobs[]` → Jobs-to-be-done
- `customer_profiles.pains[]` + `customer_profiles.gains[]` → full persona
- `evidence[]` where `evidence_type = 'interview'` → behavioral patterns from primary research

#### Slide 7: Competition

**Purpose**: Every venture has competition. Every venture. Your customers must be doing something right now to cope with the problem you solve — that "something" is your competitor. List competitors and describe how each competes in the market. Then show what differentiates you and what advantage you have over them.

Many founders find it helpful to create a map of the competitive landscape, using important aspects of the product as x and y axes (e.g., "cost" on x-axis, "value" on y-axis). By doing this, you visually demonstrate how your product differentiates itself from other players in the market.

| Field                   | Source             | Generation Method                         |
| ----------------------- | ------------------ | ----------------------------------------- |
| `primary_competitors`   | Competitor Analyst | Direct competitors, how they compete      |
| `secondary_competitors` | Competitor Analyst | Indirect alternatives                     |
| `potential_threats`     | Sage synthesis     | Unknown/potential competitors with better advantage |
| `positioning_map`       | Competitor Analyst | 2x2 quadrant visualization (x/y axes)     |
| `differentiators`       | Competitor Analyst | What makes you different enough to compete |
| `unfair_advantage`      | Sage synthesis     | Partnerships, IP, expertise, processes, networks |
| `incumbent_defense`     | Sage synthesis     | Why won't they rip you off and roll out faster? |

**What to demonstrate**:

1. **Industry Knowledge** — You should know your competitors and their unique advantages and disadvantages.
2. **Sober judgment** — Entrepreneurs caught up in the brilliance of their own ideas might miss major warning signs. Investors want to know whether you are underestimating the threat of competition.
3. **Differentiation** — Is it clear that you are different enough to compete?
4. **Unique advantage** — What is your specific advantage over your competitors?

**Quality checks** (questions this slide must answer):

- Who are your primary and secondary competitors? In what ways do they compete for your customers? → `primary_competitors`, `secondary_competitors`
- Are there unknown or potential competitors with better advantage if they entered? → `potential_threats`
- Do you displace commonly used companies? → `primary_competitors`
- How will you disrupt the current competitive landscape? Are you faster, cheaper, better? → `differentiators`, `positioning_map`
- Why won't an incumbent rip your product off and roll it out faster than you can? → `incumbent_defense`, `unfair_advantage`

**Narrative function**: Position against alternatives honestly. Investors respect founders who understand their competitive landscape rather than claiming "no competition."

#### Slide 8: Business Model

**Purpose**: Showing how the business makes money is simpler than you think. A solid financial model answers: 1) How much does it cost to acquire a customer? 2) How much cash will you make from that customer over their lifetime? 3) How do your costs break down, per unit and on a monthly basis?

Pre-revenue companies may make up assumptions and financials, but that is not an excuse for unrealistic projections. Since the pitch deck is designed to introduce the idea, it's not necessary to show a full-blown financial model with every assumption, sensitivity, and margin analysis. However, it should include gross profit, EBITDA, net income, burn rate, and cash flow.

Equally important: contextualize your math (e.g., "if we get 1% of the market, then we will have hit our revenue projection").

**VPD-verified fields** (included in evidence integrity):

| Field                   | Source         | Generation Method                  |
| ----------------------- | -------------- | ---------------------------------- |
| `revenue_model`         | Ledger         | Narrative description of how money flows |
| `cac`                   | Ledger         | Customer acquisition cost          |
| `ltv`                   | Ledger         | Lifetime value per customer        |
| `ltv_cac_ratio`         | Ledger         | LTV/CAC (should be >3x)            |
| `unit_economics`        | Ledger         | Per-unit cost breakdown            |
| `pricing_strategy`      | Ledger         | Pricing model + rationale          |
| `market_context`        | Sage synthesis | "If we get X% of market..." framing |

**Optional founder-supplied fields** (excluded from evidence integrity hash):

| Field                   | Source         | Generation Method                  |
| ----------------------- | -------------- | ---------------------------------- |
| `monthly_costs`         | Founder input  | Monthly cost breakdown (optional)  |
| `burn_rate`             | Founder input  | Monthly spend rate (optional)      |
| `gross_profit`          | Founder input  | Revenue - COGS (optional)          |
| `ebitda`                | Founder input  | Earnings before interest, taxes, depreciation, amortization (optional) |
| `net_income`            | Founder input  | Bottom line (optional)             |
| `cash_flow`             | Founder input  | Cash in vs. cash out (optional)    |
| `revenue_projections`   | Founder input  | Forward-looking estimates (optional) |
| `path_to_profitability` | Founder input  | Founder's projection to profitability (optional) |

_Note: Per the "Financial Projections — Unit Economics Only" decision, full financial projections are founder-generated and not VPD-validated. They are excluded from the evidence integrity hash but can be included in the narrative for investor presentation._

**What to demonstrate**:

1. **Consistency** — There should be a clear relationship between how costs and revenues grow over time.
2. **Financial literacy** — You know how to think about the financials of a startup.
3. **Level-headedness** — You are not overly optimistic about your projections or too cautious.

**Quality checks** (questions this slide must answer):

- Can you acquire customers for less than a third of their lifetime value? → `ltv_cac_ratio` (should be >3x)
- What is your monthly burn rate — how much money are you spending a month? → `burn_rate`
- Are the revenue projections reasonable? → `revenue_projections`, `market_context`
- Are costs legitimate? → `unit_economics`, `monthly_costs`

**Narrative function**: Show the investor how money flows. Evidence-backed unit economics from Ledger carry more weight than founder projections.

#### Slide 9: Team

**Purpose**: Give the background for each key team member, including their current roles, prior experience, significant accomplishments, and education. If there are major investors or advisers, name them here. Keep your bio to less than a minute total when presenting. Your goals are to build rapport, be known, and build confidence that the team can accomplish the mission.

**Persistence note**: Team data (`members[]`, `advisors[]`, `investors[]`, `team_culture`, `hiring_gaps`) is stored in `pitch_narratives.narrative_data` JSONB, not in separate database tables. The `founder_profiles` table models only the primary founder for basic profile data. Full team composition is edited directly within the narrative via the Pitch Editor UI. This approach supports multi-member teams without schema migration while keeping team data tied to the narrative it appears in.

| Field                    | Source           | Generation Method                           |
| ------------------------ | ---------------- | ------------------------------------------- |
| `members[]`              | Founder input    | Array of team member objects:               |
|   `.name`                |                  | Team member name                            |
|   `.current_role`        |                  | What they do now                            |
|   `.bio`                 |                  | ≤75 words!                                  |
|   `.prior_experience`    |                  | Relevant past roles (array)                 |
|   `.accomplishments`     |                  | Significant achievements (array)            |
|   `.education`           |                  | Relevant degrees/certifications (optional)  |
|   `.domain_expertise`    |                  | Why they have insight to get the job done   |
|   `.linkedin_url`        |                  | LinkedIn profile (optional)                 |
| `advisors[]`             | Founder input    | Array: name, title, relevance (optional)    |
| `investors[]`            | Founder input    | Array: name, firm (optional)                |
| `hiring_gaps`            | Founder input    | Who else needs to be hired (array)          |
| `team_culture`           | Founder input    | What kind of culture you're creating        |
| `coachability_score`     | HITL checkpoints | From checkpoint completion rate + responsiveness |

**What to demonstrate**:

1. **Brevity** — Each bio should be only 75 words or less.
2. **Domain Expertise** — You have the experience and insight to get the job done.
3. **Passion, intensity, and a good team culture** — You know the kind of team culture you are creating and that each person is committed to it.

**Quality checks** (questions this slide must answer):

- Why are you the right people for the job? → `members[].domain_expertise`, `members[].prior_experience`, `members[].accomplishments`
- Is this team sufficient to accomplish the goal? → `members[]`, `advisors[]`, `investors[]`
- Are there others who need to be hired? → `hiring_gaps`

**Narrative function**: Show who is behind the venture. The HITL coachability signal is unique to StartupAI — it provides behavioral evidence that the founder responds to feedback, iterates, and executes. Team precedes Use of Funds because investors back _people_ before they evaluate _budgets_.

**Scaffolding requirement**: The Team slide requires founder self-input not currently collected during onboarding. Add an optional "Founder Profile" section to the dashboard or post-validation flow with fields for: professional background (text, 200 char), domain expertise (tags), previous ventures (optional), LinkedIn URL.

#### Slide 10: Use of Funds

**Purpose**: A good pitch deck has a clear ask of the investor. This is married with an understanding of what the investor gets in return and what the money will be used for. Spell out how you actually plan to use the money you are asking for — what will it give you in terms of resources or achieved milestones?

_Note: Some entrepreneurs like to create slides with exit strategies, acquisition targets, IPOs, etc. Focus on your company instead._

| Field                | Source           | Generation Method                        |
| -------------------- | ---------------- | ---------------------------------------- |
| `ask_amount`         | Founder input    | How much are you raising?                |
| `ask_type`           | Founder input    | SAFE, equity, convertible note, etc.     |
| `allocations[]`      | Validation Agent | How will you spend it? (category, amount, %, experiment) |
| `milestones[]`       | Validation Agent | What will you accomplish? (description, date, criteria) |
| `timeline_weeks`     | Validation Agent | Total runway in weeks                    |
| `other_participants` | Founder input    | Who else is participating in this round? |

**What to demonstrate**:

1. **Clarity** — You specifically and clearly state what the funds will be used for.
2. **Milestones** — You should show what you expect to achieve by the time the money is gone.

**Quality checks** (questions this slide must answer):

- What size and type of investment are you looking for? → `ask_amount`, `ask_type`
- How will you spend it? → `allocations[]`
- What will you accomplish with it? → `milestones[]`
- Who else is likely to be participating in this investment round? → `other_participants[]`

**Narrative function**: The closing slide — show the investor exactly what their capital buys. Framed as validation experiments, not vague "product development" buckets. Placed last because the ask is most compelling _after_ the investor knows the team (Slide 9) and has full context.

**Key innovation**: Traditional "use of funds" slides show pie charts. StartupAI's version shows a **validation experiment roadmap** — each dollar maps to a specific hypothesis being tested, with clear success/failure criteria. This demonstrates founder rigor.

---

## Beyond Architecture: Story, Design, and Text

The 10 essential slides are the building blocks — the architecture of a pitch deck. Most entrepreneurs stop there. But the key elements that transform a deck from a lifeless document that fails to inspire into one of a founder's biggest assets are: **story**, **design**, and **text**.

For perspective, a founder may spend 25% of their time on the architecture and the remaining 75% on these components that really differentiate their deck.

This section covers all three elements: **Story**, **Design**, and **Text**.

---

#### Story

Stories explain, captivate, disturb, and inspire. They can tell us there is something very, very wrong, and they can give us a vision for what we never thought possible. Great stories are about what's true inside all of us. That's what makes them work.

Entrepreneurship is about telling a story that connects the deep needs of a group of people with a repeatable solution. For the founder's deck, stories are the fabric that stitches everything together.

**Three primary uses of story in a pitch:**

1. **To create a narrative arc** that ties your slide deck together
2. **To explain one or more of your slides** with concrete examples
3. **To have as a reservoir** of things to discuss and ways to respond to questions during a conversation

Without the elements of story, your deck is just a bunch of boring slides — whether you're presenting in person or sending the deck to someone to read.

---

#### The Four Story Archetypes

##### 1. The Origin Story

The founder's personal journey to this venture.

**Elements:**

1. You're living life as normal, unaware of anything wrong with the world
2. Suddenly, you have an epiphany and feel a call to adventure
3. You accept the challenge and take bold action
4. That action gives you a new sense of purpose

**Best for:**
- Products or services with high social benefit
- **Effect**: Taps into the audience's desire for meaning

**Maps to slides**: Cover, Team

---

##### 2. The Customer Story

A specific person's transformation through your product.

**Elements:**

1. Meet Joe. Joe has a problem. This problem really bothers Joe
2. Joe tried this and this, but no matter what he does he can't solve his problem
3. Until, one day, Joe finds [your amazing product]
4. Now Joe is so happy, he tells all his friends. Don't you want to be like Joe?

**Best for:**
- Complex products or services
- Customers with dramatic transformation stories
- **Effect**: Explains your venture and its value

**Maps to slides**: Problem, Solution

---

##### 3. The Industry Story

How market shifts create your opportunity.

**Elements:**

1. For a long time, the industry has operated according to a set of assumptions based on the environment it grew up within
2. As a result of specific social, technological, or economic factors, those assumptions are no longer holding true, creating problems for the big players in the industry
3. This change creates a unique opportunity for someone to step in and take advantage of these new circumstances

**Best for:**
- Disruptive products or services
- **Effect**: Shows you know what you are talking about and that the idea could be huge

**Maps to slides**: Opportunity

---

##### 4. The Venture Growth Story

Your traction and momentum.

**Elements:**

1. We took action
2. We got results. We learned from those results and took more action
3. This resulted in unbelievable progress
4. For as much progress that has already been made, the vision for what we can do is bigger

**Best for:**
- Ventures with immediate traction
- **Effect**: Feels like you're on a train headed somewhere big

**Maps to slides**: Competition, Business Model, Traction, Use of Funds

---

#### What Makes a Great Story?

**1. Things happen**

For a story to be a story, things have to happen. Static descriptions aren't stories — they're exposition. Events, actions, and consequences are what drive narrative forward.

**2. Vivid sensory details**

If you want to tell a story, you must start where human knowledge begins: with the senses. As highly educated adults, we like to speak in abstractions — focusing on ideas, concepts, and complex emotions that are the result of thousands of years of philosophy. But to get your audience's attention, you must literally put them into the scene:

- Let them **see** what you see
- Let them **feel** what you feel
- Let them **hear** what you hear

The more vivid the details in your story, the more likely they will stick in the mind of your audience.

**3. Conflict**

Life is about struggle, and stories should be, too. If there is no conflict in your story, the audience won't have anyone to root for. The point of the story is to get people to care.

---

#### Using Story to Craft the Arc of Your Pitch

You'll need to weave your stories through the slides in your pitch. By emphasizing the stories and aspects of your venture that are strongest, you can create an interesting arc that captures the audience's attention.

**Important**: Story arcs are **overlays on the fixed canonical slide order**, not a reordering. The slides always follow the Get Backed sequence (Cover → Overview → Opportunity → Problem → Solution → Traction → Customer → Competition → Business Model → Team → Use of Funds). Story arcs determine which narrative thread you emphasize at each point.

**Story-to-Slide Mapping:**

| Story Type | Slides | When to Emphasize |
|------------|--------|-------------------|
| Origin Story | Cover, Team | High social benefit ventures |
| Industry Story | Opportunity | Disruptive products/services |
| Customer Story | Problem, Solution, Customer | Complex products, dramatic transformations |
| Venture Story | Overview, Traction, Competition, Business Model, Use of Funds | Strong immediate traction |

**Story Arc Overlay (Canonical Order Preserved):**

```
┌─────────────────────────────────────────────────────────────────┐
│  Cover    — ORIGIN STORY: Set the tone with founder's "why"     │
├─────────────────────────────────────────────────────────────────┤
│  1. Overview    — VENTURE STORY: The elevator pitch             │
│  2. Opportunity — INDUSTRY STORY: Market shifts enabling this   │
│  3. Problem     — CUSTOMER STORY: Meet the person suffering     │
│  4. Solution    — CUSTOMER STORY: Their transformation          │
│  5. Traction    — VENTURE STORY: Evidence of momentum           │
│  6. Customer    — CUSTOMER STORY: Who we serve (with faces)     │
│  7. Competition — VENTURE STORY: Our position in landscape      │
│  8. Business Model — VENTURE STORY: How we make money           │
│  9. Team        — ORIGIN STORY: The people behind the purpose   │
│  10. Use of Funds — VENTURE STORY: The next chapter             │
└─────────────────────────────────────────────────────────────────┘
```

**Choosing your lead story**: While all four archetypes appear in a complete pitch, you should decide which one to _emphasize_ based on your venture's strengths:

| Lead With | Best For | Effect |
|-----------|----------|--------|
| Origin Story | High social benefit | Taps into desire for meaning |
| Industry Story | Disruptive products | Shows you know the market; idea could be huge |
| Customer Story | Complex products | Explains venture and its value |
| Venture Story | Strong traction | Feels like a train headed somewhere big |

---

#### StartupAI Story Generation

StartupAI's narrative layer can assist with story generation by:

1. **Origin Story**: Prompting founders for their epiphany moment during onboarding, capturing the "call to adventure"
2. **Customer Story**: Synthesizing interview evidence into a specific customer narrative (with founder approval for using real names/details)
3. **Industry Story**: Using Pulse market sensing data to identify the assumption shifts and macro trends
4. **Venture Story**: Assembling traction evidence into a momentum narrative

**Schema support**: The `customer_story` field in the Problem slide schema directly supports the Customer Story archetype. The `why_now` field in Opportunity supports the Industry Story.

**HITL checkpoint**: Story content should be reviewed by founders before publication — these are deeply personal and strategic choices about how to present the venture.

---

#### Design

Design transforms information into visual communication. A well-designed pitch deck doesn't just look professional — it guides the viewer's attention, reinforces your message, and creates emotional resonance.

**Key Elements:**

##### 1. Layout

The arrangement of elements on each slide. Good layout creates visual hierarchy, guides the eye, and ensures the most important information stands out.

- **Consistency**: Use the same layout patterns across similar slide types
- **White space**: Don't crowd slides — breathing room increases comprehension
- **Visual hierarchy**: Size, position, and contrast indicate importance
- **Grid alignment**: Elements should align to an invisible grid for polish

##### 2. Typography

The fonts and text styling that convey tone and ensure readability.

- **Font pairing**: Typically one font for headlines, one for body text
- **Size hierarchy**: Clear distinction between titles, subtitles, and body
- **Readability**: Large enough to read from the back of the room (or on a phone)
- **Consistency**: Same styling for the same content types throughout

##### 3. Color

Color creates mood, reinforces brand, and directs attention.

- **Brand palette**: 2-3 primary colors plus neutrals
- **Contrast**: Ensure text is readable against backgrounds
- **Meaning**: Use color consistently (e.g., green for positive metrics)
- **Restraint**: Too many colors create visual chaos

##### 4. Images and Photography

Visual content that creates emotional connection and breaks up text.

- **Quality**: High-resolution, professional images only
- **Relevance**: Images should reinforce, not distract from, your message
- **Authenticity**: Real photos of your product/customers beat stock photos
- **Consistency**: Similar style and treatment across all images

##### 5. Visualized Data

Charts, graphs, and diagrams that make numbers compelling.

- **Clarity**: The insight should be immediately obvious
- **Simplicity**: One message per visualization
- **Labels**: Always label axes, include units, cite sources
- **Honesty**: Don't manipulate scales to exaggerate trends

**StartupAI Design Support:**

StartupAI provides design guidance through:
- PDF Brand Guidelines (see [PDF Brand Guidelines](#pdf-brand-guidelines) section)
- Evidence hierarchy color tokens (brand-aligned)
- Methodology Verified Badge specifications
- OG image templates for social sharing

_Note: Founders retain creative control over visual design. StartupAI provides a professional baseline that can be customized._

---

#### Text

The words you choose matter enormously. Text is how you communicate when you're not in the room — and even when you are, the words on screen shape what the audience hears.

**Key Elements:**

##### 1. Writing Style

How you construct sentences and convey information.

- **Clarity over cleverness**: Say what you mean directly
- **Active voice**: "We reduced costs by 40%" not "Costs were reduced by 40%"
- **Concrete over abstract**: Specific examples beat general claims
- **Brevity**: Every word should earn its place

##### 2. Voice and Tone

The personality that comes through in your writing.

- **Voice**: Your consistent personality (confident, thoughtful, bold)
- **Tone**: How voice adapts to context (more formal for financials, warmer for team)
- **Authenticity**: The voice should sound like the founder, not a corporate template
- **Consistency**: Same voice across all slides

##### 3. Format

How text is structured and presented.

- **Headlines**: Clear, compelling, benefit-focused
- **Bullet points**: Parallel structure, consistent punctuation
- **Numbers**: Formatted consistently (e.g., $1.2M not $1,200,000)
- **Emphasis**: Bold for key terms, italics sparingly

##### 4. When Words Are Not Enough

**Your evidence will not speak for itself.** You must find ways to make that evidence compelling and real to your audience.

This is the critical insight: having strong validation data is necessary but not sufficient. The Narrative Layer exists because:

- Raw metrics don't create emotional resonance
- Evidence needs context to be meaningful
- Stories make data memorable
- Investors decide with both logic AND emotion

**Techniques for making evidence compelling:**

| Technique | Example |
|-----------|---------|
| **Anchor with comparison** | "40% faster than the industry average" not just "40% faster" |
| **Make it personal** | "That's $2,400/year back in every customer's pocket" |
| **Use time** | "In just 3 months..." creates momentum |
| **Show transformation** | Before/after comparisons |
| **Quote real people** | Verbatim customer quotes with attribution |

**StartupAI Text Generation:**

The Sage agent synthesizes evidence into narrative text, but founders should:
- Review all generated text for voice/tone alignment
- Add personal anecdotes and specific details
- Ensure claims are supported by the evidence shown
- Edit for their authentic voice

**HITL checkpoint**: All narrative text should be reviewed before publication. Generated text is a starting point, not the final word.

---

#### Pivot Narrative Handling

The VPD methodology treats hypothesis invalidation as valuable learning, not failure. When a founder correctly identifies that a hypothesis is false based on evidence, this demonstrates rigor and founder discipline. The narrative layer must reflect this philosophy.

**When a project has invalidated hypotheses**, the narrative should:

1. **Celebrate the pivot** - Frame invalidations as "validated learning" that strengthened the venture's direction
2. **Show evidence-driven decision making** - Explain what evidence led to the invalidation
3. **Connect to current direction** - Demonstrate how the pivot informed the current strategy

**Example pivot narrative in Overview slide**:

- The `pivot_count` metric captures learning velocity, not failure rate

---

## Generation Prerequisites

This section defines what data must be available before narrative generation can proceed, and how the system handles missing or incomplete founder inputs.

### Minimum Required Evidence

Narrative generation requires a baseline of validated evidence. Without this foundation, the generated narrative would be speculative rather than evidence-backed.

| Requirement | Source | Rationale |
|-------------|--------|-----------|
| Project basics | `projects` table | Venture name, description required for Cover and Overview |
| At least one hypothesis | `hypotheses` table | Narrative must be grounded in testable assumptions |
| Customer profile exists | `customer_profiles` | Problem and Customer slides require persona data |
| VPC populated | `value_proposition_canvases` | Solution slide requires pain relievers and gain creators |

**Generation gate**: If any of these are missing, the `/api/narrative/generate` endpoint returns `INSUFFICIENT_EVIDENCE` error with a list of missing prerequisites.

### Founder-Input Fields

Several narrative fields require founder input that cannot be inferred from validation data. These fields fall into three categories:

#### Required for Generation

These fields must be present before narrative generation can proceed.

| Field | Slide | Reason Required |
|-------|-------|-----------------|
| `company_name` | Cover, Overview | Identity of the venture |
| `industry` | Overview | Investor context |

#### Optional with Placeholder Generation

These fields can be empty. The narrative generates with contextual placeholders that prompt the founder to complete them.

| Field | Slide | Placeholder Behavior |
|-------|-------|---------------------|
| `sales_process` | Traction | Generated text: "Your sales process [to be documented]" |
| `acquisition_channel` | Customer | Generated text: "Customer acquisition approach [to be defined]" |
| `ask_amount` | Use of Funds | Slide marked as incomplete; placeholder: "Investment amount [to be specified]" |
| `ask_type` | Use of Funds | Defaults to "SAFE" with note: "Investment instrument [confirm or update]" |
| `logo_url` | Cover | Uses branded placeholder pattern |
| `hero_image_url` | Cover | Uses branded placeholder pattern |

#### Optional for Narrative Richness

These fields enhance the narrative but are not required. Missing fields do not generate placeholders; the narrative simply omits that content.

| Field | Slide | Effect if Missing |
|-------|-------|-------------------|
| `linkedin_url` | Cover, Team | Contact section omits LinkedIn |
| `ip_defensibility` | Solution | Omitted from generated text |
| `other_participants` | Use of Funds | Omitted from investor list |

### Behavior for Missing Inputs

When founder-input fields are missing, the system follows this decision tree:

1. **Required for generation?** YES -> Block generation; return error with list of missing fields
2. **Affects sharing quality?** YES -> Generate with placeholder; add to evidence_gaps with appropriate blocking_publish flag
3. **Neither?** -> Generate without; omit from narrative

### Evidence Gaps for Missing Inputs

When optional-with-placeholder fields are missing, they are recorded in `metadata.evidence_gaps`:

```json
{
  "metadata": {
    "evidence_gaps": {
      "traction": {
        "gap_type": "missing",
        "description": "Sales process not documented",
        "recommended_action": "Document how you attract, educate, qualify, close, and service customers",
        "blocking_publish": false
      },
      "use_of_funds": {
        "gap_type": "missing",
        "description": "Investment ask amount not specified",
        "recommended_action": "Specify the amount you are raising and investment instrument",
        "blocking_publish": true
      }
    }
  }
}
```

### UI Flow Options

Two approaches for collecting founder inputs before narrative generation.

#### Option A: Pitch Editor Pre-Step (Recommended)

Before generating, prompt founders to review and complete key inputs: company name, industry, investment amount, investment type, and optional sales process.

**Pros**: Narrative starts more complete; founder primed for content
**Cons**: Additional step before generation

#### Option B: Generate First, Prompt to Fill

Generate the narrative with placeholders, then use the Pitch Editor to highlight incomplete sections and prompt founders to complete them.

**Pros**: Founders see immediate value; editing in context
**Cons**: May leave gaps unfilled; publish gate catches later

**Recommendation**: Implement Option B for Phase 1 (faster time-to-value), add Option A as enhancement in Phase 2 based on founder feedback on gap completion rates.

---

## Narrative Publication

This section defines what "publish" means for a narrative and the requirements for transitioning from draft to published state.

### Publication States

A pitch narrative exists in one of two states:

| State | Stored As | Description |
|-------|-----------|-------------|
| **Draft** | `is_published = false` | Can be edited freely; can be shared via evidence packages (with warning); not visible in Founder Directory |
| **Published** | `is_published = true` | Can be shared via evidence packages; visible in Founder Directory if opted in |

**Note on Draft Sharing (Decision Log Task #32)**: Draft narratives CAN be shared via evidence packages to enable early feedback from trusted Portfolio Holders. The UI should display a "Draft - may change" warning badge on packages containing unpublished narratives. Publication (`is_published = true`) is only required for Founder Directory listing visibility, not for direct package sharing.

### State Transitions

- **Draft -> Published**: Passes publish gate + founder HITL approval
- **Published -> Draft**: Founder unpublishes (optional)
- **Edit while published**: Edits are immediately visible; no auto-unpublish

Note: Editing a published narrative does NOT automatically unpublish it. Use HITL review for significant edits (Phase 2+).

### Publication Gate

Before a narrative can be published, it must pass the publication gate. This ensures Portfolio Holders receive quality, complete narratives.

#### Gate Requirements

| Requirement | Check | Blocking? |
|-------------|-------|-----------|
| No blocking evidence gaps | `metadata.evidence_gaps` where `blocking_publish = true` | Yes |
| Alignment check passed | `alignment_status != 'flagged'` | Yes |
| HITL review completed (first publish) | Founder has reviewed and approved | Yes |
| Not hard-stale | `narrative_stale_severity != 'hard'` | Yes |
| Soft-stale acknowledged | Founder acknowledges stale warning | No (warning only) |

#### Blocking Evidence Gaps

The following gaps block publication:

| Gap | Reason |
|-----|--------|
| `ask_amount` missing | Portfolio Holders need to know the investment amount |
| No traction evidence | Narrative claims not backed by validation data |
| Customer segment undefined | Cannot pitch to investors without target customer |

The following gaps warn but do not block:

| Gap | Reason |
|-----|--------|
| `sales_process` missing | Important but not critical for initial sharing |
| Team slide incomplete | Founder profile optional for early-stage |
| Logo/hero image missing | Visual polish, not content quality |

### HITL Review for First Publication

Before a founder can publish their narrative for the first time, they must complete a Human-in-the-Loop review checkpoint.

**Checkpoint Purpose**: Ensure founders have reviewed AI-generated content and take ownership of the narrative they share with investors.

**Checkpoint Flow**:

1. Founder clicks "Publish" for the first time
2. System displays review modal asking founder to confirm they have reviewed all 10 slides for accuracy, verified traction claims match their evidence, added personal context to AI-generated text, and confirmed the investment ask is current
3. On approval, record HITL checkpoint in `approval_checkpoints` table
4. Set `is_published = true` and `first_published_at = NOW()`

**Subsequent Edits**: After first publication, edits do not require re-review unless:
- The edit is flagged by Guardian alignment check (Phase 2)
- The narrative becomes hard-stale and is regenerated

### Unpublish Flow

Founders can unpublish a narrative at any time:

1. Founder clicks "Unpublish" from Pitch Editor
2. Confirmation modal: "This will remove your narrative from Portfolio Holder view. Are you sure?"
3. On confirm: Set `is_published = false`
4. Existing Evidence Packages remain accessible to connected PHs (snapshot)
5. New PH connections will not see the narrative

### Publication Metrics

Track publication behavior for product insights:

| Metric | Definition | Purpose |
|--------|------------|---------|
| `time_to_first_publish` | Days from generation to first publish | Measure founder review friction |
| `publish_gate_failure_reasons` | Which requirements block most often | Identify UX improvements needed |
| `unpublish_rate` | Published to Unpublished transitions | Signal quality concerns |
| `edit_after_publish_rate` | Edits made post-publication | Measure "launch and iterate" behavior |

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

**Timestamp Semantics**:
| TypeScript Field | Database Source | Meaning |
|------------------|-----------------|---------|
| `generated_at` | `pitch_narratives.created_at` | When AI generated this narrative version |
| `last_updated` | `pitch_narratives.updated_at` | When narrative was last modified (by AI or founder) |
| — | `projects.narrative_generated_at` | When ANY narrative was last generated for this project |

```typescript
interface PitchNarrative {
  version: string; // Schema version
  generated_at: string; // ISO timestamp — maps to pitch_narratives.created_at
  last_updated?: string; // ISO timestamp — maps to pitch_narratives.updated_at (if different from generated_at)
  project_id: string; // FK to projects table

  // Cover (title card — precedes the essential ten)
  // PURPOSE: Capture attention, set tone, create "white space" for founder to express
  //          gratitude, show passion, and mention mutual connections during live pitch
  cover: {
    venture_name: string;
    tagline: string; // ≤10 words, should communicate what product is or who it serves

    // Branding
    logo_url?: string;        // Founder-uploaded logo (the "face of the brand")
    hero_image_url?: string;  // Engaging picture of product or customer in action

    // Document metadata (helps track versions, sets professional tone)
    document_type: 'Investor Briefing' | 'Investor Presentation' | 'Pitch Deck';
    presentation_date: string; // ISO date — helps track different versions

    // Contact
    contact: {
      founder_name: string;
      email: string;
      linkedin_url?: string;
      website_url?: string;   // Company website for follow-up
    };
  };

  // COVER QUALITY CHECK: Does the cover make you want to open the deck?
  // Does the visual communicate what the product is or who it serves?

  // --- THE ESSENTIAL TEN (ordered per Get Backed framework) ---

  // Slide 1: Overview
  // PURPOSE: Your "elevator pitch" — the 15-second version of the deck.
  //          Describe a problem and how you solve it. Leave them hungry for more.
  // DEMONSTRATE: Clarity (easy to understand), Swagger (bold confidence), Passion (you care deeply)
  overview: {
    // Core pitch
    thesis: string;           // 3-sentence narrative arc: Problem → Solution → Evidence
    one_liner: string;        // Single sentence: "We do X for Y by Z" — extremely clear
    industry: string;         // What industry are you in? (e.g., "logistics", "fintech", "healthtech")

    // What makes this novel/bold?
    novel_insight: string;    // What's the unique insight or approach? Why is this audacious?

    // Proof points
    key_metrics: MetricSnapshot[]; // Top 3 evidence data points (traction proof)

    // Optional funding ask (can also appear on Use of Funds slide)
    ask?: {
      amount: number;
      instrument: 'SAFE' | 'equity' | 'convertible_note';
      use_summary: string; // One-sentence purpose
    };
  };

  // OVERVIEW QUALITY CHECK:
  // - What exactly does your company do? (one_liner answers this)
  // - What industry are you in? (industry field)
  // - Is this a novel idea? (novel_insight field)

  // Slide 2: Opportunity
  // Slide 2: Opportunity
  // PURPOSE: The 40,000-foot picture of your product's space. Show trends and market
  //          conditions that give you an entrance into the market and competitive position.
  // DEMONSTRATE: Explosive markets, Confusion/ambiguity, Thoroughness
  opportunity: {
    tam: MarketSize;
    sam: MarketSize;
    som: MarketSize;
    growth_trajectory: string; // Market growth rate + timing — shows "explosive" potential
    why_now: string;           // Macro trends enabling this venture
    market_tailwinds: string[]; // Regulatory, tech, behavioral shifts
    market_confusion?: string; // Ambiguity/fragmentation creating differentiation opportunity
  };

  // Slide 3: Problem
  // PURPOSE: Make investors feel an injustice has been done. The bigger the problem, the better.
  //          People empathize with specific people, not general problems — use customer stories.
  // DEMONSTRATE: Big problem in big market, Deep understanding, A specific person
  problem: {
    primary_pain: string;        // Top-ranked pain, narrative form
    pain_narrative: string;      // High-level description of the injustice
    affected_population: string; // Large, specific number of people affected
    customer_story?: {           // Specific person's experience (makes it personal)
      name: string;
      context: string;           // Who they are, what they do
      struggle: string;          // How they experience the problem
    };
    why_exists: string;          // Root cause — why does this problem persist?
    status_quo: string;          // How is it currently being addressed?
    severity_score: number;      // 0-1 from gate_scores
    evidence_quotes: string[];   // Top 3 interview quotes illustrating pain
  };

  // Slide 4: Solution
  // PURPOSE: Pull out all the stops. Show your magic, one-of-a-kind solution.
  //          Make it realistic and interactive. Show rather than tell.
  // DEMONSTRATE: Beauty, Surprise, Repeatable/Scalable, Solving pain, Team excellence
  // NOTE: Never use bullet points for your solution slide!
  solution: {
    value_proposition: string;   // Narrative-form VP statement
    how_it_works: string;        // Plain-language technical description
    key_differentiator: string;  // Unique positioning vs. competition
    use_cases: string[];         // Real customer delight scenarios
    demo_assets?: {              // Show rather than tell
      type: 'video' | 'screenshot' | 'prototype' | 'illustration';
      url: string;
      caption?: string;
    }[];
    ip_defensibility?: string;   // Patents, trade secrets, moats
    fit_score: number;           // 0-1 problem-solution fit
  };

  // Slide 5: Traction
  // PURPOSE: Demonstrate assumptions are proving true and you're making significant progress.
  //          Investors don't want to feel a venture needs them — show it will succeed regardless.
  // DEMONSTRATE: Fast-growing momentum, Clarity on metrics, Clear sales process
  traction: {
    evidence_summary: string;    // Narrative summary of all evidence
    growth_metrics: {            // The "hockey-stick" graph data
      metric_name: string;
      values: { date: string; value: number }[];
      trend: 'accelerating' | 'linear' | 'flat';
    }[];
    assumptions_validated: {     // Which assumptions are proving true
      assumption: string;
      evidence: string;
      confidence: number;        // 0-1
    }[];
    sales_process?: {            // How you attract, educate, qualify, close, service
      attract: string;
      educate: string;
      qualify: string;
      close: string;
      service: string;
    };
    do_direct: EvidenceItem[];   // Weight 1.0 evidence
    do_indirect: EvidenceItem[]; // Weight 0.8 evidence
    say_evidence: EvidenceItem[]; // Weight 0.3 evidence
    interview_count: number;
    experiment_count: number;
    hitl_completion_rate: number; // Checkpoints completed / total
    display_config: {
      evidence_order: ['do_direct', 'do_indirect', 'say_evidence']; // Render order
      show_weights: boolean;     // Always true for PH view
      visual_emphasis: {
        do_direct: 'primary';    // Green, large text, checkmark icon
        do_indirect: 'secondary'; // Blue, normal text, partial-check icon
        say_evidence: 'tertiary'; // Gray, smaller text, quote icon, italic
      };
    };
  };

  // Slide 6: Customer
  // PURPOSE: Demonstrate how well you know your customers and the market they represent.
  //          Describe them so vividly that listeners are reminded of someone they know.
  // DEMONSTRATE: The Customer (relatable), Clearly defined market (numbers), Revenue (proof)
  customer: {
    segments: CustomerSegment[];
    persona_summary: string;     // Describe the person vividly
    demographics: {
      location: string;          // Where they live
      behaviors: string;         // What they like to do
    };
    willingness_to_pay: string;  // How much they'd spend
    market_size: number;         // How many people fit this description
    target_percentage: number;   // What % you expect to buy (0-1)
    target_first: string;        // Which segment you will target first
    acquisition_channel: string; // How will you reach them?
    acquisition_cost?: number;   // CAC estimate
    paying_customers?: {         // Revenue proof (if any)
      count: number;
      revenue: number;
      example_story?: string;    // Use existing sales as examples
    };
    behavioral_insights: string[]; // Interview-derived patterns
    segment_prioritization: string; // Which segment first and why
  };

  // Slide 7: Competition
  // PURPOSE: Every venture has competition. Show you know them and can beat them.
  //          Your customers are doing something right now to cope — that's your competitor.
  // DEMONSTRATE: Industry knowledge, Sober judgment, Differentiation, Unique advantage
  competition: {
    landscape_summary: string;   // Narrative positioning
    primary_competitors: {       // Direct competitors
      name: string;
      how_they_compete: string;
      strengths: string[];
      weaknesses: string[];
    }[];
    secondary_competitors: {     // Indirect alternatives
      name: string;
      how_they_compete: string;
    }[];
    potential_threats?: string[]; // Unknown competitors with possible better advantage
    positioning_map?: {          // 2x2 quadrant visualization
      x_axis: string;            // e.g., "cost"
      y_axis: string;            // e.g., "value"
      your_position: { x: number; y: number }; // 0-1 scale
      competitor_positions: { name: string; x: number; y: number }[];
    };
    differentiators: string[];   // What makes you different enough to compete
    unfair_advantage: string;    // Partnerships, IP, expertise, processes, networks
    incumbent_defense: string;   // Why won't they rip you off and roll out faster?
  };

  // Slide 8: Business Model
  // PURPOSE: Answer three questions: 1) CAC? 2) LTV? 3) Cost breakdown per unit?
  // DEMONSTRATE: Consistency, Financial literacy, Level-headedness
  // NOTE: Per "Financial Projections — Unit Economics Only" decision, only unit economics
  //       (cac, ltv, unit_economics, pricing_strategy) are VPD-verified. Other financial
  //       fields are optional founder-supplied inputs excluded from evidence integrity hash.
  business_model: {
    // VPD-verified fields (from Ledger, included in evidence integrity)
    revenue_model: string;       // Narrative description
    cac: number;                 // Customer acquisition cost
    ltv: number;                 // Lifetime value per customer
    ltv_cac_ratio: number;       // Should be >3x
    unit_economics: {
      cost_per_unit: number;
      revenue_per_unit: number;
      margin_per_unit: number;
      breakdown: { category: string; amount: number }[];
    };
    pricing_strategy: string;
    market_context: string;      // "If we get X% of market..." framing

    // Optional founder-supplied fields (excluded from evidence integrity hash)
    monthly_costs?: {
      total: number;
      breakdown: { category: string; amount: number }[];
    };
    burn_rate?: number;          // Monthly spend rate
    gross_profit?: number;       // Revenue - COGS
    ebitda?: number;             // Earnings before interest, taxes, depreciation, amortization
    net_income?: number;         // Bottom line
    cash_flow?: number;          // Cash in vs. cash out
    revenue_projections?: {      // Forward-looking estimates
      period: string;
      amount: number;
    }[];
    path_to_profitability?: string; // Founder's projection (optional)
  };

  // Slide 9: Team
  // PURPOSE: Build rapport, be known, build confidence the team can accomplish the mission.
  //          Keep bios to <1 minute total when presenting.
  // DEMONSTRATE: Brevity (≤75 words each), Domain expertise, Passion/intensity/culture
  team: {
    members: {
      name: string;
      current_role: string;        // What they do now
      bio: string;                 // ≤75 words!
      prior_experience: string[];  // Relevant past roles
      accomplishments: string[];   // Significant achievements
      education?: string;          // Relevant degrees/certifications
      domain_expertise: string;    // Why they have insight to get the job done
      linkedin_url?: string;
    }[];
    advisors?: {
      name: string;
      title: string;
      relevance: string;           // Why they matter to this venture
    }[];
    investors?: {
      name: string;
      firm?: string;
    }[];
    hiring_gaps?: string[];        // Who else needs to be hired
    team_culture?: string;         // What kind of culture you're creating
    coachability_score: number;    // From HITL checkpoint data (StartupAI unique)
  };

  // Slide 10: Use of Funds
  // PURPOSE: Clear ask + what investor gets in return + how money will be used.
  //          Show what you'll achieve by the time the money is gone.
  // DEMONSTRATE: Clarity (specific breakdown), Milestones (what you'll accomplish)
  use_of_funds: {
    ask_amount: number;          // How much are you raising?
    ask_type: 'SAFE' | 'equity' | 'convertible_note' | 'other';
    allocations: {               // How will you spend it?
      category: string;
      amount: number;
      percentage: number;
      validation_experiment?: string; // What hypothesis does this test?
    }[];
    milestones: {                // What will you accomplish?
      description: string;
      target_date: string;       // ISO date
      success_criteria: string;  // Clear success/failure criteria
    }[];
    timeline_weeks: number;      // Total runway
    other_participants?: {       // Who else is participating?
      name: string;
      amount?: number;
      confirmed: boolean;
    }[];
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
    evidence_gaps?: {
      // Maps slide names to descriptions of missing/weak evidence
      // Generated by Guardian alignment checks
      [slide: string]: {
        gap_type: 'missing' | 'weak' | 'stale';
        description: string;
        recommended_action: string;
        blocking_publish: boolean; // If true, narrative cannot be published
      };
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
  normalized_usd_annual?: number; // Computed field for cross-venture comparison
}

/**
 * MarketSize Normalization Rules
 *
 * For consistent comparison across ventures, all MarketSize values are normalized
 * to annual USD. The `normalized_usd_annual` field is computed, not stored.
 *
 * Conversion Rules:
 * 1. Timeframe normalization:
 *    - monthly → annual: value × 12
 *    - annual → annual: value × 1
 *
 * 2. Unit normalization (requires external data or founder input):
 *    - USD: No conversion needed
 *    - users: Requires `average_revenue_per_user` from founder or industry benchmark
 *      Formula: users × ARPU × 12 (if monthly) or users × ARPU (if annual)
 *    - transactions: Requires `average_transaction_value` from founder or industry benchmark
 *      Formula: transactions × ATV × 12 (if monthly) or transactions × ATV (if annual)
 *
 * 3. Confidence weighting (for display, not calculation):
 *    - 'verified': Full confidence badge
 *    - 'researched': Standard display
 *    - 'estimated': Displayed with "~" prefix and lighter styling
 *
 * Implementation:
 * ```typescript
 * function normalizeMarketSize(
 *   size: MarketSize,
 *   conversionFactors?: { arpu?: number; atv?: number }
 * ): number | null {
 *   const timeMultiplier = size.timeframe === 'monthly' ? 12 : 1;
 *
 *   switch (size.unit) {
 *     case 'USD':
 *       return size.value * timeMultiplier;
 *     case 'users':
 *       if (!conversionFactors?.arpu) return null; // Cannot normalize without ARPU
 *       return size.value * conversionFactors.arpu * timeMultiplier;
 *     case 'transactions':
 *       if (!conversionFactors?.atv) return null; // Cannot normalize without ATV
 *       return size.value * conversionFactors.atv * timeMultiplier;
 *   }
 * }
 * ```
 *
 * Display Formatting:
 * - < $1M: Show as "$XXXk"
 * - $1M - $999M: Show as "$X.XM"
 * - ≥ $1B: Show as "$X.XB"
 */

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

// Note: UnitEconomics is defined inline in business_model.unit_economics

interface FounderProfile {
  name: string;
  role: string;
  professional_summary: string;  // 500 char max (stored); truncated to 200 chars in pitch narrative
  domain_expertise: string[];
  linkedin_url?: string;
  previous_ventures?: {
    name: string;
    role: string;
    outcome: string;
    year: number;
  }[];
  years_experience?: number;  // For credibility display
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
 *
 * MIGRATION RULES (for existing evidence without category):
 *
 * Step 1: Add nullable column
 *   ALTER TABLE evidence ADD COLUMN evidence_category VARCHAR(20);
 *
 * Step 2: Backfill based on evidence.type heuristics
 *   UPDATE evidence SET evidence_category = CASE
 *     -- DO-direct: actual transactions or usage
 *     WHEN type IN ('payment', 'purchase', 'transaction', 'usage_metric', 'conversion') THEN 'DO-direct'
 *     -- DO-indirect: commitment signals
 *     WHEN type IN ('loi', 'waitlist', 'signup', 'prototype_feedback', 'pilot', 'beta') THEN 'DO-indirect'
 *     -- SAY: stated preferences
 *     WHEN type IN ('interview', 'survey', 'feedback', 'quote', 'testimonial') THEN 'SAY'
 *     -- Default: SAY (conservative default for uncategorized)
 *     ELSE 'SAY'
 *   END
 *   WHERE evidence_category IS NULL;
 *
 * Step 3: Make column NOT NULL with default
 *   ALTER TABLE evidence ALTER COLUMN evidence_category SET NOT NULL;
 *   ALTER TABLE evidence ALTER COLUMN evidence_category SET DEFAULT 'SAY';
 *
 * Step 4: Add CHECK constraint
 *   ALTER TABLE evidence ADD CONSTRAINT evidence_category_check
 *     CHECK (evidence_category IN ('DO-direct', 'DO-indirect', 'SAY'));
 *
 * MAPPING TABLE (for manual categorization UI):
 * | Evidence Type        | Default Category | Notes                              |
 * |---------------------|------------------|-------------------------------------|
 * | Payment received    | DO-direct        | Actual money exchanged              |
 * | Usage metric        | DO-direct        | Behavioral data from product        |
 * | LOI signed          | DO-indirect      | Written commitment, not payment     |
 * | Waitlist signup     | DO-indirect      | Action taken, low commitment        |
 * | Prototype test      | DO-indirect      | Interaction observed                |
 * | Interview quote     | SAY              | Stated intent/preference            |
 * | Survey response     | SAY              | Self-reported data                  |
 * | NPS score           | SAY              | Self-reported satisfaction          |
 */
```

#### Evidence Package Schema

**Important**: This interface defines the **API response shape**, not the database schema.
The `evidence_packages` table stores references and raw JSONB; the API assembles the full package.

| Interface Field | Database Source |
|-----------------|-----------------|
| `version` | Derived from `evidence_packages.evidence_data->>'version'` |
| `generated_at` | `evidence_packages.created_at` |
| `project_id` | `evidence_packages.project_id` |
| `founder_id` | `evidence_packages.founder_id` |
| `pitch_narrative` | JOIN to `pitch_narratives` via `pitch_narrative_id` |
| `validation_evidence` | Parsed from `evidence_packages.evidence_data` JSONB |
| `integrity.*` | Combination of `integrity_hash` + `evidence_data` metadata |
| `access.*` | Computed from `evidence_package_access` table (see notes below) |

```typescript
interface EvidencePackage {
  version: string;           // From evidence_data JSONB, defaults to "1.0"
  generated_at: string;      // Maps to evidence_packages.created_at
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
  // NOTE: This section is computed at query time, not stored in evidence_packages table
  access: {
    shared_with: string[]; // Portfolio Holder IDs - derived from evidence_package_access table
                           // Query: SELECT ARRAY_AGG(portfolio_holder_id) FROM evidence_package_access
                           //        WHERE evidence_package_id = ? GROUP BY evidence_package_id
    shared_at: string;     // earliest first_accessed_at from evidence_package_access
    connection_type: RelationshipType; // from consultant_clients.relationship_type
    founder_consent: boolean; // from evidence_packages.is_public OR explicit consent record
    opt_in_timestamp: string; // from evidence_packages.created_at or consent record timestamp
  };
}

// --- Supporting Interfaces for Validation Evidence ---

// RelationshipType must match consultant_clients.relationship_type column values
// Source: frontend/src/db/schema/consultant-clients.ts (relationshipTypeEnum)
// Note: The Drizzle schema uses a TEXT column without a CHECK constraint, but the
// application enforces these values via TypeScript. The canonical enum values are:
type RelationshipType = 'advisory' | 'capital' | 'program' | 'service' | 'ecosystem';

interface ValuePropositionCanvas {
  customer_segment: string;
  customer_jobs: string[];
  pains: { description: string; severity: number }[];
  gains: { description: string; importance: number }[];
  pain_relievers: string[];
  gain_creators: string[];
  products_services: string[];
  fit_assessment: string;
}

interface CustomerProfile {
  segment_name: string;
  jobs_to_be_done: { job: string; importance: number; frequency: string }[];
  pains: { pain: string; severity: number; current_solution: string }[];
  gains: { gain: string; relevance: number }[];
  demographics?: Record<string, string>;
  behavioral_insights: string[];
}

interface CompetitorMap {
  competitors: {
    name: string;
    category: 'direct' | 'indirect' | 'substitute';
    strengths: string[];
    weaknesses: string[];
    market_share_estimate?: number;
  }[];
  positioning_statement: string;
  differentiation_axes: { axis: string; our_position: string; competitor_positions: Record<string, string> }[];
}

interface BusinessModelCanvas {
  key_partners: string[];
  key_activities: string[];
  key_resources: string[];
  value_propositions: string[];
  customer_relationships: string[];
  channels: string[];
  customer_segments: string[];
  cost_structure: { item: string; type: 'fixed' | 'variable'; amount?: number }[];
  revenue_streams: { stream: string; type: string; pricing_model: string }[];
}

interface ExperimentResult {
  experiment_id: string;
  hypothesis_id: string;
  experiment_type: 'landing_page' | 'concierge' | 'wizard_of_oz' | 'prototype' | 'interview' | 'survey';
  start_date: string;
  end_date: string;
  sample_size: number;
  success_criteria: string;
  actual_result: string;
  outcome: 'validated' | 'invalidated' | 'inconclusive';
  learnings: string[];
  evidence_category: 'DO-direct' | 'DO-indirect' | 'SAY';
}

interface GateScores {
  desirability: number;  // 0-1
  feasibility: number;   // 0-1
  viability: number;     // 0-1
  overall_fit: number;   // 0-1, weighted combination
  current_gate: 'desirability' | 'feasibility' | 'viability' | 'complete';
  gate_passed_at?: Record<string, string>;  // Gate name -> ISO timestamp
}

interface HITLRecord {
  checkpoints: {
    checkpoint_id: string;
    checkpoint_type: string;
    triggered_at: string;
    responded_at?: string;
    response_summary?: string;
    approval_status: 'pending' | 'approved' | 'rejected' | 'revised';
  }[];
  coachability_score: number;  // 0-1, derived from response time and revision acceptance
  total_checkpoints: number;
  completed_checkpoints: number;
}

interface AlignmentIssue {
  field: string;              // Dot-notation path like "traction.evidence_summary"
  issue: string;              // Human-readable description of the problem
  severity: 'warning' | 'error';
  suggested_language?: string;  // What language would be permitted
  evidence_needed?: string;     // What evidence would unlock the claimed language
}

interface EditHistoryEntry {
  timestamp: string;    // ISO timestamp
  slide: SlideKey;      // Which slide was edited (e.g., 'problem', 'solution', 'traction')
  field: string;        // Dot-notation path within slide (e.g., 'headline', 'evidence[0].description')
  old_value: unknown;
  new_value: unknown;
  alignment_result?: 'verified' | 'flagged';
  edit_source: 'founder' | 'regeneration';  // Was this a manual edit or AI regeneration?
}

// Valid slide keys for edit tracking
type SlideKey =
  | 'cover'
  | 'overview'
  | 'opportunity'
  | 'problem'
  | 'solution'
  | 'traction'
  | 'customer'
  | 'competition'
  | 'business_model'
  | 'team'
  | 'use_of_funds'
  | 'metadata';  // For changes to metadata fields
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
  edit_history JSONB DEFAULT '[]',            -- Array of EditHistoryEntry: {timestamp, slide, field, old_value, new_value, alignment_result?, edit_source}
  alignment_status VARCHAR(20) DEFAULT 'verified',  -- 'verified' | 'flagged' | 'pending'
  alignment_issues JSONB DEFAULT '[]',        -- Array of Guardian-detected issues

  -- NOTE: Per-slide edit tracking is DERIVED from edit_history, not stored separately.
  -- Use the TypeScript helper functions in "Regeneration with Edit Preservation" section:
  --   getFounderEditedSlides(editHistory)  -- Returns Set<SlideKey> of founder-edited slides
  --   getSlideEdits(editHistory, slide)    -- Returns Map of field -> value for a slide
  -- These helpers correctly filter by edit_source:'founder' at the element level.
  -- Raw SQL queries on edit_history JSONB are complex and error-prone; prefer application logic.

  -- IMPORTANT: alignment_status state transitions
  -- 1. New AI-generated narrative: DEFAULT 'verified' (AI output is trusted)
  -- 2. Founder makes ANY edit: Application MUST set alignment_status = 'pending'
  --    (Do NOT rely on database default; update explicitly in the same transaction)
  -- 3. Guardian check completes: Set to 'verified' or 'flagged'
  -- 4. Narrative regenerated: Reset to 'verified', clear alignment_issues, set is_edited = FALSE

  -- Generation metadata
  generation_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  source_evidence_hash VARCHAR(64) NOT NULL,  -- SHA-256 of input evidence
  agent_run_id VARCHAR(100),                  -- CrewAI run that produced this

  -- NOTE: Staleness is tracked on `projects` table only (single source of truth)
  -- Query via: SELECT p.narrative_is_stale, p.narrative_stale_severity, p.narrative_stale_reason
  --            FROM projects p WHERE p.id = pitch_narratives.project_id

  -- Verification security (see "Verification Endpoint Security" section)
  -- DEPRECATED: verification_token moved to narrative_exports table (per-export, not per-narrative)
  -- See Decision Log entry 2026-02-05: "Verification tokens are per-export, not per-narrative"
  -- Rationale: Per-export tokens allow detecting stale PDFs after regeneration.
  -- Old exports can be marked "outdated" while new exports remain "verified".
  verification_request_count INTEGER DEFAULT 0,       -- Track verification requests for abuse detection

  -- Publication state (see "Narrative Publication" section)
  is_published BOOLEAN DEFAULT FALSE,               -- TRUE = shareable with PHs, FALSE = draft
  first_published_at TIMESTAMPTZ,                   -- When founder first approved for sharing
  last_publish_review_at TIMESTAMPTZ,               -- When founder last completed HITL review

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_project_narrative UNIQUE (project_id)
);

-- Export history with per-export verification tokens
-- Each export captures a point-in-time snapshot with its own verification URL.
-- When the narrative is regenerated, old exports become "outdated" but remain verifiable.
-- This enables: (1) detecting stale PDFs shared externally, (2) audit trail of exports,
-- (3) lead capture from external investors verifying old PDFs.
CREATE TABLE narrative_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  narrative_id UUID NOT NULL REFERENCES pitch_narratives(id) ON DELETE CASCADE,

  -- Verification (see "Verification Endpoint Security" section)
  verification_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,  -- Public verification URL token
  generation_hash VARCHAR(64) NOT NULL,             -- SHA-256 of narrative content at export time

  -- Export metadata
  export_format VARCHAR(10) NOT NULL,               -- 'pdf', 'pptx', 'json'
  exported_at TIMESTAMPTZ DEFAULT NOW(),

  -- Match tracking (for comparing against current narrative)
  -- When verifying: if generation_hash != current narrative hash, export is "outdated"
  CONSTRAINT valid_export_format CHECK (export_format IN ('pdf', 'pptx', 'json'))
);

-- Index for fast verification token lookup (public API)
-- Note: UNIQUE constraint on column already creates implicit unique index,
-- but explicit index ensures optimal query planning for verification endpoint
CREATE UNIQUE INDEX idx_narrative_exports_verification_token
  ON narrative_exports(verification_token);

-- Index for finding exports by narrative (dashboard listing)
CREATE INDEX idx_narrative_exports_narrative_id
  ON narrative_exports(narrative_id);

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
-- Cardinality: One project may have multiple evidence packages (e.g., different versions
-- for different audiences). Selection rules:
--   - "Latest" = most recent created_at
--   - Auto-attachment to connection requests uses latest active package
--   - Only one package per project can be is_primary = true (enforced by partial unique index below)
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
  is_primary BOOLEAN DEFAULT FALSE,           -- Primary package for auto-attachment
  founder_consent BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one primary package per project (partial unique index)
CREATE UNIQUE INDEX idx_evidence_packages_primary_per_project
  ON evidence_packages(project_id)
  WHERE is_primary = TRUE;

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

CREATE POLICY "Founders can create own narratives"
  ON pitch_narratives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Founders can delete own narratives"
  ON pitch_narratives FOR DELETE
  USING (auth.uid() = user_id);

-- Narrative versions: inherit access from parent narrative
CREATE POLICY "Founders can view own narrative versions"
  ON narrative_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitch_narratives pn
      WHERE pn.id = narrative_versions.narrative_id
        AND pn.user_id = auth.uid()
    )
  );

-- Evidence packages: founder + connected Portfolio Holders
-- NOTE: is_published is NOT checked here. Per Decision Log (Task #32):
-- Draft narratives CAN be shared via evidence packages for early feedback.
-- is_published only gates Founder Directory listing, not direct package access.
-- Access is gated by founder_consent and connection status, not publication state.
CREATE POLICY "Founders can view own packages"
  ON evidence_packages FOR SELECT
  USING (auth.uid() = founder_id);

-- SECURITY FIX: Added founder_consent check to prevent unauthorized data access
-- Consultants can ONLY view packages when founder has explicitly granted consent
-- See "Founder Consent Flow" documentation in schema comments
CREATE POLICY "Consultants can view packages with consent"
  ON evidence_packages FOR SELECT
  USING (
    -- Owner can always view their own packages (redundant with above policy, but explicit)
    auth.uid() = founder_id
    OR
    -- Connected consultant with EXPLICIT consent
    (
      founder_consent = TRUE  -- CRITICAL: Must have explicit founder consent
      AND EXISTS (
        SELECT 1 FROM consultant_clients cc
        WHERE cc.consultant_id = auth.uid()
          AND cc.client_id = evidence_packages.founder_id
          AND cc.connection_status = 'active'
      )
    )
    OR
    -- Public packages: founder has opted into marketplace discovery (Founder Directory)
    -- NOTE: This path DOES check is_published. Per Decision Log (Task #32):
    -- Founder Directory listing requires published narrative, unlike direct package sharing.
    (
      is_public = TRUE
      AND founder_consent = TRUE  -- Public also requires consent flag
      AND EXISTS (
        SELECT 1 FROM pitch_narratives pn
        WHERE pn.id = evidence_packages.pitch_narrative_id
          AND pn.is_published = TRUE  -- REQUIRED for Founder Directory visibility
      )
      AND EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
          AND up.role = 'consultant'
      )
    )
  );

-- Evidence package access: PHs see their own records, founders see access to their packages
CREATE POLICY "PHs can view own access records"
  ON evidence_package_access FOR SELECT
  USING (auth.uid() = portfolio_holder_id);

CREATE POLICY "Founders can view access to their packages"
  ON evidence_package_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evidence_packages ep
      WHERE ep.id = evidence_package_access.evidence_package_id
        AND ep.founder_id = auth.uid()
    )
  );

CREATE POLICY "PHs can create access records"
  ON evidence_package_access FOR INSERT
  WITH CHECK (
    auth.uid() = portfolio_holder_id
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'consultant'
    )
  );

CREATE POLICY "PHs can update own access records"
  ON evidence_package_access FOR UPDATE
  USING (auth.uid() = portfolio_holder_id)
  WITH CHECK (auth.uid() = portfolio_holder_id);

-- Founder profiles: public read for verified PHs, write for owner
CREATE POLICY "Verified PHs can view founder profiles"
  ON founder_profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'consultant'  -- Use existing role column; consultant_verification_status requires migration
    )
  );

CREATE POLICY "Founders can manage own profile"
  ON founder_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);  -- Required for INSERT/UPDATE operations
```

### Indexes

```sql
-- GIN index for JSONB queries on narrative_data
CREATE INDEX idx_pitch_narratives_narrative_data ON pitch_narratives USING GIN (narrative_data);

-- Composite index to support RLS policy checking consultant-founder connections
CREATE INDEX idx_consultant_clients_connection_lookup
  ON consultant_clients(consultant_id, client_id, connection_status);

-- Index to support RLS policy checking user role for PH access
CREATE INDEX idx_user_profiles_role
  ON user_profiles(id, role);

-- Index for project-based narrative lookups (staleness is on projects table)
CREATE INDEX idx_pitch_narratives_project ON pitch_narratives(project_id);

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
  target_project_id UUID;
BEGIN
  -- Safely extract project_id (may be direct column or from JSONB)
  BEGIN
    target_project_id := NEW.project_id;
  EXCEPTION WHEN OTHERS THEN
    -- If project_id not accessible, cannot mark stale
    RAISE WARNING 'mark_narrative_stale: Cannot access project_id from % table: %', TG_TABLE_NAME, SQLERRM;
    RETURN NEW;
  END;

  -- Determine staleness severity based on change type
  -- Wrapped in exception handler for safety when accessing JSONB or missing columns
  BEGIN
    IF TG_TABLE_NAME = 'evidence' THEN
      -- New evidence is soft stale (informational)
      change_severity := 'soft';
      change_reason := 'New evidence added';
    ELSIF TG_TABLE_NAME = 'hypotheses' THEN
      -- Hypothesis status change is hard stale
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        change_severity := 'hard';
        change_reason := 'Hypothesis status changed: ' || COALESCE(OLD.status, 'none') || ' → ' || COALESCE(NEW.status, 'unknown');
      ELSE
        change_severity := 'soft';
        change_reason := 'Hypothesis updated';
      END IF;
    ELSIF TG_TABLE_NAME = 'gate_scores' THEN
      -- Fit score change >0.1 is hard stale
      IF ABS(COALESCE(NEW.overall_fit, 0) - COALESCE(OLD.overall_fit, 0)) > 0.1 THEN
        change_severity := 'hard';
        change_reason := 'Fit Score changed significantly: ' || ROUND(COALESCE(OLD.overall_fit, 0)::numeric, 2) || ' → ' || ROUND(COALESCE(NEW.overall_fit, 0)::numeric, 2);
      ELSE
        change_severity := 'soft';
        change_reason := 'Fit Score updated';
      END IF;
    ELSIF TG_TABLE_NAME = 'validation_runs' THEN
      -- Gate passage is hard stale
      IF NEW.current_gate IS DISTINCT FROM OLD.current_gate THEN
        change_severity := 'hard';
        change_reason := 'Validation stage changed: ' || COALESCE(OLD.current_gate, 'none') || ' → ' || COALESCE(NEW.current_gate, 'unknown');
      ELSE
        change_severity := 'soft';
        change_reason := 'Validation run updated';
      END IF;
    ELSE
      change_severity := 'soft';
      change_reason := 'Related data changed';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- FALLBACK: If any column access fails, default to soft stale with generic reason
    -- This ensures narrative is still marked stale even if trigger logic encounters unexpected schema
    change_severity := 'soft';
    change_reason := 'Data changed in ' || TG_TABLE_NAME || ' (fallback: ' || SQLERRM || ')';
    RAISE WARNING 'mark_narrative_stale fallback triggered for %: %', TG_TABLE_NAME, SQLERRM;
  END;

  -- Apply staleness update
  UPDATE projects
  SET
    narrative_is_stale = TRUE,
    narrative_stale_severity = CASE
      WHEN narrative_stale_severity = 'hard' THEN 'hard'  -- Don't downgrade existing hard stale
      ELSE change_severity
    END,
    narrative_stale_reason = change_reason
  WHERE id = target_project_id;

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

-- Founder profile changes trigger soft staleness (Team slide may be outdated)
-- Note: Triggers on founder_profiles which stores professional background data
-- for the Team slide. user_profiles (name, email) changes are handled separately.
CREATE TRIGGER founder_profile_staleness_trigger
  AFTER UPDATE ON founder_profiles
  FOR EACH ROW
  WHEN (
    OLD.professional_summary IS DISTINCT FROM NEW.professional_summary OR
    OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url OR
    OLD.years_experience IS DISTINCT FROM NEW.years_experience
  )
  EXECUTE FUNCTION mark_narrative_stale();
```

> **⚠️ Prerequisite Tables for Triggers**: The staleness triggers above reference tables that may not yet exist in the Drizzle schema:
> - `gate_scores` - Currently stored as JSONB within `crewai_validation_states`. Either create a dedicated table or modify the trigger to query JSONB.
> - `customer_profiles` - Currently stored as JSONB within `crewai_validation_states`. Either create a dedicated table or modify the trigger.
> - `value_proposition_canvas` - Verify this table exists or adjust trigger accordingly.
>
> **Migration Strategy**: Deploy triggers only for tables that exist (`evidence`, `hypotheses`, `validation_runs`). Add remaining triggers when prerequisite tables are created. See Infrastructure Requirements for migration ordering.

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

-- ============================================================================
-- ANALYTICS TABLES RLS POLICY
-- ============================================================================
-- These tables are written by the application (service role) and read for analytics.
-- No user-facing RLS policies are needed; all access is via service role.
--
-- Access Pattern:
--   WRITE: Application backend via service role (tracking events)
--   READ:  Admin dashboards via service role (analytics queries)
--
-- If user-facing analytics are needed in future (e.g., founders see their own funnel):
--
-- CREATE POLICY "Founders can view own funnel events"
--   ON narrative_funnel_events FOR SELECT
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "PHs can view own engagement events"
--   ON package_engagement_events FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM evidence_package_access epa
--       WHERE epa.id = package_engagement_events.access_id
--         AND epa.portfolio_holder_id = auth.uid()
--     )
--   );
-- ============================================================================

-- Verification to connection conversion tracking
ALTER TABLE evidence_package_access
  ADD COLUMN verification_token_used UUID,  -- Links to narrative_exports.verification_token (per-export)
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

1. Check if existing narrative exists and `projects.narrative_is_stale = false` → return cached
2. If `projects.narrative_is_stale = true` or `force_regenerate = true` → gather all project evidence
3. Pass to Report Compiler with narrative synthesis prompt
4. Store result in `pitch_narratives` table
5. Update projects table: `narrative_is_stale = false`, `narrative_generated_at = NOW()`
6. Update `pitch_narratives.source_evidence_hash` with new hash

**Cache Check Query**:
```sql
SELECT pn.*, p.narrative_is_stale, p.narrative_stale_severity
FROM pitch_narratives pn
JOIN projects p ON p.id = pn.project_id
WHERE pn.project_id = $1
  AND p.narrative_is_stale = FALSE;
```

**Cache Invalidation** (after successful generation):
```sql
UPDATE projects
SET narrative_is_stale = FALSE,
    narrative_generated_at = NOW(),
    narrative_stale_severity = NULL,
    narrative_stale_reason = NULL
WHERE id = $1;
```

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

```
GET /api/evidence-packages
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `project_id` | UUID | Required. Filter by project |
| `latest` | boolean | Optional. If `true`, return only the most recent package (by `created_at`) |
| `primary` | boolean | Optional. If `true`, return only the primary package (where `is_primary = true`) |

**Authorization**: Founder owner of the project only.

**Response** (when `latest=true` or `primary=true`):
```json
{
  "package": { /* EvidencePackage */ } | null
}
```

**Response** (without `latest` or `primary` filter):
```json
{
  "packages": [/* EvidencePackage[] */],
  "total": 3
}
```

**Logic**:
- If `latest=true`: Return single package with most recent `created_at` for the project
- If `primary=true`: Return single package where `is_primary = true` (null if none set)
- Default: Return all packages for the project, ordered by `created_at DESC`

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


### Narrative Publication

```
POST /api/narrative/:id/publish
```

**Authorization**: Founder owner only.

**Request**:

```json
{
  "hitl_confirmation": {
    "reviewed_slides": true,
    "verified_traction": true,
    "added_context": true,
    "confirmed_ask": true
  }
}
```

**Response (Success)**:

```json
{
  "narrative_id": "uuid",
  "is_published": true,
  "published_at": "2026-02-05T14:30:00Z",
  "first_publish": true
}
```

**Response (Blocked)**:

```json
{
  "error": {
    "code": "PUBLISH_BLOCKED",
    "message": "Narrative cannot be published due to blocking issues",
    "details": {
      "blocking_gaps": [
        {
          "slide": "use_of_funds",
          "gap_type": "missing",
          "description": "Investment ask amount not specified"
        }
      ],
      "alignment_status": "flagged",
      "stale_severity": null
    }
  }
}
```

**Logic**:

1. Check publication gate requirements (see "Narrative Publication" section):
   - No `blocking_publish = true` in `metadata.evidence_gaps`
   - `alignment_status != 'flagged'`
   - `narrative_stale_severity != 'hard'`
2. If first publish, require `hitl_confirmation` object with all fields `true`
3. On success:
   - Set `is_published = true`
   - Set `first_published_at = NOW()` if null
   - Set `last_publish_review_at = NOW()`
   - Record HITL checkpoint in `approval_checkpoints` table
4. Return success response

```
POST /api/narrative/:id/unpublish
```

**Authorization**: Founder owner only.

**Request**: Empty body or `{}`

**Response**:

```json
{
  "narrative_id": "uuid",
  "is_published": false,
  "unpublished_at": "2026-02-05T15:00:00Z"
}
```

**Logic**:

1. Set `is_published = false`
2. Existing Evidence Packages remain accessible to connected PHs (snapshot)
3. New PH connections will not see the narrative

### External Verification

```
GET /api/verify/:verification_token
```

**Authorization**: Public (no auth required).

**Response**:

```json
{
  "status": "verified" | "outdated" | "not_found",
  "generated_at": "2026-02-04T14:34:00Z",
  "venture_name": "Acme Logistics",
  "evidence_id": "a3f8c2d1e9b4",
  "generation_hash": "abc123...",
  "current_hash": "abc123...",
  "current_hash_matches": true,
  "evidence_updated_at": "2026-02-04T14:34:00Z",
  "validation_stage_at_generation": "Solution Testing",
  "is_edited": true,
  "alignment_status": "verified",
  "request_access_url": "/connect/request?founder=uuid"
}
```

**Response Field Notes**:
- `fit_score_at_generation`: **Intentionally excluded** from public response. See Response Sanitization table for rationale.
- `is_edited`: `true` if founder has modified the AI-generated narrative. Provides transparency about customization.
- `alignment_status`: `"verified"` | `"flagged"` | `"pending"` — Guardian's assessment of whether edits maintain evidence alignment.
  - `verified`: Edits checked and approved by Guardian
  - `flagged`: Guardian detected claims that may exceed evidence (view with caution)
  - `pending`: Edits not yet reviewed by Guardian
- `request_access_url`: Deep link to request founder connection (lead capture for marketplace).

### Narrative Export

```
POST /api/narrative/:id/export
```

**Authorization**: Founder owner only.

Creates an export record and generates a downloadable file. Each export gets a unique verification token for integrity checking.

**Request**:

```json
{
  "format": "pdf" | "pptx" | "json",
  "include_qr_code": true
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `format` | string | Yes | - | Export format: `pdf`, `pptx`, or `json` |
| `include_qr_code` | boolean | No | `true` for PDF | Whether to embed QR code for verification |

**Response (Success)**:

```json
{
  "success": true,
  "export_id": "uuid",
  "verification_token": "uuid",
  "generation_hash": "sha256...",
  "verification_url": "https://app.startupai.site/verify/abc123",
  "download_url": "https://storage.supabase.co/...",
  "expires_at": "2026-02-06T14:30:00Z"
}
```

| Field | Description |
|-------|-------------|
| `export_id` | Unique identifier for this export record |
| `verification_token` | Token for external integrity verification (per-export) |
| `generation_hash` | SHA-256 hash of narrative content at export time |
| `verification_url` | Public URL for verifying export authenticity |
| `download_url` | Signed URL for downloading the exported file |
| `expires_at` | When the download URL expires (24-hour default) |

**Response (Error)**:

```json
{
  "error": {
    "code": "FORMAT_NOT_SUPPORTED",
    "message": "Export format 'docx' is not supported",
    "details": {
      "supported_formats": ["pdf", "pptx", "json"]
    }
  }
}
```

| HTTP Status | Error Code | Condition |
|-------------|------------|-----------|
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Authenticated but not owner of narrative |
| 404 | `NOT_FOUND` | Narrative does not exist |
| 422 | `FORMAT_NOT_SUPPORTED` | Requested format not available |

**Logic**:

1. Verify user owns the narrative
2. Generate export file in requested format
3. Create row in `narrative_exports` table with:
   - `verification_token`: New UUID for this export
   - `generation_hash`: SHA-256 of narrative content
   - `format`: Requested format
   - `qr_code_included`: Whether QR code was embedded
4. Upload file to Supabase Storage bucket `narrative-exports`
5. Generate signed URL with 24-hour expiration
6. If `include_qr_code = true` (PDF only):
   - QR code contains `verification_url`
   - QR placement: Bottom-right of cover slide
   - QR includes: venture name, generation date, verification link
7. Return export metadata with download URL

**Implementation Notes**:

- QR code links to `/verify/:verification_token` for public integrity checking
- Each export creates a new verification token (per-export tokens, not per-narrative)
- Download URLs expire after 24 hours; export record persists for re-download
- Export record links back to narrative version for audit trail

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
- Verification URL: `app.startupai.site/verify/{verification_token}`
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

**Generation**: Next.js API route at `/api/og/evidence-package/[id]` using `satori` + `@resvg/resvg-js` for SVG-to-PNG conversion. This combination is Netlify-compatible (unlike `@vercel/og` which requires Vercel's edge runtime).

**Implementation Notes**:
- Use `satori` to render React components to SVG
- Use `@resvg/resvg-js` to convert SVG to PNG (works in Node.js runtime)
- Bundle Inter font (or brand font) with the API route
- Cache generated images in Supabase Storage for 1 hour (check `Cache-Control` header before regenerating)
- Fallback: If generation fails, return a static branded placeholder image

**Meta tags** (for Evidence Package pages):
```html
<meta property="og:image" content="https://app.startupai.site/api/og/evidence-package/{id}" />
<meta property="og:title" content="{venture_name} - Validated by StartupAI" />
<meta property="og:description" content="{tagline} | Fit Score: {fit_score}" />
<meta name="twitter:card" content="summary_large_image" />
```

### Cover Slide Design

The Cover slide captures attention, sets the tone, and creates "white space" for the founder to express gratitude, show passion, and mention mutual connections during a live pitch.

**Cover Slide Principles** (per *Get Backed*):
| Element | Purpose | Quality Check |
|---------|---------|---------------|
| Clean logo | Face of the brand; important to overall image | Is it professional and memorable? |
| Inviting picture | Engaging image of product or customer | Does it communicate what you do or who you serve? |
| Descriptive title | "Investor Briefing" + date for version tracking | Is it clear this is a professional investor document? |
| Overall impression | First impression sets expectations | Does it make you want to open the deck? |

**Cover Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     [Logo - top left or centered]                          │
│                                                             │
│     ┌─────────────────────────────────────────────────┐    │
│     │                                                 │    │
│     │         [Hero Image - product/customer]         │    │
│     │                                                 │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│                    VENTURE NAME                            │
│            Tagline that explains what you do               │
│                                                             │
│     ─────────────────────────────────────────────────      │
│     Investor Briefing · February 2026                      │
│                                                             │
│     founder@company.com · linkedin.com/in/founder          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**When logo/hero image not uploaded** (placeholder):
- Background: Subtle gradient using brand colors (primary → accent, 5% opacity)
- Center element: Geometric pattern derived from industry tags
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

### Hash Canonicalization Rules

To ensure deterministic hash computation across services (Next.js, CrewAI, verification endpoint), all evidence data MUST be canonicalized before hashing:

**Canonicalization Algorithm**

The hash is computed over `validation_evidence` (the methodology data), NOT the pitch_narrative (which may be edited by founders).

```typescript
import { createHash } from 'crypto';

/**
 * Recursively sorts object keys for deterministic serialization.
 * Arrays are serialized in their given order (sorting happens before this).
 */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  // Sort object keys alphabetically
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key =>
    JSON.stringify(key) + ':' + stableStringify((obj as Record<string, unknown>)[key])
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Sort all array fields in BusinessModelCanvas for deterministic hashing.
 * BMC has multiple string array fields that need alphabetical sorting.
 */
function sortBmcArrays(bmc: BusinessModelCanvas): BusinessModelCanvas {
  return {
    ...bmc,
    key_partners: [...(bmc.key_partners || [])].sort(),
    key_activities: [...(bmc.key_activities || [])].sort(),
    key_resources: [...(bmc.key_resources || [])].sort(),
    value_propositions: [...(bmc.value_propositions || [])].sort(),
    customer_relationships: [...(bmc.customer_relationships || [])].sort(),
    channels: [...(bmc.channels || [])].sort(),
    customer_segments: [...(bmc.customer_segments || [])].sort(),
    // cost_structure and revenue_streams may be objects or strings - sort if arrays
    cost_structure: Array.isArray(bmc.cost_structure)
      ? [...bmc.cost_structure].sort()
      : bmc.cost_structure,
    revenue_streams: Array.isArray(bmc.revenue_streams)
      ? [...bmc.revenue_streams].sort()
      : bmc.revenue_streams,
  };
}

function canonicalizeEvidence(evidence: EvidencePackage): string {
  // Hash the validation_evidence section (methodology data)
  // This is immutable and represents the actual evidence
  const hashableData = {
    // Project identity
    project_id: evidence.project_id,
    version: evidence.version,

    // Validation evidence (sorted arrays for determinism)
    validation_evidence: {
      // VPC - sort all arrays for determinism
      vpc: {
        customer_segment: evidence.validation_evidence.vpc.customer_segment,
        customer_jobs: [...evidence.validation_evidence.vpc.customer_jobs].sort(),  // String array - alphabetical
        pains: [...evidence.validation_evidence.vpc.pains]
          .sort((a, b) => a.description.localeCompare(b.description)),
        gains: [...evidence.validation_evidence.vpc.gains]
          .sort((a, b) => a.description.localeCompare(b.description)),
        pain_relievers: [...evidence.validation_evidence.vpc.pain_relievers].sort(),  // String array
        gain_creators: [...evidence.validation_evidence.vpc.gain_creators].sort(),    // String array
        products_services: [...evidence.validation_evidence.vpc.products_services].sort(),  // String array
        fit_assessment: evidence.validation_evidence.vpc.fit_assessment,
      },

      // Customer profile - sort all arrays
      customer_profile: {
        segment_name: evidence.validation_evidence.customer_profile.segment_name,
        jobs_to_be_done: [...evidence.validation_evidence.customer_profile.jobs_to_be_done]
          .sort((a, b) => a.job.localeCompare(b.job)),
        pains: [...evidence.validation_evidence.customer_profile.pains]
          .sort((a, b) => a.pain.localeCompare(b.pain)),
        gains: [...evidence.validation_evidence.customer_profile.gains]
          .sort((a, b) => a.gain.localeCompare(b.gain)),
      },

      // Competitor map - sort competitors by name
      competitor_map: {
        ...evidence.validation_evidence.competitor_map,
        competitors: [...evidence.validation_evidence.competitor_map.competitors]
          .sort((a, b) => a.name.localeCompare(b.name)),
      },

      // BMC - sort any array fields for determinism
      bmc: sortBmcArrays(evidence.validation_evidence.bmc),

      // Experiment results - sort by experiment_id
      experiment_results: [...evidence.validation_evidence.experiment_results]
        .sort((a, b) => a.experiment_id.localeCompare(b.experiment_id)),

      // Gate scores - object with fixed keys
      gate_scores: evidence.validation_evidence.gate_scores,

      // HITL record - sort checkpoints by type then timestamp
      // Uses responded_at if available, falls back to triggered_at (per HITLRecord interface)
      hitl_record: {
        ...evidence.validation_evidence.hitl_record,
        checkpoints: [...(evidence.validation_evidence.hitl_record.checkpoints || [])]
          .sort((a, b) =>
            a.checkpoint_type.localeCompare(b.checkpoint_type) ||
            (a.responded_at ?? a.triggered_at).localeCompare(b.responded_at ?? b.triggered_at)
          ),
      },
    },

    // Integrity metadata (excluding the hash itself)
    integrity: {
      methodology_version: evidence.integrity.methodology_version,
      fit_score_algorithm: evidence.integrity.fit_score_algorithm,
      agent_versions: [...evidence.integrity.agent_versions]
        .sort((a, b) => a.agent_name.localeCompare(b.agent_name)),
    },
  };

  // Use stable stringify for deterministic key ordering
  return stableStringify(hashableData);
}

function computeEvidenceHash(evidence: EvidencePackage): string {
  const canonical = canonicalizeEvidence(evidence);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
```

**Why `stableStringify` instead of `JSON.stringify`?**

`JSON.stringify(obj, replacer)` does NOT sort nested object keys. The `replacer` argument filters/transforms values but doesn't affect key ordering. Different JavaScript engines may serialize `{b: 1, a: 2}` differently, causing hash mismatches across services.

**Alternative**: Use the `json-stable-stringify` npm package for production.

**Canonicalization Rules**

| Rule | Description | Example |
|------|-------------|---------|
| Hash scope | Only `validation_evidence` + `integrity` metadata; NOT `pitch_narrative` | Founder edits don't change hash |
| Object key ordering | All nested object keys sorted alphabetically via `stableStringify` | `{b: 1, a: 2}` → `{"a":2,"b":1}` |
| Object array sorting | Arrays of objects sorted by semantic key (description, name, id, job, pain) | VPC pains sorted by `description` |
| String array sorting | String arrays (`string[]`) sorted alphabetically | `['c','a','b']` → `['a','b','c']` |
| Null/undefined | `stableStringify` converts `null` and `undefined` to `"null"` | `{x: null}` → `{"x":null}` |
| Timestamp format | All timestamps in ISO 8601 UTC format | `2026-02-04T12:00:00.000Z` |
| Number precision | Floats kept as-is (JavaScript number precision) | `0.78333` stays `0.78333` |
| No whitespace | JSON serialized without pretty-printing | `{"key":"value"}` not `{ "key": "value" }` |

**Sorted Arrays Summary**:
- String arrays: Alphabetical sort (`.sort()`)
- Object arrays: Sorted by semantic key field:
  - `pains`: by `description` or `pain`
  - `gains`: by `description` or `gain`
  - `jobs_to_be_done`: by `job`
  - `competitors`: by `name`
  - `experiment_results`: by `experiment_id`
  - `checkpoints`: by `checkpoint_type`, then `responded_at ?? triggered_at`
  - `agent_versions`: by `agent_name`

**Fields Included in Hash**:
- `project_id`, `version`
- `validation_evidence.vpc`, `validation_evidence.customer_profile`, `validation_evidence.competitor_map`
- `validation_evidence.bmc`, `validation_evidence.experiment_results`, `validation_evidence.gate_scores`
- `validation_evidence.hitl_record`
- `integrity.methodology_version`, `integrity.fit_score_algorithm`, `integrity.agent_versions`

**Fields EXCLUDED from Hash**:
- `pitch_narrative` (can be edited by founder)
- `generated_at` (changes on regeneration)
- `access.*` (computed at query time)
- `integrity.evidence_hash` (circular dependency)

**Verification**

The `/api/verify/:verification_token` endpoint recomputes the hash using the same canonicalization algorithm and compares against stored `integrity_hash`. Any mismatch indicates tampering or version skew.

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

1. **Verification URL**: `app.startupai.site/verify/{verification_token}`
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
GET /api/verify/:verification_token
```

**Response** (public, unauthenticated):
```json
{
  "status": "verified" | "outdated" | "not_found",
  "generated_at": "2026-02-04T14:34:00Z",
  "venture_name": "Acme Logistics",
  "evidence_id": "a3f8c2...d1e9b4",
  "generation_hash": "abc123...",
  "current_hash": "abc123...",
  "current_hash_matches": true,
  "evidence_updated_at": "2026-02-04T14:34:00Z",
  "validation_stage_at_generation": "Solution Testing",
  "is_edited": true,
  "alignment_status": "verified",
  "request_access_url": "/connect/request?founder=uuid"
}
```

**Note**: See Response Sanitization table for fields intentionally excluded from public response (e.g., `fit_score_at_generation`).

#### Verification Endpoint Security

The public verification endpoint requires careful security design to prevent abuse while maintaining utility.

**Hash Generation**:

The verification URL uses a full UUID token rather than a truncated SHA-256 hash:

| Approach | Entropy | Attack Surface |
|----------|---------|----------------|
| Truncated SHA-256 (12 chars) | ~48 bits | Enumerable with ~280 trillion attempts |
| Full UUID v4 | 122 bits | Computationally infeasible to enumerate |

- Generate a separate random UUID as `verification_token` (not derived from content)
- Store in `narrative_exports` table alongside the `generation_hash` (per-export, not per-narrative)
- URL format: `app.startupai.site/verify/{verification_token}`
- The `evidence_id` displayed to users remains the truncated SHA-256 for readability
- Each export gets its own token; regeneration creates new exports with new tokens
- Old export tokens continue to work but return `outdated` status

**Rate Limiting**:

```
Per IP Address:
- 30 requests per minute (burst limit)  -- Reduced from 100 per security review
- 500 requests per hour (sustained limit)  -- Reduced from 1,000 per security review

Response when exceeded:
HTTP 429 Too Many Requests
Retry-After: <seconds until reset>
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <unix timestamp>
```

> **Security Note**: Burst limit reduced from 100/min to 30/min based on security review. Legitimate verification use cases (1-2 requests per PDF view) are accommodated while reducing enumeration attack surface.

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
| `is_edited` | Yes | Yes | Transparency about founder customization |
| `alignment_status` | Yes | Yes | Trust signal (Guardian verification) |
| `request_access_url` | Yes | Yes | Lead capture for marketplace |
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
  result: 'verified' | 'outdated' | 'not_found' | 'rate_limited';
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

**Helper: Derive edited slides from edit_history**

```typescript
/**
 * Extract unique slides that have founder edits from edit_history.
 * Only considers edits with edit_source: 'founder' (ignores regeneration changes).
 */
function getFounderEditedSlides(editHistory: EditHistoryEntry[]): Set<SlideKey> {
  return new Set(
    editHistory
      .filter(entry => entry.edit_source === 'founder')
      .map(entry => entry.slide)
  );
}

/**
 * Get the most recent founder edit for each field within a slide.
 * Used to preserve specific customizations during regeneration.
 */
function getSlideEdits(editHistory: EditHistoryEntry[], slide: SlideKey): Map<string, unknown> {
  const edits = new Map<string, unknown>();
  editHistory
    .filter(entry => entry.slide === slide && entry.edit_source === 'founder')
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp)) // Oldest first
    .forEach(entry => edits.set(entry.field, entry.new_value)); // Later overwrites earlier
  return edits;
}
```

**Regeneration Algorithm** (when `preserve_edits: true`):

1. Compute `editedSlides = getFounderEditedSlides(narrative.edit_history)`
2. Generate new narrative from current evidence (full regeneration internally)
3. For each slide in the new narrative:
   - If slide NOT in `editedSlides`: Use new AI-generated content
   - If slide IS in `editedSlides`:
     a. Start with new AI-generated content as base
     b. Get founder edits via `getSlideEdits(edit_history, slide)`
     c. Apply each founder edit to the new content (deep merge)
     d. Re-run Guardian alignment check on merged content
4. Set `is_edited = (editedSlides.size > 0)`
5. Preserve `edit_history` entries with `edit_source: 'founder'`
6. Add new entries with `edit_source: 'regeneration'` for AI changes
7. Increment version, save previous to `narrative_versions`

**Evidence Citation Updates**:

When regenerating, evidence citations within narrative text may become stale (e.g., evidence ID changed, evidence deleted). The regeneration process:

1. Parses citation markers in narrative text: `[evidence:uuid]` or `[interview:uuid]`
2. Maps old evidence IDs to new evidence IDs where possible
3. For unmappable citations:
   - If slide is NOT founder-edited: New AI content won't have stale citations
   - If slide IS founder-edited: Flag as `regeneration_conflict` for founder review

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
    should have entries in `metadata.evidence_gaps[slide_name]` describing
    the gap_type, description, recommended_action, and blocking_publish status.

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

test.describe('Verification integrity after regeneration', () => {
  test('verification returns verified for current export', async () => {
    // Setup: Generate narrative and export PDF
    const narrative = await generateNarrative(projectId);
    const exportResult = await exportNarrative(narrative.id, 'pdf');

    // Act: Verify immediately
    const verification = await verifyNarrative(exportResult.verification_token);

    // Assert: Should be verified (hashes match)
    expect(verification.status).toBe('verified');
    expect(verification.current_hash_matches).toBe(true);
  });

  test('verification returns outdated for pre-regeneration PDF', async () => {
    // Setup: Generate narrative v1 and export
    const narrative = await generateNarrative(projectId);
    const v1Export = await exportNarrative(narrative.id, 'pdf');
    const v1Token = v1Export.verification_token;
    const v1Hash = v1Export.generation_hash;

    // Act: Regenerate narrative (new evidence hash)
    await regenerateNarrative(narrative.id);

    // Act: Verify with v1 token
    const verification = await verifyNarrative(v1Token);

    // Assert: Should be outdated (hash mismatch)
    expect(verification.status).toBe('outdated');
    expect(verification.current_hash_matches).toBe(false);
    expect(verification.generation_hash).toBe(v1Hash);
    expect(verification.current_hash).not.toBe(v1Hash);
  });

  test('new export after regeneration has new token and hash', async () => {
    // Setup: Generate, export, regenerate
    const narrative = await generateNarrative(projectId);
    const v1Export = await exportNarrative(narrative.id, 'pdf');
    await regenerateNarrative(narrative.id);

    // Act: Export again after regeneration
    const v2Export = await exportNarrative(narrative.id, 'pdf');

    // Assert: New export has different token and hash
    expect(v2Export.verification_token).not.toBe(v1Export.verification_token);
    expect(v2Export.generation_hash).not.toBe(v1Export.generation_hash);

    // Verify v2 export is verified
    const verification = await verifyNarrative(v2Export.verification_token);
    expect(verification.status).toBe('verified');
  });

  test('verification returns not_found for invalid token', async () => {
    const verification = await verifyNarrative('invalid-token-uuid');
    expect(verification.status).toBe('not_found');
  });
});

// Phase 3: Marketplace Integration
test.describe('Marketplace Integration', () => {
  test('PH requests more evidence from founder');
  test('founder receives and acts on feedback');
  test('verification endpoint rate limits excessive requests');
});

// RLS Founder Consent Enforcement (Task #17)
test.describe('RLS founder consent enforcement', () => {
  test('connected consultant cannot view package without consent', async () => {
    // Setup: Create connection but founder has NOT granted consent
    const { founder, consultant } = await setupConnection();
    const package = await createEvidencePackage(founder.id, projectId);

    // Ensure consent is NOT granted
    await updatePackage(package.id, { founder_consent: false });

    // Act: Query as consultant
    const { data, error } = await supabaseAsConsultant
      .from('evidence_packages')
      .select('*')
      .eq('id', package.id);

    // Assert: RLS blocks access - returns empty array
    expect(data).toHaveLength(0);
  });

  test('connected consultant CAN view package WITH consent', async () => {
    // Setup: Create connection with consent granted
    const { founder, consultant } = await setupConnection();
    const package = await createEvidencePackage(founder.id, projectId);

    // Grant consent
    await updatePackage(package.id, { founder_consent: true });

    // Act: Query as consultant
    const { data, error } = await supabaseAsConsultant
      .from('evidence_packages')
      .select('*')
      .eq('id', package.id);

    // Assert: Access granted
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(package.id);
  });

  test('founder can always view own packages regardless of consent flag', async () => {
    // Setup: Create package with consent = false
    const founder = await createFounder();
    const package = await createEvidencePackage(founder.id, projectId);
    await updatePackage(package.id, { founder_consent: false });

    // Act: Query as founder
    const { data, error } = await supabaseAsFounder
      .from('evidence_packages')
      .select('*')
      .eq('id', package.id);

    // Assert: Founder can always see their own packages
    expect(data).toHaveLength(1);
  });

  test('consent revocation immediately blocks access', async () => {
    // Setup: Consultant has access initially
    const { founder, consultant } = await setupConnection();
    const package = await createEvidencePackage(founder.id, projectId);
    await updatePackage(package.id, { founder_consent: true });

    // Verify initial access
    let result = await supabaseAsConsultant
      .from('evidence_packages')
      .select('*')
      .eq('id', package.id);
    expect(result.data).toHaveLength(1);

    // Act: Founder revokes consent
    await updatePackage(package.id, { founder_consent: false });

    // Assert: Access immediately blocked
    result = await supabaseAsConsultant
      .from('evidence_packages')
      .select('*')
      .eq('id', package.id);
    expect(result.data).toHaveLength(0);
  });

  test('public package requires both is_public AND founder_consent', async () => {
    // Setup: Create public package without consent
    const founder = await createFounder();
    const package = await createEvidencePackage(founder.id, projectId);
    await updatePackage(package.id, { is_public: true, founder_consent: false });

    const consultant = await createVerifiedConsultant();

    // Act: Query as consultant (no connection, just public access)
    const { data, error } = await supabaseAsConsultant
      .from('evidence_packages')
      .select('*')
      .eq('id', package.id);

    // Assert: Blocked because founder_consent = false
    expect(data).toHaveLength(0);
  });
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
- [ ] **Test fixtures**: Update test fixtures and contract tests to include new required fields:
  - `overview.industry`, `overview.novel_insight`, `overview.one_liner`
  - `traction.growth_metrics[]`, `traction.assumptions_validated[]`
  - `customer.persona_summary`, `customer.target_first`, `customer.segment_prioritization`
  - `team.members[]` array structure (replacing flat fields)
  - `business_model.unit_economics` inline structure
  - All slide-level required fields per updated schema
- [ ] Build narrative preview component (Founder Dashboard)
- [ ] Implement soft/hard staleness detection triggers
- [ ] Add PDF export with verification footer (URL + QR code)
- [ ] Implement `/api/verify/:verification_token` public endpoint
- [ ] Validate A11 (Founder Narrative Value) concurrent with A6 interviews
- [ ] **Dogfooding checkpoint**: Before Phase 1 launch
  - [ ] Generate narrative for chris00walker@proton.me test founder account
  - [ ] Export PDF and verify verification URL resolves
  - [ ] Preview evidence package as consultant account
  - [ ] Document any UX friction for iteration
- [ ] **Marketing assets**
  - [ ] Implement OG image generation endpoint (`/api/og/evidence-package/[id]`) using satori + @resvg/resvg-js
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

### Font Bundling for @react-pdf/renderer

`@react-pdf/renderer` requires fonts to be explicitly registered - it does not inherit system fonts or CSS `@font-face` declarations.

**Required Setup**:

```typescript
// lib/pdf/fonts.ts
import { Font } from '@react-pdf/renderer';

// Register fonts from public directory or CDN
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Fallback for special characters
Font.registerHyphenationCallback((word) => [word]);
```

**Font Files Required** (add to `public/fonts/`):
- `Inter-Regular.ttf` (body text)
- `Inter-Medium.ttf` (labels)
- `Inter-SemiBold.ttf` (headlines)
- `Inter-Bold.ttf` (emphasis)

**Bundle Size Considerations**:
- Each TTF file is ~100-300KB
- Total font bundle: ~800KB-1.2MB
- Fonts are loaded once per serverless cold start
- Consider using woff2 for smaller size if supported

**Alternative: CDN-hosted fonts**:
```typescript
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
});
```

**Testing Checklist**:
- [ ] Verify fonts render correctly in exported PDF
- [ ] Test with non-ASCII characters (accents, symbols)
- [ ] Confirm PDF file size is reasonable (<5MB for 10 slides)
- [ ] Verify fonts work in Netlify serverless environment

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
- `metadata.evidence_gaps['team']`: `{ gap_type: 'missing', description: "Founder profile incomplete — add professional background for stronger Team slide", recommended_action: "Complete founder profile in dashboard", blocking_publish: false }`

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
| 2026-02-05 | **Publication state machine** with draft/published states             | Narratives need a clear sharing gate; PHs should only see reviewed, complete narratives; founders control visibility                                                                      |
| 2026-02-05 | **Generation prerequisites defined** with required vs optional fields | Prevents speculative narratives; allows generation with placeholders for founder-input fields; evidence gaps track what's missing                                                        |
| 2026-02-05 | **HITL review required for first publication**                        | Founders must take ownership of AI-generated content before sharing with investors; subsequent edits don't require re-review unless flagged                                              |
| 2026-02-05 | **Option B (generate first, prompt to fill)** recommended for Phase 1 | Faster time-to-value; founders see immediate results; publish gate catches gaps before sharing; Option A (pre-step) deferred to Phase 2                                                  |
| 2026-02-05 | **Verification tokens are per-export, not per-narrative**             | Per-export tokens allow detecting stale PDFs after regeneration. Each export has its own `verification_token` and `generation_hash`; old exports show "outdated" status while new exports show "verified". Supports: (1) integrity verification of externally-shared PDFs, (2) export audit trail, (3) lead capture from external investors. |

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
| **Verification URL**             | Public URL (`app.startupai.site/verify/{verification_token}`) that validates an exported PDF's integrity and freshness                           |
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
| 2026-02-04 | 1.6     | **Design team contributions**: Visual Designer and Graphic Designer additions. Changes: (1) Added PDF Brand Guidelines with slide specs, typography stack, and header/footer treatment. (2) Fixed evidence hierarchy color tokens to use brand palette (--accent, --primary, --muted-foreground). (3) Added Methodology Verified Badge specification. (4) Added Marketing Asset Specifications section with OG image template, Cover slide placeholder design, and shareable assets table. (5) Deferred AI-generated visuals to Phase 4+. (6) Updated Phase 1/2 checklists with marketing asset tasks. |
| 2026-02-04 | 1.7     | **Critical fixes from 18-agent swarm review**: (1) Fixed RLS policy FK mismatch: `cc.founder_id` → `cc.client_id` to match actual `consultant_clients` schema. (2) Fixed RLS policies using non-existent `consultant_verification_status` column to use existing `role = 'consultant'` pattern. (3) Added missing RLS policies: INSERT/DELETE for `pitch_narratives`, SELECT for `narrative_versions`. (4) Reduced rate limiting from 100/min to 30/min per security review (enumeration attack surface reduction). (5) Added 10 missing TypeScript interfaces: `RelationshipType`, `ValuePropositionCanvas`, `CustomerProfile`, `CompetitorMap`, `BusinessModelCanvas`, `ExperimentResult`, `GateScores`, `HITLRecord`, `AlignmentIssue`, `EditHistoryEntry`. (6) Added prerequisite note for staleness triggers referencing non-existent tables (`gate_scores`, `customer_profiles`). |
| 2026-02-04 | 1.8     | **Batch 1 refinements**: (1) Added `evidence_gaps` field to PitchNarrative metadata for tracking missing/weak evidence per slide. (2) Added RLS policies for analytics: founders can view access to their packages, PHs can INSERT/UPDATE access records. (3) Added comprehensive Hash Canonicalization Rules section with algorithm, sorting rules, and verification notes. (4) Replaced `@vercel/og` with `satori + @resvg/resvg-js` for Netlify-compatible OG image generation. (5) Verified staleness single source of truth on `projects` table (per v1.7). (6) Verified verification URL uses `verification_token` consistently throughout spec. |
| 2026-02-04 | 1.9     | **Batch 2 refinements**: (1) Enhanced `EditHistoryEntry` with `slide` field for per-slide edit tracking, added `SlideKey` type and `edit_source` discriminator. (2) Aligned `professional_summary` limits: 500 chars stored, 200 chars displayed in pitch. Added `years_experience` to FounderProfile. (3) Added comprehensive `evidence_category` migration rules with SQL backfill strategy and mapping table. (4) Clarified `access.shared_with` is computed from `evidence_package_access` table, not stored. (5) Added Font Bundling section for `@react-pdf/renderer` with setup code, file requirements, and testing checklist. |
| 2026-02-04 | 2.0     | **Batch 3 refinements (spec complete)**: (1) Added EvidencePackage schema-to-DB mapping table clarifying API response vs database storage. (2) Added `is_edited` and `alignment_status` to verification endpoint response with field notes. (3) Added EXCEPTION handlers to `mark_narrative_stale()` trigger with fallback behavior for schema mismatches. (4) Added Timestamp Semantics table and `last_updated` field to PitchNarrative. (5) Added MarketSize normalization rules with conversion formulas, implementation code, and display formatting. (6) Added alignment_status state transition documentation with explicit rules for edit → pending → verified/flagged flow. |
| 2026-02-04 | 2.1     | **Schema/RLS fixes**: (1) Added `WITH CHECK` clause to `founder_profiles FOR ALL` RLS policy for INSERT/UPDATE operations. (2) Added analytics tables RLS guidance: service-role only access with commented future user-facing policies. (3) Updated narrative caching logic to reference `projects.narrative_is_stale` instead of removed field, with explicit cache check and invalidation SQL queries. |
| 2026-02-04 | 2.2     | **Contract alignment**: (1) Aligned verification endpoint to use `/api/verify/:verification_token` consistently (removed `{short-hash}` references). (2) Removed `fit_score_at_generation` from public verification response per sanitization table security rationale. (3) Added `is_edited`, `alignment_status`, `request_access_url` to Response Sanitization table. (4) Rewrote hash canonicalization to use actual EvidencePackage fields (`validation_evidence.*` instead of non-existent fields). (5) Added `stableStringify` function for deterministic nested key ordering (fixes `JSON.stringify` limitation). (6) Clarified hash scope: validation_evidence + integrity metadata only; pitch_narrative excluded so founder edits don't change hash. |
| 2026-02-04 | 2.3     | **Regeneration algorithm fix**: (1) Added `getFounderEditedSlides()` and `getSlideEdits()` helper functions to derive per-slide edit status from `edit_history`. (2) Rewrote regeneration algorithm to use actual schema: computes edited slides from edit_history, applies founder edits via deep merge, tracks edit_source for each change. (3) Added Evidence Citation Updates section explaining how stale citations are handled during regeneration. (4) Added SQL note to pitch_narratives schema showing how to query per-slide edits from JSONB. (5) Removed references to non-existent per-slide `is_edited` and `content` fields. |
| 2026-02-04 | 2.4     | **Hash/Glossary consistency**: (1) Fixed HITL checkpoint sorting to use `responded_at ?? triggered_at` instead of non-existent `approved_at` field (aligns with HITLRecord interface). (2) Updated Glossary "Verification URL" term to use `{verification_token}` instead of `{hash}`. |
| 2026-02-04 | 2.5     | **Canonicalization completeness**: (1) Replaced SQL note for per-slide edits with reference to TypeScript helper functions (SQL was returning regeneration edits incorrectly). (2) Extended canonicalization to sort ALL arrays: string arrays alphabetically, added `sortBmcArrays()` helper for BMC fields. (3) Explicitly listed all VPC and CustomerProfile fields in canonicalization (not using spread). (4) Updated Canonicalization Rules table with separate rules for object arrays vs string arrays, added Sorted Arrays Summary. |
| 2026-02-05 | 3.0     | **Get Backed framework integration**: Complete slide-by-slide specification update based on _Get Backed_ (Baehr & Loomis). Each slide now includes: Purpose statement ("What is it?"), What to demonstrate, Quality checks ("What questions must this slide answer?"), and field-to-question mappings. **Schema expansions**: Cover (branding, document metadata), Overview (one_liner, industry, novel_insight), Opportunity (market_confusion), Problem (pain_narrative, affected_population, customer_story, why_exists), Solution (use_cases, demo_assets, ip_defensibility), Traction (growth_metrics, assumptions_validated, sales_process), Customer (persona_summary, demographics, willingness_to_pay, acquisition fields, paying_customers), Competition (primary/secondary_competitors, potential_threats, positioning_map, incumbent_defense), Business Model (split VPD-verified vs optional founder-supplied per Unit Economics Only decision), Team (members[] array, advisors[], investors[], hiring_gaps, team_culture with persistence note), Use of Funds (allocations[], milestones[] with success_criteria). **Consistency fixes**: Aligned all field tables with TypeScript schema, fixed evidence_gap → metadata.evidence_gaps, removed unused UnitEconomics type, added test fixture checklist. |
| 2026-02-05 | 3.1     | **Beyond Architecture: Story, Design, and Text**: Added comprehensive guidance for the 75% of pitch deck work that goes beyond slide architecture. **Story section**: Four story archetypes (Origin, Customer, Industry, Venture Growth) with elements for each, what makes a great story (things happen, vivid sensory details, conflict), story-to-slide mapping table, example arc diagram, and StartupAI story generation support. **Design section**: Five key elements (Layout, Typography, Color, Images/Photography, Visualized Data) with guidance for each, links to existing PDF Brand Guidelines. **Text section**: Four key elements (Writing Style, Voice and Tone, Format, When Words Are Not Enough) with techniques table for making evidence compelling. Critical insight: "Your evidence will not speak for itself." Updated Table of Contents. |
| 2026-02-05 | 3.2     | **Generation Prerequisites and Narrative Publication**: (1) Added Generation Prerequisites section defining minimum required evidence for narrative generation (project basics, at least one hypothesis, customer profile, VPC). (2) Defined founder-input field categories: required for generation (`company_name`, `industry`), optional with placeholder (`sales_process`, `acquisition_channel`, `ask_amount`, `ask_type`, `logo_url`, `hero_image_url`), and optional for richness (`linkedin_url`, `ip_defensibility`, `other_participants`). (3) Added evidence gaps for missing inputs with `blocking_publish` flag. (4) Documented UI flow options: Option A (pre-step) vs Option B (generate first), recommending Option B for Phase 1. (5) Added Narrative Publication section defining draft/published states, publication gate requirements (no blocking gaps, alignment passed, HITL review, not hard-stale), HITL review checkpoint flow for first publication, unpublish flow. (6) Added `is_published`, `first_published_at`, `last_publish_review_at` to `pitch_narratives` schema. (7) Added `POST /api/narrative/:id/publish` and `POST /api/narrative/:id/unpublish` API endpoints with request/response schemas. (8) Added publication metrics (`time_to_first_publish`, `publish_gate_failure_reasons`, `unpublish_rate`, `edit_after_publish_rate`). Updated Table of Contents, Decision Log. |
| 2026-02-05 | 3.3     | **Per-export verification tokens**: Architectural decision that verification tokens are per-export, not per-narrative. (1) Deprecated `verification_token` column on `pitch_narratives` table. (2) Added `narrative_exports` table with: `id` UUID PK, `narrative_id` UUID FK, `verification_token` UUID UNIQUE, `generation_hash` VARCHAR(64), `export_format` VARCHAR(10), `exported_at` TIMESTAMPTZ. (3) Updated Verification Endpoint Security section to reference `narrative_exports` table. (4) Updated `evidence_package_access.verification_token_used` FK reference. (5) Added Decision Log entry documenting rationale: per-export allows detecting stale PDFs after regeneration; old exports show "outdated" status while new exports show "verified". |
