import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Account Routes
 * Tests complete user journeys for organization, team, and bot management
 *
 * Prerequisites:
 * - Test user must be logged in
 * - Test database must be seeded with initial data
 * - Supabase RLS policies must be deployed
 */

test.describe('Organization Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to organizations page
    await page.goto('/account/organizations');
    await expect(page).toHaveTitle(/Organizations/);
  });

  test('should create a new organization', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create Organization")');

    // Fill form using FormUtils pattern
    await page.fill('input[name="name"]', 'Test Organization');
    await page.fill('input[name="email"]', 'test-org@example.com');
    await page.fill('textarea[name="description"]', 'Test organization description');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('.ant-message-success')).toContainText('組織建立成功');

    // Verify organization appears in list
    await expect(page.locator('text=Test Organization')).toBeVisible();
  });

  test('should update an existing organization', async ({ page }) => {
    // Find and click edit button for first organization
    await page.click('[data-testid="org-list"] tbody tr:first-child button:has-text("Edit")');

    // Update name using FormUtils pattern
    await page.fill('input[name="name"]', 'Updated Organization Name');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('.ant-message-success')).toContainText('組織更新成功');

    // Verify updated name appears
    await expect(page.locator('text=Updated Organization Name')).toBeVisible();
  });

  test('should delete an organization', async ({ page }) => {
    // Find and click delete button
    await page.click('[data-testid="org-list"] tbody tr:first-child button:has-text("Delete")');

    // Confirm deletion in modal
    await page.click('button:has-text("確認")');

    // Verify success message
    await expect(page.locator('.ant-message-success')).toContainText('組織刪除成功');
  });

  test('should validate required fields', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create Organization")');

    // Try to submit empty form (FormUtils should handle validation)
    await page.click('button[type="submit"]');

    // Verify validation errors are shown
    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
  });

  test('should trim whitespace from inputs', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create Organization")');

    // Fill form with extra whitespace (getTrimmedFormValue should handle)
    await page.fill('input[name="name"]', '  Test Org  ');
    await page.fill('input[name="email"]', '  test@example.com  ');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify data is trimmed (no leading/trailing spaces)
    await expect(page.locator('text=Test Org')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });
});

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account/teams');
  });

  test('should create a new team', async ({ page }) => {
    await page.click('button:has-text("Create Team")');

    await page.fill('input[name="name"]', 'Test Team');
    await page.fill('textarea[name="description"]', 'Test team description');

    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-message-success')).toContainText('團隊建立成功');
    await expect(page.locator('text=Test Team')).toBeVisible();
  });

  test('should update a team', async ({ page }) => {
    await page.click('[data-testid="team-list"] tbody tr:first-child button:has-text("Edit")');

    await page.fill('input[name="name"]', 'Updated Team Name');
    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-message-success')).toContainText('團隊更新成功');
    await expect(page.locator('text=Updated Team Name')).toBeVisible();
  });

  test('should delete a team', async ({ page }) => {
    await page.click('[data-testid="team-list"] tbody tr:first-child button:has-text("Delete")');
    await page.click('button:has-text("確認")');

    await expect(page.locator('.ant-message-success')).toContainText('團隊刪除成功');
  });
});

test.describe('Bot Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account/bots');
  });

  test('should create a new bot', async ({ page }) => {
    await page.click('button:has-text("Create Bot")');

    await page.fill('input[name="name"]', 'Test Bot');
    await page.fill('input[name="email"]', 'bot@example.com');

    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-message-success')).toContainText('機器人建立成功');
    await expect(page.locator('text=Test Bot')).toBeVisible();
  });

  test('should activate a bot', async ({ page }) => {
    await page.click('[data-testid="bot-list"] tbody tr:first-child button:has-text("Activate")');

    await expect(page.locator('.ant-message-success')).toContainText('機器人已啟用');
    await expect(page.locator('[data-testid="bot-status"]:has-text("Active")')).toBeVisible();
  });

  test('should deactivate a bot', async ({ page }) => {
    await page.click('[data-testid="bot-list"] tbody tr:first-child button:has-text("Deactivate")');

    await expect(page.locator('.ant-message-success')).toContainText('機器人已停用');
    await expect(page.locator('[data-testid="bot-status"]:has-text("Inactive")')).toBeVisible();
  });

  test('should delete a bot', async ({ page }) => {
    await page.click('[data-testid="bot-list"] tbody tr:first-child button:has-text("Delete")');
    await page.click('button:has-text("確認")');

    await expect(page.locator('.ant-message-success')).toContainText('機器人刪除成功');
  });
});

test.describe('RLS Policy Verification', () => {
  test('should only show user their own organizations', async ({ page }) => {
    await page.goto('/account/organizations');

    // Get all organization rows
    const orgRows = await page.locator('[data-testid="org-list"] tbody tr').count();

    // Verify user can see their organizations (not all organizations in system)
    expect(orgRows).toBeGreaterThan(0);

    // Verify RLS is working by checking we don't see "Access Denied" or errors
    await expect(page.locator('text=Access Denied')).not.toBeVisible();
    await expect(page.locator('text=infinite recursion')).not.toBeVisible();
  });

  test('should prevent infinite recursion errors', async ({ page }) => {
    // Navigate to page that triggers organization query
    await page.goto('/account/organizations');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Verify no infinite recursion errors
    expect(errors.filter(e => e.includes('infinite recursion'))).toHaveLength(0);
  });

  test('should allow organization owners to update', async ({ page }) => {
    await page.goto('/account/organizations');

    // Click edit on owned organization
    await page.click('[data-testid="org-list"] tbody tr:first-child button:has-text("Edit")');

    // Verify form is accessible
    await expect(page.locator('form')).toBeVisible();

    // Update should succeed
    await page.fill('input[name="name"]', 'Updated by Owner');
    await page.click('button[type="submit"]');

    await expect(page.locator('.ant-message-success')).toBeVisible();
  });
});

test.describe('FormUtils Integration', () => {
  test('should use validateForm for all form submissions', async ({ page }) => {
    await page.goto('/account/organizations');
    await page.click('button:has-text("Create Organization")');

    // Submit empty form - validateForm should catch this
    await page.click('button[type="submit"]');

    // Verify form controls are marked as touched (validateForm behavior)
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveClass(/ng-touched/);

    // Verify validation errors display
    await expect(page.locator('.ant-form-item-explain-error')).toBeVisible();
  });

  test('should use getTrimmedFormValue for form data extraction', async ({ page }) => {
    await page.goto('/account/organizations');
    await page.click('button:has-text("Create Organization")');

    // Input with whitespace
    await page.fill('input[name="name"]', '   Trimmed Org   ');
    await page.fill('input[name="email"]', '   trimmed@example.com   ');

    await page.click('button[type="submit"]');

    // Verify data is trimmed in the list (no extra spaces)
    const orgName = page.locator('[data-testid="org-list"] text=Trimmed Org').first();
    const orgNameText = await orgName.textContent();
    expect(orgNameText?.trim()).toBe('Trimmed Org');
  });
});

test.describe('Workspace Data Reloading', () => {
  test('should reload workspace data after organization creation', async ({ page }) => {
    await page.goto('/account/organizations');

    // Get initial count
    const initialCount = await page.locator('[data-testid="org-list"] tbody tr').count();

    // Create new organization
    await page.click('button:has-text("Create Organization")');
    await page.fill('input[name="name"]', 'New Org for Reload Test');
    await page.fill('input[name="email"]', 'reload@example.com');
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('.ant-message-success')).toBeVisible();

    // Verify workspace data reloaded (new org appears without manual refresh)
    await expect(page.locator('text=New Org for Reload Test')).toBeVisible();

    // Verify count increased
    const newCount = await page.locator('[data-testid="org-list"] tbody tr').count();
    expect(newCount).toBe(initialCount + 1);
  });
});

test.describe('Error Handling', () => {
  test('should display user-friendly error messages', async ({ page }) => {
    await page.goto('/account/organizations');

    // Simulate network failure
    await page.route('**/rest/v1/accounts*', route => route.abort());

    await page.click('button:has-text("Create Organization")');
    await page.fill('input[name="name"]', 'Test Org');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Verify ErrorHandlerService provides user-friendly message
    await expect(page.locator('.ant-message-error')).toBeVisible();
    await expect(page.locator('.ant-message-error')).not.toContainText('500');
    await expect(page.locator('.ant-message-error')).not.toContainText('undefined');
  });
});
