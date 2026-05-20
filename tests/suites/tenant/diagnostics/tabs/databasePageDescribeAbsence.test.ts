import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {VISIBILITY_TIMEOUT} from '../../constants';

test.describe('Database page in v2 navigation - no /describe calls', () => {
    test.beforeEach(async ({page}) => {
        await page.addInitScript(() => {
            localStorage.setItem('enableTenantNavigationV2', JSON.stringify(true));
            // Dismiss the "Navigation is here now" alert popover so it doesn't block interactions
            localStorage.setItem('isV2NavigationAlertSeen', JSON.stringify(true));
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

        // Collect all tab hrefs before navigating.
        // Assert every tab link has an href so no tab is silently skipped.
        const tabHrefs: string[] = [];
        for (let i = 0; i < tabCount; i++) {
            const href = await tabLinks.nth(i).getAttribute('href');
            expect(
                href,
                `Tab ${i} (a[data-tab]) has no href — it would be silently skipped`,
            ).toBeTruthy();
            if (href) {
                tabHrefs.push(href);
            }
        }

        // Navigate to each tab URL directly instead of clicking.
        // Clicking tabs + waiting for networkidle is unreliable in a live backend
        // (the app polls continuously, so networkidle never settles), which causes
        // the test to consume its full timeout on every tab and eventually stall CI.
        // Direct goto() waits for the page load event which is sufficient to capture
        // any /describe requests triggered during component mount.
        for (const href of tabHrefs) {
            await page.goto(href);
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
