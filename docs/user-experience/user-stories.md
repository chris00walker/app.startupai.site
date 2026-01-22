---
purpose: "Comprehensive user stories with acceptance criteria linked to E2E tests"
status: "active"
last_reviewed: "2026-01-22"
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

### US-F08: View Phase 1 Progress Indicators

> **Updated (2026-01-22)**: Decomposed from original US-F08 for smaller, testable units.

**As a** Founder,
**I want to** see real-time progress while Phase 1 is running,
**So that** I know validation is happening and can track progress.

**Acceptance Criteria:**

**Given** I have submitted Quick Start and Phase 1 is running
**When** I view my dashboard
**Then** I should see:
  - Phase indicator with "IN PROGRESS" badge
  - Segmented progress bar (Market Research → Competitor Analysis → Brief Generation → QA)
  - Current segment highlighted with shimmer animation
  - Estimated time remaining

**Given** Phase 1 is taking longer than expected (>20 minutes)
**When** the estimated time passes
**Then** I should see:
  - "Taking longer than expected" message
  - Updated time estimate
  - Reassurance that work is continuing

**Given** Phase 1 reaches a HITL checkpoint
**When** the checkpoint is ready
**Then** I should see:
  - Progress bar complete
  - "Ready for Review" state
  - Receive browser notification (if enabled)

**E2E Test:** `04-founder-analysis-journey.spec.ts` - "should show phase progress indicators"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Steps 6-7

---

### US-F09: View Activity Feed Updates

> **Added (2026-01-22)**: Decomposed from original US-F08.

**As a** Founder,
**I want to** see a timestamped activity feed while Phase 1 runs,
**So that** I can follow what the AI team is doing.

**Acceptance Criteria:**

**Given** Phase 1 is running
**When** I view the AI Team Activity section
**Then** I should see:
  - Vertical timeline of completed activities
  - Agent name and avatar for each activity (Sage, Forge, Pulse, etc.)
  - Timestamp (HH:MM format)
  - Activity description (e.g., "Completed market size analysis")

**Given** a new activity completes
**When** I am viewing the activity feed
**Then** the new activity should appear at the top with a subtle animation

**Given** Phase 1 transitions between segments
**When** the transition occurs
**Then** I should see a "Phase transition" entry in the feed

**E2E Test:** `04-founder-analysis-journey.spec.ts` - "should update activity feed in real-time"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 6

---

### US-F10: Handle Phase 1 Errors and Retry

> **Added (2026-01-22)**: Decomposed from original US-F08.

**As a** Founder,
**I want to** understand and recover from Phase 1 errors,
**So that** I don't lose progress when issues occur.

**Acceptance Criteria:**

**Given** Phase 1 encounters an error
**When** the system detects a failure
**Then** I should see:
  - Error card with clear message
  - "AI Analysis Temporarily Unavailable" explanation
  - Auto-retry countdown (30 second intervals, 3 attempts)

**Given** auto-retry is in progress
**When** I view my dashboard
**Then** I should see:
  - Retry attempt counter (e.g., "Retry 1 of 3")
  - Countdown timer to next retry
  - Option to cancel and retry manually later

**Given** all auto-retries fail
**When** the final retry fails
**Then** I should see:
  - Clear error message with support contact option
  - "Retry Now" button for manual retry
  - Partial progress preserved (any completed segments shown)

**Given** I click "Retry Now" after failure
**When** the retry begins
**Then** the system should resume from the last successful checkpoint

**E2E Test:** `04-founder-analysis-journey.spec.ts` - "should handle phase errors gracefully"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 7

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

## Founder Trial Stories (US-FT)

> **Updated (2026-01-22)**: Renamed from "Trial User Stories (US-T)" to reflect the trial split. Original US-T01/T02/T03 are now US-FT01/FT02/FT03.

### US-FT01: Start Founder Trial Onboarding

**As a** Founder Trial user,
**I want to** begin the onboarding process,
**So that** I can evaluate the platform with my business idea.

**Acceptance Criteria:**

**Given** I am a new user who signed up with "founder" intent
**When** I complete authentication
**Then** I should be redirected to `/onboarding/founder`

**Given** I am on the onboarding page
**When** the page loads
**Then** I should see the Quick Start form explaining the process

**E2E Test:** `02-onboarding-flow.spec.ts` - "should start and access onboarding interface"
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

### US-FT02: View Founder Trial Limits

**As a** Founder Trial user,
**I want to** see my remaining usage limits,
**So that** I know when I need to upgrade.

**Acceptance Criteria:**

**Given** I am logged in as a Founder Trial user
**When** I view my dashboard or attempt a limited action
**Then** I should see my remaining allowance (e.g., "2/3 projects created")

**Given** I have reached a usage limit
**When** I attempt the restricted action
**Then** I should see an upgrade prompt instead of performing the action

**E2E Test:** `13-trial-limits.spec.ts` - "should display trial status card on dashboard"
**Journey Reference:** [`user-personas.md`](./user-personas.md) - Founder Trial Restrictions

---

### US-FT03: Upgrade to Founder Plan

**As a** Founder Trial user,
**I want to** upgrade to the paid Founder plan,
**So that** I can unlock full platform access.

**Acceptance Criteria:**

**Given** I am logged in as a Founder Trial user
**When** I click an upgrade prompt or navigate to billing
**Then** I should see the Founder plan pricing ($49/mo) and features

**Given** I complete the upgrade payment
**When** the transaction succeeds
**Then** my role should change from `founder_trial` to `founder` and limits should be removed

**E2E Test:** `13-trial-limits.spec.ts` - "should initiate Stripe checkout"
**Journey Reference:** [`user-personas.md`](./user-personas.md) - Founder Trial Conversion Path

---

### US-FT04: Experience Post-Upgrade Orientation

> **Added (2026-01-22)**: Addresses missing post-upgrade touchpoint from founder-trial-journey-map.md.

**As a** newly upgraded Founder,
**I want to** understand what's changed after upgrading,
**So that** I can take full advantage of my paid plan.

**Acceptance Criteria:**

**Given** I have just completed my upgrade payment
**When** I return to my dashboard
**Then** I should see a welcome modal with:
  - Congratulations message
  - Summary of unlocked features (unlimited analysis runs, priority processing)
  - Quick action buttons (Continue current project, Start new project)

**Given** I see the post-upgrade modal
**When** I dismiss it or take action
**Then** my dashboard should show:
  - Trial badge removed
  - Usage limits removed from UI
  - "Founder" plan badge visible

**Given** I upgraded from trial
**When** I view my project
**Then** any "Trial limit reached" banners should be removed

**Given** I upgraded from trial
**When** I check my email
**Then** I should receive a welcome email with tips for getting the most from my plan

**E2E Test:** `13-trial-limits.spec.ts` - "should show post-upgrade orientation"
**Journey Reference:** [`founder-trial-journey-map.md`](./founder-trial-journey-map.md) - Phase 4 (Post-Upgrade)

---

## Consultant Trial Stories (US-CT)

> **Added (2026-01-22)**: New story category for consultant trial experience with mock clients.

### US-CT01: Complete Consultant Trial Onboarding

**As a** Consultant Trial user,
**I want to** complete the practice setup onboarding,
**So that** I can evaluate the consultant experience before paying.

**Acceptance Criteria:**

**Given** I am a new user who signed up with "consultant" intent
**When** I complete authentication
**Then** I should be redirected to `/onboarding/consultant`

**Given** I am on the consultant onboarding page
**When** the page loads
**Then** I should see a practice setup form (specializations, industries, experience)

**Given** I complete the practice setup form
**When** I click "Start Trial"
**Then** I should be redirected to `/consultant-dashboard` with 2 pre-populated mock clients

**E2E Test:** `22-consultant-trial.spec.ts` - "should complete consultant trial onboarding"
**Journey Reference:** [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) - Phase 1

---

### US-CT02: Explore Portfolio with Mock Clients

**As a** Consultant Trial user,
**I want to** view and interact with mock clients in my portfolio,
**So that** I can understand the multi-client management experience.

**Acceptance Criteria:**

**Given** I have completed consultant trial onboarding
**When** I view my consultant dashboard
**Then** I should see 2 mock clients with different validation stages

**Given** I am viewing my portfolio
**When** I click on a mock client card
**Then** I should see their full detail page with D-F-V signals and canvases

**Given** I am viewing a mock client
**When** I look at the data
**Then** I should see realistic sample data (not placeholder text)

**Given** I am viewing my portfolio
**When** I see the trial badge
**Then** I should see "Trial: 2 mock clients" with days remaining

**E2E Test:** `22-consultant-trial.spec.ts` - "should display mock clients in portfolio"
**Journey Reference:** [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) - Phase 2

---

### US-CT03: Attempt Real Client Invite (Upgrade Prompt)

**As a** Consultant Trial user,
**I want to** see an upgrade prompt when I try to invite a real client,
**So that** I understand what I need to do to unlock full functionality.

**Acceptance Criteria:**

**Given** I am on my consultant dashboard
**When** I click "Add Client"
**Then** I should see the invite form appear

**Given** I am filling out the invite form
**When** I enter a real email address and click "Send Invite"
**Then** I should see an upgrade modal instead of sending the invite

**Given** I see the upgrade modal
**When** I view the content
**Then** I should see: feature comparison (trial vs paid), pricing ($149/mo), "Upgrade Now" CTA

**Given** I click "Upgrade Now"
**When** the Stripe checkout loads
**Then** I should see the Consultant plan with correct pricing

**Given** I dismiss the upgrade modal
**When** I return to the dashboard
**Then** my mock clients should still be available

**E2E Test:** `22-consultant-trial.spec.ts` - "should show upgrade prompt on real invite attempt"
**Journey Reference:** [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) - Phase 3

---

### US-CT04: View Consultant Trial Limits and Status

**As a** Consultant Trial user,
**I want to** see my trial status and remaining limits,
**So that** I know when I need to upgrade.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant Trial user
**When** I view my dashboard
**Then** I should see a trial status card with: days remaining, mock clients used (2/2), features locked

**Given** my trial has 3 days remaining
**When** I view the trial status
**Then** I should see an urgent badge with "3 days left"

**Given** my trial has expired
**When** I try to access the dashboard
**Then** I should see a full-page upgrade prompt with: trial ended message, portfolio preview, upgrade CTA

**E2E Test:** `22-consultant-trial.spec.ts` - "should display trial status card"
**Journey Reference:** [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) - Phase 2

---

### US-CT05: Upgrade to Consultant Plan

**As a** Consultant Trial user,
**I want to** upgrade to the paid Consultant plan,
**So that** I can invite real clients and access full features.

**Acceptance Criteria:**

**Given** I am logged in as a Consultant Trial user
**When** I click any upgrade prompt
**Then** I should see Stripe checkout with Consultant plan ($149/mo)

**Given** I complete payment successfully
**When** the webhook processes
**Then** my role should change from `consultant_trial` to `consultant`

**Given** I have upgraded
**When** I return to my dashboard
**Then** I should see: mock clients converted to "sample" clients (archivable), "Add Client" now functional, trial badge removed

**Given** I have upgraded
**When** I try to invite a real client
**Then** the invite should send successfully

**E2E Test:** `22-consultant-trial.spec.ts` - "should upgrade to consultant plan"
**Journey Reference:** [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) - Phase 4

---

### US-CT06: Experience Post-Upgrade Orientation

> **Added (2026-01-22)**: Addresses missing post-upgrade touchpoint from consultant-trial-journey-map.md.

**As a** newly upgraded Consultant,
**I want to** understand what's changed after upgrading,
**So that** I can start inviting real clients immediately.

**Acceptance Criteria:**

**Given** I have just completed my upgrade payment
**When** I return to my dashboard
**Then** I should see a welcome modal with:
  - Congratulations message
  - Summary of unlocked features (real client invites, unlimited clients)
  - Quick action buttons (Invite first client, Archive mock clients)

**Given** I see the post-upgrade modal
**When** I dismiss it or take action
**Then** my dashboard should show:
  - Trial badge removed
  - Mock clients marked as "Sample" with archive option
  - "Add Client" button now fully functional
  - "Consultant" plan badge visible

**Given** I upgraded from trial
**When** I try to send a client invite
**Then** the invite should process and send successfully

**Given** I upgraded from trial
**When** I check my email
**Then** I should receive a welcome email with:
  - Tips for onboarding your first real client
  - Link to white-label settings
  - Best practices for consultant success

**E2E Test:** `22-consultant-trial.spec.ts` - "should show post-upgrade orientation"
**Journey Reference:** [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) - Phase 4 (Post-Upgrade)

---

## Admin Stories (US-A)

> **Added (2026-01-22)**: New story category for platform administration and support workflows.

### US-A01: Search and Find Users

**As an** Admin,
**I want to** search for users by email, name, or project ID,
**So that** I can quickly find the user I need to help.

**Acceptance Criteria:**

**Given** I am logged in as an Admin
**When** I navigate to `/admin/users`
**Then** I should see a search interface with email, name, and project ID fields

**Given** I enter a partial email address
**When** I click "Search"
**Then** I should see matching users with their role, status, and last active date

**Given** I enter a project ID
**When** I click "Search"
**Then** I should see the user who owns that project

**E2E Test:** `19-admin-user-management.spec.ts` - "should search users by email"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 1

---

### US-A02: View User Profile and State

**As an** Admin,
**I want to** view a user's complete profile and current state,
**So that** I can understand their situation before helping them.

**Acceptance Criteria:**

**Given** I have found a user via search
**When** I click on their row
**Then** I should see their profile page with: account info, role, plan, projects list, recent activity

**Given** I am viewing a user's profile
**When** I look at the "Current State" section
**Then** I should see: active project phase, pending HITL checkpoints, usage limits remaining

**Given** the user has multiple projects
**When** I view their projects list
**Then** I should see each project's status, phase, and last activity

**E2E Test:** `19-admin-user-management.spec.ts` - "should display user profile details"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 1

---

### US-A03: Impersonate User (Read-Only)

**As an** Admin,
**I want to** view the platform as a specific user sees it,
**So that** I can debug issues they're experiencing.

**Acceptance Criteria:**

**Given** I am viewing a user's profile
**When** I click "View as User"
**Then** I should see their dashboard exactly as they see it (read-only mode)

**Given** I am impersonating a user
**When** I try to click any action button
**Then** I should see a toast: "Read-only mode - actions disabled"

**Given** I am impersonating a user
**When** I click "Exit Impersonation" in the admin banner
**Then** I should return to the admin dashboard

**Given** I impersonate a user
**When** the session starts
**Then** an audit log entry should be created with my admin ID and the target user ID

**E2E Test:** `19-admin-user-management.spec.ts` - "should impersonate user in read-only mode"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 2

---

### US-A04: Retry Failed Workflow

**As an** Admin,
**I want to** retry a failed CrewAI workflow for a user,
**So that** I can resolve stuck projects without engineering help.

**Acceptance Criteria:**

**Given** I am viewing a user's project that has a failed workflow
**When** I see the "Failed Jobs" section
**Then** I should see the job name, error message, and failure timestamp

**Given** I am viewing a failed job
**When** I click "Retry"
**Then** I should see a confirmation dialog with: job name, estimated duration, impact summary

**Given** I confirm the retry
**When** the job is re-queued
**Then** I should see success message and the job status should change to "pending"

**Given** I retry a job
**When** the action completes
**Then** an audit log entry should be created with job ID and outcome

**E2E Test:** `20-admin-operations.spec.ts` - "should retry failed workflow"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 3

---

### US-A05: View System Health Dashboard

**As an** Admin,
**I want to** see overall platform health at a glance,
**So that** I can identify issues before users report them.

**Acceptance Criteria:**

**Given** I am logged in as an Admin
**When** I navigate to `/admin/health`
**Then** I should see: Modal API status, Supabase status, active workflow count, error rate (last hour)

**Given** I am on the health dashboard
**When** any service shows degraded status
**Then** I should see a yellow/red indicator with the affected service name

**Given** I am on the health dashboard
**When** I click on "Recent Errors"
**Then** I should see the 20 most recent errors with user ID, error type, and timestamp

**E2E Test:** `20-admin-operations.spec.ts` - "should display system health dashboard"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 3

---

### US-A06: Manage Feature Flags

**As an** Admin,
**I want to** enable or disable features for specific users or globally,
**So that** I can control rollouts and troubleshoot issues.

**Acceptance Criteria:**

**Given** I am logged in as an Admin
**When** I navigate to `/admin/features`
**Then** I should see a list of all feature flags with current state (on/off/percentage)

**Given** I am viewing a feature flag
**When** I click "Edit"
**Then** I should see options: Enable globally, Disable globally, Enable for specific users, Percentage rollout

**Given** I enable a feature for a specific user
**When** I enter their email and save
**Then** that user should see the feature on their next page load

**Given** I change a feature flag
**When** the change is saved
**Then** an audit log entry should be created with old value, new value, and affected scope

**E2E Test:** `20-admin-operations.spec.ts` - "should toggle feature flag for user"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 4

---

### US-A07: View Audit Logs

**As an** Admin,
**I want to** view audit logs of all admin actions,
**So that** I can review what changes were made and by whom.

**Acceptance Criteria:**

**Given** I am logged in as an Admin
**When** I navigate to `/admin/audit`
**Then** I should see a filterable log of all admin actions

**Given** I am viewing audit logs
**When** I filter by action type (impersonation, retry, feature flag, etc.)
**Then** I should see only logs matching that action type

**Given** I am viewing audit logs
**When** I filter by date range
**Then** I should see only logs within that range

**Given** I am viewing an audit log entry
**When** I click for details
**Then** I should see: admin email, action, target, timestamp, old value, new value

**E2E Test:** `21-admin-audit.spec.ts` - "should filter audit logs by action type"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 5

---

### US-A08: Change User Role

**As an** Admin,
**I want to** change a user's role (e.g., upgrade trial to founder),
**So that** I can resolve billing issues or grant access manually.

**Acceptance Criteria:**

**Given** I am viewing a user's profile
**When** I click "Change Role"
**Then** I should see a dropdown with valid role transitions

**Given** I select a new role
**When** I click "Save"
**Then** I should see a confirmation dialog with: current role, new role, effective immediately

**Given** I confirm the role change
**When** the change is saved
**Then** the user should have the new role on their next page load

**Given** I change a user's role
**When** the action completes
**Then** an audit log entry should be created with old role, new role, and reason (if provided)

**E2E Test:** `19-admin-user-management.spec.ts` - "should change user role"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 1

---

### US-A09: Export User Data

**As an** Admin,
**I want to** export a user's data for support or compliance purposes,
**So that** I can respond to data requests or debug complex issues.

**Acceptance Criteria:**

**Given** I am viewing a user's profile
**When** I click "Export Data"
**Then** I should see export options: Full export, Projects only, Activity only

**Given** I select an export type
**When** I click "Generate Export"
**Then** I should see a progress indicator and estimated completion time

**Given** the export completes
**When** I return to the export section
**Then** I should see a download link (valid for 24 hours)

**Given** I generate an export
**When** the action completes
**Then** an audit log entry should be created with export type and user ID

**E2E Test:** `21-admin-audit.spec.ts` - "should export user data"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 6

---

### US-A10: Run Data Integrity Check

**As an** Admin,
**I want to** run data integrity checks on a user's account,
**So that** I can identify and report data inconsistencies.

**Acceptance Criteria:**

**Given** I am viewing a user's profile
**When** I click "Run Integrity Check"
**Then** I should see the check running with progress indicator

**Given** the integrity check completes with no issues
**When** I view the results
**Then** I should see "All checks passed" with green indicator

**Given** the integrity check finds issues
**When** I view the results
**Then** I should see: issue type, affected records, severity, recommended action

**Given** issues are found
**When** I click "Create Ticket"
**Then** a support ticket should be created with all issue details pre-populated

**E2E Test:** `21-admin-audit.spec.ts` - "should run data integrity check"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 6

---

### US-A11: Admin Login and Role Verification

> **Added (2026-01-22)**: Addresses missing admin login flow from admin-journey-map.md Step 1.

**As an** Admin,
**I want to** log in via OAuth and have my admin role verified,
**So that** I can access the admin dashboard securely.

**Acceptance Criteria:**

**Given** I have admin credentials
**When** I complete OAuth authentication
**Then** my admin role should be verified via Supabase RLS policies

**Given** I am authenticated without admin role
**When** I try to access `/admin` routes
**Then** I should be redirected to my regular dashboard with "Unauthorized" toast

**Given** I am verified as an admin
**When** my authentication completes
**Then** I should be redirected to `/admin-dashboard`

**Given** I am an admin logging in
**When** my session starts
**Then** an audit log entry should be created for admin login

**E2E Test:** `19-admin-user-management.spec.ts` - "should verify admin role on login"
**Journey Reference:** [`admin-journey-map.md`](./admin-journey-map.md) - Phase 1, Step 1

---

## Coverage Summary

> **Updated 2026-01-22**: Quality audit remediation - 89 stories after US-F08 split, US-H03 removal, and new stories.

### Stories by Category

| Category | Story IDs | Total | With E2E Tests | Gaps |
|----------|-----------|-------|----------------|------|
| Founder | US-F01-F10 | 10 | 10 | 0 |
| Consultant | US-C01-C07 | 7 | 7 | 0 |
| Founder Trial | US-FT01-FT04 | 4 | 4 | 0 |
| Consultant Trial | US-CT01-CT06 | 6 | 0 | 6 |
| HITL Checkpoint | US-H01-H02, H04-H09 | 8 | 8 | 0 |
| Pivot Flow | US-P01-P04 | 4 | 4 | 0 |
| Edge Cases | US-E01-E06 | 6 | 0 | 6 |
| Admin | US-A01-A11 | 11 | 0 | 11 |
| Support | US-S01-S05 | 5 | 0 | 5 |
| Offboarding | US-O01-O05 | 5 | 0 | 5 |
| Billing | US-B01-B10 | 10 | 0 | 10 |
| Notification | US-N01-N05 | 5 | 0 | 5 |
| Account Settings | US-AS01-AS05 | 5 | 0 | 5 |
| Marketing Funnel | US-MF01-MF03 | 3 | 0 | 3 |
| **Total** | | **89** | **33** | **56** |

### E2E Test File Mapping

| Test File | Stories Covered |
|-----------|-----------------|
| `00-smoke.spec.ts` | Infrastructure (no stories) |
| `01-login.spec.ts` | Authentication (cross-cutting) |
| `02-onboarding-flow.spec.ts` | US-F01, US-F08, US-FT01 |
| `03-founder-attribution.spec.ts` | US-F02 (attribution aspect) |
| `04-founder-analysis-journey.spec.ts` | US-F02, US-F06 |
| `05-hitl-approval-flow.spec.ts` | US-F03, US-H01-H09 |
| `06-consultant-portfolio.spec.ts` | US-C03, US-C04 |
| `07-adr005-persistence.spec.ts` | US-F07 |
| `08-ui-indicators.spec.ts` | US-F01 (UI indicators) |
| `09-consultant-practice-setup.spec.ts` | US-C01 |
| `10-consultant-client-onboarding.spec.ts` | US-C02, US-C07 |
| `11-project-lifecycle.spec.ts` | US-F04, US-F05 |
| `12-client-lifecycle.spec.ts` | US-C05, US-C06 |
| `13-trial-limits.spec.ts` | US-FT02, US-FT03 |
| `14-hitl-extended.spec.ts` | US-H01-H09 |
| `15-pivot-workflows.spec.ts` | US-P01-P04 |
| `16-quick-start-founder.spec.ts` | US-F01, US-FT01 |
| `17-quick-start-consultant.spec.ts` | US-C07 |

### Gap Analysis (51 Stories Need Implementation)

Stories with test stubs created but not yet implemented:

| Category | Story IDs | Test File | Priority |
|----------|-----------|-----------|----------|
| Consultant Trial | US-CT01-CT05 | `22-consultant-trial.spec.ts` | High |
| Edge Cases | US-E01-E06 | `18-edge-cases.spec.ts` | Medium |
| Admin | US-A01-A10 | `19-21-admin-*.spec.ts` | High |
| Support | US-S01-S05 | `23-support.spec.ts` | High |
| Offboarding | US-O01-O05 | `24-offboarding.spec.ts` | Medium |
| Billing | US-B01-B10 | `25-billing.spec.ts` | Critical |
| Notification | US-N01-N05 | `26-notifications.spec.ts` | High |
| Account Settings | US-AS01-AS05 | `27-account-settings.spec.ts` | Medium |

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

## Support Stories (US-S)

> **Added (2026-01-22)**: New story category for user-facing support and GDPR compliance flows.
> **User Scope**: All authenticated users including Admin.

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
**Journey Reference:** [`support-journey-map.md`](./support-journey-map.md) - Phase 2

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
**Journey Reference:** [`support-journey-map.md`](./support-journey-map.md) - Phase 1

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
**Journey Reference:** [`support-journey-map.md`](./support-journey-map.md) - Phase 3

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
**Journey Reference:** [`support-journey-map.md`](./support-journey-map.md) - Phase 4

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
**Journey Reference:** [`support-journey-map.md`](./support-journey-map.md) - Phase 5

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
**Journey Reference:** [`offboarding-journey-map.md`](./offboarding-journey-map.md) - Phase 1

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
**Journey Reference:** [`offboarding-journey-map.md`](./offboarding-journey-map.md) - Phase 2

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
**Journey Reference:** [`offboarding-journey-map.md`](./offboarding-journey-map.md) - Phase 3

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
**Journey Reference:** [`offboarding-journey-map.md`](./offboarding-journey-map.md) - Phase 4

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
**Journey Reference:** [`offboarding-journey-map.md`](./offboarding-journey-map.md) - Phase 5

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 1

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 1

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 2

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 3

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 6

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 4

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 5

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 6

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 4

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
**Journey Reference:** [`billing-journey-map.md`](./billing-journey-map.md) - Phase 3

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
**Journey Reference:** [`notification-journey-map.md`](./notification-journey-map.md) - Phase 1

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
**Journey Reference:** [`notification-journey-map.md`](./notification-journey-map.md) - Phase 2

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
**Journey Reference:** [`notification-journey-map.md`](./notification-journey-map.md) - Phase 3

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
**Journey Reference:** [`notification-journey-map.md`](./notification-journey-map.md) - Phase 4

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
**Journey Reference:** [`notification-journey-map.md`](./notification-journey-map.md) - Phase 5

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
**Journey Reference:** [`account-settings-journey-map.md`](./account-settings-journey-map.md) - Phase 1

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
**Journey Reference:** [`account-settings-journey-map.md`](./account-settings-journey-map.md) - Phase 2

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
**Journey Reference:** [`account-settings-journey-map.md`](./account-settings-journey-map.md) - Phase 3

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
**Journey Reference:** [`account-settings-journey-map.md`](./account-settings-journey-map.md) - Phase 4

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
**Journey Reference:** [`account-settings-journey-map.md`](./account-settings-journey-map.md) - Phase 5

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
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Steps 1-3

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
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 4

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
**Journey Reference:** [`founder-journey-map.md`](./founder-journey-map.md) - Step 5

---

## Updated Coverage Summary

> **Updated 2026-01-22**: Quality audit remediation - added US-MF, US-A11, US-FT04, US-CT06, split US-F08, removed US-H03.

### Stories by Category

| Category | Total Stories | With E2E Tests | Gaps |
|----------|---------------|----------------|------|
| Founder (US-F) | 10 | 10 | 0 |
| Consultant (US-C) | 7 | 7 | 0 |
| Founder Trial (US-FT) | 4 | 4 | 0 |
| Consultant Trial (US-CT) | 6 | 0 | 6 |
| Admin (US-A) | 11 | 0 | 11 |
| HITL Checkpoint (US-H) | 8 | 8 | 0 |
| Pivot Flow (US-P) | 4 | 4 | 0 |
| Edge Case (US-E) | 6 | 0 | 6 |
| Support (US-S) | 5 | 0 | 5 |
| Offboarding (US-O) | 5 | 0 | 5 |
| Billing (US-B) | 10 | 0 | 10 |
| Notification (US-N) | 5 | 0 | 5 |
| Account Settings (US-AS) | 5 | 0 | 5 |
| Marketing Funnel (US-MF) | 3 | 0 | 3 |
| **Total** | **89** | **33** | **56** |

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
| [`founder-trial-journey-map.md`](./founder-trial-journey-map.md) | Founder trial journey |
| [`consultant-journey-map.md`](./consultant-journey-map.md) | Consultant journey phases |
| [`consultant-trial-journey-map.md`](./consultant-trial-journey-map.md) | Consultant trial journey |
| [`admin-journey-map.md`](./admin-journey-map.md) | Admin journey phases |
| [`support-journey-map.md`](./support-journey-map.md) | Support and GDPR flows |
| [`offboarding-journey-map.md`](./offboarding-journey-map.md) | Cancellation and churn flows |
| [`billing-journey-map.md`](./billing-journey-map.md) | Payment lifecycle |
| [`notification-journey-map.md`](./notification-journey-map.md) | Notification delivery |
| [`account-settings-journey-map.md`](./account-settings-journey-map.md) | Profile and security |
| [`journey-test-matrix.md`](../testing/journey-test-matrix.md) | Test coverage matrix |
| [`project-client-management.md`](../features/project-client-management.md) | Archive/delete feature specs |
| [`consultant-client-system.md`](../features/consultant-client-system.md) | Invite system specs |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | **Quality Audit Remediation:** P0: Fixed US-O03 retention timeline (30+60 days), US-O05 win-back emails (7/30/60/90 days), US-B04 dunning (6 stages), US-B05 refund tiers (4 tiers + US-S05 clarification), US-B07 tax registries (VIES/HMRC/ABN), US-N04 escalation (6 stages). P1: Added US-MF01-03 marketing funnel, US-A11 admin login, US-FT04/CT06 post-upgrade, enhanced US-B03 backup payment. P2: Split US-F08→F08/F09/F10, replaced faceless "User" with "any authenticated user" in US-N/AS/S sections, defined US-AS04 suspicious login criteria. Removed US-H03 reference from journey-test-matrix.md. Total stories now 89. |
| 2026-01-22 | **Major Expansion:** Added 30 new stories across 5 categories: Support (US-S01-S05), Offboarding (US-O01-O05), Billing (US-B01-B10), Notification (US-N01-N05), Account Settings (US-AS01-AS05). Total stories now 82. |
| 2026-01-22 | **Major Update:** Added 10 Admin stories (US-A01-A10), 5 Consultant Trial stories (US-CT01-CT05); Renamed Trial to Founder Trial (US-T → US-FT) |
| 2026-01-21 | Enhanced US-F08 with detailed UI criteria; added 6 edge case stories (US-E01-E06) |
| 2026-01-20 | Updated for Quick Start (ADR-006): Replaced US-F07/F08 with Quick Start stories, updated US-C01/C07, removed US-H03 |
| 2026-01-19 | Added 13 HITL/Pivot stories (US-H01-H09, US-P01-P04) derived from phase-transitions.md and hitl-approval-ui.md |
| 2026-01-19 | Initial creation - consolidated 18 user stories with acceptance criteria |
