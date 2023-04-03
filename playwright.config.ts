import {PlaywrightTestConfig, devices} from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;

const config: PlaywrightTestConfig = {
    testDir: 'tests/suites',
    timeout: 2 * 60 * 1000,
    // If there is no url provided, playwright starts webServer with the app in dev mode
    webServer: baseUrl
        ? undefined
        : {
              command: 'npm run dev',
              port: 3000,
          },
    use: {
        baseURL: baseUrl || 'http://localhost:3000/',
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
    ],
};

export default config;
