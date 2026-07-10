import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {VISIBILITY_TIMEOUT} from '../../constants';

test.describe('Database page in v2 navigation - no /describe calls', () => {
    test('/describe is not called when navigating through Database page tabs', async ({page}) => {
        const describeCalls: string[] = [];

        page.on('request', (request) => {
            if (request.url().includes('/viewer/json/describe')) {
                describeCalls.push(request.url());
            }
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            databasePage: 'database',
        });

        await tenantPage.isDiagnosticsVisible();

        // Find all tab links rendered on the Database page
        const tabsContainer = page.locator('.ydb-database-diagnostics-tabs__tabs');
        await tabsContainer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        const tabLinks = tabsContainer.locator('a[data-tab]');
        const tabCount = await tabLinks.count();

        // Ensure at least one tab is visible so the test is not vacuously true
        expect(tabCount).toBeGreaterThan(0);

        // Collect all tab ids/hrefs before navigating.
        // Assert every tab link has an href so no tab is silently skipped.
        const tabIds: string[] = [];
        for (let i = 0; i < tabCount; i++) {
            const tab = tabLinks.nth(i);
            const href = await tab.getAttribute('href');
            const tabId = await tab.getAttribute('data-tab');
            expect(
                href,
                `Tab ${i} (a[data-tab]) has no href — it would be silently skipped`,
            ).toBeTruthy();
            expect(tabId, `Tab ${i} (a[data-tab]) has no data-tab`).toBeTruthy();
            if (tabId) {
                tabIds.push(tabId);
            }
        }

        // Click tabs as a user would, but wait only for URL/content stabilization.
        // Waiting for networkidle is unreliable in a live backend because the app polls
        // continuously; direct page.goto() can race with URL normalization in Safari.
        for (const tabId of tabIds) {
            await tabsContainer.locator(`a[data-tab="${tabId}"]`).click();
            await expect(page).toHaveURL(new RegExp(`diagnosticsTab=${tabId}`));
            await tenantPage.isDiagnosticsVisible();
        }

        // Give deferred effects on the last tab a moment to fire before asserting.
        await page.waitForTimeout(500);

        expect(
            describeCalls,
            `/describe should not be called on the Database page, but was called ${describeCalls.length} time(s): ${describeCalls.join(', ')}`,
        ).toHaveLength(0);
    });
});
