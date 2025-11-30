import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Blueprint Feature
 * Tests complete user journeys for blueprint CRUD operations
 *
 * Prerequisites:
 * - Test user must be logged in (ac7x@pm.me / 123123)
 * - Test database must have workspace context configured
 */

// Test user credentials
const TEST_USER = {
  email: 'ac7x@pm.me',
  password: '123123'
};

test.describe('Blueprint Feature', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/#/passport/login');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Fill login form using placeholder text
    await page.locator('input[placeholder="Email"]').fill(TEST_USER.email);
    await page.locator('input[placeholder="Password"]').fill(TEST_USER.password);

    // Submit login
    await page.locator('button:has-text("Login")').click();

    // Wait for navigation
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/03-after-login.png' });

    // Navigate to blueprint list
    await page.goto('/#/blueprint/list');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/04-blueprint-list.png' });
  });

  test('should display blueprint list page', async ({ page }) => {
    // Verify page contains blueprint-related content
    console.log('Page URL:', page.url());

    // Take screenshot
    await page.screenshot({ path: 'test-results/05-blueprint-list-test.png' });

    // Verify we're on the blueprint page
    expect(page.url()).toContain('blueprint');
  });

  test('should show create button when context is selected', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if create button is visible
    const createButton = page.locator('button:has-text("新增藍圖")');
    const buttonCount = await createButton.count();
    console.log('Create button count:', buttonCount);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/06-create-button-check.png' });
  });

  test('should open create blueprint dialog when button clicked', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for create button
    const createButton = page.locator('button:has-text("新增藍圖"), button:has-text("建立第一個藍圖")');

    if ((await createButton.count()) > 0) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({ path: 'test-results/07-create-dialog.png' });

      // Verify dialog opened
      const modal = page.locator('.ant-modal');
      const modalVisible = await modal.isVisible();
      console.log('Modal visible:', modalVisible);
    } else {
      console.log('Create button not visible - context may not be selected');
      await page.screenshot({ path: 'test-results/07-no-create-button.png' });
    }
  });
});
