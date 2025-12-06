/**
 * Blueprint Exploration and Creation Test
 * 藍圖探索與創建測試
 * 
 * This test explores the blueprint functionality by:
 * 1. Logging in with test credentials
 * 2. Navigating to the blueprint list
 * 3. Attempting to create a new blueprint
 * 4. Documenting all encountered issues and obstacles
 * 
 * Test Account: ac7x@pm.me
 * Password: 123123
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_CREDENTIALS = {
  email: 'ac7x@pm.me',
  password: '123123'
};

// Helper function to take screenshot with timestamp
async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

// Helper function to log page state
async function logPageState(page: Page, step: string) {
  console.log(`\n=== ${step} ===`);
  console.log(`URL: ${page.url()}`);
  console.log(`Title: ${await page.title()}`);
}

test.describe('Blueprint Functionality Exploration', () => {
  test.beforeEach(async ({ page }) => {
    // Create screenshots directory
    await page.context().addInitScript(() => {
      console.log('Starting blueprint exploration test');
    });
  });

  test('Complete Blueprint Workflow - Login and Explore', async ({ page }) => {
    // Step 1: Navigate to the application
    console.log('Step 1: Navigating to application...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await takeTimestampedScreenshot(page, '01-landing-page');
    await logPageState(page, 'Landing Page');

    // Check if we're on login page or already logged in
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Step 2: Login process
    if (currentUrl.includes('passport/login') || currentUrl.includes('login')) {
      console.log('Step 2: On login page, attempting to login...');
      
      // Wait for login form to be visible
      await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 10000 });
      await takeTimestampedScreenshot(page, '02-login-page');
      
      // Fill in login credentials
      const emailInput = page.locator('input[type="text"], input[type="email"]').first();
      await emailInput.fill(TEST_CREDENTIALS.email);
      console.log(`Filled email: ${TEST_CREDENTIALS.email}`);
      
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(TEST_CREDENTIALS.password);
      console.log('Filled password');
      
      await takeTimestampedScreenshot(page, '03-login-form-filled');
      
      // Click login button
      const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登錄"), button:has-text("Login")').first();
      await loginButton.click();
      console.log('Clicked login button');
      
      // Wait for navigation after login
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for any animations/redirects
      await takeTimestampedScreenshot(page, '04-after-login');
      await logPageState(page, 'After Login');
    } else {
      console.log('Step 2: Already logged in or not on login page');
      await takeTimestampedScreenshot(page, '02-already-logged-in');
    }

    // Step 3: Navigate to blueprint list
    console.log('Step 3: Navigating to blueprint list...');
    
    // Try multiple ways to navigate to blueprint list
    const blueprintNavigation = [
      () => page.goto('/blueprint/list'),
      () => page.click('text=藍圖'),
      () => page.click('text=Blueprint'),
      () => page.click('a[href*="blueprint"]'),
    ];

    let navigationSuccessful = false;
    for (const navigate of blueprintNavigation) {
      try {
        await navigate();
        await page.waitForLoadState('networkidle');
        if (page.url().includes('blueprint')) {
          navigationSuccessful = true;
          break;
        }
      } catch (error) {
        console.log(`Navigation attempt failed: ${error}`);
      }
    }

    if (!navigationSuccessful) {
      console.log('Could not navigate to blueprint list, trying direct URL...');
      await page.goto('/blueprint/list');
      await page.waitForLoadState('networkidle');
    }

    await takeTimestampedScreenshot(page, '05-blueprint-list');
    await logPageState(page, 'Blueprint List Page');

    // Document the page structure
    console.log('\n=== Blueprint List Page Analysis ===');
    const pageContent = await page.content();
    console.log(`Page contains ${pageContent.length} characters`);

    // Check for common UI elements
    const uiElements = {
      'Create Button': 'button:has-text("創建"), button:has-text("新增"), button:has-text("Create"), button:has-text("添加")',
      'Search Box': 'input[type="search"], input[placeholder*="搜"], input[placeholder*="Search"]',
      'Table': 'table, nz-table, .ant-table',
      'List': 'nz-list, .ant-list, ul[class*="list"]',
      'Cards': '.ant-card, nz-card',
    };

    console.log('\nUI Elements Detection:');
    for (const [name, selector] of Object.entries(uiElements)) {
      const count = await page.locator(selector).count();
      console.log(`${name}: ${count > 0 ? '✓ Found' : '✗ Not Found'} (${count} elements)`);
    }

    // Step 4: Attempt to create a new blueprint
    console.log('\nStep 4: Attempting to create a new blueprint...');
    
    // Look for create/add button with various possible texts
    const createButtonSelectors = [
      'button:has-text("創建藍圖")',
      'button:has-text("新增藍圖")',
      'button:has-text("Create Blueprint")',
      'button:has-text("創建")',
      'button:has-text("新增")',
      'button:has-text("添加")',
      'button:has-text("Create")',
      'button:has-text("Add")',
      'button[nz-button]:has-text("+")',
      'a:has-text("創建")',
      'a:has-text("Create")',
      '.ant-btn:has-text("創建")',
      '.ant-btn:has-text("新增")',
    ];

    let createButtonFound = false;
    let createButton;
    
    for (const selector of createButtonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        createButton = page.locator(selector).first();
        console.log(`Found create button with selector: ${selector}`);
        createButtonFound = true;
        break;
      }
    }

    if (createButtonFound && createButton) {
      console.log('Create button found, clicking...');
      await takeTimestampedScreenshot(page, '06-before-create-click');
      
      await createButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeTimestampedScreenshot(page, '07-after-create-click');
      await logPageState(page, 'After Create Button Click');

      // Check if we're on a form page or modal
      const isModal = await page.locator('.ant-modal, nz-modal, [role="dialog"]').count() > 0;
      const isFormPage = page.url().includes('create') || page.url().includes('new');
      
      console.log(`Modal opened: ${isModal}`);
      console.log(`Form page loaded: ${isFormPage}`);

      if (isModal || isFormPage) {
        console.log('\n=== Blueprint Creation Form Analysis ===');
        
        // Analyze form fields
        const formFields = await page.locator('input, textarea, select, nz-select').all();
        console.log(`Total form fields found: ${formFields.length}`);
        
        for (let i = 0; i < Math.min(formFields.length, 20); i++) {
          const field = formFields[i];
          const tagName = await field.evaluate(el => el.tagName);
          const type = await field.getAttribute('type');
          const placeholder = await field.getAttribute('placeholder');
          const name = await field.getAttribute('name');
          const id = await field.getAttribute('id');
          
          console.log(`Field ${i + 1}: ${tagName}${type ? `[type="${type}"]` : ''}`);
          if (placeholder) console.log(`  Placeholder: ${placeholder}`);
          if (name) console.log(`  Name: ${name}`);
          if (id) console.log(`  ID: ${id}`);
        }

        // Try to fill out a sample blueprint
        console.log('\nAttempting to fill blueprint form...');
        const blueprintTestData = {
          name: `測試藍圖 ${Date.now()}`,
          description: '這是一個自動化測試創建的藍圖',
          code: `BP-TEST-${Date.now()}`,
        };

        // Try to fill common field names
        const fieldMappings = [
          { selector: 'input[placeholder*="名稱"], input[name*="name"], input[id*="name"]', value: blueprintTestData.name },
          { selector: 'textarea[placeholder*="描述"], textarea[name*="description"], textarea[id*="description"]', value: blueprintTestData.description },
          { selector: 'input[placeholder*="編號"], input[name*="code"], input[id*="code"]', value: blueprintTestData.code },
        ];

        for (const mapping of fieldMappings) {
          try {
            const count = await page.locator(mapping.selector).count();
            if (count > 0) {
              await page.locator(mapping.selector).first().fill(mapping.value);
              console.log(`Filled field with selector: ${mapping.selector}`);
            }
          } catch (error) {
            console.log(`Could not fill field ${mapping.selector}: ${error}`);
          }
        }

        await takeTimestampedScreenshot(page, '08-form-filled');

        // Look for submit button
        const submitButtonSelectors = [
          'button[type="submit"]',
          'button:has-text("確定")',
          'button:has-text("提交")',
          'button:has-text("保存")',
          'button:has-text("儲存")',
          'button:has-text("Submit")',
          'button:has-text("Save")',
          'button:has-text("OK")',
        ];

        let submitButtonFound = false;
        for (const selector of submitButtonSelectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`Found submit button with selector: ${selector}`);
            submitButtonFound = true;
            // Note: We're not actually submitting to avoid creating test data
            console.log('Submit button found but not clicking to avoid creating test data');
            break;
          }
        }

        if (!submitButtonFound) {
          console.log('⚠️ Issue: Submit button not found');
        }

        await takeTimestampedScreenshot(page, '09-ready-to-submit');
      } else {
        console.log('⚠️ Issue: No form or modal appeared after clicking create button');
      }
    } else {
      console.log('⚠️ Issue: Create button not found on blueprint list page');
      console.log('Available buttons on page:');
      const buttons = await page.locator('button, a.ant-btn').all();
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const text = await buttons[i].textContent();
        console.log(`  Button ${i + 1}: "${text?.trim()}"`);
      }
    }

    // Step 5: Explore blueprint details page (if any blueprint exists)
    console.log('\nStep 5: Exploring existing blueprints...');
    
    const blueprintLinks = await page.locator('a[href*="/blueprint/"], .blueprint-item, .ant-list-item').all();
    console.log(`Found ${blueprintLinks.length} potential blueprint links`);

    if (blueprintLinks.length > 0) {
      try {
        await blueprintLinks[0].click();
        await page.waitForLoadState('networkidle');
        await takeTimestampedScreenshot(page, '10-blueprint-detail');
        await logPageState(page, 'Blueprint Detail Page');

        // Analyze the blueprint detail page
        console.log('\n=== Blueprint Detail Page Analysis ===');
        const tabs = await page.locator('[role="tab"], .ant-tabs-tab, nz-tab').all();
        console.log(`Tabs found: ${tabs.length}`);
        for (const tab of tabs) {
          const tabText = await tab.textContent();
          console.log(`  Tab: "${tabText?.trim()}"`);
        }
      } catch (error) {
        console.log(`Could not navigate to blueprint detail: ${error}`);
      }
    }

    // Final screenshot
    await takeTimestampedScreenshot(page, '11-final-state');

    // Generate test report
    console.log('\n' + '='.repeat(80));
    console.log('BLUEPRINT EXPLORATION TEST REPORT');
    console.log('藍圖功能探索測試報告');
    console.log('='.repeat(80));
    console.log(`Test Account: ${TEST_CREDENTIALS.email}`);
    console.log(`Test Date: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
  });

  test('Detailed UI Component Analysis', async ({ page }) => {
    console.log('\n=== Detailed UI Component Analysis Test ===');
    
    // Login first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to blueprint
    try {
      await page.goto('/blueprint/list');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log(`Navigation error: ${error}`);
    }

    await takeTimestampedScreenshot(page, 'ui-analysis-blueprint-list');

    // Comprehensive UI element detection
    console.log('\nComprehensive UI Element Detection:');
    
    const elementsToCheck = {
      'Navigation': 'nav, .ant-menu, nz-menu',
      'Header': 'header, .ant-layout-header',
      'Sidebar': 'aside, .ant-layout-sider',
      'Content': 'main, .ant-layout-content',
      'Footer': 'footer, .ant-layout-footer',
      'Buttons': 'button, .ant-btn',
      'Inputs': 'input',
      'Tables': 'table, .ant-table, nz-table',
      'Cards': '.ant-card, nz-card',
      'Modals': '.ant-modal, nz-modal',
      'Dropdowns': '.ant-dropdown, nz-dropdown',
      'Tooltips': '.ant-tooltip, nz-tooltip',
      'Alerts': '.ant-alert, nz-alert',
      'Forms': 'form, .ant-form',
      'Tabs': '.ant-tabs, nz-tabs',
      'Pagination': '.ant-pagination, nz-pagination',
    };

    const uiAnalysis: Record<string, number> = {};
    for (const [name, selector] of Object.entries(elementsToCheck)) {
      const count = await page.locator(selector).count();
      uiAnalysis[name] = count;
      console.log(`${name.padEnd(20)}: ${count.toString().padStart(3)} elements`);
    }

    // Log all visible text on the page
    console.log('\nVisible Text Content (first 50 elements):');
    const textElements = await page.locator('h1, h2, h3, h4, button, a, label, .ant-card-head-title').all();
    for (let i = 0; i < Math.min(textElements.length, 50); i++) {
      const text = await textElements[i].textContent();
      if (text && text.trim()) {
        console.log(`  [${i + 1}] ${text.trim()}`);
      }
    }

    // Extract all href attributes
    console.log('\nLinks on the page (first 30):');
    const links = await page.locator('a[href]').all();
    for (let i = 0; i < Math.min(links.length, 30); i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      console.log(`  [${i + 1}] ${href} - "${text?.trim()}"`);
    }

    console.log('\n=== UI Analysis Complete ===');
  });
});
