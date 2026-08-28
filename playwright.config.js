import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: false,
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:8000',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
