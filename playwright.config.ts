import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    channel:
      process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : 'chromium'),
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/api/config',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  reporter: 'list',
});
