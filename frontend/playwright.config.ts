import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'e2e', use: { ...devices['Desktop Chrome'] } },
  ],
})
