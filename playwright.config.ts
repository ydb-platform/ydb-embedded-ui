import type {PlaywrightTestConfig} from '@playwright/test';
import {devices} from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
const videoMode = process.env.PLAYWRIGHT_VIDEO as
    | 'on'
    | 'off'
    | 'retain-on-failure'
    | 'on-first-retry'
    | undefined;

const config: PlaywrightTestConfig = {
    globalSetup: './tests/playwrightSetup.ts',
    testDir: './tests/suites',
    timeout: 30 * 1000,
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
        },
    },
    outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || './playwright-artifacts/test-results',
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
              command: 'npm start',
              env: {
                  DISABLE_ESLINT_PLUGIN: 'true',
                  TSC_COMPILE_ON_ERROR: 'true',
                  REACT_APP_BACKEND: process.env.PLAYWRIGHT_APP_BACKEND || 'http://localhost:8765',
                  REACT_APP_META_BACKEND: 'undefined',
                  REACT_APP_DISABLE_CHECKS: 'true',
                  REACT_APP_E2E_UI_OVERRIDES: 'true',
              },
              port: 3000,
              reuseExistingServer: !process.env.CI,
          },
    use: {
        baseURL: baseUrl || 'http://localhost:3000/',
        testIdAttribute: 'data-qa',
        trace: 'on-first-retry',
        // Avoid recording successful first attempts in CI; keep PLAYWRIGHT_VIDEO as an explicit override.
        video: videoMode || (process.env.CI ? 'on-first-retry' : 'retain-on-failure'),
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
