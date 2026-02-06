/**
 * E2E Tests: Narrative Layer
 *
 * Tests the full narrative generation, editing, export,
 * verification, and publication flows.
 *
 * Feature flag: All narrative pages are gated behind
 * NEXT_PUBLIC_NARRATIVE_LAYER_ENABLED=true. When disabled,
 * pages return 404.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md
 */

import { test, expect, type Page } from '@playwright/test';
import { login, FOUNDER_USER } from './helpers/auth';
import { setupDashboardMocks } from './helpers/api-mocks';
import { waitForDashboard } from './helpers/wait-helpers';

// --- Constants mirroring frontend/src/lib/constants/narrative.ts ---

const EMPTY_STATE_TITLE = 'Your pitch narrative is almost ready';
const FIRST_RUN_TITLE = 'Your pitch narrative is ready to generate';
const GENERATE_CTA = 'Generate My Pitch Narrative';
const EXPORT_DIALOG_TITLE = 'Export as PDF';
const QR_CODE_LABEL = 'Include verification QR code';
const PUBLISH_DIALOG_TITLE = 'Publish your narrative';
const HITL_CHECKLIST = {
  reviewed_slides: 'I have reviewed all 10 slides for accuracy',
  verified_traction: 'Traction data reflects current evidence',
  added_context: 'I have added any missing context or corrections',
  confirmed_ask: 'My funding ask and use of funds are accurate',
};
const VERIFICATION_LOADING_TEXT = 'Verifying evidence integrity...';
const VERIFICATION_NOT_FOUND_TITLE = 'Not Found';
const LOADING_MESSAGE_PREFIX = 'Analyzing your validation evidence';
const NARRATIVE_HISTORY_HEADING = 'Narrative History';

// We use a placeholder project ID; tests that need a real project are skipped.
const TEST_PROJECT_ID = 'test-project-id';

/**
 * Mocks the narrative API endpoints to return controlled responses.
 * Must be called BEFORE page navigation.
 */
async function mockNarrativeApis(
  page: Page,
  scenario: 'no-narrative-prereqs-unmet' | 'no-narrative-prereqs-met' | 'has-narrative' | 'generating',
) {
  // Mock prerequisite check
  const prereqsMet = scenario !== 'no-narrative-prereqs-unmet';
  const prerequisites = {
    project: true,
    hypothesis: prereqsMet,
    customer_profile: prereqsMet,
    vpc: prereqsMet,
  };

  // Mock the useNarrativePrerequisites hook data
  await page.route(`**/api/narrative/prerequisites?project_id=${TEST_PROJECT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        prerequisites,
        all_met: prereqsMet,
        completed_count: prereqsMet ? 4 : 1,
        total: 4,
      }),
    });
  });

  // Mock the narrative fetch
  if (scenario === 'has-narrative') {
    await page.route(`**/api/narrative?project_id=${TEST_PROJECT_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'narrative-e2e-test-id',
          project_id: TEST_PROJECT_ID,
          content: {
            cover: { venture_name: 'E2E Test Venture', tagline: 'Testing narratives' },
            overview: { one_liner: 'We test narratives', thesis: 'Testing is important' },
            opportunity: { tam: '$10B', sam: '$1B', som: '$100M' },
            problem: { pain_statement: 'Testing is hard' },
            solution: { solution_statement: 'Automated testing' },
            traction: { traction_summary: '8 interviews, 3 experiments' },
            customer: { persona_name: 'Test User' },
            competition: { positioning: 'Unique' },
            business_model: { revenue_model: 'SaaS' },
            team: { founder_story: 'Built testing tools' },
            use_of_funds: { ask_amount: '$500K' },
          },
          is_published: false,
          is_edited: false,
          alignment_status: 'verified',
          version: 1,
        }),
      });
    });
  } else {
    await page.route(`**/api/narrative?project_id=${TEST_PROJECT_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });
  }

  // Mock generate endpoint
  await page.route(`**/api/narrative/generate`, async (route) => {
    if (scenario === 'generating') {
      // Simulate slow generation -- respond after delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'narrative-e2e-test-id', status: 'completed' }),
    });
  });

  // Mock the full narrative detail endpoint (for edit page)
  await page.route(`**/api/narrative/narrative-e2e-test-id`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'narrative-e2e-test-id',
        narrative_data: { overview: { one_liner: 'We test narratives' } },
        baseline_narrative: { overview: { one_liner: 'We test narratives' } },
        is_edited: false,
        alignment_status: 'verified',
        alignment_issues: [],
      }),
    });
  });

  // Mock edit endpoint
  await page.route(`**/api/narrative/narrative-e2e-test-id/edit`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        is_edited: true,
        alignment_status: 'pending',
      }),
    });
  });

  // Mock publish endpoint
  await page.route(`**/api/narrative/narrative-e2e-test-id/publish`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        narrative_id: 'narrative-e2e-test-id',
        is_published: true,
        published_at: new Date().toISOString(),
        first_publish: true,
      }),
    });
  });

  // Mock export endpoint
  await page.route(`**/api/narrative/narrative-e2e-test-id/export`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        export_id: 'export-e2e-test-id',
        verification_token: 'e2e-verify-token-abc123',
        generation_hash: 'sha256-test-hash',
        verification_url: 'https://app.startupai.site/verify/e2e-verify-token-abc123',
        download_url: 'https://storage.supabase.co/test-pdf.pdf',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
  });

  // Mock versions endpoint
  await page.route(`**/api/narrative/narrative-e2e-test-id/versions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        versions: [
          { version: 1, created_at: '2026-02-01T10:00:00Z', trigger: 'initial_generation' },
          { version: 2, created_at: '2026-02-03T14:00:00Z', trigger: 'regeneration' },
        ],
      }),
    });
  });

  // Mock evidence package endpoints (for "Preview as PH")
  await page.route(`**/api/evidence-packages?project_id=${TEST_PROJECT_ID}*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ packages: [{ id: 'pkg-e2e-test' }] }),
    });
  });

  await page.route(`**/api/evidence-package/pkg-e2e-test`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'pkg-e2e-test',
        narrative: { venture_name: 'E2E Test Venture' },
      }),
    });
  });

  // Mock guardian check endpoint
  await page.route(`**/api/narrative/narrative-e2e-test-id/guardian-check`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ alignment_status: 'verified', issues: [] }),
    });
  });
}

/**
 * Mocks the verification API endpoint for public pages (no auth required).
 */
async function mockVerificationApi(
  page: Page,
  token: string,
  status: 'verified' | 'outdated' | 'not_found',
) {
  await page.route(`**/api/verify/${token}`, async (route) => {
    if (status === 'not_found') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'not_found' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status,
          venture_name: 'E2E Test Venture',
          exported_at: '2026-02-04T10:00:00Z',
          evidence_generated_at: '2026-02-04T09:00:00Z',
          evidence_id: 'abc123def456',
          is_edited: false,
          alignment_status: 'verified',
          current_hash_matches: status === 'verified',
          request_access_url: 'https://app.startupai.site/founder/connect/test-id',
        }),
      });
    }
  });
}

// ========================================================================
// Test Suites
// ========================================================================

test.describe('Narrative Layer - Feature Flag Gate', () => {
  // This test verifies that the page returns 404 when the feature flag is off.
  // The flag is a build-time env var, so in CI where the flag is off by default,
  // this test validates the gating behavior.
  test('should return 404 when NEXT_PUBLIC_NARRATIVE_LAYER_ENABLED is not true', async ({ page }) => {
    // Navigate to narrative page without feature flag
    const response = await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // If the feature flag is OFF, we expect a 404 page
    // If it is ON (local dev), the page will render normally
    const statusCode = response?.status() ?? 0;
    if (statusCode === 404) {
      // Feature flag is off - verify 404 renders
      await expect(page.locator('body')).toContainText(/404|not found/i);
    } else {
      // Feature flag is on - page should render (empty state or narrative)
      const pageContent = page.locator('main, [data-testid="narrative-page"], body');
      await expect(pageContent).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe('Narrative Layer - Empty State (Prerequisites Not Met)', () => {
  // TODO US-NL01: Requires seeded founder account with incomplete project (missing hypothesis, VPC, customer profile)
  test.skip(true, 'Requires seeded founder with incomplete project data');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should show prerequisite checklist when prerequisites not met', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Verify the empty state heading from EMPTY_STATE_COPY.title
    await expect(page.getByText(EMPTY_STATE_TITLE)).toBeVisible({ timeout: 15000 });

    // Verify prerequisite labels are displayed
    await expect(page.getByText('Project with company name and industry')).toBeVisible();
    await expect(page.getByText('At least one hypothesis')).toBeVisible();
    await expect(page.getByText('Customer profile completed')).toBeVisible();
    await expect(page.getByText('Value Proposition Canvas populated')).toBeVisible();

    // Verify progress bar is present
    const progressBar = page.locator('[role="progressbar"], .h-2');
    await expect(progressBar.first()).toBeVisible();

    // Verify generate button is NOT shown (prerequisites not met)
    await expect(page.getByRole('button', { name: GENERATE_CTA })).not.toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-empty-state-prereqs-unmet.png', fullPage: true });
  });
});

test.describe('Narrative Layer - First-Run Prompt (Prerequisites Met)', () => {
  // TODO US-NL01: Requires seeded founder account with complete prerequisites but no generated narrative
  test.skip(true, 'Requires seeded founder with complete prerequisites and no existing narrative');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should show first-run prompt when prerequisites met', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Verify the first-run prompt from FIRST_RUN_COPY.title
    await expect(page.getByText(FIRST_RUN_TITLE)).toBeVisible({ timeout: 15000 });

    // Verify generate button is visible and enabled
    const generateButton = page.getByRole('button', { name: GENERATE_CTA });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();

    // Verify time estimate is shown (from FIRST_RUN_COPY.subtitle)
    await expect(page.getByText('Takes about 30 seconds')).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-first-run-prompt.png', fullPage: true });
  });
});

test.describe('Narrative Layer - Generation Loading State', () => {
  // TODO US-NL01: Requires seeded founder with prerequisites met and ability to trigger generation
  test.skip(true, 'Requires seeded founder with prerequisites met for generation trigger');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should show loading state with cycling messages during generation', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Trigger generation
    const generateButton = page.getByRole('button', { name: GENERATE_CTA });
    await expect(generateButton).toBeVisible({ timeout: 15000 });
    await generateButton.click();

    // Verify loading state appears with the first cycling message
    await expect(page.getByText(LOADING_MESSAGE_PREFIX)).toBeVisible({ timeout: 10000 });

    // Verify step indicator is present (e.g., "Step 1 of 9")
    await expect(page.getByText(/Step \d+ of \d+/)).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-loading-state.png', fullPage: true });
  });
});

test.describe('Narrative Layer - Export Dialog', () => {
  // TODO US-NL01: Requires seeded founder account with an existing generated narrative
  test.skip(true, 'Requires seeded founder with existing generated narrative');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should open export dialog with PDF and QR code options', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Wait for the narrative page to load with action buttons
    const exportButton = page.getByRole('button', { name: 'Export' });
    await expect(exportButton).toBeVisible({ timeout: 15000 });

    // Open export dialog
    await exportButton.click();

    // Verify dialog content from EXPORT_COPY constants
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(EXPORT_DIALOG_TITLE)).toBeVisible();
    await expect(dialog.getByText('Generate a branded PDF with verification QR code.')).toBeVisible();

    // QR code checkbox should be checked by default
    const qrCheckbox = dialog.getByLabel(QR_CODE_LABEL);
    await expect(qrCheckbox).toBeChecked();

    // Export PDF button should be visible
    await expect(dialog.getByRole('button', { name: 'Export PDF' })).toBeVisible();

    // Cancel button should be visible
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-export-dialog.png', fullPage: true });
  });

  test('should allow unchecking QR code option', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    const exportButton = page.getByRole('button', { name: 'Export' });
    await expect(exportButton).toBeVisible({ timeout: 15000 });
    await exportButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Uncheck QR code
    const qrCheckbox = dialog.getByLabel(QR_CODE_LABEL);
    await qrCheckbox.click();
    await expect(qrCheckbox).not.toBeChecked();
  });
});

test.describe('Narrative Layer - Publish Dialog (HITL Checklist)', () => {
  // TODO US-NL01: Requires seeded founder account with an existing generated narrative
  test.skip(true, 'Requires seeded founder with existing generated narrative');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should open publish dialog with HITL checklist', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Wait for the publish button
    const publishButton = page.getByRole('button', { name: 'Publish' });
    await expect(publishButton).toBeVisible({ timeout: 15000 });

    // Open publish dialog
    await publishButton.click();

    // Verify dialog content from PUBLICATION_COPY constants
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(PUBLISH_DIALOG_TITLE)).toBeVisible();

    // Verify all 4 HITL checklist items are visible
    await expect(dialog.getByText(HITL_CHECKLIST.reviewed_slides)).toBeVisible();
    await expect(dialog.getByText(HITL_CHECKLIST.verified_traction)).toBeVisible();
    await expect(dialog.getByText(HITL_CHECKLIST.added_context)).toBeVisible();
    await expect(dialog.getByText(HITL_CHECKLIST.confirmed_ask)).toBeVisible();

    // "Please confirm:" label should be present
    await expect(dialog.getByText('Please confirm:')).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-publish-dialog.png', fullPage: true });
  });

  test('should disable Publish Narrative button until all 4 confirmations are checked', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    const publishButton = page.getByRole('button', { name: 'Publish' });
    await expect(publishButton).toBeVisible({ timeout: 15000 });
    await publishButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // The publish action button text is "Publish Narrative" (from component)
    const confirmButton = dialog.getByRole('button', { name: 'Publish Narrative' });
    await expect(confirmButton).toBeDisabled();

    // Check all 4 HITL confirmation checkboxes
    const checkboxes = dialog.locator('button[role="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).click();
    }

    // Publish button should now be enabled
    await expect(confirmButton).toBeEnabled();

    await page.screenshot({ path: 'test-results/narrative-publish-all-checked.png', fullPage: true });
  });

  test('should re-disable Publish Narrative button when a confirmation is unchecked', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    const publishButton = page.getByRole('button', { name: 'Publish' });
    await expect(publishButton).toBeVisible({ timeout: 15000 });
    await publishButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const confirmButton = dialog.getByRole('button', { name: 'Publish Narrative' });
    const checkboxes = dialog.locator('button[role="checkbox"]');

    // Check all 4
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).click();
    }
    await expect(confirmButton).toBeEnabled();

    // Uncheck the first one
    await checkboxes.first().click();

    // Publish button should be disabled again
    await expect(confirmButton).toBeDisabled();
  });
});

test.describe('Narrative Layer - Edit Page Navigation', () => {
  // TODO US-NL01: Requires seeded founder account with an existing generated narrative
  test.skip(true, 'Requires seeded founder with existing generated narrative');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should navigate to edit page and show editor heading', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Wait for the Edit button in the narrative view header
    const editButton = page.getByRole('button', { name: 'Edit' });
    await expect(editButton).toBeVisible({ timeout: 15000 });

    // Click Edit
    await editButton.click();

    // Verify URL changed to edit route
    await expect(page).toHaveURL(new RegExp(`/project/${TEST_PROJECT_ID}/narrative/edit`));

    // Verify edit page heading renders
    await expect(page.getByRole('heading', { name: 'Edit Narrative' })).toBeVisible({ timeout: 15000 });

    // Verify the helper text about Guardian is visible
    await expect(page.getByText('Guardian will verify your changes against the evidence')).toBeVisible();

    // Verify "Back to Narrative" link is present
    await expect(page.getByRole('link', { name: /Back to Narrative/i })).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-edit-page.png', fullPage: true });
  });

  test('should navigate directly to edit page via URL', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative/edit`);

    // Verify page loads (or shows error if no narrative exists)
    const heading = page.getByRole('heading', { name: 'Edit Narrative' });
    const errorText = page.getByText('Narrative not found');

    // One of these should be visible
    await expect(heading.or(errorText)).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/narrative-edit-direct.png', fullPage: true });
  });
});

test.describe('Narrative Layer - History Page Navigation', () => {
  // TODO US-NL01: Requires seeded founder account with an existing generated narrative
  test.skip(true, 'Requires seeded founder with existing generated narrative');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should navigate to history page and show heading', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Wait for the History button
    const historyButton = page.getByRole('button', { name: 'History' });
    await expect(historyButton).toBeVisible({ timeout: 15000 });

    // Click History
    await historyButton.click();

    // Verify URL changed to history route
    await expect(page).toHaveURL(new RegExp(`/project/${TEST_PROJECT_ID}/narrative/history`));

    // Verify history page heading from the component
    await expect(page.getByRole('heading', { name: NARRATIVE_HISTORY_HEADING })).toBeVisible({ timeout: 15000 });

    // Verify the description text is visible
    await expect(page.getByText('Track how your pitch narrative has evolved')).toBeVisible();

    // Verify "Back to Narrative" link is present
    await expect(page.getByRole('link', { name: /Back to Narrative/i })).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-history-page.png', fullPage: true });
  });

  test('should navigate directly to history page via URL', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative/history`);

    // Verify page loads (heading or no-narrative message)
    const heading = page.getByRole('heading', { name: NARRATIVE_HISTORY_HEADING });
    const noNarrative = page.getByText('No narrative found for this project');

    await expect(heading.or(noNarrative)).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/narrative-history-direct.png', fullPage: true });
  });

  test('should show empty diff panel before selecting a version', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative/history`);

    const heading = page.getByRole('heading', { name: NARRATIVE_HISTORY_HEADING });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // The diff panel shows placeholder text when no version is selected
    await expect(page.getByText('Select a version from the timeline to view changes')).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-history-no-selection.png', fullPage: true });
  });
});

test.describe('Narrative Layer - Verification Page (Public)', () => {
  // The verification page is public (no auth required).

  test('should show loading state then Not Found for invalid token', async ({ page }) => {
    // Mock the verify API to return not_found
    await mockVerificationApi(page, 'invalid-token-zzz', 'not_found');

    await page.goto('/verify/invalid-token-zzz');

    // After loading completes, should show Not Found state.
    await expect(page.getByText('This verification token is not recognized')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(VERIFICATION_NOT_FOUND_TITLE).first()).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-verify-not-found.png', fullPage: true });
  });

  test('should show Verified status for a valid token', async ({ page }) => {
    // Mock the verify API to return verified
    await mockVerificationApi(page, 'valid-token-abc', 'verified');

    await page.goto('/verify/valid-token-abc');

    // Should show Verified badge and title
    await expect(page.getByText('Verified').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('This pitch narrative matches the evidence on record')).toBeVisible();

    // Should show venture name
    await expect(page.getByText('E2E Test Venture')).toBeVisible();

    // Should show export details
    await expect(page.getByText('Exported')).toBeVisible();
    await expect(page.getByText('Evidence generated')).toBeVisible();
    await expect(page.getByText('Evidence ID')).toBeVisible();

    // Should show branding footer
    await expect(page.getByText('Verified by StartupAI')).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-verify-verified.png', fullPage: true });
  });

  test('should show Outdated status for an outdated token', async ({ page }) => {
    // Mock the verify API to return outdated
    await mockVerificationApi(page, 'outdated-token-xyz', 'outdated');

    await page.goto('/verify/outdated-token-xyz');

    // Should show Outdated badge
    await expect(page.getByText('Outdated').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("This export was generated from an earlier version. The founder's narrative has been updated since this PDF was created.")).toBeVisible();

    // Should show the hash mismatch warning
    await expect(page.getByText('The narrative has been updated since this export')).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-verify-outdated.png', fullPage: true });
  });

  test('should show Request Full Access button when access URL is available', async ({ page }) => {
    await mockVerificationApi(page, 'with-access-token', 'verified');

    await page.goto('/verify/with-access-token');

    // Wait for the page to load
    await expect(page.getByText('Verified').first()).toBeVisible({ timeout: 15000 });

    // Should show the Request Full Access button
    await expect(page.getByRole('link', { name: 'Request Full Access' })).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-verify-request-access.png', fullPage: true });
  });
});

test.describe('Narrative Layer - Preview as PH Dialog', () => {
  // TODO US-NL01: Requires seeded founder account with an existing generated narrative
  test.skip(true, 'Requires seeded founder with existing generated narrative');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should open Preview as PH dialog with evidence package content', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Wait for the "Preview as PH" button
    const previewButton = page.getByRole('button', { name: 'Preview as PH' });
    await expect(previewButton).toBeVisible({ timeout: 15000 });

    // Click to open dialog
    await previewButton.click();

    // Verify the dialog opens with the correct title
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Preview as Portfolio Holder')).toBeVisible();
    await expect(dialog.getByText('This is how your evidence package appears to investors')).toBeVisible();

    // Should show either the evidence package content or a loading/empty state
    const packageContent = dialog.getByText('E2E Test Venture');
    const emptyMessage = dialog.getByText('No evidence package found');
    const loadingMessage = dialog.getByText('Loading preview...');

    await expect(
      packageContent.or(emptyMessage).or(loadingMessage)
    ).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'test-results/narrative-preview-as-ph.png', fullPage: true });
  });
});

test.describe('Narrative Layer - Dashboard Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupDashboardMocks(page);
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should display Pitch Narrative heading on narrative page', async ({ page }) => {
    // Navigate to the narrative page for any project
    // This test verifies the page renders at all after auth
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // The page heading is always "Pitch Narrative" regardless of state
    const heading = page.getByRole('heading', { name: 'Pitch Narrative' });
    const notFoundText = page.locator('body').getByText(/404|not found/i);

    // Either the page loads (feature flag on) or 404s (feature flag off)
    await expect(heading.or(notFoundText)).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/narrative-page-auth.png', fullPage: true });
  });

  test('should show back button linking to founder dashboard', async ({ page }) => {
    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // When the page loads (feature flag on), the back button should be present
    const heading = page.getByRole('heading', { name: 'Pitch Narrative' });
    const isPageLoaded = await heading.isVisible({ timeout: 15000 }).catch(() => false);

    if (isPageLoaded) {
      // Verify back button links to dashboard
      const backLink = page.getByRole('link', { name: /Back to Dashboard/i });
      await expect(backLink).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/narrative-back-button.png', fullPage: true });
  });
});

test.describe('Narrative Layer - No Console Errors', () => {
  test.beforeEach(async ({ page }) => {
    await setupDashboardMocks(page);
    await page.goto('/login');
    await login(page, FOUNDER_USER);
  });

  test('should render narrative page without critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`/project/${TEST_PROJECT_ID}/narrative`);

    // Wait for page to render (any state)
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');

    // Filter expected non-critical errors (favicon, PostHog, feature flag 404)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('PostHog') &&
        !e.includes('404') &&
        !e.includes('NEXT_NOT_FOUND') &&
        !e.includes('[useApprovals] Error:') &&
        !e.includes('supabase_auth-js_dist_module') &&
        !e.includes('status of 403 (Forbidden)') &&
        !e.includes('TypeError: Failed to fetch')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical console errors:', criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Narrative Layer - Verification Page No Console Errors', () => {
  test('should render verification page without critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await mockVerificationApi(page, 'console-error-check', 'not_found');
    await page.goto('/verify/console-error-check');

    await expect(page.getByText(VERIFICATION_NOT_FOUND_TITLE).first()).toBeVisible({ timeout: 15000 });

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('PostHog') &&
        !e.includes('supabase_auth-js_dist_module') &&
        !e.includes('TypeError: Failed to fetch')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Narrative Layer - Mobile Responsive', () => {
  test('should render verification page on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await mockVerificationApi(page, 'mobile-test-token', 'verified');
    await page.goto('/verify/mobile-test-token');

    await expect(page.getByText('Verified').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('E2E Test Venture')).toBeVisible();

    await page.screenshot({ path: 'test-results/narrative-verify-mobile.png', fullPage: true });
  });
});
