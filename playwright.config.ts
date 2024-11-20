import type {PlaywrightTestConfig} from '@playwright/test';
import {devices} from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;

const config: PlaywrightTestConfig = {
    globalSetup: './tests/playwrightSetup.ts',
    testDir: 'tests/suites',
    timeout: 2 * 60 * 1000,
    outputDir: './playwright-artifacts/test-results',
    reporter: [
        ['html', {outputFolder: './playwright-artifacts/playwright-report'}],
        ['json', {outputFile: './playwright-artifacts/test-results.json'}],
    ],
    retries: 2,
    workers: 4,
    // If there is no url provided, playwright starts webServer with the app in dev mode
    webServer: baseUrl
        ? undefined
        : {
              command: 'npm run dev',
              port: 3000,
          },
    use: {
        baseURL: baseUrl || 'http://localhost:3000/',
        testIdAttribute: 'data-qa',
        trace: 'on-first-retry',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
        {
            name: 'safari',
            use: {...devices['Desktop Safari']},
        },
    ],
};

export default config;
