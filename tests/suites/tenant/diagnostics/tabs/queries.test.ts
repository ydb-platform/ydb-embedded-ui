import {expect, test} from '@playwright/test';

import {prepareQueryWithPragmas} from '../../../../../src/store/reducers/query/utils';
import {defaultPragma} from '../../../../../src/utils/query';
import {database} from '../../../../utils/constants';
import {NavigationTabs, TenantPage} from '../../TenantPage';
import {longRunningStreamQuery} from '../../constants';
import {QueryEditor} from '../../queryEditor/models/QueryEditor';
import {
    Diagnostics,
    DiagnosticsTab,
    QUERY_COLUMNS_IDS,
    QueriesSwitch,
    QueryPeriod,
    QueryTopColumns,
} from '../Diagnostics';
import {setupTopQueriesMock} from '../mocks';

test.describe('Diagnostics Queries tab', async () => {
    test('No runnning queries in Queries if no queries are running', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
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
            schema: database,
            database,
            tenantPage: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(500);
        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Running');
        await tenantPage.selectNavigationTab(NavigationTabs.Diagnostics);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Queries);
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        const finalQueryText = prepareQueryWithPragmas(longRunningStreamQuery, defaultPragma);
        expect(
            await diagnostics.table.waitForCellValueByHeader(1, 'Query text', finalQueryText),
        ).toBe(true);
    });

    test('Query tab defaults to Top mode', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
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
            schema: database,
            database,
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
        // First, run some CPU-intensive queries to generate data
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const queryEditor = new QueryEditor(page);

        // Run CPU-intensive stream query
        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();

        // Wait for the query to complete
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        // Give some time for the queries to be recorded in the system
        await page.waitForTimeout(2000);

        // Now navigate to diagnostics to check Top queries
        await tenantPage.selectNavigationTab(NavigationTabs.Diagnostics);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Queries);

        // Ensure we're in Top mode (should be default)
        const radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Top);

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
            schema: database,
            database,
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
            schema: database,
            database,
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

    test('Top Query rows components have consistent height across different query lengths', async ({
        page,
    }) => {
        // Setup mock with 100 rows for scrolling test
        await setupTopQueriesMock(page);

        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Check that FixedHeightQuery components have the expected fixed height
        const rowCount = await diagnostics.table.getRowCount();

        if (rowCount > 1) {
            // Check that all FixedHeightQuery components have the same height
            const heights = [];
            for (let i = 0; i < Math.min(rowCount, 5); i++) {
                const height = await diagnostics.getFixedHeightQueryElementHeight(i);
                heights.push(height);
            }

            // All heights should be the same (88px for 4 lines)
            const firstHeight = heights[0];

            for (const height of heights) {
                expect(height).toBe(firstHeight);
            }
        }
    });

    test('Scroll to row, get shareable link, navigate to URL and verify row is scrolled into view', async ({
        page,
        context,
        browserName,
    }) => {
        // Skip this test in Safari due to clipboard permission issues
        test.skip(browserName === 'webkit', 'Clipboard API not fully supported in Safari');
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read']);

        // Setup mock with 100 rows for scrolling test
        await setupTopQueriesMock(page);

        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Get the number of rows and select a row that requires scrolling (should be 100 from mock)
        const rowCount = await diagnostics.table.getRowCount();
        expect(rowCount).toBe(9); // Verify we have the expected 100 rows from mock

        // Target a row further down that requires scrolling
        const targetRowIndex = 8;

        // Click on the target row to open the drawer
        await diagnostics.table.clickRow(targetRowIndex);

        // Wait for drawer to open
        await page.waitForTimeout(500);

        // Find and click the copy link button in the drawer
        await expect(diagnostics.isCopyLinkButtonVisible()).resolves.toBe(true);
        await diagnostics.clickCopyLinkButton();

        // Get the copied URL from clipboard
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toBeTruthy();
        expect(clipboardText).toContain('/tenant');

        // Navigate to the copied URL
        await page.goto(clipboardText);
        await page.waitForTimeout(1000);

        const firstVisibleRowIndex = 4;
        // Verify the row is highlighted/selected (if applicable)
        await page.waitForTimeout(1000);

        const hasActiveClass = await diagnostics.isRowActive(firstVisibleRowIndex);

        expect(hasActiveClass).toBe(true);
    });
});
