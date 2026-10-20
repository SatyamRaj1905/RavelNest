import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'npm run start',
          url: 'http://127.0.0.1:3000',
          env: {
            PORT: '3000',
            GEMINI_API_KEY: '',
            APP_ORIGIN: 'http://127.0.0.1:3000',
            UPSTASH_REDIS_REST_URL: '',
            UPSTASH_REDIS_REST_TOKEN: '',
          },
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }),
});
