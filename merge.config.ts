import type {PlaywrightTestConfig} from '@playwright/test';

const config: PlaywrightTestConfig = {
    reporter: [
        ['html', {outputFolder: './playwright-artifacts/playwright-report'}],
        ['json', {outputFile: './playwright-artifacts/test-results.json'}],
    ],
};

export default config;
