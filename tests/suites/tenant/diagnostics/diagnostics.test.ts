import {expect, test} from '@playwright/test';

import {dsVslotsSchema, tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {Diagnostics, DiagnosticsTab} from './Diagnostics';

test.describe('Diagnostics tab', async () => {
    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            name: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Primary keys header is visible in Scheme tab', async ({page}) => {
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
