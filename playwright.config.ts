import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for GigHub Blueprint Testing
 * 
 * This configuration is set up to test the blueprint functionality
 * of the GigHub construction management system.
 */
export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer commented out as server is manually started
  // webServer: {
  //   command: 'yarn start',
  //   url: 'http://localhost:4200',
  //   reuseExistingServer: true,
  //   timeout: 120000,
  // },
});
