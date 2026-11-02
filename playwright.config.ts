import { defineConfig, devices } from "@playwright/test";

// Smoke tests against a running app with a real database (not run in CI, which has no Neon).
//   pnpm test:e2e                                   # starts `pnpm dev` or reuses one on :3000
//   E2E_BASE_URL=https://preview.example.com pnpm test:e2e
//   E2E_PROFILE_SLUG=siti-nur-aisyah pnpm test:e2e  # also checks a published profile + vCard
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "pnpm dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
