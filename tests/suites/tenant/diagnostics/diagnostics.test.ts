import {expect, test} from '@playwright/test';

import {dsVslotsSchema, tenantName} from '../../../utils/constants';
import {NavigationTabs, TenantPage} from '../TenantPage';
import {longRunningQuery} from '../constants';
import {QueryEditor} from '../queryEditor/models/QueryEditor';

import {Diagnostics, DiagnosticsTab, QueriesSwitch} from './Diagnostics';

test.describe('Diagnostics tab', async () => {
    test('Primary keys header is visible in Schema tab', async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database: tenantName,
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

    test('No runnning queries in Queries if no queries are running', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Queries);
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        await diagnostics.table.hasNoData();
    });

    test('Running query is shown if query is running', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(500);
        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Running');
        await tenantPage.selectNavigationTab(NavigationTabs.Diagnostics);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Queries);
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        expect(
            await diagnostics.table.waitForCellValueByHeader(1, 'Query text', longRunningQuery),
        ).toBe(true);
    });
});
