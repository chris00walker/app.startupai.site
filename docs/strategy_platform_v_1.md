# Windsurf Design Specification — Evidence‑Led Strategy Platform (v1)

**Product Codename:** Moat Compass  
**Date:** Sept 2, 2025  
**Owner:** Chris Walker  
**Primary Moat:** Data  
**Supporting Moats:** Trust, Distribution  
**Reference:** “The Moat Compass — Moat‑First Edition (Complete Draft v1)” (current canvas)

> Goal: Provide Windsurf with a complete, mock‑ready spec to prototype the **non‑linear, hard‑gated** Customer Discovery → Customer Development lifecycle with evidence‑backed decisions.

---

## 0. Scope of This Mock (MVP Prototype)

**In‑scope screens & flows (end‑to‑end happy path + key edge cases):**

1) **Guided Intake** (homepage → new project)  
2) **Hypothesis Hub** (create/manage assumptions & hypotheses per segment)  
3) **Evidence Inbox** (ingest URLs, notes, interviews; link to hypotheses)  
4) **Experiment Planner** (register W/M/S tests; map to hypotheses; run/record outcome)  
5) **Gate Scorecard** (DESIRABILITY / FEASIBILITY / VIABILITY) with pass/fail logic  
6) **Fit Dashboard** (project overview; Stage Badges; risk budget; revert notices)  
7) **Report Composer** (citations, confidence chips, limitation banner)  
8) **Share Flow** (Evidence Stamp + referral token; Stage Badge embed)  
9) **Gate Policy Editor** (config‑as‑data JSON with form UI)  
10) **Audit Log** (tamper‑evident events + override trail)

**Out‑of‑scope for this mock:** auth, payments, real integrations (use stubs), model training/inference (use fake responses), SSO.

---

## 1. Personas & Jobs‑to‑Be‑Done

**P1: Lead Consultant (LC)** — orchestrates discovery/development, decides gates.  
**P2: Program Manager (PM)** — monitors portfolio, enforces governance, approves overrides.  
**P3: Client Stakeholder (CS)** — reviews reports, approves budgets, needs transparent proof.

**Top JTBD:**

- LC: “Prioritize hypotheses, run rigorous tests, **don’t let us pass a gate** without proof.”
- PM: “See risk, cycle time, revert risk; ensure overrides are justified.”
- CS: “Understand **why** we recommend this plan, with sources and confidence.”

---

## 1.1 System Overview & Data Flow (for Mock)

### End-to-End System (@ chriswalker.consulting)

```mermaid
flowchart TD
A[Entrepreneur / Agency Client]
  --> B[Next.js Frontend @ chriswalker.consulting]
B --> C[Agentuity Orchestration Layer]
C --> D[CrewAI Backend (Python, Cloud Run on GCP)]
D --> E[(GCP Cloud SQL / Firestore)]
E --> F[(GCP BigQuery + Dataflow)]
F --> G[(Vertex AI Feature Store + Models)]
G --> G1[Satisfaction Predictor]
G --> G2[Validation Recommender]
G --> G3[Copy Optimizer]
G --> H[QA Agent in CrewAI]
(Calls Vertex AI endpoints)
H --> I[(Google Cloud Storage)]
(Final deliverables: PDF/Markdown/Notion-ready)
I --> J[Agentuity + Next.js Dashboard]
(Client-facing package)
```

**Data Flow (mocked):**

1. Client engages via **Next.js** (tiers: Sprint, Platform, Co-Pilot).
2. **Agentuity** runs onboarding → produces **Entrepreneur Brief JSON**.
3. Brief sent to **CrewAI** → executes 6-agent crew.
4. Deliverables & logs → **Cloud SQL** (structured) + **Cloud Storage** (files).
5. Engagement data → **BigQuery view** → **Vertex AI pipeline**.
6. Models trained & deployed → **QA Agent** calls them in real time.
7. Final QA-approved deliverables returned to **Agentuity + Next.js** client portal.

**System Components (summary):**

- **Frontend (Next.js):** website, pricing, client portal; auth stubbed; dashboard of runs.
- **Agentuity (Orchestration):** onboarding conversations → JSON brief; triggers CrewAI via API; displays deliverables.
- **CrewAI Backend (Cloud Run):** 6 agents (Onboarding, Customer Researcher, Competitor Analyst, Value Designer, Validation Agent, QA Agent); generates Entrepreneur Brief, Customer Profile, Competitor Map, Value Prop Canvas, Validation Roadmap, QA Report; stores outputs in GCP.
- **GCP Infra:** Cloud SQL (structured data), Cloud Storage (files), BigQuery (analytics), Dataflow (feature engineering), Vertex AI (feature store + models/endpoints).
- **Vertex AI Models:** Satisfaction Predictor, Validation Recommender, Copy Optimizer — deployed as endpoints; invoked by QA Agent during runs.

**Feedback Loop:**

- Client gives **explicit ratings** and **implicit signals** (downloads, repeats). Data → SQL → BigQuery → Dataflow → Vertex AI Feature Store → training → redeploy.
- **QA Agent** incorporates latest rules/scores; future deliverables improve.

---

## 2. Information Architecture & Navigation

**Topbar:** Project switcher • Notifications • Help • Profile  
**Sidebar:** Fit Dashboard ▸ Hypothesis Hub ▸ Evidence Inbox ▸ Experiment Planner ▸ Gate Scorecard ▸ Report Composer ▸ Settings (Gate Policy, Integrations) ▸ Audit Log

---

## 3. Screen Specs

### 3.1 Guided Intake

**Purpose:** Create a project with initial assumptions & target segment.  
**Key Components:**

- Segment selector (ICP, JTBD, market slice)
- Assumption quick‑add (3 prompts)
- CTA: **Create Project**
**Data Elements:** project_id, segment, initial assumptions[]
**Interactions:** on submit → create project → route to **Hypothesis Hub**
**Events:** `session_start`, `assumption_created`
**Acceptance:** new project appears in switcher; three assumptions visible on Hub

### 3.2 Hypothesis Hub

**Purpose:** Manage hypotheses linked to assumptions; set risk & stage.  
**Components:** Hypothesis table, Risk chips (High/Med/Low), Stage chip (Discovery/Development), Add Hypothesis modal  
**Data:** hypothesis_id, assumption_id, stage, risk_level, target_segment  
**Interactions:** create/edit/retire; bulk link evidence; send to Experiment Planner  
**Events:** `hypothesis_created`, `hypothesis_retired`, `risk_budget_updated`
**Acceptance:** hypotheses sortable; status reflected on Gate Scorecard counters

### 3.3 Evidence Inbox

**Purpose:** Ingest and curate evidence; link to hypotheses.  
**Components:** Add evidence (URL/file/note), Auto‑citation (source type, date), Relevance vote, Linker  
**Data:** evidence_id, source_type, uri, recency, authority_score, linked_hypotheses[]  
**Interactions:** paste URL → fetch metadata → link to hypothesis → vote relevance  
**Events:** `evidence_added`, `evidence_linked`  
**Acceptance:** linked items show up on Scorecard under DESIRABILITY evidence

### 3.4 Experiment Planner

**Purpose:** Register tests per hypothesis with strength W/M/S; log outcomes.  
**Components:** Experiment cards (strength badge), Design fields (metric, effect target), Run status, Outcome entry  
**Data:** experiment_id, hypothesis_id, strength, success_metric, expected_effect, result, effect_size, kpi_delta  
**Interactions:** add/edit; mark run complete; log outcomes  
**Events:** `experiment_registered`, `experiment_outcome_logged`  
**Acceptance:** Gate Scorecard tallies strength mix; outcomes drive pass/fail

### 3.5 Gate Scorecard (DESIRABILITY / FEASIBILITY / VIABILITY)

**Purpose:** Enforce hard gates; block progress without evidence.  
**Components:**

- Gate header (Stage, status: Pending/Passed/Failed)
- **Criteria checklist** with progress bars (e.g., min experiments, strength mix, thresholds)
- **Attempt Gate** button → evaluates policy → pass/fail modal
- **Override** button (role‑gated) → rationale textarea → approval chain
- **Stage Badge** (appears only on pass)
**Data:** gate_attempts[], gate_status, failing_criteria[], score  
**Events:** `gate_attempted`, `gate_passed`, `gate_failed`  
**Acceptance:**
- If failed: shows failing criteria & suggestions; creates `stage_reverted` when applicable  
- If passed: Stage Badge issued; **Fit Dashboard** moves project forward

### 3.6 Fit Dashboard

**Purpose:** Portfolio‑style project overview, stage progress, risk & budget.  
**Components:** Stage timeline (Discovery → Feasibility → Viability → Scale), Badges, Risk budget widget, Revert banner, KPIs  
**Events:** derived totals; `risk_budget_updated`, `stage_reverted`
**Acceptance:** reflects latest gate status; shares badge on pass

### 3.7 Report Composer

**Purpose:** Author client‑ready outputs with transparent reasoning.  
**Components:** Section blocks (VPC/BMC/Experiments), **Citation pills**, **Confidence chips**, **Limitation banner**, Export (Notion/Slides JSON)  
**Data:** references to evidence, experiments, hypotheses; confidence scores  
**Events:** `report_generated`, `report_viewed` (with `citation_clicked_bool`)
**Acceptance:** all claims show at least one citation; banner appears if evidence thin

### 3.8 Share Flow

**Purpose:** Distribution loops.  
**Components:** **Evidence Stamp** card (title, key claims, citations, confidence chips), **Referral token** generator, **Stage Badge** embed (Notion/Docs snippet)  
**Events:** `report_shared` (channel, referral_token)  
**Acceptance:** copyable snippet; mocked landing shows referral attribution

### 3.9 Gate Policy Editor (Config‑as‑Data)

**Purpose:** Edit JSON policy via safe form, with preview of pass/fail computation.  
**Components:** JSON editor pane + form fields (min experiments, strength mix, thresholds), Validator  
**Data:** policy JSON (see Appendix H)  
**Events:** policy save audit  
**Acceptance:** saving updates policy referenced by Gate Scorecard

### 3.10 Audit Log

**Purpose:** Trust & governance trail.  
**Components:** filterable table (event, actor, payload hash, timestamp), detail drawer with before/after  
**Events:** show all 19 events; highlight gate overrides  
**Acceptance:** tamper‑evident hash column displayed

---

## 4. Component Library (for Windsurf UI)

| Component | Props | Behavior |
|---|---|---|
| **Stage Badge** | `stage: 'DESIRABILITY'\|'FEASIBILITY'\|'VIABILITY'`, `date`, `project_id` | Renders badge; copy embed snippet |
| **Confidence Chip** | `score: 0..1`, `explanation` | Tooltip shows why; color ramps A11y AA |
| **Citation Pill** | `source_type`, `date`, `uri` | Opens source; tracks `citation_clicked_bool` |
| **Evidence Card** | `title`, `source_type`, `recency`, `authority_score`, `linked_hypotheses[]` | Vote relevance; link/unlink |
| **Hypothesis Row** | `text`, `risk_level`, `stage`, `status` | Inline edit; retire |
| **Experiment Card** | `strength`, `metric`, `expected_effect`, `status`, `result` | Logs outcome; computes effect_size |
| **Gate Criteria Item** | `label`, `target`, `actual`, `pass` | Used in Scorecard checklist |
| **Referral Modal** | `report_id`, `channel`, `token` | Generates token; copies link |
| **Risk Budget Widget** | `planned`, `actual`, `delta` | Updates via `risk_budget_updated` |

**Style:** Tailwind + shadcn/ui + lucide icons; rounded‑2xl cards; soft shadows; AA contrast; motion via Framer Motion (subtle fades/slide‑ins; 150–250ms).

**Color mapping:**  

- Gate statuses: **Green=#16a34a**, **Amber=#f59e0b**, **Red=#ef4444**, **Gray=#6b7280**  
- Confidence chip ramp: 0–1 scaled to Gray→Amber→Green  
- Evidence types: Interview=Indigo, Desk=Sky, Analytics=Emerald, Competitor=Rose

---

## 5. State Machine & Gate Logic

```mermaid
stateDiagram-v2
[*] --> Discovery_Desirability
Discovery_Desirability --> Discovery_Desirability: Run W/M/S experiments
Discovery_Desirability --> Development_Feasibility: Gate DESIRABILITY passed
Discovery_Desirability --> [*]: Project killed (fails gate)
Development_Feasibility --> Development_Feasibility: Build/Measure/Learn
Development_Feasibility --> Development_Viability: Gate FEASIBILITY passed
Development_Feasibility --> Discovery_Desirability: Demand contradicted
Development_Viability --> Scale: Gate VIABILITY passed
Development_Viability --> Development_Feasibility: Unit economics fail
Scale --> [*]
```

**Evaluation Order:** Desirability → Feasibility → Viability.  
**Overrides:** RBAC‑gated; requires `justification` + `approver`; writes to audit log.

**Gate Scorecards (default policy):**

- **DESIRABILITY:** ≥3 experiments incl. ≥1 medium & ≥1 strong; CTR ≥3% **and** signup ≥15%; ≥8 interviews; theme_consistency ≥0.7.
- **FEASIBILITY:** prototype pass‑rate ≥90%; supply chain verified; SLA achievable; COGS within target.
- **VIABILITY:** LTV:CAC ≥2.5; gross margin ≥40%; payback ≤9m; churn within target.

---

## 6. Data Model (Front‑End Oriented for Mock)

```ts
// Core
type Project = { id: string; name: string; segment: string; stage: 'DES'|'FEA'|'VIA'|'SCALE'; riskBudget: {planned:number; actual:number} };

type Assumption = { id:string; projectId:string; text:string; riskLevel:'High'|'Med'|'Low'; createdAt:string };

type Hypothesis = { id:string; projectId:string; assumptionId:string; stage:'Discovery'|'Development'; targetSegment:string; status:'Open'|'Retired' };

type EvidenceItem = { id:string; sourceType:'interview'|'desk'|'competitor'|'analytics'; uri?:string; date:string; authorityScore:number; linkedHypotheses:string[] };

type Experiment = { id:string; hypothesisId:string; strength:'weak'|'medium'|'strong'; successMetric:string; expectedEffect:number; status:'Planned'|'Running'|'Complete'; result?:'success'|'neutral'|'failure'; effectSize?:number; kpiDelta?:Record<string,number> };

type GateAttempt = { id:string; projectId:string; gate:'DESIRABILITY'|'FEASIBILITY'|'VIABILITY'; criteriaSnapshot:any; passed:boolean; score:number; failingCriteria?:string[]; attemptedAt:string };

type GateStatus = { projectId:string; desirability:'Pending'|'Passed'|'Failed'; feasibility:'Pending'|'Passed'|'Failed'; viability:'Pending'|'Passed'|'Failed' };

type Report = { id:string; projectId:string; sections:{id:string; title:string; content:string; citations:EvidenceItem[]; confidence:number}[] };
```

---

## 7. API Contracts (Mocked)

**Base:** `/api` (all stubbed by Windsurf)

### 7.1 Projects

- `POST /projects` → `{id, name, segment}`  
- `GET /projects/:id` → `Project`

### 7.2 Hypotheses & Assumptions

- `POST /assumptions` → `Assumption`  
- `POST /hypotheses` → `Hypothesis`  
- `PATCH /hypotheses/:id` → `Hypothesis`

### 7.3 Evidence & Experiments

- `POST /evidence` → `EvidenceItem`  
- `POST /evidence/:id/link` → `{ok:true}`  
- `POST /experiments` → `Experiment`  
- `PATCH /experiments/:id/outcome` → `Experiment`

### 7.4 Gates

- `POST /gates/:projectId/attempt` → `GateAttempt` (evaluates policy)  
- `POST /gates/:projectId/override` (role‑gated) → `{ok:true}`  
- `GET /gates/:projectId/scorecard` → `{policy, status, attempts[]}`

### 7.5 Reports & Share

- `POST /reports` → `Report`  
- `POST /reports/:id/share` → `{token, url, stageBadgeEmbed}`

### 7.6 Policy & Audit

- `GET /policy` / `PUT /policy` → JSON policy  
- `GET /audit` → `[{event,type,actor,timestamp,hash}]`

**Sample Response — Gate Attempt (fail):**

```json
{
  "id": "ga_123",
  "projectId": "prj_42",
  "gate": "DESIRABILITY",
  "criteriaSnapshot": {
    "experiments": {"total": 2, "mix": {"weak": 1, "medium": 1, "strong": 0}},
    "ctr": 0.021, "signup": 0.12, "interviews": 6, "theme_consistency": 0.62
  },
  "passed": false,
  "score": 0.58,
  "failingCriteria": ["min_experiments","required_strength_mix","ctr","signup","interviews","theme_consistency"],
  "attemptedAt": "2025-09-02T13:04:00Z"
}
```

---

## 8. Analytics & Telemetry (Events)

Implement these **19** events (append‑only; include `project_id`, `user_id`, `timestamp`, `version`):

1) `session_start`
2) `assumption_created`
3) `hypothesis_created`
4) `evidence_added`
5) `evidence_linked`
6) `experiment_registered`
7) `recommendation_proposed`
8) `recommendation_edited`
9) `fit_status_set`
10) `gate_attempted`
11) `gate_passed`
12) `gate_failed`
13) `experiment_outcome_logged`
14) `stage_reverted`
15) `report_generated`
16) `report_viewed` (prop: `citation_clicked_bool`)
17) `report_shared` (props: `channel`, `referral_token`)
18) `hypothesis_retired`
19) `risk_budget_updated`

**Dashboards to include in mock:** gate pass rates, cycle time per gate, revert rate, evidence mix coverage, edit‑accept, TTFX, citation precision, evidence CTR, share→signup.

---

## 9. Integrations (Stubbed)

- **Notion Embed:** copyable snippet; mock success message.  
- **Google Docs Export:** JSON preview; fake download.  
- **HubSpot:** toggle that marks “write‑back enabled” (no network call).

---

## 10. Sample Data Seeds (for the mock)

**Project:** Elias Food Imports (EFI) — *B2B food importer serving chefs & specialty retailers*  

- 3 assumptions; 5 hypotheses (Discovery), risks High/Med  
- Evidence: 10 items (mix of interview/desk/competitor/analytics)  
- Experiments: W=2, M=2, S=1 (two completed with outcomes)  
- First **gate_attempted** for DESIRABILITY → **fail**, then additional tests → **pass**; Stage Badge issued  
- Feasibility underway with prototype pass‑rate 92%

---

## 11. Acceptance Criteria (per flow)

**Guided Intake:** creates project with 3 assumptions; routes to Hub.  
**Hypothesis Hub:** can add/edit/retire; status reflects on Scorecard.  
**Evidence Inbox:** save evidence with citation; link to hypotheses; relevance vote persists.  
**Experiment Planner:** create experiments with strength; can log outcomes; effect_size computed.  
**Gate Scorecard:** “Attempt Gate” computes result from policy; failure lists failing criteria; pass issues Stage Badge; override requires role + rationale and writes audit record.  
**Fit Dashboard:** shows current stage, badge(s), risk budget; revert banner appears when stage reverses.  
**Report Composer:** every claim shows at least one citation; confidence chips render; limitation banner shows if thin evidence.  
**Share Flow:** Evidence Stamp shows citations & confidence; referral token copy works; mock landing records `report_shared`.  
**Audit Log:** lists chronological events with actor and hash.

---

## 12. Non‑Functional (for the mock)

- **Accessibility:** keyboard nav on forms; chips/badges have aria‑labels; contrast AA.
- **Performance:** mock fetch ≤300ms artificial delay to feel real.
- **Error/Empty States:** provide placeholder copy for Inbox/Planner/Scorecard when empty.

---

## 13. Future (Post‑Mock)

- Real SSO/RBAC; SOC posture; evaluator governance dashboard  
- Real Notion/Docs/HubSpot connectors with write‑back  
- Distilled specialists; weekly retraining; evaluator regression tests

---

> "Commit to the Lord whatever you do, and He will establish your plans." — Proverbs 16:3  
**Design intent:** Faithful stewardship of truth; gates keep us honest; badges help the truth spread.
