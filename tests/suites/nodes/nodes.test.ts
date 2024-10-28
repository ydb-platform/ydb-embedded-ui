import {expect, test} from '@playwright/test';

import {NodesPage} from '../nodes/NodesPage';
import {PaginatedTable} from '../paginatedTable/paginatedTable';

test.describe('Test Nodes page', async () => {
    test('Nodes page is OK', async ({page}) => {
        const nodesPage = new NodesPage(page);
        const response = await nodesPage.goto();
        expect(response?.ok()).toBe(true);
    });

    test('Nodes page has nodes table', async ({page}) => {
        const nodesPage = new NodesPage(page);

        // Get table with all nodes
        await nodesPage.goto({problemFilter: 'All'});

        // Check if table is present
        await expect(nodesPage.table).toBeVisible();
    });
});

test.describe('Test Nodes Paginated Table', async () => {
    test.beforeEach(async ({page}) => {
        const nodesPage = new NodesPage(page);
        const response = await nodesPage.goto();
        expect(response?.ok()).toBe(true);

        // Wil be removed since it's an experiment
        await page.evaluate(() => {
            localStorage.setItem('useBackendParamsForTables', 'true');
            location.reload();
        });

        await page.waitForLoadState('networkidle');
    });

    test('Table loads and displays data', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const rowCount = await paginatedTable.getRowCount();
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Search by hostname filters the table', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialRowCount = await paginatedTable.getRowCount();
        await paginatedTable.search('localhost');

        await page.waitForTimeout(1000); // Wait for the table to update

        const filteredRowCount = await paginatedTable.getRowCount();
        expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
    });

    test('Radio button selection changes displayed data', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialRowCount = await paginatedTable.getRowCount();
        await paginatedTable.selectRadioOption(0, 'With problems');

        await page.waitForTimeout(1000); // Wait for the table to update

        const filteredRowCount = await paginatedTable.getRowCount();
        expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
    });

    test('Node count is displayed correctly', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const nodeCount = await paginatedTable.getCount();
        const rowCount = await paginatedTable.getRowCount();

        expect(nodeCount).toBe(rowCount);
    });

    test('Uptime values are displayed in correct format', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const uptimeValues = await paginatedTable.getColumnValues('Uptime');

        for (const uptime of uptimeValues) {
            expect(uptime).toMatch(/^(\d+d\s)?(\d+):(\d{2}):(\d{2})$/); // Format: DDd? HH:MM:SS
        }
    });

    test('Refresh button updates the table data', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialUptimeValues = await paginatedTable.getColumnValues('Uptime');
        await page.waitForTimeout(2000); // Wait for some time to pass
        await paginatedTable.clickRefreshButton();
        await paginatedTable.waitForTableData();

        const updatedUptimeValues = await paginatedTable.getColumnValues('Uptime');
        expect(updatedUptimeValues).not.toEqual(initialUptimeValues);
    });

    test('Row data can be retrieved correctly', async ({page}) => {
        const storageTable = new PaginatedTable(page);

        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const rowData = await storageTable.getRowData(0);

        expect(rowData).toHaveProperty('Host');
        expect(rowData).toHaveProperty('Uptime');
        expect(rowData).toHaveProperty('Memory');
        expect(rowData).toHaveProperty('CPU');
    });

    test('Column values can be retrieved correctly', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const hostValues = await paginatedTable.getColumnValues('Host');
        const uptimeValues = await paginatedTable.getColumnValues('Uptime');

        expect(hostValues.length).toBeGreaterThan(0);
        expect(uptimeValues.length).toBeGreaterThan(0);
        expect(hostValues.length).toBe(uptimeValues.length);
    });
});
