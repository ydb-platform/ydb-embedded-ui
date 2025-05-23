import {chromium} from '@playwright/test';

import config from '../playwright.config';

import {PageModel} from './models/PageModel';

async function warmupApplication(appPage: PageModel) {
    const maxRetries = 5;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            await appPage.goto();
            await appPage.page.waitForLoadState('networkidle');
            await appPage.page.waitForTimeout(retryDelay);
        } catch {
            if (i === maxRetries - 1) {
                throw new Error('Application warmup failed after max retries');
            }
        }
    }
}

export default async function globalSetup() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const appPage = new PageModel(page, config.use?.baseURL);
    await warmupApplication(appPage);
    await browser.close();
}
