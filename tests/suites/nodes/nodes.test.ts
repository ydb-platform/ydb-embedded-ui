import {expect, test} from '@playwright/test';

import {backend} from '../../utils/constants';
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

    test('Table groups displayed correctly if group by option is selected', async ({page}) => {
        const nodesPage = new NodesPage(page);
        const nodesTable = new PaginatedTable(page);

        await nodesTable.waitForTableToLoad();
        await nodesTable.waitForTableData();

        const rowData = await nodesTable.getRowData(0);
        const host = rowData['Host'];

        await nodesPage.selectGroupByOption('Host');
        await nodesPage.waitForTableGroupsLoaded();

        await nodesPage.selectTableGroup(host).isVisible();

        await nodesPage.expandTableGroup(host);
        await nodesPage.selectTableGroupContent(host).isVisible();
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
        expect(rowData).toHaveProperty('Detailed Memory');
        expect(rowData).toHaveProperty('Pools');
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

    test('Table displays empty data message when no entities', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        await paginatedTable.search('Some Invalid search string !%#@[]');

        await paginatedTable.waitForTableData();

        const emptyDataMessage = await paginatedTable.getEmptyDataMessageLocator();
        await expect(emptyDataMessage).toContainText('No such nodes');
    });

    test('Autorefresh updates data when initially empty data', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        const emptyRequest = page.route(`${backend}/viewer/json/nodes?*`, async (route) => {
            await route.fulfill({json: {FoundNodes: 0, TotalNodes: 0, Nodes: []}});
        });
        await paginatedTable.clickRefreshButton();

        await emptyRequest;

        const emptyDataMessage = await paginatedTable.getEmptyDataMessageLocator();
        await expect(emptyDataMessage).toContainText('No such nodes');

        await paginatedTable.setRefreshInterval('15 sec');

        const requestWithData = page.route(`${backend}/viewer/json/nodes?*`, async (route) => {
            await route.continue();
        });

        await page.waitForTimeout(15_000); // Wait for autorefresh

        await requestWithData;
        await paginatedTable.waitForTableData();

        await expect(emptyDataMessage).toBeHidden();

        const hostValues = await paginatedTable.getColumnValues('Host');
        expect(hostValues.length).toBeGreaterThan(0);
    });
});
