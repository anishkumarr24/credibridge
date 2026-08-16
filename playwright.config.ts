import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Run tests sequentially to avoid overwhelming the Prisma connection pool
  // in the dev server under concurrent load.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Retry flaky tests (e.g., transient DB connection resets)
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Allow enough time for auth redirects through Next.js middleware
    navigationTimeout: 20000,
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
