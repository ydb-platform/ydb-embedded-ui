import {chromium} from '@playwright/test';

import {PageModel} from '../tests/models/PageModel';

async function warmupApplication(page: PageModel) {
    const maxRetries = 5;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
        try {
            await page.goto();
            await page.page.waitForLoadState('networkidle');
            await page.page.waitForTimeout(retryDelay);
        } catch (error) {
            if (i === maxRetries - 1) {
                throw new Error('Application warmup failed after max retries');
            }
        }
    }
}

export default async function globalSetup() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const appPage = new PageModel(page);
    await warmupApplication(appPage);
    await browser.close();
}
