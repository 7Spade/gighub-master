/**
 * Blueprint E2E Test Suite
 * 
 * Testing GigHub Blueprint functionality including:
 * - Login
 * - Blueprint creation
 * - Blueprint overview
 * - All blueprint features (members, tasks, financial, etc.)
 * 
 * Test Account: ac7x@pm.me
 * Password: 123123
 */

import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_EMAIL = 'ac7x@pm.me';
const TEST_PASSWORD = '123123';

// Test data
const BLUEPRINT_NAME = `測試藍圖 ${Date.now()}`;
const BLUEPRINT_DESCRIPTION = '這是一個使用 Playwright 自動化測試建立的藍圖';

// Helper function to take screenshot with timestamp
async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

// Helper function to wait for navigation
async function waitForNavigation(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(1000); // Additional wait for any animations
}

test.describe('Blueprint Functionality Test Suite', () => {
  let blueprintId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Set up console and error listeners
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR]: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]: ${error.message}`);
    });
  });

  test('Step 1: Login with test credentials', async ({ page }) => {
    console.log('\n=== Testing Login Functionality ===');
    
    // Navigate to login page
    await page.goto('/passport/login');
    await waitForNavigation(page);
    await takeScreenshot(page, '01-login-page');
    
    // Check if already logged in
    const currentUrl = page.url();
    if (!currentUrl.includes('/passport/login')) {
      console.log('Already logged in, proceeding to logout first');
      // Try to find and click logout button
      try {
        await page.goto('/passport/login');
        await waitForNavigation(page);
      } catch (e) {
        console.log('Could not navigate to login page');
      }
    }
    
    // Fill in login credentials
    console.log('Filling in email and password...');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="郵箱"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await takeScreenshot(page, '02-login-filled');
    
    // Submit login form
    console.log('Submitting login form...');
    await page.click('button[type="submit"], button:has-text("登入"), button:has-text("登录"), button:has-text("Login")');
    
    // Wait for navigation after login
    await page.waitForURL('**/account/**', { timeout: 30000 }).catch(async () => {
      console.log('Did not navigate to account page, checking current URL');
      await takeScreenshot(page, '03-login-error');
      throw new Error('Login failed - did not navigate to account page');
    });
    
    await waitForNavigation(page);
    await takeScreenshot(page, '04-login-success');
    
    console.log('✓ Login successful');
    expect(page.url()).toContain('/account');
  });

  test('Step 2: Navigate to blueprint list', async ({ page }) => {
    console.log('\n=== Testing Blueprint List Navigation ===');
    
    // Login first
    await page.goto('/passport/login');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="郵箱"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("登入"), button:has-text("登录"), button:has-text("Login")');
    await page.waitForURL('**/account/**', { timeout: 30000 });
    await waitForNavigation(page);
    
    // Navigate to blueprint list
    console.log('Navigating to blueprint list...');
    await page.goto('/blueprint/list');
    await waitForNavigation(page);
    await takeScreenshot(page, '05-blueprint-list');
    
    console.log('✓ Blueprint list page loaded');
    expect(page.url()).toContain('/blueprint/list');
  });

  test('Step 3: Create new blueprint', async ({ page }) => {
    console.log('\n=== Testing Blueprint Creation ===');
    
    // Login and navigate to blueprint list
    await page.goto('/passport/login');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="郵箱"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("登入"), button:has-text("登录"), button:has-text("Login")');
    await page.waitForURL('**/account/**', { timeout: 30000 });
    await page.goto('/blueprint/list');
    await waitForNavigation(page);
    
    // Look for create button
    console.log('Looking for create blueprint button...');
    const createButton = page.locator('button:has-text("建立"), button:has-text("新增"), button:has-text("創建"), button:has-text("Create"), button[nz-button]:has(span:has-text("新"))').first();
    
    await takeScreenshot(page, '06-before-create-click');
    
    if (await createButton.isVisible()) {
      console.log('Clicking create button...');
      await createButton.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '07-create-modal-opened');
      
      // Fill in blueprint details
      console.log('Filling blueprint name and description...');
      await page.fill('input[placeholder*="名稱"], input[formControlName="name"]', BLUEPRINT_NAME);
      await page.fill('textarea[placeholder*="描述"], textarea[formControlName="description"]', BLUEPRINT_DESCRIPTION);
      await takeScreenshot(page, '08-blueprint-form-filled');
      
      // Submit the form
      console.log('Submitting blueprint creation form...');
      const submitButton = page.locator('button:has-text("確定"), button:has-text("確認"), button:has-text("提交"), button:has-text("Submit"), button[type="submit"]').last();
      await submitButton.click();
      
      // Wait for creation to complete
      await page.waitForTimeout(3000);
      await waitForNavigation(page);
      await takeScreenshot(page, '09-blueprint-created');
      
      // Check if redirected to blueprint overview
      const currentUrl = page.url();
      console.log(`Current URL after creation: ${currentUrl}`);
      
      if (currentUrl.includes('/blueprint/') && !currentUrl.includes('/list')) {
        // Extract blueprint ID from URL
        const match = currentUrl.match(/\/blueprint\/([^\/]+)/);
        if (match) {
          blueprintId = match[1];
          console.log(`✓ Blueprint created with ID: ${blueprintId}`);
        }
      }
      
      console.log('✓ Blueprint creation completed');
    } else {
      console.log('⚠ Create button not found');
      await takeScreenshot(page, '06-create-button-not-found');
      throw new Error('Create button not found on blueprint list page');
    }
  });

  test('Step 4: Test Blueprint Overview', async ({ page }) => {
    console.log('\n=== Testing Blueprint Overview ===');
    
    // Login and create a blueprint first
    await page.goto('/passport/login');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="郵箱"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("登入"), button:has-text("登录"), button:has-text("Login")');
    await page.waitForURL('**/account/**', { timeout: 30000 });
    await page.goto('/blueprint/list');
    await waitForNavigation(page);
    
    // Get first blueprint or create one
    const blueprintLinks = page.locator('a[href*="/blueprint/"]:not([href*="/list"])');
    const count = await blueprintLinks.count();
    
    if (count > 0) {
      console.log(`Found ${count} blueprints, clicking the first one...`);
      await blueprintLinks.first().click();
      await waitForNavigation(page);
      await takeScreenshot(page, '10-blueprint-overview');
      
      console.log('✓ Blueprint overview page loaded');
      expect(page.url()).toMatch(/\/blueprint\/[^\/]+/);
    } else {
      console.log('⚠ No blueprints found, creating one first...');
      // Create a blueprint first
      const createButton = page.locator('button:has-text("建立"), button:has-text("新增"), button:has-text("創建")').first();
      await createButton.click();
      await page.waitForTimeout(2000);
      await page.fill('input[formControlName="name"]', BLUEPRINT_NAME);
      await page.fill('textarea[formControlName="description"]', BLUEPRINT_DESCRIPTION);
      const submitButton = page.locator('button:has-text("確定"), button:has-text("確認")').last();
      await submitButton.click();
      await page.waitForTimeout(3000);
      await waitForNavigation(page);
      await takeScreenshot(page, '10-blueprint-overview-after-create');
    }
  });

  // Test each blueprint feature
  const blueprintFeatures = [
    { name: 'Members', path: 'members', title: '成員管理' },
    { name: 'Tasks', path: 'tasks', title: '任務管理' },
    { name: 'Financial', path: 'financial', title: '財務管理' },
    { name: 'Diaries', path: 'diaries', title: '施工日誌' },
    { name: 'QC Inspections', path: 'qc-inspections', title: '品質管控' },
    { name: 'Files', path: 'files', title: '檔案管理' },
    { name: 'Settings', path: 'settings', title: '藍圖設定' },
    { name: 'Problems', path: 'problems', title: '問題追蹤' },
    { name: 'Metadata', path: 'metadata', title: '自訂欄位' },
    { name: 'Activities', path: 'activities', title: '活動歷史' },
    { name: 'Notifications', path: 'notifications', title: '通知設定' },
    { name: 'Search', path: 'search', title: '進階搜尋' },
    { name: 'Permissions', path: 'permissions', title: '權限管理' },
    { name: 'Acceptances', path: 'acceptances', title: '驗收管理' },
    { name: 'Reports', path: 'reports', title: '報表分析' },
    { name: 'Gantt', path: 'gantt', title: '甘特圖' },
    { name: 'API Gateway', path: 'api-gateway', title: 'API 閘道' }
  ];

  blueprintFeatures.forEach((feature, index) => {
    test(`Step 5.${index + 1}: Test ${feature.name} feature`, async ({ page }) => {
      console.log(`\n=== Testing ${feature.name} Feature ===`);
      
      // Login
      await page.goto('/passport/login');
      await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="郵箱"]', TEST_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"], button:has-text("登入"), button:has-text("登录"), button:has-text("Login")');
      await page.waitForURL('**/account/**', { timeout: 30000 });
      
      // Navigate to blueprint list
      await page.goto('/blueprint/list');
      await waitForNavigation(page);
      
      // Get first blueprint
      const blueprintLinks = page.locator('a[href*="/blueprint/"]:not([href*="/list"])');
      const count = await blueprintLinks.count();
      
      if (count > 0) {
        const firstLink = await blueprintLinks.first().getAttribute('href');
        if (firstLink) {
          const blueprintUrl = firstLink.split('?')[0]; // Remove query params
          const featureUrl = `${blueprintUrl}/${feature.path}`;
          
          console.log(`Navigating to ${feature.name} page: ${featureUrl}`);
          await page.goto(featureUrl);
          await waitForNavigation(page);
          await takeScreenshot(page, `11-feature-${feature.path}`);
          
          // Check for any error messages or empty states
          const errorMessages = page.locator('nz-empty, .error-message, .ant-empty');
          const hasError = await errorMessages.count() > 0;
          
          if (hasError) {
            console.log(`⚠ ${feature.name} page shows empty state or error`);
            const errorText = await errorMessages.first().textContent();
            console.log(`Error/Empty message: ${errorText}`);
          } else {
            console.log(`✓ ${feature.name} page loaded successfully`);
          }
          
          expect(page.url()).toContain(feature.path);
        }
      } else {
        console.log(`⚠ No blueprints found to test ${feature.name} feature`);
      }
    });
  });
});
