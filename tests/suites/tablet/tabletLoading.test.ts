import {expect, test} from '@playwright/test';

import {TabletPage} from './TabletPage';
import {setupTabletDevUiMocks} from './tabletDevUiMocks';

test('keeps the tablet loader centered', async ({page, baseURL}) => {
    await setupTabletDevUiMocks(page, {}, baseURL);
    // Keep the tablet request pending until the page closes.
    await page.route('**/viewer/json/tabletinfo*', () => undefined);

    const tablet = new TabletPage(page);
    await tablet.goto();

    const tabletPage = page.locator('.ydb-tablet-page');
    await expect(tabletPage.locator('.g-loader')).toBeVisible();
    await expect(tabletPage).toHaveScreenshot('tablet-loading.png', {maxDiffPixelRatio: 0});
});
