import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {
    Diagnostics,
    TopShardsHistoricalColumns,
    TopShardsImmediateColumns,
    TopShardsMode,
} from '../Diagnostics';
import {setupTopShardsHistoryMock} from '../mocks';

test.describe('Diagnostics TopShards tab', async () => {
    test('TopShards tab defaults to Immediate mode', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topShards',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify Immediate mode is selected by default
        expect(await diagnostics.getSelectedTableMode()).toBe(TopShardsMode.Immediate);
    });

    test('TopShards immediate tab shows all expected column headers', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topShards',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify table has data
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await expect(diagnostics.table.getRowCount()).resolves.toBeGreaterThan(0);
        // Verify column headers exist
        await diagnostics.table.verifyHeaders(TopShardsImmediateColumns);
    });

    test('TopShards history tab shows all expected column headers', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topShards',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.selectTopShardsMode(TopShardsMode.Historical);
        // Verify table has data
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await expect(diagnostics.table.getRowCount()).resolves.toBeGreaterThan(0);

        // Verify column headers exist
        await diagnostics.table.verifyHeaders(TopShardsHistoricalColumns);
    });

    test('TopShards tab first row has values for all columns in Immediate mode', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topShards',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify table has data
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await expect(diagnostics.table.getRowCount()).resolves.toBeGreaterThan(0);

        // Verify first row has non-empty values for all columns
        for (const column of TopShardsImmediateColumns) {
            const columnValue = await diagnostics.table.getCellValueByHeader(1, column);
            expect(columnValue.trim()).toBeTruthy();
        }
    });

    test('TopShards tab first row has values for all columns in History mode', async ({page}) => {
        // Setup mock for TopShards tab in History mode
        await setupTopShardsHistoryMock(page);

        // Now navigate to diagnostics page to check topShards
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topShards',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.selectTopShardsMode(TopShardsMode.Historical);

        // Verify table has data
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await expect(diagnostics.table.getRowCount()).resolves.toBeGreaterThan(0);

        // Verify first row has non-empty values for all columns
        for (const column of TopShardsHistoricalColumns) {
            const columnValue = await diagnostics.table.getCellValueByHeader(1, column);
            expect(columnValue.trim()).toBeTruthy();
        }
    });

    test('TopShards tab can switch back to Immediate mode from Historical mode', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topShards',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Switch to Historical mode
        await diagnostics.selectTopShardsMode(TopShardsMode.Historical);
        expect(await diagnostics.getSelectedTableMode()).toBe(TopShardsMode.Historical);

        // Switch back to Immediate mode
        await diagnostics.selectTopShardsMode(TopShardsMode.Immediate);
        expect(await diagnostics.getSelectedTableMode()).toBe(TopShardsMode.Immediate);

        // Verify table still has data after switching back
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await expect(diagnostics.table.getRowCount()).resolves.toBeGreaterThan(0);
    });
});
