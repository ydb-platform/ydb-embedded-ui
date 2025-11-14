import {expect, test} from '@playwright/test';

import {TenantsPage} from './TenantsPage';

test.describe('Test Tenants page', async () => {
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
