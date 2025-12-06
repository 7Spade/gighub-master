/**
 * Debug Login Test
 * Simple test to debug login issues
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'ac7x@pm.me';
const TEST_PASSWORD = '123123';

test.describe('Debug Login', () => {
  test('Debug login page and form submission', async ({ page }) => {
    console.log('\n=== Debugging Login ===');
    
    // Navigate to login page
    await page.goto('http://localhost:4200/passport/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/debug-01-login-page.png', fullPage: true });
    console.log('Screenshot saved: debug-01-login-page.png');
    
    // Log page title and URL
    console.log('Page title:', await page.title());
    console.log('Current URL:', page.url());
    
    // Find all input fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const formControlName = await input.getAttribute('formControlName');
      console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}, formControlName=${formControlName}`);
    }
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const type = await button.getAttribute('type');
      const text = await button.textContent();
      console.log(`Button ${i}: type=${type}, text=${text?.trim()}`);
    }
    
    // Try to fill in the form with different selectors
    console.log('\nAttempting to fill email field...');
    
    // Try multiple selectors for email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[formControlName="userName"]',
      'input[formControlName="email"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="郵箱"]',
      'input[placeholder*="email"]',
    ];
    
    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          await input.fill(TEST_EMAIL);
          console.log(`✓ Email filled using selector: ${selector}`);
          emailFilled = true;
          break;
        }
      } catch (e) {
        console.log(`✗ Email selector failed: ${selector}`);
      }
    }
    
    if (!emailFilled) {
      console.log('⚠ Could not find email input field');
    }
    
    // Try multiple selectors for password
    console.log('\nAttempting to fill password field...');
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[formControlName="password"]',
      'input[placeholder*="密码"]',
      'input[placeholder*="密碼"]',
      'input[placeholder*="password"]',
    ];
    
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          await input.fill(TEST_PASSWORD);
          console.log(`✓ Password filled using selector: ${selector}`);
          passwordFilled = true;
          break;
        }
      } catch (e) {
        console.log(`✗ Password selector failed: ${selector}`);
      }
    }
    
    if (!passwordFilled) {
      console.log('⚠ Could not find password input field');
    }
    
    // Take screenshot after filling
    await page.screenshot({ path: 'test-results/debug-02-form-filled.png', fullPage: true });
    console.log('Screenshot saved: debug-02-form-filled.png');
    
    // Try to find and click submit button
    console.log('\nAttempting to click submit button...');
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("登入")',
      'button:has-text("登录")',
      'button:has-text("Login")',
      'button:has-text("确定")',
      'button:has-text("確定")',
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          console.log(`Found submit button with selector: ${selector}`);
          await button.click();
          console.log(`✓ Submit button clicked`);
          submitClicked = true;
          break;
        }
      } catch (e) {
        console.log(`✗ Submit selector failed: ${selector}`);
      }
    }
    
    if (!submitClicked) {
      console.log('⚠ Could not find submit button');
    }
    
    // Wait for potential navigation or error messages
    await page.waitForTimeout(5000);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'test-results/debug-03-after-submit.png', fullPage: true });
    console.log('Screenshot saved: debug-03-after-submit.png');
    
    // Log current URL
    console.log('URL after submission:', page.url());
    
    // Check for error messages
    const errorMessages = await page.locator('.ant-message-error, .error, .ant-form-item-explain-error').all();
    if (errorMessages.length > 0) {
      console.log('\n⚠ Error messages found:');
      for (const error of errorMessages) {
        const text = await error.textContent();
        console.log(`  - ${text}`);
      }
    }
    
    // Check if we navigated to account page
    if (page.url().includes('/account')) {
      console.log('✓ Successfully navigated to account page!');
    } else {
      console.log('✗ Did not navigate to account page');
    }
  });
});
