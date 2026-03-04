import type {PlaywrightTestConfig} from '@playwright/test';
import {devices} from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;

const config: PlaywrightTestConfig = {
    globalSetup: './tests/playwrightSetup.ts',
    testDir: './tests/suites',
    timeout: 30 * 1000,
    outputDir: './playwright-artifacts/test-results',
    reporter: process.env.CI
        ? [['blob', {outputDir: './blob-report'}]]
        : [
              ['html', {outputFolder: './playwright-artifacts/playwright-report'}],
              ['json', {outputFile: './playwright-artifacts/test-results.json'}],
          ],
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    // If there is no url provided, playwright starts webServer with the app in dev mode
    webServer: baseUrl
        ? undefined
        : {
              command: 'npm run dev',
              env: {
                  REACT_APP_DISABLE_CHECKS: 'true',
              },
              port: 3000,
              reuseExistingServer: !process.env.CI,
          },
    use: {
        baseURL: baseUrl || 'http://localhost:3000/',
        testIdAttribute: 'data-qa',
        trace: 'on-first-retry',
        // Record video only on failure by default, can be overridden via PLAYWRIGHT_VIDEO env var
        video:
            (process.env.PLAYWRIGHT_VIDEO as 'on' | 'off' | 'retain-on-failure' | undefined) ||
            'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                contextOptions: {permissions: ['clipboard-read', 'clipboard-write']},
            },
        },
        {
            name: 'safari',
            use: {
                ...devices['Desktop Safari'],
                contextOptions: {permissions: ['clipboard-read']},
            },
        },
    ],
};

export default config;
