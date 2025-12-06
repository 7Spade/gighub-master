/**
 * Login Debug Test
 * 登錄調試測試
 * 
 * This test helps debug the login process
 */

import { test, expect } from '@playwright/test';

test.describe('Login Debug', () => {
  test('Debug login flow step by step', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    console.log('\n=== Step 1: Navigate to application ===');
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    console.log('Page Title:', await page.title());
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/01-initial-page.png', fullPage: true });
    
    console.log('\n=== Step 2: Analyze login form ===');
    
    // Find all input fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const formControlName = await input.getAttribute('formcontrolname');
      
      console.log(`Input ${i + 1}:`);
      console.log(`  Type: ${type}`);
      console.log(`  Placeholder: ${placeholder}`);
      console.log(`  Name: ${name}`);
      console.log(`  ID: ${id}`);
      console.log(`  FormControlName: ${formControlName}`);
    }
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      console.log(`Button ${i + 1}: "${text?.trim()}" (type: ${type})`);
    }
    
    console.log('\n=== Step 3: Try to fill login form ===');
    
    // Try different selectors for email
    const emailSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="email"]',
      'input[formcontrolname="userName"]',
      'input[formcontrolname="email"]',
      'input[name="userName"]',
      'input[name="email"]',
    ];
    
    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          await page.locator(selector).first().fill('ac7x@pm.me');
          console.log(`✓ Filled email using selector: ${selector}`);
          emailFilled = true;
          break;
        }
      } catch (error) {
        console.log(`✗ Failed with selector: ${selector}`);
      }
    }
    
    if (!emailFilled) {
      console.log('⚠️ Could not fill email field');
    }
    
    // Try different selectors for password
    const passwordSelectors = [
      'input[type="password"]',
      'input[formcontrolname="password"]',
      'input[name="password"]',
    ];
    
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          await page.locator(selector).first().fill('123123');
          console.log(`✓ Filled password using selector: ${selector}`);
          passwordFilled = true;
          break;
        }
      } catch (error) {
        console.log(`✗ Failed with selector: ${selector}`);
      }
    }
    
    if (!passwordFilled) {
      console.log('⚠️ Could not fill password field');
    }
    
    await page.screenshot({ path: 'test-results/screenshots/02-form-filled.png', fullPage: true });
    
    console.log('\n=== Step 4: Attempt login ===');
    
    // Check for any error messages before clicking
    const errorMessages = await page.locator('.ant-form-item-explain-error, .error-message, [class*="error"]').allTextContents();
    if (errorMessages.length > 0) {
      console.log('Error messages found:', errorMessages);
    }
    
    // Try to find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("登录")',
      'button:has-text("登錄")',
      'button.ant-btn-primary',
    ];
    
    let loginClicked = false;
    for (const selector of submitSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`Found login button with selector: ${selector}`);
          
          // Check if button is enabled
          const button = page.locator(selector).first();
          const isDisabled = await button.isDisabled();
          console.log(`Button disabled: ${isDisabled}`);
          
          if (!isDisabled) {
            await button.click();
            console.log(`✓ Clicked login button`);
            loginClicked = true;
            break;
          } else {
            console.log('⚠️ Login button is disabled');
          }
        }
      } catch (error) {
        console.log(`✗ Failed to click with selector: ${selector} - ${error}`);
      }
    }
    
    if (!loginClicked) {
      console.log('⚠️ Could not click login button');
    }
    
    console.log('\n=== Step 5: Wait and check response ===');
    await page.waitForTimeout(3000);
    
    console.log('URL after login:', page.url());
    console.log('Title after login:', await page.title());
    
    await page.screenshot({ path: 'test-results/screenshots/03-after-login.png', fullPage: true });
    
    // Check for any error messages after login
    const afterLoginErrors = await page.locator('.ant-form-item-explain-error, .error-message, [class*="error"], .ant-message').allTextContents();
    if (afterLoginErrors.length > 0) {
      console.log('Messages after login attempt:', afterLoginErrors);
    }
    
    // Check if we're still on login page
    if (page.url().includes('login')) {
      console.log('\n⚠️ ISSUE: Still on login page after login attempt');
      console.log('Possible reasons:');
      console.log('1. Invalid credentials');
      console.log('2. Form validation errors');
      console.log('3. Login button was disabled');
      console.log('4. JavaScript errors preventing form submission');
    } else {
      console.log('\n✓ Successfully navigated away from login page');
    }
  });
  
  test('Check if test account exists', async ({ page }) => {
    console.log('\n=== Checking test account existence ===');
    
    // Navigate to login page
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Try to login
    await page.locator('input[type="text"], input[type="email"]').first().fill('ac7x@pm.me');
    await page.locator('input[type="password"]').first().fill('123123');
    
    await page.screenshot({ path: 'test-results/screenshots/account-check-before.png', fullPage: true });
    
    // Click login
    await page.locator('button[type="submit"]').first().click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/screenshots/account-check-after.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);
    
    if (currentUrl.includes('login')) {
      console.log('❌ Login failed - account may not exist or credentials are incorrect');
      
      // Check for error messages
      const errors = await page.locator('.ant-form-item-explain-error, .ant-message-error, [class*="error"]').allTextContents();
      if (errors.length > 0) {
        console.log('Error messages:', errors);
      }
    } else {
      console.log('✅ Login successful');
    }
  });
});
