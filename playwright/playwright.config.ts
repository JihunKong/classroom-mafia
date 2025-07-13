import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  /* Global test timeout */
  timeout: 300 * 1000, // 5 minutes per test
  expect: {
    timeout: 10 * 1000 // 10 seconds for assertions
  },
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Global navigation timeout */
    navigationTimeout: 30 * 1000,
    /* Global action timeout */
    actionTimeout: 10 * 1000
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] }
    },
    
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] }
    },

    /* Mobile testing for Korean Mafia game */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },

    /* Special configuration for 20-player load testing */
    {
      name: 'Load Test Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimize for concurrent testing
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
      testMatch: /.*load.*\.spec\.ts/
    }
  ],

  /* Run local dev server before starting the tests */
  webServer: process.env.SKIP_WEB_SERVER ? undefined : process.env.CI ? undefined : [
    {
      command: 'npm run dev:server',
      port: 3001,
      cwd: '../server',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test',
        PORT: '3001'
      }
    },
    {
      command: 'npm run dev:client',
      port: 5173,
      cwd: '../client',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        VITE_SERVER_URL: 'http://localhost:3001',
        VITE_SOCKET_URL: 'http://localhost:3001'
      }
    }
  ]
});