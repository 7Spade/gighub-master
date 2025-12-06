/**
 * Test Helper Functions
 * 測試輔助函數
 */

import { Page } from '@playwright/test';

export const TEST_CREDENTIALS = {
  email: 'ac7x@pm.me',
  password: '123123'
};

/**
 * Login helper function
 * 登錄輔助函數
 */
export async function login(page: Page, credentials = TEST_CREDENTIALS) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const currentUrl = page.url();
  
  if (currentUrl.includes('passport/login') || currentUrl.includes('login')) {
    // Fill in credentials
    const emailInput = page.locator('input[type="text"], input[type="email"]').first();
    await emailInput.fill(credentials.email);
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(credentials.password);
    
    // Click login button
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登錄"), button:has-text("Login")').first();
    await loginButton.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
}

/**
 * Take screenshot with timestamp
 * 帶時間戳的截圖
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Log page state
 * 記錄頁面狀態
 */
export async function logPageState(page: Page, step: string) {
  console.log(`\n=== ${step} ===`);
  console.log(`URL: ${page.url()}`);
  console.log(`Title: ${await page.title()}`);
}

/**
 * Wait for Angular to be ready
 * 等待 Angular 準備就緒
 */
export async function waitForAngular(page: Page) {
  await page.waitForFunction(() => {
    return (window as any).getAllAngularTestabilities !== undefined;
  }, { timeout: 10000 }).catch(() => {
    console.log('Angular testability not available, continuing anyway');
  });
  
  await page.waitForLoadState('networkidle');
}
