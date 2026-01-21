---
purpose: "Comprehensive user stories with acceptance criteria linked to E2E tests"
status: "active"
last_reviewed: "2026-01-21"
---

# User Stories

**Status:** Active
**Personas Reference:** [`user-personas.md`](./user-personas.md)

This document contains all user stories for the StartupAI platform. Each story includes acceptance criteria in Given/When/Then format and maps to E2E tests for verification.

---

## Story Format

```
### US-[X]##: Story Title

**As a** [Role],
**I want to** [Action],
**So that** [Business Value].

**Acceptance Criteria:**

**Given** [precondition]
**When** [action]
**Then** [expected result]

**E2E Test:** `file.spec.ts` - "test description"
**Journey Reference:** `journey-map.md` - Step/Phase X
```

---

## Founder Stories (US-F)

### US-F01: Complete Quick Start Onboarding

> **Updated (2026-01-19)**: The 7-stage AI conversation was replaced by Quick Start. See [ADR-006](../../startupai-crew/docs/adr/006-quick-start-architecture.md).

**As a** Founder,
**I want to** submit my business idea via Quick Start,
**So that** my business idea is captured for strategic analysis.

**Acceptance Criteria:**

**Given** I am logged in as a Founder or Trial user
**When** I navigate to `/onboarding/quick-start`
**Then** I should see the Quick Start form with business idea input

**Given** I have entered my business idea (min 10 characters)
**When** I click "Start Validation"
**Then** Phase 1 should begin automatically and I should see progress

**Given** Phase 1 has completed BriefGenerationCrew
**When** the AI-generated Founder's Brief is ready
**Then** I should see the `approve_discovery_output` HITL checkpoint

**E2E Test:** `02-onboarding-flow.spec.ts` - "should complete Quick Start form" (needs update)
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

### US-F02: View Founder Dashboard

**As a** Founder,
**I want to** view my dashboard with analysis results,
**So that** I can understand my business validation status.

**Acceptance Criteria:**

**Given** I am logged in as a Founder with a completed onboarding
**When** I navigate to `/founder-dashboard`
**Then** I should see the Innovation Physics Panel with D-F-V signals

**Given** I am on the Founder dashboard
**When** I click between tabs (Canvases, Experiments, Evidence)
**Then** I should see the relevant content for each tab

**Given** I have AI analysis results
**When** I view the dashboard
**Then** I should see AI Founder attribution (Sage, Forge, Pulse, etc.)

**E2E Test:** `04-founder-analysis-journey.spec.ts` - "should display founder dashboard after login"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 14

---

### US-F03: Review HITL Checkpoint

**As a** Founder,
**I want to** review and approve AI-generated insights at checkpoints,
**So that** I can validate the analysis before it proceeds.

**Acceptance Criteria:**

**Given** CrewAI has generated insights requiring approval
**When** I navigate to `/approvals`
**Then** I should see pending approval cards with evidence summaries

**Given** I am viewing an approval detail
**When** I click on an approval card
**Then** I should see the full evidence summary and decision options

**Given** I have reviewed an approval
**When** I select "Approve" or "Request Revision" with feedback
**Then** the approval status should update and the workflow should continue

**E2E Test:** `05-hitl-approval-flow.spec.ts` - "should display approval stats cards"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 13

---

### US-F04: Archive Project

**As a** Founder,
**I want to** archive a project,
**So that** I can hide it from my dashboard without losing data.

**Acceptance Criteria:**

**Given** I am logged in as a Founder with at least one active project
**When** I navigate to Settings → Projects tab
**Then** I should see a project selector and archive button

**Given** I have selected a project
**When** I click "Archive Project"
**Then** the project status should change to `archived` and it should be hidden from my dashboard

**Given** I have archived a project
**When** I toggle "Show archived projects" in Settings
**Then** I should see the archived project with a "Restore" option

**E2E Test:** Gap - needs test
**Journey Reference:** [`project-client-management.md`](../features/project-client-management.md) - Archive Flow

---

### US-F05: Delete Project Permanently

**As a** Founder,
**I want to** permanently delete a project,
**So that** I can remove unwanted data and free up resources.

**Acceptance Criteria:**

**Given** I am logged in as a Founder with at least one project
**When** I navigate to Settings → Projects tab → Danger Zone
**Then** I should see a delete button with impact summary (hypotheses, evidence, etc.)

**Given** I click "Delete Project Forever"
**When** I type the project name to confirm
**Then** the project and all related data should be permanently deleted

**Given** I have deleted a project
**When** I view my dashboard
**Then** the project should no longer appear (even with "show archived")

**E2E Test:** Gap - needs test
**Journey Reference:** [`project-client-management.md`](../features/project-client-management.md) - Delete Flow

---

### US-F06: View AI Analysis Results

**As a** Founder,
**I want to** view the AI-generated strategic analysis,
**So that** I can understand the validation recommendations for my business.

**Acceptance Criteria:**

**Given** CrewAI analysis has completed for my project
**When** I view my Founder dashboard
**Then** I should see the Value Proposition Canvas in the Canvases tab

**Given** I have analysis results
**When** I navigate to the Experiments tab
**Then** I should see AI-recommended validation experiments

**Given** I have analysis results
**When** I navigate to the Evidence tab
**Then** I should see collected evidence with quality indicators

**E2E Test:** `04-founder-analysis-journey.spec.ts` - "should display VPC content in Canvases tab"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Steps 14-15

---

### US-F07: Quick Start with Hints (Optional)

> **Added (2026-01-20)**: Supports optional hints in Quick Start form.

**As a** Founder,
**I want to** provide optional hints about my industry, target user, and geography,
**So that** the AI can provide more targeted analysis from the start.

**Acceptance Criteria:**

**Given** I am on the Quick Start form
**When** I click "Add optional hints"
**Then** I should see dropdowns for industry, target user, and geography

**Given** I have selected optional hints
**When** I submit the Quick Start form
**Then** Phase 1 should use my hints to focus the research

**Given** I don't want to provide hints
**When** I submit without expanding the hints section
**Then** Phase 1 should proceed with general research

**E2E Test:** `16-quick-start-founder.spec.ts` - "should expand optional hints section"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

### US-F08: View Phase 1 Progress

> **Updated (2026-01-21)**: Enhanced with detailed UI acceptance criteria.

**As a** Founder,
**I want to** see progress while Phase 1 is running,
**So that** I know validation is happening and can stay engaged.

**Acceptance Criteria:**

**Given** I have submitted Quick Start and Phase 1 is running
**When** I view my dashboard
**Then** I should see:
  - Phase indicator with "IN PROGRESS" badge
  - Segmented progress bar (Market Research → Competitor Analysis → Brief Generation → QA)
  - Current segment highlighted with shimmer animation
  - Estimated time remaining

**Given** Phase 1 is running
**When** I view the AI Team Activity section
**Then** I should see:
  - Vertical timeline of completed activities
  - Agent name and avatar for each activity
  - Timestamp (HH:MM format)
  - Activity description (e.g., "Completed market size analysis")

**Given** Phase 1 is taking longer than expected (>20 minutes)
**When** the estimated time passes
**Then** I should see:
  - "Taking longer than expected" message
  - Updated time estimate
  - Reassurance that work is continuing

**Given** Phase 1 encounters an error
**When** the system detects a failure
**Then** I should see:
  - Error card with retry option
  - "AI Analysis Temporarily Unavailable" message
  - Auto-retry countdown (30 second intervals, 3 attempts)

**Given** Phase 1 reaches a HITL checkpoint
**When** the checkpoint is ready
**Then** I should:
  - Receive browser notification (if enabled)
  - See progress bar complete
  - See "Ready for Review" state
  - Have one-click access to approval UI

**E2E Test:** `16-quick-start-founder.spec.ts` - "should show loading state during submission"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Steps 6-7

---

## Consultant Stories (US-C)

### US-C01: Complete Practice Setup

> **Updated (2026-01-20)**: Maya AI removed per ADR-006. Practice setup is now a static form.

**As a** Consultant,
**I want to** complete my practice setup via a profile form,
**So that** I can configure my consulting profile and specializations.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant without a completed profile
**When** I access the platform
**Then** I should be directed to the practice setup form

**Given** I am on the practice setup form
**When** I fill in my specializations, industries, and experience
**Then** my consultant profile should be saved

**Given** I complete practice setup
**When** I submit the form
**Then** I should be redirected to `/consultant-dashboard`

**E2E Test:** `09-consultant-practice-setup.spec.ts` - "should complete consultant practice setup"
**Journey Reference:** [`consultant-journey-map.md`](./consultant-journey-map.md) - Phase 2

---

### US-C02: Invite Client

**As a** Consultant,
**I want to** invite a client via email,
**So that** they can sign up and be linked to my portfolio.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant
**When** I click "Add Client" on my dashboard
**Then** I should see an invite form with email, name, and custom message fields

**Given** I have filled out the invite form
**When** I submit the invitation
**Then** an email should be sent with a unique invite token (30-day expiry)

**Given** a client signs up using my invite link
**When** they complete registration
**Then** they should appear in my portfolio as an "active" client

**E2E Test:** `10-consultant-client-onboarding.spec.ts` - "should show Add Client option on consultant dashboard"
**Journey Reference:** [`consultant-journey-map.md`](./consultant-journey-map.md) - Phase 3

---

### US-C03: View Client Portfolio

**As a** Consultant,
**I want to** view all my clients in a portfolio dashboard,
**So that** I can monitor their validation progress at a glance.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant with active clients
**When** I navigate to `/consultant-dashboard`
**Then** I should see a grid of client cards with progress indicators

**Given** I am viewing my portfolio
**When** I look at client cards
**Then** I should see D-F-V signals, validation stage, and key metrics

**Given** I have many clients
**When** I use the search/filter functionality
**Then** I should be able to find clients by name or filter by stage

**E2E Test:** `06-consultant-portfolio.spec.ts` - "should display portfolio grid with client cards"
**Journey Reference:** [`consultant-journey-map.md`](./consultant-journey-map.md) - Phase 4

---

### US-C04: View Client Detail

**As a** Consultant,
**I want to** view detailed information about a specific client,
**So that** I can understand their validation progress in depth.

**Acceptance Criteria:**

**Given** I am viewing my portfolio
**When** I click on a client card
**Then** I should navigate to the client detail page

**Given** I am on a client detail page
**When** I view the tabs (Overview, Canvases, Experiments, Evidence)
**Then** I should see the client's validation data (view-only)

**Given** I am viewing client details
**When** I click "Back to Portfolio"
**Then** I should return to my portfolio dashboard

**E2E Test:** `06-consultant-portfolio.spec.ts` - "should click client card and navigate to detail"
**Journey Reference:** [`consultant-journey-map.md`](./consultant-journey-map.md) - Phase 5

---

### US-C05: Archive Client

**As a** Consultant,
**I want to** archive a client relationship,
**So that** I can hide inactive clients without affecting their data.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant with active clients
**When** I navigate to Settings → Clients tab
**Then** I should see a client selector and archive button

**Given** I have selected a client
**When** I click "Archive Client"
**Then** the client should be hidden from my portfolio (but their data is unchanged)

**Given** I have archived a client
**When** I toggle "Show archived clients" in Settings
**Then** I should see the archived client with a "Restore" option

**E2E Test:** Gap - needs test
**Journey Reference:** [`consultant-journey-map.md`](./consultant-journey-map.md) - Phase 6

---

### US-C06: Resend Client Invite

**As a** Consultant,
**I want to** resend an invitation to a pending client,
**So that** they receive a reminder if they missed the original email.

**Acceptance Criteria:**

**Given** I have a pending (uninvited) client
**When** I view the invite in my client list
**Then** I should see a "Resend" button

**Given** I click "Resend"
**When** the action completes
**Then** a new email should be sent (up to 3 resends per invite)

**E2E Test:** Gap - needs test
**Journey Reference:** [`consultant-client-system.md`](../features/consultant-client-system.md) - Resend Flow

---

### US-C07: Start Client Project via Quick Start

> **Updated (2026-01-20)**: Now uses Quick Start form instead of 7-stage conversation.

**As a** Consultant,
**I want to** start a validation project for a client via Quick Start,
**So that** I can initiate their validation process quickly.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant
**When** I click "Start Client Project"
**Then** I should see a client selection list (active clients only)

**Given** I have selected a client
**When** I click the client's name
**Then** I should see the Quick Start form with the client's name displayed

**Given** I have entered the client's business idea
**When** I click "Start Validation"
**Then** Phase 1 should begin for the client's project (not mine)

**Given** the Quick Start submission completes
**When** the project is created
**Then** I should be redirected to the client's project detail page

**E2E Test:** `17-quick-start-consultant.spec.ts` - "should submit Quick Start for client and redirect"
**Journey Reference:** [`consultant-journey-map.md`](./consultant-journey-map.md) - Phase 3 (Client Mode)

---

## Trial User Stories (US-T)

### US-T01: Start Trial Onboarding

**As a** Trial user,
**I want to** begin the onboarding process,
**So that** I can evaluate the platform with my business idea.

**Acceptance Criteria:**

**Given** I am a new user who just signed up
**When** I complete authentication
**Then** I should be redirected to `/onboarding/founder`

**Given** I am on the onboarding page
**When** the page loads
**Then** I should see Alex's welcome message explaining the process

**E2E Test:** `02-onboarding-flow.spec.ts` - "should start and access onboarding interface"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

### US-T02: View Trial Limits

**As a** Trial user,
**I want to** see my remaining usage limits,
**So that** I know when I need to upgrade.

**Acceptance Criteria:**

**Given** I am logged in as a Trial user
**When** I view my dashboard or attempt a limited action
**Then** I should see my remaining allowance (e.g., "2/3 projects created")

**Given** I have reached a usage limit
**When** I attempt the restricted action
**Then** I should see an upgrade prompt instead of performing the action

**E2E Test:** Gap - needs test
**Journey Reference:** [`user-personas.md`](./user-personas.md) - Trial User Restrictions

---

### US-T03: Upgrade to Founder Plan

**As a** Trial user,
**I want to** upgrade to a paid Founder plan,
**So that** I can unlock full platform access.

**Acceptance Criteria:**

**Given** I am logged in as a Trial user
**When** I click an upgrade prompt or navigate to billing
**Then** I should see the Founder plan pricing and features

**Given** I complete the upgrade payment
**When** the transaction succeeds
**Then** my role should change to `founder` and limits should be removed

**E2E Test:** Gap - needs test
**Journey Reference:** [`user-personas.md`](./user-personas.md) - Trial Conversion Path

---

## Coverage Summary

### Stories by Role

| Role | Total Stories | With E2E Tests | Gaps |
|------|---------------|----------------|------|
| Founder | 8 | 6 | 2 (US-F04, US-F05) |
| Consultant | 7 | 5 | 2 (US-C05, US-C06) |
| Trial | 3 | 1 | 2 (US-T02, US-T03) |
| **Total** | **18** | **12** | **6** |

### E2E Test File Mapping

| Test File | Stories Covered |
|-----------|-----------------|
| `00-smoke.spec.ts` | Infrastructure (no stories) |
| `01-login.spec.ts` | Authentication (cross-cutting) |
| `02-onboarding-flow.spec.ts` | US-F01, US-F08, US-T01 |
| `03-founder-attribution.spec.ts` | US-F02 (attribution aspect) |
| `04-founder-analysis-journey.spec.ts` | US-F02, US-F06 |
| `05-hitl-approval-flow.spec.ts` | US-F03 |
| `06-consultant-portfolio.spec.ts` | US-C03, US-C04 |
| `07-adr005-persistence.spec.ts` | US-F07 |
| `08-ui-indicators.spec.ts` | US-F01 (UI indicators) |
| `09-consultant-practice-setup.spec.ts` | US-C01 |
| `10-consultant-client-onboarding.spec.ts` | US-C02, US-C07 |

### Gap Analysis

Stories needing E2E tests:

| Story ID | Description | Priority |
|----------|-------------|----------|
| US-F04 | Archive Project | Medium |
| US-F05 | Delete Project | Medium |
| US-C05 | Archive Client | Medium |
| US-C06 | Resend Client Invite | Low |
| US-T02 | View Trial Limits | High |
| US-T03 | Upgrade to Founder | High |

---

## HITL Checkpoint Stories (US-H)

These stories are derived from the [hitl-approval-ui.md](../specs/hitl-approval-ui.md) specification.

### US-H01: Review Discovery Output (Founder's Brief + VPC)

> **Updated (2026-01-19)**: This checkpoint is now in Phase 1 (not Phase 0) and combines Brief + VPC approval.

**As a** Founder,
**I want to** review the AI-generated Founder's Brief and VPC before deeper analysis,
**So that** I can confirm my business idea is accurately captured.

**Acceptance Criteria:**

**Given** Phase 1 BriefGenerationCrew has completed
**When** the AI generates Founder's Brief and VPC
**Then** I should see the `approve_discovery_output` HITL checkpoint

**Given** I am reviewing the discovery output
**When** I view the modal
**Then** I should see: Founder's Brief (AI-generated from research), Customer Profile (Jobs, Pains, Gains), Value Map coverage, Fit Score, and QA Report

**Given** I have reviewed the output
**When** I select "Approve"
**Then** Phase 1 VPC Discovery should continue to completion

**Given** I find inaccuracies in the output
**When** I select "Save Edits" with corrections
**Then** Phase 1 should continue with my edits incorporated

**Given** the research is fundamentally wrong
**When** I select "Reject"
**Then** I should return to Quick Start to try again

**E2E Test:** `05-hitl-approval-flow.spec.ts` - "should approve discovery output"
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Phase 1
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 1

---

### US-H02: Approve Experiment Plan

**As a** Founder,
**I want to** review proposed experiments before they run,
**So that** I can approve the testing approach and budget.

**Acceptance Criteria:**

**Given** the AI has designed test cards for my assumptions
**When** the `approve_experiment_plan` checkpoint is triggered
**Then** I should see a list of proposed experiments with: hypothesis, method, metrics, pass criteria, cost, and duration

**Given** I am reviewing the experiment plan
**When** I view assumptions being tested
**Then** I should see which assumptions are covered and which are not

**Given** I approve the plan
**When** I click "Approve Plan"
**Then** the experiments should begin execution

**Given** I want to adjust the budget
**When** I select "Modify Budget"
**Then** I should be able to specify new spending limits

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Phase 1
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 1

---

### US-H04: Approve Campaign Launch

**As a** Founder,
**I want to** review ad creatives and landing pages before they go live,
**So that** I can protect my brand and control public messaging.

**Acceptance Criteria:**

**Given** the AI has generated ad variants and landing pages
**When** the `campaign_launch` checkpoint is triggered
**Then** I should see previews of all creative assets with Guardian QA status

**Given** I am reviewing creatives
**When** I view the modal
**Then** I should see: Ad variants (headline, platform, hook type, CTA), Landing page variants (preview URLs), Budget and timeline, Expected metrics

**Given** I approve the campaign
**When** I click "Launch Campaign"
**Then** the ads should begin running on specified platforms

**Given** I want to edit creatives
**When** I select "Edit Creatives"
**Then** I should be directed to the creative editing flow

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Phase 2
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 2

---

### US-H05: Approve Budget Increase

**As a** Founder,
**I want to** approve budget increases during experiments,
**So that** I maintain financial accountability for my validation spend.

**Acceptance Criteria:**

**Given** my experiment budget threshold is reached
**When** the AI recommends a budget increase
**Then** the `spend_increase` checkpoint should be triggered

**Given** I am reviewing a budget increase request
**When** I view the modal
**Then** I should see: Current spend, Results so far (impressions, clicks, signups, CPA), Recommended increase amount, Expected additional signups

**Given** I approve the full increase
**When** I click "Approve Full Increase"
**Then** the new budget should be applied and experiments should continue

**Given** I want a smaller increase
**When** I select "Approve Partial"
**Then** I should be able to specify the amount

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Phase 2
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 2

---

### US-H06: Review Desirability Gate

**As a** Founder,
**I want to** review market evidence before proceeding to feasibility testing,
**So that** I can make an informed go/no-go decision.

**Acceptance Criteria:**

**Given** desirability experiments have completed
**When** the `gate_progression` checkpoint is triggered for Phase 2
**Then** I should see: Desirability Signal (strong_commitment/weak_interest/no_interest), Problem Resonance score, Zombie Ratio, Conversion metrics, Key learnings

**Given** I have strong commitment signals
**When** I select "Proceed to Feasibility"
**Then** Phase 3 should begin automatically

**Given** I have high zombie ratio
**When** I select "Pivot Value Prop"
**Then** the Value Pivot flow should begin

**Given** I have low problem resonance
**When** I select "Pivot Segment"
**Then** the Segment Pivot flow should begin

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Phase 2 Gate
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 2

---

### US-H07: Review Feasibility Gate

**As a** Founder,
**I want to** review technical feasibility assessment before viability analysis,
**So that** I understand if my solution can be built.

**Acceptance Criteria:**

**Given** feasibility assessment has completed
**When** the `gate_progression` checkpoint is triggered for Phase 3
**Then** I should see: Feasibility Signal (green/orange/red), Feature assessment (POSSIBLE/CONSTRAINED/IMPOSSIBLE per feature), Cost estimates, Technical constraints

**Given** I have a green feasibility signal
**When** I select "Proceed to Viability"
**Then** Phase 4 should begin automatically

**Given** I have an orange (constrained) signal
**When** I view the modal
**Then** I should see downgrade options with impact assessment

**Given** I select "Accept Downgrade"
**When** the decision is confirmed
**Then** Phase 4 should begin with reduced scope

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Phase 3 Gate
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 3

---

### US-H08: Review Viability Gate

**As a** Founder,
**I want to** review unit economics analysis before final decision,
**So that** I understand if my business can be profitable.

**Acceptance Criteria:**

**Given** viability analysis has completed
**When** the `gate_progression` checkpoint is triggered for Phase 4
**Then** I should see: Viability Signal (profitable/marginal/underwater), CAC, LTV, LTV/CAC ratio, Gross margin, Payback period, Market sizing (TAM/SAM/SOM)

**Given** I have profitable unit economics (LTV/CAC ≥ 3)
**When** I select "Proceed to Launch"
**Then** the final decision checkpoint should be triggered

**Given** I have marginal unit economics
**When** I view the modal
**Then** I should see options: Price Pivot, Cost Pivot, or Kill

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Phase 4 Gate
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 4

---

### US-H09: Make Final Validation Decision

**As a** Founder,
**I want to** make a final decision on my validated business idea,
**So that** I can move forward with confidence.

**Acceptance Criteria:**

**Given** all validation phases have completed
**When** the `final_decision` checkpoint is triggered
**Then** I should see: Validation Summary (D-F-V signals), Journey metrics (duration, spend, experiments), AI recommendation with confidence level, Recommended next steps

**Given** I have validated signals across all three axes
**When** I select "Mark as Validated"
**Then** my project status should change to "Validated"

**Given** I want more evidence
**When** I select "Continue Testing"
**Then** I should be able to choose which phase to revisit

**Given** I want to pause the project
**When** I select "Archive Project"
**Then** my project status should change to "Archived"

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Final Decision
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Phase 4

---

## Pivot Flow Stories (US-P)

These stories are derived from the [phase-transitions.md](../specs/phase-transitions.md) pivot flows.

### US-P01: Approve Segment Pivot

**As a** Founder,
**I want to** choose a new customer segment when my current segment shows no interest,
**So that** I can test a more promising audience.

**Acceptance Criteria:**

**Given** desirability testing shows low problem resonance (<30%)
**When** the AI triggers a segment pivot recommendation
**Then** the `segment_pivot` checkpoint should appear

**Given** I am reviewing the segment pivot
**When** I view the modal
**Then** I should see: Current segment evidence (problem resonance, conversion), Why it's failing, 3 AI-recommended alternative segments with rationale and TAM

**Given** I select an alternative segment
**When** I click the recommended option
**Then** Phase 1 should restart with the new segment hypothesis

**Given** I want to define my own segment
**When** I select "Custom Segment"
**Then** I should be able to specify segment details before restart

**Given** I don't want to pivot
**When** I select "Continue with Current"
**Then** I should proceed with a warning acknowledgment

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Segment Pivot Flow
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Pivot Flows

---

### US-P02: Approve Value Pivot

**As a** Founder,
**I want to** refine my value proposition when customers are interested but not committing,
**So that** I can convert interest into action.

**Acceptance Criteria:**

**Given** desirability testing shows high zombie ratio (≥70%)
**When** the AI triggers a value pivot recommendation
**Then** the `value_pivot` checkpoint should appear

**Given** I am reviewing the value pivot
**When** I view the modal
**Then** I should see: Current value proposition, Zombie ratio and conversion evidence, 2 AI-recommended alternative value propositions focusing on different pain points

**Given** I select an alternative value proposition
**When** I click the recommended option
**Then** Desirability testing should restart with the new messaging

**Given** I want to refine, not replace
**When** I select "Refine Current VP"
**Then** I should iterate on messaging without a full restart

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Value Pivot Flow
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Pivot Flows

---

### US-P03: Approve Feature Downgrade

**As a** Founder,
**I want to** accept scope reduction when core features are technically impossible,
**So that** I can still build a viable product.

**Acceptance Criteria:**

**Given** feasibility assessment shows ORANGE (constrained) signal
**When** core features are marked as IMPOSSIBLE
**Then** the `feature_downgrade` checkpoint should appear

**Given** I am reviewing the feature downgrade
**When** I view the modal
**Then** I should see: Impossible features with technical reasons, Suggested alternatives where available, Downgrade options with impact assessment

**Given** I accept a downgrade option
**When** I select "Downgrade Option A"
**Then** the features should be marked as removed and Desirability testing should be re-run with reduced scope

**Given** I want to explore technical alternatives
**When** I select "Explore Technical Alternatives"
**Then** the AI should research other implementation approaches

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Feature Downgrade Flow
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Pivot Flows

---

### US-P04: Approve Strategic Pivot

**As a** Founder,
**I want to** adjust my pricing or acquisition strategy when unit economics are marginal,
**So that** I can improve viability without killing the project.

**Acceptance Criteria:**

**Given** viability analysis shows MARGINAL signal (1 < LTV/CAC < 3)
**When** the AI recommends a strategic pivot
**Then** the `strategic_pivot` checkpoint should appear

**Given** I am reviewing the strategic pivot
**When** I view the modal
**Then** I should see: Current unit economics breakdown, Options: Increase pricing, Reduce CAC, or Both, Impact projections for each option

**Given** I select "Increase Pricing"
**When** I confirm the decision
**Then** the pricing strategy should be updated and viability re-tested

**Given** I select "Reduce CAC"
**When** I confirm the decision
**Then** the acquisition strategy should be optimized and viability re-tested

**E2E Test:** Gap - needs test
**Journey Reference:** [`phase-transitions.md`](../specs/phase-transitions.md) - Strategic Pivot Flow
**UI Spec:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Pivot Flows

---

## Edge Case Stories (US-E)

These stories cover error recovery, timeout handling, and other edge cases that ensure a robust user experience.

### US-E01: Recover from Interrupted Quick Start

**As a** Founder,
**I want to** recover my draft if I accidentally close the browser during Quick Start,
**So that** I don't have to retype my business idea.

**Acceptance Criteria:**

**Given** I have typed content in the Quick Start form
**When** I close the browser or navigate away
**Then** my draft should be saved to localStorage

**Given** I return to the Quick Start form within 24 hours
**When** the page loads
**Then** I should see a "Resume draft?" prompt with preview text

**Given** I click "Resume"
**When** the draft loads
**Then** my previous input should be restored (business idea + any hints)

**Given** I click "Start Fresh"
**When** the form resets
**Then** the localStorage draft should be cleared

**E2E Test:** Gap - needs test
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

### US-E02: Handle Concurrent Project Creation

**As a** Founder,
**I want to** be warned if I try to start a new project while one is already processing,
**So that** I don't accidentally create duplicate projects.

**Acceptance Criteria:**

**Given** I have a project in "phase_1_running" status
**When** I navigate to Quick Start to create another project
**Then** I should see a warning: "You have a project currently being analyzed"

**Given** I see the concurrent project warning
**When** I click "View Current Project"
**Then** I should be taken to my in-progress project's dashboard

**Given** I see the concurrent project warning
**When** I click "Create Anyway"
**Then** I should be able to proceed with Quick Start (multi-project is allowed)

**E2E Test:** Gap - needs test
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

### US-E03: Handle Invalid or Malformed Input

**As a** Founder,
**I want to** receive clear feedback if my input is invalid,
**So that** I can correct it before submission.

**Acceptance Criteria:**

**Given** I enter fewer than 10 characters in the business idea field
**When** I try to submit the form
**Then** I should see inline validation: "Please describe your idea in at least 10 characters"

**Given** I exceed the 5000 character limit
**When** I continue typing
**Then** the character counter should turn red and additional characters should be blocked

**Given** I paste content with potentially malicious characters (script tags, etc.)
**When** the form processes my input
**Then** the content should be sanitized without losing legitimate text

**Given** I submit with only whitespace characters
**When** the validation runs
**Then** I should see: "Please enter a valid business idea"

**E2E Test:** Gap - needs test
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

### US-E04: Handle Phase 1 Timeout

**As a** Founder,
**I want to** know what to do if Phase 1 takes unusually long,
**So that** I don't think my project is stuck.

**Acceptance Criteria:**

**Given** Phase 1 has been running for more than 20 minutes
**When** I view my dashboard
**Then** I should see: "Taking longer than expected - our team is still working"

**Given** Phase 1 has been running for more than 30 minutes
**When** I view my dashboard
**Then** I should see:
  - "Extended processing time" message
  - "Contact Support" link
  - Option to cancel and retry

**Given** I click "Contact Support"
**When** the support form opens
**Then** my project ID should be pre-filled

**E2E Test:** Gap - needs test
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 7

---

### US-E05: Handle HITL Checkpoint Expiry

**As a** Founder,
**I want to** know if my HITL checkpoint is about to expire,
**So that** I don't lose progress by not responding in time.

**Acceptance Criteria:**

**Given** a HITL checkpoint has been pending for 7 days
**When** I view my dashboard or email
**Then** I should receive a reminder: "Action required: Your brief is ready for review"

**Given** a HITL checkpoint has been pending for 14 days
**When** I view my dashboard
**Then** I should see an urgent badge on the approval card

**Given** a HITL checkpoint has been pending for 30 days
**When** the deadline passes
**Then** my project status should change to "paused" with option to resume

**E2E Test:** Gap - needs test
**Journey Reference:** [`hitl-approval-ui.md`](../specs/hitl-approval-ui.md) - Timeout Handling

---

### US-E06: Consultant Handles Client Unlink

**As a** Consultant,
**I want to** be notified if a client unlinks from my portfolio,
**So that** I can follow up if needed.

**Acceptance Criteria:**

**Given** a client decides to unlink from my portfolio
**When** they complete the unlink action
**Then** I should receive an email notification

**Given** I have been notified of an unlink
**When** I view my consultant dashboard
**Then** the client should no longer appear in my active clients

**Given** I want to re-invite the unlinked client
**When** I send a new invitation
**Then** the client should receive a fresh invite (previous relationship history preserved)

**E2E Test:** Gap - needs test
**Journey Reference:** [`consultant-client-system.md`](../features/consultant-client-system.md) - Unlink Flow

---

## Updated Coverage Summary

### Stories by Category

| Category | Total Stories | With E2E Tests | Gaps |
|----------|---------------|----------------|------|
| Founder (US-F) | 8 | 7 | 1 |
| Consultant (US-C) | 7 | 5 | 2 |
| Trial (US-T) | 3 | 1 | 2 |
| HITL Checkpoint (US-H) | 8 | 1 | 7 |
| Pivot Flow (US-P) | 4 | 0 | 4 |
| Edge Case (US-E) | 6 | 0 | 6 |
| **Total** | **36** | **14** | **22** |

### HITL Story Priority

| Story ID | Description | Priority | Blocking |
|----------|-------------|----------|----------|
| US-H01 | Review Discovery Output (Brief + VPC) | P0 | Phase 1 continuation |
| US-H02 | Approve Experiment Plan | P1 | Experiments |
| US-H04 | Approve Campaign Launch | P1 | Ads go live |
| US-H05 | Approve Budget Increase | P2 | Budget control |
| US-H06 | Review Desirability Gate | P1 | Phase 3 start |
| US-H07 | Review Feasibility Gate | P1 | Phase 4 start |
| US-H08 | Review Viability Gate | P1 | Final decision |
| US-H09 | Make Final Decision | P0 | Validation complete |

### Edge Case Story Priority

| Story ID | Description | Priority | Impact |
|----------|-------------|----------|--------|
| US-E01 | Recover from Interrupted Quick Start | P1 | User retention |
| US-E02 | Handle Concurrent Project Creation | P2 | Data integrity |
| US-E03 | Handle Invalid or Malformed Input | P1 | Security, UX |
| US-E04 | Handle Phase 1 Timeout | P1 | User confidence |
| US-E05 | Handle HITL Checkpoint Expiry | P2 | Workflow continuity |
| US-E06 | Consultant Handles Client Unlink | P3 | Relationship management |

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| [`user-personas.md`](./user-personas.md) | Role definitions for each story |
| [`founder-journey-map.md`](./founder-journey-map.md) | Founder journey steps |
| [`consultant-journey-map.md`](./consultant-journey-map.md) | Consultant journey phases |
| [`journey-test-matrix.md`](../testing/journey-test-matrix.md) | Test coverage matrix |
| [`project-client-management.md`](../features/project-client-management.md) | Archive/delete feature specs |
| [`consultant-client-system.md`](../features/consultant-client-system.md) | Invite system specs |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-21 | Enhanced US-F08 with detailed UI criteria; added 6 edge case stories (US-E01-E06) |
| 2026-01-20 | Updated for Quick Start (ADR-006): Replaced US-F07/F08 with Quick Start stories, updated US-C01/C07, removed US-H03 |
| 2026-01-19 | Added 13 HITL/Pivot stories (US-H01-H09, US-P01-P04) derived from phase-transitions.md and hitl-approval-ui.md |
| 2026-01-19 | Initial creation - consolidated 18 user stories with acceptance criteria |
