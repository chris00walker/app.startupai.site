---
purpose: "Trial user stories for founder and consultant trials"
status: "active"
last_reviewed: "2026-01-22"
last_updated: "2026-01-22"
---

# Founder Trial Stories (US-FT)

> **Updated (2026-01-22)**: Renamed from "Trial User Stories (US-T)" to reflect the trial split. Original US-T01/T02/T03 are now US-FT01/FT02/FT03.
> **Trial Support:** US-S01–US-S05 apply to trial users (limited support SLA).

### US-FT01: Start Founder Trial Onboarding

**As a** Founder Trial user,
**I want to** begin the onboarding process,
**So that** I can evaluate the platform with my business idea.

**Acceptance Criteria:**

**Given** I am a new user who signed up with "founder" intent
**When** I complete authentication
**Then** I should be redirected to `/trial/founder/`

**Given** I selected a Founder Trial on pricing
**When** my account is created
**Then** my trial intent should be stored as `founder_trial` and my role should be `founder_trial`

**Given** I am on the onboarding page
**When** the page loads
**Then** I should see the Quick Start form explaining the process

**E2E Test:** `02-onboarding-flow.spec.ts` - "should start and access onboarding interface"
**Journey Reference:** [`founder-journey-map.md`](../journeys/founder/founder-journey-map.md) - Step 5

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
**Journey Reference:** [`user-personas.md`](../personas/trials.md#founder-trial-founder_trial) - Founder Trial Restrictions

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
**Journey Reference:** [`user-personas.md`](../personas/trials.md#founder-trial-founder_trial) - Founder Trial Conversion Path

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
**Journey Reference:** [`founder-trial-journey-map.md`](../journeys/trials/founder-trial-journey-map.md) - Phase 4 (Post-Upgrade)

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
**Then** I should be redirected to `/trial/consultant/`

**Given** I selected a Consultant Trial on pricing
**When** my account is created
**Then** my trial intent should be stored as `consultant_trial` and my role should be `consultant_trial`

**Given** I am on the consultant onboarding page
**When** the page loads
**Then** I should see a practice setup form (specializations, industries, experience)

**Given** I complete the practice setup form
**When** I click "Start Trial"
**Then** I should be redirected to `/consultant-dashboard` with 2 pre-populated mock clients

**E2E Test:** `22-consultant-trial.spec.ts` - "should complete consultant trial onboarding"
**Journey Reference:** [`consultant-trial-journey-map.md`](../journeys/trials/consultant-trial-journey-map.md) - Phase 1

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
**Journey Reference:** [`consultant-trial-journey-map.md`](../journeys/trials/consultant-trial-journey-map.md) - Phase 2

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
**Journey Reference:** [`consultant-trial-journey-map.md`](../journeys/trials/consultant-trial-journey-map.md) - Phase 3

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
**Journey Reference:** [`consultant-trial-journey-map.md`](../journeys/trials/consultant-trial-journey-map.md) - Phase 2

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
**Journey Reference:** [`consultant-trial-journey-map.md`](../journeys/trials/consultant-trial-journey-map.md) - Phase 4

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
**Journey Reference:** [`consultant-trial-journey-map.md`](../journeys/trials/consultant-trial-journey-map.md) - Phase 4 (Post-Upgrade)

---
