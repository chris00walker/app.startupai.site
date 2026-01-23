---
purpose: "Cross-cutting platform user stories and acceptance criteria"
status: "active"
last_reviewed: "2026-01-23"
last_updated: "2026-01-23"
---

# HITL Checkpoint Stories (US-H)

These stories are derived from the [hitl-approval-ui.md](../../specs/hitl-approval-ui.md) specification.

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Phase 1
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 1

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Phase 1
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 1

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Phase 2
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 2

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Phase 2
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 2

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Phase 2 Gate
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 2

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Phase 3 Gate
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 3

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Phase 4 Gate
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 4

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Final Decision
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Phase 4

---

## Pivot Flow Stories (US-P)

These stories are derived from the [phase-transitions.md](../../specs/phase-transitions.md) pivot flows.

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Segment Pivot Flow
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Pivot Flows

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Value Pivot Flow
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Pivot Flows

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Feature Downgrade Flow
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Pivot Flows

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
**Journey Reference:** [`phase-transitions.md`](../../specs/phase-transitions.md) - Strategic Pivot Flow
**UI Spec:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Pivot Flows

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 5

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 5

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 5

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 7

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
**Journey Reference:** [`hitl-approval-ui.md`](../../specs/hitl-approval-ui.md) - Timeout Handling

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
**Journey Reference:** [`consultant-client-system.md`](../../features/consultant-client-system.md) - Unlink Flow

---

## Support Stories (US-S)

> **Added (2026-01-22)**: New story category for user-facing support and GDPR compliance flows.
> **User Scope**: All authenticated users including Trial and Admin.

### US-S01: Contact Support

**As any** authenticated user,
**I want to** submit a help request with context,
**So that** I can get assistance when I encounter issues.

**Acceptance Criteria:**

**Given** I am logged in as any user type
**When** I click "Contact Support" or the help icon
**Then** I should see a support form with category, subject, and description fields

**Given** I am filling out the support form
**When** I submit the request
**Then** I should receive confirmation and a ticket ID

**Given** I have submitted a support request
**When** the submission completes
**Then** I should receive a confirmation email within 60 seconds

**E2E Test:** `23-support.spec.ts` - "should submit support request"
**Journey Reference:** [`support-journey-map.md`](../journeys/platform/support-journey-map.md) - Phase 2

---

### US-S02: View Help Articles

**As any** authenticated user,
**I want to** search and browse help articles,
**So that** I can find answers without waiting for support.

**Acceptance Criteria:**

**Given** I am on the help center
**When** I enter a search query
**Then** I should see relevant articles matching my query

**Given** I am browsing help articles
**When** I click on an article
**Then** I should see the full article content with helpful formatting

**Given** no articles match my search
**When** I see the "no results" state
**Then** I should see a link to contact support

**E2E Test:** `23-support.spec.ts` - "should search help articles"
**Journey Reference:** [`support-journey-map.md`](../journeys/platform/support-journey-map.md) - Phase 1

---

### US-S03: Track Support Ticket

**As any** authenticated user,
**I want to** view the status of my support requests,
**So that** I know when to expect resolution.

**Acceptance Criteria:**

**Given** I have submitted support requests
**When** I navigate to my support requests
**Then** I should see a list of tickets with status (Open, In Progress, Resolved)

**Given** I am viewing a ticket
**When** I click on it
**Then** I should see the conversation thread and current status

**Given** I have an open ticket
**When** support responds
**Then** I should receive a notification

**E2E Test:** `23-support.spec.ts` - "should track support ticket status"
**Journey Reference:** [`support-journey-map.md`](../journeys/platform/support-journey-map.md) - Phase 3

---

### US-S04: Request Data Export (GDPR)

**As any** authenticated user,
**I want to** request a copy of my personal data,
**So that** I can exercise my GDPR right of access.

**Acceptance Criteria:**

**Given** I am on Settings → Privacy
**When** I click "Export My Data"
**Then** I should see export options (Full, Account Only, Projects Only)

**Given** I have selected an export type
**When** I confirm the request
**Then** I should see a confirmation that export is processing

**Given** my export is ready
**When** I receive the notification
**Then** I should be able to download my data within 7 days

**E2E Test:** `23-support.spec.ts` - "should request GDPR data export"
**Journey Reference:** [`support-journey-map.md`](../journeys/platform/support-journey-map.md) - Phase 4

---

### US-S05: Delete Account (GDPR)

**As any** authenticated user,
**I want to** permanently delete my account,
**So that** I can exercise my GDPR right to erasure.

**Acceptance Criteria:**

**Given** I am on Settings → Account
**When** I click "Delete My Account"
**Then** I should see an impact summary of what will be deleted

**Given** I have reviewed the impact
**When** I type my email to confirm
**Then** I should see the final delete button enabled

**Given** I confirm deletion
**When** the process completes
**Then** my account should be deleted and I should be signed out

**Given** I have deleted my account
**When** I try to sign in
**Then** I should see "Account not found"

**E2E Test:** `23-support.spec.ts` - "should delete account permanently"
**Journey Reference:** [`support-journey-map.md`](../journeys/platform/support-journey-map.md) - Phase 5

---

## Offboarding Stories (US-O)

> **Added (2026-01-22)**: New story category for subscription cancellation and user lifecycle exit.

### US-O01: Cancel Subscription

**As a** Paid User (Founder or Consultant),
**I want to** cancel my subscription,
**So that** I can stop being charged.

**Acceptance Criteria:**

**Given** I am on Settings → Billing
**When** I click "Cancel Subscription"
**Then** I should see a cancellation modal with retention offer and impact summary

**Given** I am viewing the cancellation modal
**When** I choose to proceed with cancellation
**Then** I should see my access end date and data retention timeline

**Given** I confirm cancellation
**When** the process completes
**Then** I should receive a confirmation email and see updated billing status

**E2E Test:** `24-offboarding.spec.ts` - "should cancel subscription"
**Journey Reference:** [`offboarding-journey-map.md`](../journeys/platform/offboarding-journey-map.md) - Phase 1

---

### US-O02: Complete Exit Survey

**As a** User who cancelled,
**I want to** provide feedback on why I'm leaving,
**So that** the platform can improve.

**Acceptance Criteria:**

**Given** I have just cancelled my subscription
**When** I see the exit survey prompt
**Then** I should see reason options and optional feedback field

**Given** I have selected a reason
**When** I submit the survey
**Then** I should see a thank you message

**Given** I don't want to complete the survey
**When** I click "Skip"
**Then** I should proceed without providing feedback

**E2E Test:** `24-offboarding.spec.ts` - "should complete exit survey"
**Journey Reference:** [`offboarding-journey-map.md`](../journeys/platform/offboarding-journey-map.md) - Phase 2

---

### US-O03: View Data Retention Notice

**As a** User who cancelled,
**I want to** understand what happens to my data,
**So that** I know my options for returning.

**Acceptance Criteria:**

**Given** I have cancelled my subscription
**When** I view the cancellation confirmation
**Then** I should see the data retention timeline:
  - Days 0-30: Grace period (read-only access, can reactivate instantly)
  - Days 31-90: Retention period (no access, data preserved in cold storage, reactivation within 24 hours)
  - After day 90: Data purged (irreversible)

**Given** I am in the grace period (days 0-30)
**When** I access the platform
**Then** I should have read-only access to my data

**Given** I am in the retention period (days 31-90)
**When** I try to access the platform
**Then** I should see the reactivation page with "Data restoring within 24 hours" message

**Given** my retention period is ending
**When** 7 days remain before day 90
**Then** I should receive a reminder email with deadline to reactivate

**E2E Test:** `24-offboarding.spec.ts` - "should display data retention notice"
**Journey Reference:** [`offboarding-journey-map.md`](../journeys/platform/offboarding-journey-map.md) - Phase 3

---

### US-O04: Reactivate Cancelled Account

**As a** User who previously cancelled,
**I want to** reactivate my subscription,
**So that** I can continue using the platform with my data intact.

**Acceptance Criteria:**

**Given** I cancelled within 90 days
**When** I click "Reactivate"
**Then** I should see my previous plan with current pricing

**Given** I am reactivating within 30 days
**When** I complete payment
**Then** my access should be restored instantly

**Given** I am reactivating between 30-90 days
**When** I complete payment
**Then** I should see "Data restoring within 24 hours" message

**E2E Test:** `24-offboarding.spec.ts` - "should reactivate cancelled account"
**Journey Reference:** [`offboarding-journey-map.md`](../journeys/platform/offboarding-journey-map.md) - Phase 4

---

### US-O05: Win-Back Email Response

**As a** Churned User,
**I want to** receive helpful re-engagement emails,
**So that** I can return if I change my mind.

**Acceptance Criteria:**

**Given** I cancelled my account
**When** 7 days pass
**Then** I should receive a friendly check-in email ("We miss you")

**Given** I cancelled my account
**When** 30 days pass (end of grace period)
**Then** I should receive a reminder that read-only access is ending

**Given** I cancelled my account
**When** 60 days pass
**Then** I should receive an email: "Last chance: Your data will be deleted in 30 days"

**Given** I cancelled my account
**When** 90 days pass (data deletion day)
**Then** I should receive a final email: "Your StartupAI data has been deleted" with option to start fresh

**Given** I receive a win-back email
**When** I click the reactivation link
**Then** I should be taken to the reactivation page with any discount applied

**E2E Test:** `24-offboarding.spec.ts` - "should handle win-back email flow"
**Journey Reference:** [`offboarding-journey-map.md`](../journeys/platform/offboarding-journey-map.md) - Phase 5

---

## Billing Stories (US-B)

> **Added (2026-01-22)**: New story category for payment lifecycle and compliance.

### US-B01: View Billing History

**As a** Paid User,
**I want to** view my billing history,
**So that** I can track my payments and expenses.

**Acceptance Criteria:**

**Given** I am on Settings → Billing
**When** I view the billing history section
**Then** I should see all past payments with date, amount, and status

**Given** I have many payments
**When** I filter by date range
**Then** I should see only payments within that range

**E2E Test:** `25-billing.spec.ts` - "should display billing history"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 1

---

### US-B02: Download Invoice

**As a** Paid User,
**I want to** download invoices as PDF,
**So that** I can submit them for expense reports or tax purposes.

**Acceptance Criteria:**

**Given** I am viewing my billing history
**When** I click "Download" on a payment
**Then** I should receive a PDF invoice with all legal requirements

**Given** the invoice is downloaded
**When** I review it
**Then** it should include company details, line items, and tax info

**E2E Test:** `25-billing.spec.ts` - "should download invoice PDF"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 1

---

### US-B03: Update Payment Method

**As a** Paid User,
**I want to** update my payment method,
**So that** I can ensure my subscription continues without interruption.

**Acceptance Criteria:**

**Primary Payment Method:**

**Given** I am on Settings → Billing
**When** I click "Update Payment Method"
**Then** I should see a secure form to enter new card details

**Given** I have entered valid card details
**When** I submit the form
**Then** my payment method should be updated and confirmed

**Given** I enter invalid card details
**When** I submit the form
**Then** I should see a clear error message

**Backup Payment Method:**

**Given** I am on Settings → Billing
**When** I view my payment methods
**Then** I should see an option to "Add Backup Payment Method"

**Given** I click "Add Backup Payment Method"
**When** I enter valid card details
**Then** the backup method should be saved and marked as "Backup"

**Given** my primary payment method fails
**When** automatic retry occurs
**Then** the system should attempt to charge my backup method

**Given** I have both primary and backup methods
**When** I want to switch them
**Then** I should be able to set either as primary

**E2E Test:** `25-billing.spec.ts` - "should update payment method"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 2

---

### US-B04: Handle Payment Failure

**As a** Paid User with failed payment,
**I want to** understand and resolve the payment issue,
**So that** I don't lose access to the platform.

**Acceptance Criteria:**

**Dunning Timeline:**

**Given** my payment fails (Day 0)
**When** the failure is detected
**Then** I should see:
  - Immediate automatic retry
  - Email: "Payment failed - Action required"
  - Dashboard banner (red): "Payment failed"
  - Full access maintained

**Given** my payment remains failed (Day 1)
**When** the second retry fails
**Then** I should receive email: "Reminder: Update your payment method"

**Given** my payment remains failed (Day 3)
**When** the third retry fails
**Then** I should see:
  - Email: "Urgent: Your subscription is at risk"
  - Dashboard banner: "Update payment to avoid interruption"
  - Full access maintained

**Given** my payment remains failed (Day 7)
**When** the final retry fails
**Then** I should see:
  - Email: "Final warning: Service suspension in 7 days"
  - In-app modal: "Payment overdue"
  - Full access maintained

**Given** my payment remains failed (Day 14)
**When** the suspension deadline is reached
**Then** I should see:
  - Email: "Your account has been suspended"
  - Dashboard: Suspended state
  - Read-only access only

**Given** my payment remains failed (Day 30)
**When** the cancellation deadline is reached
**Then** I should see:
  - Email: "Your subscription has been cancelled"
  - No access
  - Data retained for 90 days per retention policy

**Recovery:**

**Given** I update my payment method at any point in dunning
**When** the payment succeeds
**Then** I should see confirmation and full access should be restored immediately

**E2E Test:** `25-billing.spec.ts` - "should handle payment failure dunning"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 3

---

### US-B05: Request Refund

**As a** Paid User,
**I want to** request a refund,
**So that** I can get my money back if I'm not satisfied.

**Acceptance Criteria:**

**Refund Policy Tiers:**

**Given** I am within 0-14 days of payment
**When** I request a refund
**Then** it should be automatically approved and processed (full refund)

**Given** I am 14-30 days since payment
**When** I request a refund
**Then** I should see that it will be reviewed by support (prorated refund possible)

**Given** I am more than 30 days since payment
**When** I request a refund
**Then** I should see that refunds are not available except for billing errors

**Given** I am on an annual plan
**When** I request a refund after 30 days
**Then** I should see prorated refund based on unused months

**Processing:**

**Given** my refund is approved
**When** it is processed
**Then** I should receive confirmation email and see it in billing history

**Given** my refund is denied
**When** I view the response
**Then** I should see the reason and option to contact support

> **Note:** This refund policy applies to voluntary refund requests while the account remains active. Account deletion (US-S05) follows a different policy: subscription cancels immediately with no prorated refund for the current billing period.

**E2E Test:** `25-billing.spec.ts` - "should request refund"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 6

---

### US-B06: Change Plan

**As a** Paid User,
**I want to** upgrade or downgrade my plan,
**So that** I can adjust my subscription to my needs.

**Acceptance Criteria:**

**Given** I am on Settings → Billing
**When** I click "Change Plan"
**Then** I should see available plans with feature comparison

**Given** I select an upgrade
**When** I confirm the change
**Then** I should see prorated charge and immediate access to new features

**Given** I select a downgrade
**When** I confirm the change
**Then** I should see it takes effect at next billing date

**E2E Test:** `25-billing.spec.ts` - "should change subscription plan"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 4

---

### US-B07: View Tax Invoice (VAT/GST)

**As a** International Paid User,
**I want to** provide my VAT/GST number and receive compliant invoices,
**So that** I can reclaim taxes and maintain compliance.

**Acceptance Criteria:**

**Registry Validation by Region:**

**Given** I am on Settings → Billing → Tax
**When** I select my country and enter a tax ID
**Then** it should be validated against the appropriate registry:
  - EU countries: VIES (VAT Information Exchange System)
  - UK: HMRC VAT validation
  - Australia: ABN Lookup
  - Other countries: Manual entry accepted, marked as "unverified"

**Given** I enter an EU VAT number
**When** VIES validation succeeds
**Then** I should see "Verified" status and my number saved

**Given** I enter an invalid VAT number
**When** validation fails
**Then** I should see the specific error and option to retry or save as unverified

**Invoice Generation:**

**Given** I have a verified VAT/GST number (B2B)
**When** I download an invoice
**Then** it should show reverse charge (0% VAT) and my tax ID

**Given** I have an unverified tax ID
**When** I download an invoice
**Then** it should include applicable VAT/GST and note "Tax ID: unverified"

**Given** I don't have a tax ID (B2C)
**When** I download an invoice
**Then** it should include the correct local VAT/GST based on my billing address

**E2E Test:** `25-billing.spec.ts` - "should generate tax-compliant invoice"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 5

---

### US-B08: Apply Promo Code

**As a** User,
**I want to** apply a promo code,
**So that** I can receive a discount on my subscription.

**Acceptance Criteria:**

**Given** I have a promo code
**When** I enter it in the promo field
**Then** I should see the discount applied to my price

**Given** I enter an invalid code
**When** I try to apply it
**Then** I should see a clear error message

**Given** a promo code is applied
**When** I complete checkout
**Then** the discount should be reflected in my invoice

**E2E Test:** `25-billing.spec.ts` - "should apply promo code"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 6

---

### US-B09: Switch Billing Cycle

**As a** Monthly Subscriber,
**I want to** switch to annual billing,
**So that** I can save money with a longer commitment.

**Acceptance Criteria:**

**Given** I am on Settings → Billing
**When** I see "Switch to Annual"
**Then** I should see the savings calculation (e.g., "Save $120/year")

**Given** I click to switch
**When** I confirm the change
**Then** I should be charged prorated annual amount and see new billing date

**Given** I am on annual billing
**When** I view switch options
**Then** I should see that monthly is available at renewal

**E2E Test:** `25-billing.spec.ts` - "should switch to annual billing"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 4

---

### US-B10: Resume After Payment Recovery

**As a** User with restored payment,
**I want to** confirm my access is restored,
**So that** I can continue working without data loss.

**Acceptance Criteria:**

**Given** I have updated my payment method after failure
**When** the payment succeeds
**Then** I should see immediate confirmation of restored access

**Given** my access was read-only due to payment failure
**When** payment is recovered
**Then** I should have full access restored immediately

**Given** I was in dunning flow
**When** I recover payment
**Then** I should receive confirmation email and see normal billing status

**E2E Test:** `25-billing.spec.ts` - "should resume after payment recovery"
**Journey Reference:** [`billing-journey-map.md`](../journeys/platform/billing-journey-map.md) - Phase 3

---

## Notification Stories (US-N)

> **Added (2026-01-22)**: New story category for notification delivery and preference management.
> **User Scope**: All authenticated users (Founder, Consultant, Trial users). Admin receives system notifications separately.

### US-N01: Receive In-App Notification

**As any** authenticated user,
**I want to** receive real-time in-app notifications,
**So that** I stay informed while using the platform.

**Acceptance Criteria:**

**Given** an event occurs that requires my attention
**When** I am on the platform
**Then** I should see the notification badge update

**Given** I click the notification bell
**When** the dropdown opens
**Then** I should see my notifications with the most recent first

**Given** I click on a notification
**When** navigating
**Then** I should be taken to the relevant page

**E2E Test:** `26-notifications.spec.ts` - "should receive in-app notification"
**Journey Reference:** [`notification-journey-map.md`](../journeys/platform/notification-journey-map.md) - Phase 1

---

### US-N02: Receive Email Notification

**As any** authenticated user,
**I want to** receive email notifications for important events,
**So that** I stay informed even when not using the platform.

**Acceptance Criteria:**

**Given** a HITL checkpoint is ready
**When** 15 minutes pass without me viewing it
**Then** I should receive an email notification

**Given** my analysis phase completes
**When** results are ready
**Then** I should receive an email with summary

**Given** I receive a notification email
**When** I click the CTA button
**Then** I should be taken directly to the relevant page

**E2E Test:** `26-notifications.spec.ts` - "should receive email notification"
**Journey Reference:** [`notification-journey-map.md`](../journeys/platform/notification-journey-map.md) - Phase 2

---

### US-N03: Manage Notification Preferences

**As any** authenticated user,
**I want to** control which notifications I receive,
**So that** I'm not overwhelmed but stay informed about what matters.

**Acceptance Criteria:**

**Given** I am on Settings → Notifications
**When** I view my preferences
**Then** I should see categories (Product, Marketing) with channel options (In-App, Email, Browser)

**Given** I toggle a notification setting
**When** I save my preferences
**Then** future notifications should respect my choices

**Given** I disable email for phase completion
**When** a phase completes
**Then** I should only receive in-app notification, not email

**E2E Test:** `26-notifications.spec.ts` - "should manage notification preferences"
**Journey Reference:** [`notification-journey-map.md`](../journeys/platform/notification-journey-map.md) - Phase 3

---

### US-N04: Escalation Alert (Approval Aging)

**As any** authenticated user with pending HITL approval,
**I want to** receive escalating reminders,
**So that** I don't block my validation progress.

**Acceptance Criteria:**

**Escalation Timeline:**

**Given** I have a HITL checkpoint pending (immediate)
**When** the checkpoint is created
**Then** I should see an in-app notification with normal badge

**Given** I haven't viewed the in-app notification after 15 minutes
**When** the escalation triggers
**Then** I should receive an email: "Action needed: Your {checkpoint_name} is ready for review"

**Given** I have a HITL checkpoint pending for 24 hours
**When** the escalation triggers
**Then** I should receive:
  - In-app: Reminder with amber (warning) badge
  - Email: "Reminder: Your {checkpoint_name} needs attention"

**Given** I have a HITL checkpoint pending for 3 days
**When** the escalation triggers
**Then** I should receive:
  - In-app: "Overdue" with red (urgent) badge
  - Email: "Overdue: Your validation is paused"
  - Workflow paused indicator
  - Consultant notified (if applicable)

**Given** I have a HITL checkpoint pending for 7 days
**When** the escalation triggers
**Then** I should see:
  - In-app: "Critical" with red badge + pulse animation
  - Email: "Critical: Your project needs attention"
  - Message: "Workflow has been paused for 7 days"

**Given** I have a HITL checkpoint pending for 30 days
**When** the deadline passes
**Then** I should see:
  - Project auto-paused
  - Email only: "Your project {project_name} has been paused"
  - Can resume anytime by completing the approval

**E2E Test:** `26-notifications.spec.ts` - "should escalate approval reminders"
**Journey Reference:** [`notification-journey-map.md`](../journeys/platform/notification-journey-map.md) - Phase 4

---

### US-N05: Unsubscribe from Emails

**As any** authenticated user,
**I want to** unsubscribe from non-essential emails,
**So that** I control my inbox.

**Acceptance Criteria:**

**Given** I receive a marketing email
**When** I click "Unsubscribe"
**Then** I should be unsubscribed without logging in

**Given** I click unsubscribe
**When** the page loads
**Then** I should see confirmation and option to manage all preferences

**Given** I unsubscribe from marketing
**When** I check my preferences
**Then** I should still receive transactional/security emails

**E2E Test:** `26-notifications.spec.ts` - "should unsubscribe from marketing emails"
**Journey Reference:** [`notification-journey-map.md`](../journeys/platform/notification-journey-map.md) - Phase 5

---

## Authentication Stories (US-AU)

> **Added (2026-01-23)**: Core authentication flows for all product users.

### US-AU01: Log In to Product App

**As any** authenticated user,
**I want to** sign in to the product app,
**So that** I can access my dashboard or onboarding flow.

**Acceptance Criteria:**

**Given** I am on `/login`
**When** I enter valid credentials or use OAuth
**Then** I should be redirected to onboarding or my dashboard

**Given** I enter invalid credentials
**When** I submit the form
**Then** I should see a clear error message

**E2E Test:** `01-login.spec.ts` - "should successfully login as Consultant"
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 4

---

### US-AU02: Handle OAuth Error States

**As any** authenticated user,
**I want to** see a clear error when OAuth fails,
**So that** I can retry or return to login.

**Acceptance Criteria:**

**Given** OAuth returns an error code
**When** I land on `/auth/auth-code-error`
**Then** I should see the error message and a link to retry login

**Given** I click "Back to Login"
**When** I return to `/login`
**Then** I should be able to attempt authentication again

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (error handling)

---

### US-AU03: Log Out of Product App

**As any** authenticated user,
**I want to** log out of the product app,
**So that** my session ends securely.

**Acceptance Criteria:**

**Given** I am signed in to the product app
**When** I click "Logout" in the sidebar
**Then** my session should end and I should be redirected to the login page

**Given** I have logged out
**When** I attempt to visit a protected page
**Then** I should be prompted to sign in again

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (authentication)

---

## Core Product Tool Stories (US-CP)

> **Added (2026-01-23)**: Cross-role tooling surfaces for analytics, canvases, workflows, and exports.

### US-CP01: Browse Canvas Gallery

**As any** authenticated user,
**I want to** browse available validation canvases,
**So that** I can choose the right framework for my work.

**Acceptance Criteria:**

**Given** I navigate to `/canvas`
**When** the page loads
**Then** I should see available canvases (VPC, BMC, TBI) with quick links

**Given** I select a canvas
**When** I click "Open"
**Then** I should be routed to the selected canvas editor

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP02: Edit Value Proposition Canvas

**As any** authenticated user,
**I want to** edit the Value Proposition Canvas,
**So that** I can document customer profiles and value maps.

**Acceptance Criteria:**

**Given** I navigate to `/canvas/vpc`
**When** the editor loads
**Then** I should see Customer Profile and Value Map sections

**Given** I update a canvas field
**When** I save changes
**Then** the updated content should persist for my project

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP03: Edit Business Model Canvas

**As any** authenticated user,
**I want to** edit the Business Model Canvas,
**So that** I can document key model assumptions.

**Acceptance Criteria:**

**Given** I navigate to `/canvas/bmc`
**When** the editor loads
**Then** I should see all nine BMC blocks

**Given** I update a block
**When** I save changes
**Then** the updated content should persist for my project

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP04: Edit Testing Business Ideas Canvas

**As any** authenticated user,
**I want to** edit the Testing Business Ideas canvas,
**So that** I can capture validation experiments and evidence plans.

**Acceptance Criteria:**

**Given** I navigate to `/canvas/tbi`
**When** the editor loads
**Then** I should see experiment and evidence planning fields

**Given** I update a field
**When** I save changes
**Then** the updated content should persist for my project

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP05: Run AI Workflows

**As any** authenticated user,
**I want to** view and trigger AI workflows,
**So that** I can start validation runs or automation tasks.

**Acceptance Criteria:**

**Given** I navigate to `/workflows`
**When** the page loads
**Then** I should see a list of workflows with status indicators

**Given** I click "Run" on a workflow
**When** the action is confirmed
**Then** I should see the workflow start or show a queued state

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP06: View Analytics Dashboard

**As any** authenticated user,
**I want to** view analytics metrics,
**So that** I can monitor activity and progress across projects.

**Acceptance Criteria:**

**Given** I navigate to `/analytics`
**When** the page loads
**Then** I should see key metrics and a last-updated timestamp

**Given** data is unavailable
**When** the dashboard loads
**Then** I should see an empty state with guidance

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP07: Export Evidence Pack

**As any** authenticated user,
**I want to** export an evidence pack,
**So that** I can share validation results externally.

**Acceptance Criteria:**

**Given** I navigate to `/export`
**When** the page loads
**Then** I should see evidence pack and canvas export options

**Given** I click "Export Pack"
**When** the export is prepared
**Then** I should be prompted to download the file

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP08: View Validation Summary

**As any** authenticated user,
**I want to** view a validation summary,
**So that** I can assess overall project progress at a glance.

**Acceptance Criteria:**

**Given** I navigate to `/validation`
**When** the page loads
**Then** I should see a summary of validation results and signals

**Given** there is no data
**When** the page loads
**Then** I should see an empty state explaining next steps

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (tooling surface)

---

### US-CP09: Ask AI Strategic Analysis

**As any** authenticated user,
**I want to** ask an AI strategic question,
**So that** I can receive targeted analysis on my project.

**Acceptance Criteria:**

**Given** I navigate to `/ai-analysis`
**When** the page loads
**Then** I should see a question input and submission controls

**Given** I submit a question
**When** analysis completes
**Then** I should see an AI-generated response

**E2E Test:** Gap - needs test
**Journey Reference:** N/A (legacy analysis page)

---

## Account Settings Stories (US-AS)

> **Added (2026-01-22)**: New story category for profile and security management.
> **User Scope**: All authenticated users including Admin.

### US-AS01: Update Profile

**As any** authenticated user,
**I want to** update my profile information,
**So that** my account reflects current details.

**Acceptance Criteria:**

**Given** I am on Settings → Profile
**When** I view my profile
**Then** I should see my current name, email, company, and timezone

**Given** I click to edit my name
**When** I save changes
**Then** my name should be updated across the platform

**Given** I change my email
**When** I save
**Then** I should receive verification at the new email address

**E2E Test:** `27-account-settings.spec.ts` - "should update profile"
**Journey Reference:** [`account-settings-journey-map.md`](../journeys/platform/account-settings-journey-map.md) - Phase 1

---

### US-AS02: Change Password

**As any** authenticated user,
**I want to** change my password,
**So that** I can maintain account security.

**Acceptance Criteria:**

**Given** I am on Settings → Security
**When** I click "Change Password"
**Then** I should see fields for current and new password

**Given** I enter a new password
**When** it meets requirements (8+ chars, uppercase, number, special)
**Then** the strength indicator should show "Strong"

**Given** I submit a valid password change
**When** it succeeds
**Then** I should see confirmation and receive a security email

**Given** I forgot my password
**When** I click "Forgot password?"
**Then** I should receive a reset email

**E2E Test:** `27-account-settings.spec.ts` - "should change password"
**Journey Reference:** [`account-settings-journey-map.md`](../journeys/platform/account-settings-journey-map.md) - Phase 2

---

### US-AS03: Enable 2FA

**As a** Security-Conscious User,
**I want to** enable two-factor authentication,
**So that** my account is protected even if my password is compromised.

**Acceptance Criteria:**

**Given** I am on Settings → Security
**When** I click "Enable 2FA"
**Then** I should see a QR code to scan with my authenticator app

**Given** I have scanned the QR code
**When** I enter the verification code
**Then** 2FA should be enabled and I should receive backup codes

**Given** 2FA is enabled
**When** I log in
**Then** I should be prompted for my 2FA code after password

**Given** I want to disable 2FA
**When** I confirm with my password
**Then** 2FA should be disabled and I should receive a security alert

**E2E Test:** `27-account-settings.spec.ts` - "should enable and disable 2FA"
**Journey Reference:** [`account-settings-journey-map.md`](../journeys/platform/account-settings-journey-map.md) - Phase 3

---

### US-AS04: View Login History

**As any** authenticated user,
**I want to** view my recent login activity,
**So that** I can detect unauthorized access.

**Acceptance Criteria:**

**Given** I am on Settings → Security
**When** I view Login History
**Then** I should see recent logins with device, location, and time

**Given** I see an unfamiliar login
**When** it's highlighted as suspicious
**Then** I should be able to report it or sign out that session

**Given** I am viewing login history
**When** I filter by date
**Then** I should see only logins within that period

**Suspicious Login Detection Criteria:**

**Primary signals** (trigger notification + highlight in login history):
- **New device**: Device not seen in last 90 days
- **Unusual location**: Login from >500km from typical locations
- **Multiple failed attempts**: >3 failed login attempts in 5 minutes before success

**Secondary signal** (triggers step-up auth, not automatic block):
- **VPN/Tor detected**: Prompt for additional verification (2FA code or email confirmation)

**Given** a login matches primary suspicious criteria
**When** I next view my account
**Then** I should see a security notification prompting review of recent logins

**Given** a login is detected from VPN/Tor
**When** I complete initial authentication
**Then** I should be prompted for step-up verification (not blocked)

**E2E Test:** `27-account-settings.spec.ts` - "should display login history"
**Journey Reference:** [`account-settings-journey-map.md`](../journeys/platform/account-settings-journey-map.md) - Phase 4

---

### US-AS05: Manage Connected Devices

**As any** authenticated user,
**I want to** see and manage my connected devices,
**So that** I can control which devices have access to my account.

**Acceptance Criteria:**

**Given** I am on Settings → Security
**When** I view Connected Devices
**Then** I should see all devices with active sessions

**Given** I see an unfamiliar device
**When** I click "Sign out"
**Then** that device's session should be terminated

**Given** I want to secure my account
**When** I click "Sign out all other devices"
**Then** all sessions except current should be terminated

**E2E Test:** `27-account-settings.spec.ts` - "should manage connected devices"
**Journey Reference:** [`account-settings-journey-map.md`](../journeys/platform/account-settings-journey-map.md) - Phase 5

---

## Marketing Funnel Stories (US-MF)

> **Added (2026-01-22)**: New story category for pre-signup marketing touchpoints. Implementation in startupai.site (marketing repo), stories documented here for cross-repo visibility.

### US-MF01: View Landing Page Value Proposition

**As a** Visitor,
**I want to** understand the value proposition quickly,
**So that** I can decide if StartupAI is relevant to my needs.

**Acceptance Criteria:**

**Given** I am a prospective Founder
**When** I land on startupai.site
**Then** I should see:
  - Hero headline focused on "validate your idea"
  - Clear value propositions (AI-powered validation, 5-phase framework)
  - Social proof (testimonials, logos, metrics)
  - Primary CTA to start free trial

**Given** I am a prospective Consultant
**When** I view the consultant-focused page (or toggle)
**Then** I should see:
  - Hero headline focused on "grow your practice"
  - Value propositions (client management, white-label ready)
  - Consultant-specific testimonials
  - Primary CTA to start consultant trial

**Given** I am on any landing page
**When** I scroll down
**Then** I should see secondary content (features, how it works, FAQ)

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Steps 1-3

---

### US-MF02: Evaluate Pricing Options

**As a** Visitor considering signup,
**I want to** compare pricing plans,
**So that** I can choose the right plan for my needs.

**Acceptance Criteria:**

**Given** I click "Pricing" in the navigation
**When** the pricing page loads
**Then** I should see:
  - Plan comparison table (Founder vs Consultant)
  - Feature matrix showing what's included in each tier
  - Monthly/annual toggle with savings displayed
  - Clear CTA buttons for each plan

**Given** I am viewing pricing
**When** I hover over a feature
**Then** I should see a tooltip explaining the feature

**Given** I am undecided between plans
**When** I look for help
**Then** I should see "Not sure? Start with our 14-day free trial"

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 4

---

### US-MF03: Complete Signup Form

**As a** Visitor ready to try StartupAI,
**I want to** create an account quickly,
**So that** I can start using the platform.

**Acceptance Criteria:**

**Given** I click "Start Free Trial" or "Get Started"
**When** I am on the signup page
**Then** I should see:
  - Pre-selected plan type (based on CTA clicked)
  - Email and name fields
  - OAuth option (GitHub)
  - "No credit card required" reassurance

**Given** I have entered my email and selected a plan
**When** I click "Continue with GitHub"
**Then** I should be redirected to GitHub for OAuth authentication

**Given** OAuth succeeds
**When** I am redirected back
**Then** I should land on app.startupai.site/onboarding with my plan pre-set

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 5

---

### US-MF04: View Product Overview

**As a** Visitor,
**I want to** explore the product overview,
**So that** I can understand what StartupAI delivers.

**Acceptance Criteria:**

**Given** I navigate to `/product`
**When** the page loads
**Then** I should see core product capabilities, feature highlights, and a CTA to start

**Given** I scroll the product overview
**When** I reach the CTA section
**Then** I should see a link to the product signup flow

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF05: Understand AI Strategy and Process

**As a** Visitor,
**I want to** understand the AI strategy and validation process,
**So that** I can evaluate the methodology before signing up.

**Acceptance Criteria:**

**Given** I navigate to `/ai-strategy` or `/process`
**When** the page loads
**Then** I should see the step-by-step process and methodology details

**Given** I finish reviewing the process
**When** I reach the CTA
**Then** I should see a link to start the trial

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF06: Review Services

**As a** Visitor,
**I want to** review consulting services,
**So that** I can choose the right engagement option.

**Acceptance Criteria:**

**Given** I navigate to `/services`
**When** the page loads
**Then** I should see the list of service offerings with CTAs

**Given** I navigate to a service detail page
**When** the page loads
**Then** I should see the service scope, outcomes, and a contact CTA

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) - Phase 1

---

### US-MF07: Review Case Studies

**As a** Visitor,
**I want to** review case studies,
**So that** I can see real outcomes from StartupAI.

**Acceptance Criteria:**

**Given** I navigate to `/case-studies`
**When** the page loads
**Then** I should see case study summaries with outcomes

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF08: Read Blog Content

**As a** Visitor,
**I want to** read blog content,
**So that** I can learn about validation practices.

**Acceptance Criteria:**

**Given** I navigate to `/blog`
**When** the page loads
**Then** I should see a list of blog posts

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF09: Contact StartupAI

**As a** Visitor,
**I want to** contact StartupAI,
**So that** I can ask questions or request a consultation.

**Acceptance Criteria:**

**Given** I navigate to `/contact`
**When** the page loads
**Then** I should see a contact form and contact details

**Given** I submit the form with valid details
**When** the form is accepted
**Then** I should see a confirmation state

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF10: Request Beta Access

**As a** Visitor,
**I want to** apply for beta access,
**So that** I can join the early access program.

**Acceptance Criteria:**

**Given** I navigate to `/beta`
**When** the page loads
**Then** I should see the beta application form

**Given** I submit the form with valid details
**When** submission succeeds
**Then** I should see a success message

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 2

---

### US-MF11: View Demo Dashboard

**As a** Visitor,
**I want to** view a demo dashboard,
**So that** I can preview the product experience.

**Acceptance Criteria:**

**Given** I navigate to `/demo/dashboard`
**When** the page loads
**Then** I should see a demo experience or walkthrough

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF12: View About Page

**As a** Visitor,
**I want to** learn about StartupAI,
**So that** I can assess credibility and mission fit.

**Acceptance Criteria:**

**Given** I navigate to `/about`
**When** the page loads
**Then** I should see company mission, story, and team details

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF13: Preview Upcoming Features

**As a** Visitor,
**I want to** preview upcoming features,
**So that** I can understand future capabilities.

**Acceptance Criteria:**

**Given** I navigate to `/preview`
**When** the page loads
**Then** I should see a preview of upcoming features

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 1

---

### US-MF14: Sign In from Marketing Site

**As a** Returning User,
**I want to** sign in from the marketing site,
**So that** I can reach the product app quickly.

**Acceptance Criteria:**

**Given** I navigate to `/login` on the marketing site
**When** the page loads
**Then** I should be redirected to the product login page

**Given** authentication succeeds
**When** I land on `/auth/success`
**Then** I should see confirmation and a redirect to the app

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 4

---

### US-MF15: Review Design System Preview

**As a** Marketing Designer,
**I want to** review the design system preview,
**So that** I can QA visual consistency before publishing.

**Acceptance Criteria:**

**Given** I navigate to `/design-system-test`
**When** the page loads
**Then** I should see the UI component preview surface

**E2E Test:** Gap - marketing site (cross-repo)
**Journey Reference:** N/A (internal QA)

---
