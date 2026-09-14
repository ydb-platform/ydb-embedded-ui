import {expect, test} from '@playwright/test';

import {TenantsPage} from './TenantsPage';

test.describe('Test Tenants page', async () => {
    test('pool popup belongs to the main database list scroll container', async ({page}) => {
        await page.route('**/viewer/json/tenantinfo?*', (route) =>
            route.fulfill({
                json: {
                    TenantInfo: Array.from({length: 40}, (_, index) => ({
                        Name: `/Root/popup-${index}`,
                        Type: 'Dedicated',
                        State: 'Running',
                        PoolStats: [{Name: 'System', Usage: 0.5, Threads: 4}],
                    })),
                },
            }),
        );
        await page.setViewportSize({width: 1500, height: 600});
        const tenantsPage = new TenantsPage(page);
        await tenantsPage.goto();
        const row = tenantsPage.table.getByRole('row').filter({hasText: '/Root/popup-0'});
        await row.locator('.ydb-pool-bar').hover();
        const popup = page.locator('.ydb-pool-bar__popup-content');
        await expect(popup).toBeVisible();
        expect(await popup.evaluate((element) => Boolean(element.closest('.ydb-cluster')))).toBe(
            true,
        );
        await expect(popup).toHaveCSS('max-height', 'none');
        await expect(popup).toHaveCSS('overflow-y', 'visible');
        const scroll = page.locator('.ydb-cluster');
        const before = await scroll.evaluate((element) => element.scrollTop);
        await popup.hover();
        await page.mouse.wheel(0, 200);
        await expect
            .poll(() => scroll.evaluate((element) => element.scrollTop))
            .toBeGreaterThan(before);
    });

    test('Tenants page is OK', async ({page}) => {
        const tenantsPage = new TenantsPage(page);
        const response = await tenantsPage.goto();
        expect(response?.ok()).toBe(true);
    });

    test('Tenants page has tenants table', async ({page}) => {
        const tenantsPage = new TenantsPage(page);

        // Get table with all tenants
        await tenantsPage.goto();

        // Check if table is present
        await expect(tenantsPage.table).toBeVisible();
    });
});
