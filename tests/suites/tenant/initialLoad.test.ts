import {expect, test} from '@playwright/test';

import {backend, database} from '../../utils/constants';

import {TenantPage} from './TenantPage';

const pageQueryParams = {
    schema: database,
    database,
    tenantPage: 'diagnostics',
};

test.describe('Tenant initial load', () => {
    test('Tenant diagnostics page is visible', async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        await expect(await tenantPage.isDiagnosticsVisible()).toBeTruthy();
    });

    test('Tenant diagnostics page is visible when describe returns no data', async ({page}) => {
        await page.route(`${backend}/viewer/json/describe?*`, async (route) => {
            await route.fulfill({json: ''});
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        await expect(await tenantPage.isDiagnosticsVisible()).toBeTruthy();
    });

    test('Tenant page shows error message when describe returns 401', async ({page}) => {
        await page.route(`${backend}/viewer/json/describe?*`, async (route) => {
            await route.fulfill({status: 401});
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        await expect(await tenantPage.isEmptyStateVisible()).toBeTruthy();
        await expect(await tenantPage.getEmptyStateTitle()).toBe('Access denied');
    });

    test('Tenant page shows error message when describe returns 403', async ({page}) => {
        await page.route(`${backend}/viewer/json/describe?*`, async (route) => {
            await route.fulfill({status: 403});
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        await expect(await tenantPage.isEmptyStateVisible()).toBeTruthy();
        await expect(await tenantPage.getEmptyStateTitle()).toBe('Access denied');
    });
});
