---
purpose: "Comprehensive user stories with acceptance criteria linked to E2E tests"
status: "active"
last_reviewed: "2026-01-19"
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

### US-F01: Complete AI-Guided Onboarding

**As a** Founder,
**I want to** complete the 7-stage AI conversation with Alex,
**So that** my business idea is captured for strategic analysis.

**Acceptance Criteria:**

**Given** I am logged in as a Founder or Trial user
**When** I navigate to `/onboarding/founder`
**Then** I should see the chat interface with Alex's welcome message

**Given** I have provided responses covering all 7 conversation topics
**When** the quality assessment threshold is reached for each stage
**Then** the system should advance me through all stages automatically

**Given** I have completed Stage 7 (Goals & Next Steps)
**When** I click "Approve" in the Summary Modal
**Then** CrewAI analysis should be triggered and I should be redirected to my dashboard

**E2E Test:** `02-onboarding-flow.spec.ts` - "should progress through Stage 1-7"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Steps 6-11

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

### US-F07: Resume Paused Session

**As a** Founder,
**I want to** resume a paused onboarding conversation,
**So that** I don't lose progress if I need to step away.

**Acceptance Criteria:**

**Given** I have an active onboarding session with conversation history
**When** I close the browser and return later
**Then** my conversation should be restored at the same stage

**Given** I am resuming a session
**When** the page loads
**Then** I should see a "Resuming previous conversation" indicator

**Given** a message was pending when I left
**When** I return to the session
**Then** the pending message should be recovered from localStorage

**E2E Test:** `07-adr005-persistence.spec.ts` - "should preserve conversation history after page refresh"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Section 4.3

---

### US-F08: Start New Conversation

**As a** Founder,
**I want to** start a new onboarding conversation,
**So that** I can begin fresh if my previous attempt was off-track.

**Acceptance Criteria:**

**Given** I have an existing onboarding session
**When** I click "Start New Conversation" in the sidebar
**Then** I should see a confirmation dialog

**Given** I confirm starting a new conversation
**When** the dialog closes
**Then** my current session should be marked as "abandoned" and a fresh session should begin

**Given** I started a new conversation
**When** I see the chat interface
**Then** Alex should greet me with the initial welcome message

**E2E Test:** `02-onboarding-flow.spec.ts` - "should show Start New Conversation option in sidebar"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Section 4.3

---

## Consultant Stories (US-C)

### US-C01: Complete Practice Setup

**As a** Consultant,
**I want to** complete my practice setup with Maya,
**So that** I can configure my consulting profile and specializations.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant without a completed profile
**When** I access the platform
**Then** I should be directed to practice setup with Maya (Consultant AI)

**Given** I am in practice setup
**When** I provide information about my specializations and industries
**Then** my consultant profile should be populated

**Given** I complete practice setup
**When** the setup is finalized
**Then** I should be redirected to `/consultant-dashboard`

**E2E Test:** `09-consultant-practice-setup.spec.ts` - "should complete consultant practice setup stages"
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

### US-C07: Onboard Client on Behalf

**As a** Consultant,
**I want to** guide a client through onboarding in their presence,
**So that** I can facilitate their business validation conversation.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant
**When** I start "Add Client" → "Onboard Now"
**Then** Alex should start in "client mode" referencing "your client" not "you"

**Given** I am onboarding on behalf of a client
**When** the 7-stage conversation completes
**Then** the data should be stored to the client's project, not mine

**Given** client onboarding completes
**When** I approve the summary
**Then** I should be redirected to the client detail page

**E2E Test:** `10-consultant-client-onboarding.spec.ts` - "should complete 7-stage business validation for client"
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
| 2026-01-19 | Initial creation - consolidated 18 user stories with acceptance criteria |
