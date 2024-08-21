import {expect, test} from '@playwright/test';

import {dsVslotsSchema, dsVslotsTableName, tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {QueryEditor} from '../queryEditor/QueryEditor';

import {ObjectSummary} from './ObjectSummary';

test.describe('Object Summary', async () => {
    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            name: tenantName,
            general: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Open Preview icon appears on hover for "test" tree item', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        await expect(objectSummary.isTreeVisible()).resolves.toBe(true);

        const isPreviewIconVisible =
            await objectSummary.isOpenPreviewIconVisibleOnHover(dsVslotsTableName);
        expect(isPreviewIconVisible).toBe(true);
    });

    test('On Open Preview icon click table with results appear', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await expect(objectSummary.isTreeVisible()).resolves.toBe(true);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);

        await objectSummary.clickPreviewButton(dsVslotsTableName);
        await expect(queryEditor.resultTable.isPreviewVisible()).resolves.toBe(true);
    });

    test('Preview table is still present after settings dialog was opened', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        await objectSummary.clickPreviewButton(dsVslotsTableName);
        await queryEditor.clickGearButton();
        await queryEditor.closeSettingsDialog();

        await expect(queryEditor.resultTable.isPreviewVisible()).resolves.toBe(true);
    });
});
