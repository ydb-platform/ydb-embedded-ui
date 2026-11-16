import {defineConfig, devices} from '@playwright/test';

// Actual SQL Editor and settings persistence with mocked HTTP APIs; no database is required.
export default defineConfig({
    testDir: '.',
    testMatch: 'querySettings.spec.ts',
    workers: 1,
    retries: 0,
    timeout: 30000,
    reporter: [['line']],
    outputDir: '../../playwright-artifacts/query-settings',
    use: {
        baseURL: 'http://127.0.0.1:3109',
        testIdAttribute: 'data-qa',
        screenshot: 'only-on-failure',
    },
    projects: [
        {name: 'chromium', use: {...devices['Desktop Chrome']}},
        {name: 'safari', use: {...devices['Desktop Safari']}},
    ],
    webServer: {
        command:
            'npm run start -- --config tests/querySettings/rsbuild.config.ts --port 3109 --host 127.0.0.1',
        cwd: '../..',
        url: 'http://127.0.0.1:3109',
        reuseExistingServer: false,
        timeout: 120000,
        env: {
            REACT_APP_BACKEND: 'http://127.0.0.1:3109',
            REACT_APP_META_BACKEND: 'undefined',
            META_YDB_BACKEND: 'undefined',
            REACT_APP_DISABLE_CHECKS: 'true',
        },
    },
});
