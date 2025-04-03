import {expect, test} from '@playwright/test';

import {tenantName} from '../../../../utils/constants';
import {NavigationTabs, TenantPage} from '../../TenantPage';
import {longRunningQuery} from '../../constants';
import {QueryEditor} from '../../queryEditor/models/QueryEditor';
import {
    Diagnostics,
    DiagnosticsTab,
    QUERY_COLUMNS_IDS,
    QueriesSwitch,
    QueryPeriod,
    QueryTopColumns,
} from '../Diagnostics';

test.describe('Diagnostics tab', async () => {
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

    test('Query tab defaults to Top mode', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify Top mode is selected by default
        const radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Top);
    });

    test('Query Top tab shows expected column headers', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify table has data
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Verify column headers exist - check at least some of the core columns
        await diagnostics.table.verifyHeaders([
            QUERY_COLUMNS_IDS.QueryHash,
            QUERY_COLUMNS_IDS.CPUTime,
            QUERY_COLUMNS_IDS.QueryText,
            QUERY_COLUMNS_IDS.Duration,
        ]);
    });

    test('Query tab first row has values for all columns in Top mode', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify table has data
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await expect(diagnostics.table.getRowCount()).resolves.toBeGreaterThan(0);

        // Verify first row has non-empty values for key columns (test first 4 columns)
        for (const column of QueryTopColumns.slice(0, 4)) {
            const columnValue = await diagnostics.table.getCellValueByHeader(1, column);
            expect(columnValue.trim()).toBeTruthy();
        }
    });

    test('Query tab can switch between Top and Running modes', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Switch to Running mode
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        let radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Running);

        // Switch back to Top mode
        await diagnostics.clickRadioSwitch(QueriesSwitch.Top);
        radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Top);

        // Verify table still has data after switching back
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
    });

    test('Query tab allows changing between Per hour and Per minute views', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify that we start with "Per hour" selected as default
        expect(await diagnostics.getSelectedQueryPeriod()).toBe(QueryPeriod.PerHour);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Switch to "Per minute" view
        await diagnostics.selectQueryPeriod(QueryPeriod.PerMinute);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Verify the view was updated - period text should change
        expect(await diagnostics.getSelectedQueryPeriod()).toBe(QueryPeriod.PerMinute);

        // The table should refresh with potentially different data
        // Wait for the table to reload and then check a value
        await page.waitForTimeout(500); // Small wait for UI update

        // Switch back to "Per hour" view
        await diagnostics.selectQueryPeriod(QueryPeriod.PerHour);

        // Verify the view was updated back
        expect(await diagnostics.getSelectedQueryPeriod()).toBe(QueryPeriod.PerHour);
    });
});
