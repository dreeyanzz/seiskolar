// Browser tests of the sign-in flows, on the three devices every SEIskolar screen is drawn
// for (03-low-fidelity/README.md: 360, 768 and 1440 px wide). They run against a production
// build, in the Microsoft Edge already on this computer, so no browser is downloaded.
import { defineConfig } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: 'tests/e2e',
  // One server holds the mock accounts in memory, and activating one changes it for good.
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'msedge',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone', use: { viewport: { width: 360, height: 800 }, hasTouch: true } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: `http://localhost:${PORT}/sign-in`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
})
