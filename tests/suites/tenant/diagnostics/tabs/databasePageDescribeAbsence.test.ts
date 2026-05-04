import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {VISIBILITY_TIMEOUT} from '../../constants';

test.describe('Database page in v2 navigation - no /describe calls', () => {
    test.beforeEach(async ({page}) => {
        await page.addInitScript(() => {
            localStorage.setItem('enableTenantNavigationV2', JSON.stringify(true));
        });
    });

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

        // Click through every visible tab and wait for triggered requests to finish
        for (let i = 0; i < tabCount; i++) {
            const tab = tabLinks.nth(i);
            await tab.click();
            await page.waitForLoadState('networkidle', {timeout: VISIBILITY_TIMEOUT});
        }

        expect(
            describeCalls,
            `/describe should not be called on the Database page, but was called ${describeCalls.length} time(s): ${describeCalls.join(', ')}`,
        ).toHaveLength(0);
    });
});
