/**
 * Simple Blueprint Test - Focused on actual workflow
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'ac7x@pm.me';
const TEST_PASSWORD = '123123';
const BLUEPRINT_NAME = `測試藍圖 ${Date.now()}`;
const BLUEPRINT_DESCRIPTION = '這是一個使用 Playwright 自動化測試建立的藍圖';

test.describe('Blueprint Workflow Test', () => {
  test('Complete blueprint workflow', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));
    page.on('pageerror', error => console.log(`[ERROR]: ${error.message}`));
    
    console.log('\n=== Step 1: Login ===');
    await page.goto('http://localhost:4200/#/passport/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.screenshot({ path: 'test-results/workflow-01-login-form.png', fullPage: true });
    
    // Click login and wait for any response
    console.log('Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Wait longer and be more flexible
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/workflow-02-after-login-click.png', fullPage: true });
    
    const loginUrl = page.url();
    console.log(`URL after login attempt: ${loginUrl}`);
    
    // Check if we're on a different page
    if (loginUrl.includes('/passport/login')) {
      console.log('⚠ Still on login page, checking for errors...');
      const errorElements = await page.locator('.ant-message-error, .error, .ant-form-item-explain-error').all();
      for (const elem of errorElements) {
        console.log(`Error: ${await elem.textContent()}`);
      }
      throw new Error('Login appears to have failed - still on login page');
    }
    
    console.log('✓ Navigated away from login page');
    expect(loginUrl).not.toContain('/passport/login');
    
    console.log('\n=== Step 2: Navigate to Blueprint List ===');
    await page.goto('http://localhost:4200/#/blueprint/list');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/workflow-03-blueprint-list.png', fullPage: true });
    
    console.log('✓ On blueprint list page');
    expect(page.url()).toContain('/blueprint/list');
    
    console.log('\n=== Step 3: Create New Blueprint ===');
    
    // Look for create button - try multiple approaches
    console.log('Looking for create button...');
    
    // First try: look for button with specific text
    let createButton = page.locator('button:has-text("新增"), button:has-text("建立"), button:has-text("創建"), button:has-text("Create")').first();
    
    let foundButton = false;
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found create button by text');
      foundButton = true;
    } else {
      // Try finding by icon or class
      createButton = page.locator('button[nz-button]').first();
      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Found create button by nz-button');
        foundButton = true;
      }
    }
    
    if (!foundButton) {
      console.log('⚠ Create button not found');
      // List all buttons on the page
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons on page:`);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  Button ${i}: ${text?.trim()}`);
      }
      await page.screenshot({ path: 'test-results/workflow-04-no-create-button.png', fullPage: true });
      throw new Error('Could not find create blueprint button');
    }
    
    console.log('Clicking create button...');
    await createButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/workflow-05-create-modal.png', fullPage: true });
    
    // Fill in blueprint form
    console.log('Filling blueprint form...');
    
    // Try different selectors for name field
    const nameSelectors = [
      'input[formControlName="name"]',
      'input[placeholder*="名稱"]',
      'input[placeholder*="名称"]',
      'input[placeholder*="name"]'
    ];
    
    let nameFilled = false;
    for (const selector of nameSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.locator(selector).fill(BLUEPRINT_NAME);
          console.log(`✓ Name filled using: ${selector}`);
          nameFilled = true;
          break;
        }
      } catch (e) {
        console.log(`✗ Name selector failed: ${selector}`);
      }
    }
    
    if (!nameFilled) {
      console.log('⚠ Could not fill blueprint name');
      await page.screenshot({ path: 'test-results/workflow-06-name-field-not-found.png', fullPage: true });
    }
    
    // Try different selectors for description field
    const descSelectors = [
      'textarea[formControlName="description"]',
      'textarea[placeholder*="描述"]',
      'textarea[placeholder*="description"]'
    ];
    
    let descFilled = false;
    for (const selector of descSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          await page.locator(selector).fill(BLUEPRINT_DESCRIPTION);
          console.log(`✓ Description filled using: ${selector}`);
          descFilled = true;
          break;
        }
      } catch (e) {
        console.log(`✗ Description selector failed: ${selector}`);
      }
    }
    
    if (!descFilled) {
      console.log('⚠ Could not fill blueprint description');
    }
    
    await page.screenshot({ path: 'test-results/workflow-07-form-filled.png', fullPage: true });
    
    // Submit the form
    console.log('Submitting blueprint form...');
    const submitButton = page.locator('button:has-text("確定"), button:has-text("确定"), button:has-text("OK"), button:has-text("Submit"), button[type="submit"]').last();
    
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
      console.log('✓ Submit button clicked');
    } else {
      console.log('⚠ Submit button not found');
      await page.screenshot({ path: 'test-results/workflow-08-no-submit-button.png', fullPage: true });
    }
    
    // Wait for creation to complete
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/workflow-09-after-submit.png', fullPage: true });
    
    const afterCreateUrl = page.url();
    console.log(`URL after creation: ${afterCreateUrl}`);
    
    // Check if we're on a blueprint detail page
    if (afterCreateUrl.includes('/blueprint/') && !afterCreateUrl.includes('/list')) {
      const match = afterCreateUrl.match(/\/blueprint\/([^\/\?#]+)/);
      if (match) {
        const blueprintId = match[1];
        console.log(`✓ Blueprint created with ID: ${blueprintId}`);
        
        // Test blueprint overview
        console.log('\n=== Step 4: Test Blueprint Overview ===');
        await page.screenshot({ path: 'test-results/workflow-10-blueprint-overview.png', fullPage: true });
        
        // Test a few key features
        const testFeatures = [
          { name: 'Members', path: 'members' },
          { name: 'Tasks', path: 'tasks' },
          { name: 'Files', path: 'files' }
        ];
        
        for (const feature of testFeatures) {
          console.log(`\nTesting ${feature.name} feature...`);
          const featureUrl = `http://localhost:4200/#/blueprint/${blueprintId}/${feature.path}`;
          await page.goto(featureUrl);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500);
          
          await page.screenshot({ 
            path: `test-results/workflow-feature-${feature.path}.png`, 
            fullPage: true 
          });
          
          console.log(`✓ ${feature.name} page loaded`);
          expect(page.url()).toContain(feature.path);
        }
        
        console.log('\n=== All Tests Completed Successfully! ===');
      }
    } else {
      console.log('⚠ Did not navigate to blueprint detail page');
      console.log('This might mean:');
      console.log('  - Blueprint creation failed');
      console.log('  - Form validation error');
      console.log('  - Different redirect behavior');
    }
  });
});
