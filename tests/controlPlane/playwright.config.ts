import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: 'controlPlane.spec.ts',
    workers: 1,
    retries: 0,
    timeout: 30000,
    reporter: [['line']],
    outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || '../../playwright-artifacts/control-plane',
    use: {
        baseURL: 'http://127.0.0.1:3108',
        testIdAttribute: 'data-qa',
        screenshot: 'only-on-failure',
    },
    projects: [
        {name: 'chromium', use: {...devices['Desktop Chrome']}},
        {name: 'safari', use: {...devices['Desktop Safari']}},
    ],
    webServer: {
        command:
            'npm run start -- --config tests/controlPlane/rsbuild.config.ts --port 3108 --host 127.0.0.1',
        cwd: '../..',
        url: 'http://127.0.0.1:3108',
        reuseExistingServer: false,
        env: {
            META_YDB_BACKEND: 'undefined',
            REACT_APP_BACKEND: '',
            REACT_APP_META_BACKEND: '/mock-meta',
        },
    },
    // No globalSetup, backend warmup, Docker or installation. Every API call is intercepted.
});
