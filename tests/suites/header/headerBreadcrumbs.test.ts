import {expect, test} from '@playwright/test';

import {database} from '../../utils/constants';
import {TenantPage} from '../tenant/TenantPage';

const pageQueryParams = {
    schema: database,
    database,
    databasePage: 'diagnostics',
};

test.describe('Header breadcrumbs', () => {
    test('Database page breadcrumbs match visual baseline', async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
        await expect(await tenantPage.isDiagnosticsVisible()).toBeTruthy();

        const breadcrumbs = page.locator('.header__breadcrumbs');
        await expect(breadcrumbs).toBeVisible();
        await expect(breadcrumbs).toHaveScreenshot('database-page-breadcrumbs.png');
    });
});
