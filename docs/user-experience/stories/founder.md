---
purpose: "Founder user stories with acceptance criteria and E2E coverage"
status: "active"
last_reviewed: "2026-01-22"
---

# Founder Stories (US-F)

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 5

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 14

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 13

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
**Journey Reference:** [`project-client-management.md`](../../features/project-client-management.md) - Archive Flow

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
**Journey Reference:** [`project-client-management.md`](../../features/project-client-management.md) - Delete Flow

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Steps 14-15

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 5

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Steps 6-7

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 6

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
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 7

---
