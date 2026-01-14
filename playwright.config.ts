import type {PlaywrightTestConfig} from '@playwright/test';
import {devices} from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;

const config: PlaywrightTestConfig = {
    globalSetup: './tests/playwrightSetup.ts',
    testDir: './tests/suites',
    timeout: 30 * 1000,
    outputDir: './playwright-artifacts/test-results',
    reporter: [
        ['html', {outputFolder: './playwright-artifacts/playwright-report'}],
        ['json', {outputFile: './playwright-artifacts/test-results.json'}],
    ],
    retries: 1,
    // If there is no url provided, playwright starts webServer with the app in dev mode
    webServer: baseUrl
        ? undefined
        : {
              command: 'npm run dev',
              env: {
                  REACT_APP_DISABLE_CHECKS: 'true',
                  // Use 127.0.0.1 instead of localhost for Safari/WebKit compatibility
                  REACT_APP_BACKEND: 'http://127.0.0.1:8765',
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
            name: 'safari',
            use: {
                ...devices['Desktop Safari'],
                browserName: 'webkit',
                baseURL: baseUrl || 'http://127.0.0.1:3000/',
                contextOptions: {permissions: ['clipboard-read']},
            },
        },
    ],
};

export default config;
