---
purpose: "Consultant user stories with acceptance criteria and E2E coverage"
status: "active"
last_reviewed: "2026-01-22"
---

# Consultant Stories (US-C)

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
**Journey Reference:** [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) - Phase 2

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
**Journey Reference:** [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) - Phase 3

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

> **Note:** The main portfolio view is on the Consultant Dashboard (`/consultant-dashboard`).
> A dedicated Client Portfolio page exists at `/clients` with extended filtering and management features.
> The sidebar "Client Portfolio" link points to `/clients` for direct access to client management.

**E2E Test:** `06-consultant-portfolio.spec.ts` - "should display portfolio grid with client cards"
**Journey Reference:** [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) - Phase 4

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
**Journey Reference:** [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) - Phase 5

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
**Journey Reference:** [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) - Phase 6

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
**Journey Reference:** [`consultant-client-system.md`](../../features/consultant-client-system.md) - Resend Flow

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
**Journey Reference:** [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) - Phase 3 (Client Mode)

---
