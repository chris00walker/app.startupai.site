---
purpose: "Portfolio Holder and Founder Marketplace user stories with acceptance criteria"
status: "active"
created: "2026-02-03"
last_reviewed: "2026-02-03"
story: "US-PH01-07, US-FM01-11"
---

# Portfolio Holder & Founder Marketplace Stories

This document contains user stories for the Portfolio Holder marketplace features, including both Portfolio Holder (consultant-facing) and Founder marketplace stories.

## Terminology

| Term | Definition |
|------|------------|
| **Portfolio Holder** | Architectural umbrella for entities managing multiple founder relationships (UI label: "Consultant") |
| **Verified** | Portfolio Holder with active paid subscription (Advisor $199/mo or Capital $499/mo) |
| **Grace Period** | 7-day window after payment failure before losing verified status |
| **Founder Directory** | Directory where verified consultants browse opt-in founders |
| **Consultant Directory** | Directory where founders browse verified consultants |
| **RFQ** | Request for Quote - founder posts seeking capital/advice |

---

## Portfolio Holder Stories (US-PH)

### US-PH01: Browse Founder Directory

**As a** verified Portfolio Holder,
**I want to** browse the Founder Directory to discover opt-in founders,
**So that** I can identify potential clients/investments with validated business ideas.

**Acceptance Criteria:**

**Given** I am logged in as a verified consultant (`verification_status IN ('verified', 'grace')`)
**When** I navigate to `/consultant/founders`
**Then** I should see a directory of founders who have:
  - `founder_directory_opt_in = TRUE`
  - `problem_fit IN ('partial_fit', 'strong_fit')`

**Given** I am viewing the Founder Directory
**When** I look at founder cards
**Then** I should see:
  - Display name (anonymized until connected)
  - Company name
  - Industry and stage
  - Problem fit badge (partial/strong)
  - Evidence badges (interviews completed, experiments passed, fit score)
  - "Request Connection" button

**Given** I am an unverified consultant (`verification_status NOT IN ('verified', 'grace')`)
**When** I try to access `/consultant/founders`
**Then** I should see a 403 error with upgrade prompt

**Journey Reference:** `consultant-journey-map.md` - Phase 7 (Directory)
**API Endpoint:** `GET /api/consultant/founders`

---

### US-PH02: Filter Founder Directory

**As a** verified Portfolio Holder,
**I want to** filter the Founder Directory by industry, stage, and fit score,
**So that** I can find founders matching my investment thesis or expertise.

**Acceptance Criteria:**

**Given** I am viewing the Founder Directory
**When** I apply filters (industry, stage, problem_fit)
**Then** the directory should update to show only matching founders

**Given** I have applied filters
**When** I click "Clear Filters"
**Then** all founders should be displayed again

**Given** I am viewing filtered results
**When** I see the result count
**Then** it should show "X founders matching your criteria"

**Journey Reference:** `consultant-journey-map.md` - Phase 7
**API Endpoint:** `GET /api/consultant/founders?industry=saas&stage=seed`

---

### US-PH03: Request Connection to Founder

**As a** verified Portfolio Holder,
**I want to** request a connection to a founder from the directory,
**So that** I can establish a professional relationship.

**Acceptance Criteria:**

**Given** I am viewing a founder's card in the Founder Directory
**When** I click "Request Connection"
**Then** I should see a modal with:
  - Relationship type selector (advisory, capital, program, service, ecosystem)
  - Optional message field
  - "Send Request" button

**Given** I have selected a relationship type and optionally written a message
**When** I click "Send Request"
**Then** the connection should be created with:
  - `connection_status = 'requested'`
  - `initiated_by = 'consultant'`
  - `relationship_type` = my selection
  - `request_message` = my message (if provided)

**Given** I previously declined a connection with this founder within 30 days
**When** I try to request a new connection
**Then** I should see a 429 error: "You can reconnect with this founder in N days"

**Journey Reference:** `consultant-journey-map.md` - Phase 7
**API Endpoint:** `POST /api/consultant/connections`

---

### US-PH04: Respond to Founder Connection Requests

**As a** verified Portfolio Holder,
**I want to** accept or decline connection requests from founders,
**So that** I can manage which founders I work with.

**Acceptance Criteria:**

**Given** I have pending connection requests from founders
**When** I view my dashboard
**Then** I should see a "Connection Requests" card with badge count

**Given** I click on a connection request
**When** I view the request details
**Then** I should see:
  - Founder's name and company
  - Relationship type they selected
  - Their message (if any)
  - "Accept" and "Decline" buttons

**Given** I click "Accept"
**When** the modal confirms my action
**Then** the connection should update to:
  - `connection_status = 'active'`
  - `accepted_at = NOW()`
  - Full evidence access granted to both parties

**Given** I click "Decline"
**When** I optionally provide a reason
**Then** the connection should update to:
  - `connection_status = 'declined'`
  - `declined_at = NOW()`
  - 30-day cooldown starts

**Journey Reference:** `consultant-journey-map.md` - Phase 7
**API Endpoints:** `POST /api/consultant/connections/[id]/accept`, `POST /api/consultant/connections/[id]/decline`

---

### US-PH05: Browse RFQ Board

**As a** verified Portfolio Holder,
**I want to** browse the RFQ Board to see founder requests for capital/advice,
**So that** I can discover opportunities matching my expertise.

**Acceptance Criteria:**

**Given** I am logged in as a verified consultant
**When** I navigate to `/consultant/rfq`
**Then** I should see a list of open RFQs with:
  - Title and description preview
  - Relationship type (capital, advisory, etc.)
  - Industries requested
  - Timeline and budget range (if specified)
  - Response count
  - "View Details" / "Respond" buttons

**Given** I am an unverified consultant
**When** I try to access `/consultant/rfq`
**Then** I should see a 403 error with upgrade prompt

**Journey Reference:** `consultant-journey-map.md` - Phase 8 (RFQ Board)
**API Endpoint:** `GET /api/consultant/rfq`

---

### US-PH06: Respond to RFQ

**As a** verified Portfolio Holder,
**I want to** respond to a founder's RFQ,
**So that** I can offer my services or capital.

**Acceptance Criteria:**

**Given** I am viewing an open RFQ
**When** I click "Respond"
**Then** I should see a form with:
  - RFQ details (read-only)
  - Message field (required)
  - "Send Response" button

**Given** I have written a message
**When** I click "Send Response"
**Then** a response record should be created with:
  - `status = 'pending'`
  - `message` = my message
  - `responded_at = NOW()`

**Given** I have already responded to this RFQ
**When** I view the RFQ
**Then** I should see "Response Sent" instead of "Respond" button

**Journey Reference:** `consultant-journey-map.md` - Phase 8
**API Endpoint:** `POST /api/consultant/rfq/[id]/respond`

---

### US-PH07: Manage Marketplace Visibility

**As a** Portfolio Holder,
**I want to** control my visibility in the Consultant Directory,
**So that** I can choose whether founders can discover me.

**Acceptance Criteria:**

**Given** I am logged in as a consultant
**When** I navigate to Settings → Marketplace tab
**Then** I should see:
  - Directory opt-in toggle
  - Default relationship type selector
  - My verification status display

**Given** I toggle "directory_opt_in" to true
**When** I am verified
**Then** I should appear in the Consultant Directory for founders

**Given** I set a "default_relationship_type"
**When** founders view my profile
**Then** they should see my preferred relationship type prominently displayed

**Journey Reference:** `consultant-journey-map.md` - Phase 7
**API Endpoint:** `PUT /api/consultant/profile/marketplace`

---

## Founder Marketplace Stories (US-FM)

### US-FM01: Browse Consultant Directory

**As a** Founder,
**I want to** browse the Consultant Directory to find verified consultants,
**So that** I can discover advisors, investors, or service providers.

**Acceptance Criteria:**

**Given** I am logged in as an authenticated founder
**When** I navigate to `/founder/consultants`
**Then** I should see a directory of verified consultants who have `directory_opt_in = TRUE`

**Given** I am viewing the Consultant Directory
**When** I look at consultant cards
**Then** I should see:
  - Consultant name
  - Organization
  - Expertise areas (industries + services)
  - Bio summary
  - Verification badge (verified/grace)
  - Relationship type offered
  - Connection count
  - "Request Connection" button

**Journey Reference:** `founder-journey-map.md` - Phase 8 (Marketplace)
**API Endpoint:** `GET /api/founder/consultants`

---

### US-FM02: View Consultant Profile

**As a** Founder,
**I want to** view a consultant's detailed profile,
**So that** I can evaluate if they're a good fit before connecting.

**Acceptance Criteria:**

**Given** I am viewing the Consultant Directory
**When** I click on a consultant card
**Then** I should see their full profile with:
  - Full name and organization
  - Complete bio
  - Industries and services offered
  - Years of experience (if provided)
  - Verification badge
  - "Request Connection" button

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `GET /api/founder/consultants/[id]`

---

### US-FM03: Request Connection to Consultant

**As a** Founder,
**I want to** request a connection to a consultant,
**So that** I can establish a professional relationship.

**Acceptance Criteria:**

**Given** I am viewing a consultant's profile
**When** I click "Request Connection"
**Then** I should see a modal with:
  - Relationship type options (may be pre-filled with consultant's default)
  - Optional message field
  - "Send Request" button

**Given** I submit the request
**When** the request is created
**Then** the connection should be created with:
  - `connection_status = 'requested'`
  - `initiated_by = 'founder'`
  - Consultant receives notification

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `POST /api/founder/connections`

---

### US-FM04: View Pending Connection Requests

**As a** Founder,
**I want to** view pending connection requests from consultants,
**So that** I can review and respond to them.

**Acceptance Criteria:**

**Given** I have pending connection requests
**When** I view my dashboard
**Then** I should see a "Connection Requests" card with badge count (e.g., "2 pending")

**Given** I click on the connection requests card
**When** I am redirected to `/founder/connections`
**Then** I should see a list of pending requests with:
  - Consultant name and organization
  - Relationship type
  - Their message (if any)
  - Verified badge
  - "Accept" and "Decline" buttons

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `GET /api/founder/connections?status=requested`

---

### US-FM05: Accept Connection Request

**As a** Founder,
**I want to** accept a connection request from a consultant,
**So that** I can establish a professional relationship and share evidence.

**Acceptance Criteria:**

**Given** I am viewing a pending connection request
**When** I click "Accept"
**Then** I should see a confirmation modal with:
  - Consultant's name
  - Relationship type confirmation
  - Consent text: "By accepting, you agree to share your validation evidence with this consultant"
  - "Confirm" button

**Given** I click "Confirm"
**When** the acceptance is processed
**Then**:
  - `connection_status` updates to `'active'`
  - `accepted_at` set to `NOW()`
  - Consultant gains access to my validation evidence
  - Success message: "Connection established. You can now share validation evidence."

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `POST /api/founder/connections/[id]/accept`

---

### US-FM06: Decline Connection Request

**As a** Founder,
**I want to** decline a connection request from a consultant,
**So that** I can control who has access to my data.

**Acceptance Criteria:**

**Given** I am viewing a pending connection request
**When** I click "Decline"
**Then** I should see a modal with:
  - Optional reason dropdown (not_right_fit, timing, other)
  - 30-day cooldown notice: "This consultant can send a new request after 30 days"
  - "Decline" button

**Given** I click "Decline"
**When** the decline is processed
**Then**:
  - `connection_status` updates to `'declined'`
  - `declined_at` set to `NOW()`
  - Consultant cannot request again for 30 days
  - Message: "Request declined. The consultant can reconnect in 30 days."

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `POST /api/founder/connections/[id]/decline`

---

### US-FM07: Create RFQ Post

**As a** Founder,
**I want to** create an RFQ (Request for Quote) post,
**So that** I can attract consultants/investors matching my needs.

**Acceptance Criteria:**

**Given** I am logged in as a founder
**When** I navigate to `/founder/rfq/new`
**Then** I should see an RFQ creation form with:
  - Title field (required)
  - Description field (required)
  - Relationship type selector (advisory, capital, program, service, ecosystem)
  - Industries multi-select
  - Stage preference selector
  - Timeline selector (1_month, 3_months, 6_months, flexible)
  - Budget range selector (equity_only, under_5k, 5k_25k, 25k_100k, over_100k)

**Given** I have filled out the form
**When** I click "Post RFQ"
**Then** the RFQ should be created with:
  - `status = 'open'`
  - `expires_at` set to 30 days from now
  - Visible to verified consultants on RFQ Board

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `POST /api/founder/rfq`

---

### US-FM08: Review RFQ Responses

**As a** Founder,
**I want to** review responses to my RFQ,
**So that** I can evaluate consultants/investors who are interested.

**Acceptance Criteria:**

**Given** I have an RFQ with responses
**When** I view my RFQ at `/founder/rfq/[id]`
**Then** I should see:
  - RFQ details (my original post)
  - Response count
  - List of responses with:
    - Consultant name and organization
    - Verification badge
    - Their message
    - "Accept" and "Decline" buttons

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `GET /api/founder/rfq/[id]/responses`

---

### US-FM09: Accept RFQ Response

**As a** Founder,
**I want to** accept an RFQ response,
**So that** I can establish a connection with an interested consultant.

**Acceptance Criteria:**

**Given** I am viewing responses to my RFQ
**When** I click "Accept" on a response
**Then** I should see a confirmation modal with relationship type confirmation

**Given** I confirm acceptance
**When** the acceptance is processed
**Then**:
  - Response `status` updates to `'accepted'`
  - New connection created with `connection_status = 'active'`
  - Consultant gains access to my evidence
  - RFQ can optionally be marked as `'filled'`

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `POST /api/founder/rfq/[id]/responses/[responseId]/accept`

---

### US-FM10: Opt-in to Founder Directory

**As a** Founder,
**I want to** opt-in to the Founder Directory,
**So that** verified consultants can discover me.

**Acceptance Criteria:**

**Given** I am logged in as a founder
**When** I navigate to Settings → Marketplace tab
**Then** I should see:
  - Founder Directory opt-in toggle
  - Explanation: "When enabled, verified consultants can see your profile in the Founder Directory"
  - VPD requirement notice: "You must have at least partial problem-fit to appear in the directory"

**Given** I have `problem_fit IN ('partial_fit', 'strong_fit')`
**When** I toggle `founder_directory_opt_in` to true
**Then** I should appear in the Founder Directory for verified consultants

**Given** I have `problem_fit = 'no_fit'` or NULL
**When** I try to toggle `founder_directory_opt_in`
**Then** I should see a message: "Complete more validation to qualify for the Founder Directory"

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `PUT /api/founder/profile/marketplace`

---

### US-FM11: Decline RFQ Response

**As a** Founder,
**I want to** decline an RFQ response,
**So that** I can communicate my decision to unselected consultants.

**Acceptance Criteria:**

**Given** I am viewing responses to my RFQ
**When** I click "Decline" on a response
**Then** I should see a modal with:
  - Optional reason (not_right_fit, went_another_direction, other)
  - "Decline" button

**Given** I confirm decline
**When** the decline is processed
**Then**:
  - Response `status` updates to `'declined'`
  - Consultant is notified (future: email notification)

**Journey Reference:** `founder-journey-map.md` - Phase 8
**API Endpoint:** `POST /api/founder/rfq/[id]/responses/[responseId]/decline`

---

## Implementation Status

| Story | Status | E2E Test |
|-------|--------|----------|
| US-PH01 | Planned | Gap |
| US-PH02 | Planned | Gap |
| US-PH03 | Planned | Gap |
| US-PH04 | Planned | Gap |
| US-PH05 | Planned | Gap |
| US-PH06 | Planned | Gap |
| US-PH07 | Planned | Gap |
| US-FM01 | Planned | Gap |
| US-FM02 | Planned | Gap |
| US-FM03 | Planned | Gap |
| US-FM04 | Planned | Gap |
| US-FM05 | Planned | Gap |
| US-FM06 | Planned | Gap |
| US-FM07 | Planned | Gap |
| US-FM08 | Planned | Gap |
| US-FM09 | Planned | Gap |
| US-FM10 | Planned | Gap |
| US-FM11 | Planned | Gap |

---

## Cross-References

| Document | Relationship |
|----------|-------------|
| [`portfolio-holder-vision.md`](../../specs/portfolio-holder-vision.md) | Vision and strategy |
| [`consultant-journey-map.md`](../journeys/consultant/consultant-journey-map.md) | Consultant journey (Phases 7-8) |
| [`consultant-client-system.md`](../../features/consultant-client-system.md) | Technical implementation |
| [`marketplace-analytics.md`](../../specs/marketplace-analytics.md) | Analytics and KPIs |
| [`pricing.md`](../../specs/pricing.md) | Pricing tiers |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-03 | Initial creation - 18 marketplace user stories (US-PH01-07, US-FM01-11) |
