import {expect, test} from '@playwright/test';

import {database, dsVslotsSchema} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

test.describe('Diagnostics Schema tab', async () => {
    test('Primary keys header is visible in Schema tab', async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const objectSummary = new Diagnostics(page);

        await objectSummary.clickTab(DiagnosticsTab.Schema);
        await expect(objectSummary.isSchemaViewerVisible()).resolves.toBe(true);

        await expect(objectSummary.getPrimaryKeys()).resolves.toEqual([
            'NodeId',
            'PDiskId',
            'VSlotId',
        ]);
    });
});
