import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

test.describe('Diagnostics Storage tab', async () => {
    test('Storage tab shows Groups and Nodes views', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Storage);

        // Check Groups view
        await diagnostics.storage.selectEntityType('Groups');
        await expect(diagnostics.storage.table).toBeVisible();

        // Check Nodes view
        await diagnostics.storage.selectEntityType('Nodes');
        await expect(diagnostics.storage.table).toBeVisible();
    });
});
