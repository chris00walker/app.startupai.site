---
purpose: "Admin user stories with acceptance criteria and E2E coverage"
status: "active"
last_reviewed: "2026-01-22"
---

# Admin Stories (US-A)

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 1

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 1

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 2

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 3

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 3

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 4

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 5

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 1

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 6

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 6

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
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 1, Step 1

---

### US-A12: Manage User Billing Issues

**As an** Admin,
**I want to** review and take billing actions for a user,
**So that** I can resolve billing issues without engineering escalation.

**Acceptance Criteria:**

**Given** I am viewing a user's profile
**When** I open the Billing tab
**Then** I should see: current plan, billing status, invoices, payment method status, dunning state, and next charge date

**Given** a user's payment has failed
**When** I click "Retry Payment"
**Then** the system should attempt the charge and show the result with a clear success/failure message

**Given** a user requests a refund
**When** I select refund amount and reason and confirm
**Then** the refund should be processed and recorded in the audit log

**Given** a user needs temporary access
**When** I apply a credit or grant a grace period
**Then** the updated status and expiration should be visible on the Billing tab

**Given** I perform any billing action
**When** the action completes
**Then** an audit log entry should be created with action type, amount (if applicable), and reason

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Phase 6, Step 12

---

## Ad Management Stories (US-AM)

> **Added (2026-01-24)**: New story category for ad platform administration and budget management.

### US-AM01: Connect Ad Platform Account

**As an** Admin,
**I want to** connect StartupAI's business account to ad platforms (Meta, Google, TikTok, etc.),
**So that** agents can deploy validation campaigns on behalf of founders.

**Acceptance Criteria:**

**Given** I am logged in as an Admin
**When** I navigate to `/admin/ad-platforms`
**Then** I should see a list of supported ad platforms with connection status

**Given** I click "Connect" on an ad platform
**When** I complete the OAuth flow
**Then** the platform should show as "Connected" with account details

**Given** a platform connection fails
**When** I view the error details
**Then** I should see the failure reason and retry option

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Ad Platform Management

---

### US-AM02: Configure Platform API Credentials

**As an** Admin,
**I want to** set up API keys, OAuth tokens, and webhook URLs for ad platforms,
**So that** agents can programmatically manage campaigns.

**Acceptance Criteria:**

**Given** I have connected an ad platform
**When** I click "Configure Credentials"
**Then** I should see fields for API key, access token, webhook URL

**Given** I enter credentials
**When** I click "Validate"
**Then** the system should test the credentials and show success/failure

**Given** credentials are validated
**When** I save the configuration
**Then** the credentials should be encrypted and stored securely

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Ad Platform Management

---

### US-AM03: Set Up Business Manager Access

**As an** Admin,
**I want to** configure agency-level access (Meta Business Suite, Google Ads Manager),
**So that** StartupAI can manage ad accounts across multiple founders.

**Acceptance Criteria:**

**Given** I am configuring Meta integration
**When** I set up Business Manager
**Then** I should be able to specify the Business Manager ID and permissions

**Given** I am configuring Google Ads integration
**When** I set up Manager Account (MCC)
**Then** I should be able to specify the MCC ID and link child accounts

**Given** agency access is configured
**When** an agent creates a campaign for a founder
**Then** the campaign should be created under the agency structure

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Ad Platform Management

---

### US-AM04: Monitor Platform-Wide Ad Spend

**As an** Admin,
**I want to** view aggregate ad spend across all founders,
**So that** I can track budget utilization and identify anomalies.

**Acceptance Criteria:**

**Given** I am on the admin ad dashboard
**When** I view the spend summary
**Then** I should see: total spend (all platforms), spend by platform, spend by founder

**Given** I want to drill down
**When** I click on a founder's spend
**Then** I should see their individual campaign breakdown

**Given** spend exceeds a threshold
**When** the anomaly is detected
**Then** I should see an alert notification

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Ad Platform Management

---

### US-AM05: Manage Ad Budget Allocation Rules

**As an** Admin,
**I want to** configure how subscription fees map to ad budgets,
**So that** founders receive the promised ad spend from their subscription.

**Acceptance Criteria:**

**Given** I am on `/admin/ad-platforms/budget-rules`
**When** I view the allocation settings
**Then** I should see: percentage of subscription allocated to ads, per-campaign limits, rollover rules

**Given** I update the allocation percentage
**When** I save the changes
**Then** new subscriptions should use the updated allocation

**Given** I set a per-campaign limit (e.g., $50)
**When** an agent creates a campaign
**Then** the campaign budget should not exceed the limit

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Ad Platform Management

---

### US-AM06: View Platform Health Dashboard

**As an** Admin,
**I want to** see API status, rate limits, and credential expiry for all ad platforms,
**So that** I can proactively address integration issues.

**Acceptance Criteria:**

**Given** I am on the ad platform health dashboard
**When** I view platform status
**Then** I should see: API health (green/yellow/red), rate limit usage, credential expiry dates

**Given** a platform API is degraded
**When** I view the dashboard
**Then** I should see a yellow/red indicator with details

**Given** credentials are expiring within 7 days
**When** I view the dashboard
**Then** I should see an expiry warning

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Ad Platform Management

---

### US-AM07: Handle Platform Integration Errors

**As an** Admin,
**I want to** receive alerts and resolve integration issues with ad platforms,
**So that** founder campaigns are not blocked by technical problems.

**Acceptance Criteria:**

**Given** an ad platform integration error occurs
**When** the error is detected
**Then** I should receive an alert via email and in-app notification

**Given** I view an integration error
**When** I click "View Details"
**Then** I should see: error code, error message, affected campaigns, suggested resolution

**Given** I resolve an integration error
**When** I click "Retry" or "Mark Resolved"
**Then** the affected campaigns should resume or the error should be cleared

**E2E Test:** Gap - needs test
**Journey Reference:** [`admin-journey-map.md`](../journeys/platform/admin-journey-map.md) - Ad Platform Management

---
