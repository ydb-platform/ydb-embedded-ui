import type {PlaywrightTestConfig} from '@playwright/test';
import {devices} from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;

const config: PlaywrightTestConfig = {
    globalSetup: './tests/playwrightSetup.ts',
    testDir: './tests/suites',
    timeout: 2 * 60 * 1000,
    outputDir: './playwright-artifacts/test-results',
    reporter: [
        ['html', {outputFolder: './playwright-artifacts/playwright-report'}],
        ['json', {outputFile: './playwright-artifacts/test-results.json'}],
    ],
    retries: process.env.CI ? 2 : 0,
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
        // Always record video and take screenshots on main branch, otherwise only on failure
        video: 'retain-on-failure',
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
