import {expect, test} from '@playwright/test';

import {backend} from '../../utils/constants';
import {NodePage} from '../nodes/NodePage';
import {NodesPage} from '../nodes/NodesPage';
import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

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
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const rowCount = await paginatedTable.getRowCount();
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Search by hostname filters the table', async ({page}) => {
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialRowCount = await paginatedTable.getRowCount();
        await paginatedTable.getControls().search('localhost');

        await page.waitForTimeout(1000); // Wait for the table to update

        const filteredRowCount = await paginatedTable.getRowCount();
        expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
    });

    test('Table groups displayed correctly if group by option is selected', async ({page}) => {
        const nodesPage = new NodesPage(page);
        const nodesTable = new ClusterNodesTable(page);

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
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const nodeCount = await paginatedTable.getControls().getCount();
        const rowCount = await paginatedTable.getRowCount();

        expect(nodeCount).toBe(rowCount);
    });

    test('Uptime values are displayed in correct format', async ({page}) => {
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const uptimeValues = await paginatedTable.getColumnValues('Uptime');

        for (const uptime of uptimeValues) {
            // \d+d\xa0\d{2}:\d{2}:\d{2} - DDd HH:MM:SS, 1d 00:20:30
            // \d{1,2}:\d{2}:\d{2}$ - HH:MM:SS, 1:02:02 or 12:02:02
            // \d{1,2}:\d{2}$ - MM:SS, 1:02 or 12:02
            // \d{1,2}s$ - SSs, 1s or 12s
            expect(uptime).toMatch(
                /^(\d+d\xa0\d{2}:\d{2}:\d{2}|\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2}|\d{1,2}s)$/,
            );
        }
    });

    test('Refresh button updates the table data', async ({page}) => {
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialUptimeValues = await paginatedTable.getColumnValues('Uptime');
        await page.waitForTimeout(2000); // Wait for some time to pass
        await paginatedTable.getControls().clickRefreshButton();
        await paginatedTable.waitForTableData();

        const updatedUptimeValues = await paginatedTable.getColumnValues('Uptime');
        expect(updatedUptimeValues).not.toEqual(initialUptimeValues);
    });

    test('Row data can be retrieved correctly', async ({page}) => {
        const nodesTable = new ClusterNodesTable(page);

        await nodesTable.waitForTableToLoad();
        await nodesTable.waitForTableData();

        const rowData = await nodesTable.getRowData(0);

        expect(rowData).toHaveProperty('Host');
        expect(rowData).toHaveProperty('Uptime');
        expect(rowData).toHaveProperty('CPU');
        expect(rowData).toHaveProperty('RAM');
        expect(rowData).toHaveProperty('Version');
        expect(rowData).toHaveProperty('Tablets');
    });

    test('Column values can be retrieved correctly', async ({page}) => {
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const hostValues = await paginatedTable.getColumnValues('Host');
        const uptimeValues = await paginatedTable.getColumnValues('Uptime');

        expect(hostValues.length).toBeGreaterThan(0);
        expect(uptimeValues.length).toBeGreaterThan(0);
        expect(hostValues.length).toBe(uptimeValues.length);
    });

    test('Table displays empty data message when no entities', async ({page}) => {
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        await paginatedTable.getControls().search('Some Invalid search string !%#@[]');

        await paginatedTable.waitForTableData();

        const emptyDataMessage = await paginatedTable.getEmptyDataMessageLocator();
        await expect(emptyDataMessage).toContainText('No such nodes');
    });

    test('Autorefresh updates data when initially empty data', async ({page}) => {
        const paginatedTable = new ClusterNodesTable(page);

        const emptyRequest = page.route(`${backend}/viewer/json/nodes?*`, async (route) => {
            await route.fulfill({json: {FoundNodes: 0, TotalNodes: 0, Nodes: []}});
        });
        await paginatedTable.getControls().clickRefreshButton();

        await emptyRequest;

        const emptyDataMessage = await paginatedTable.getEmptyDataMessageLocator();
        await expect(emptyDataMessage).toContainText('No such nodes');

        await paginatedTable.getControls().setRefreshInterval('15 sec');

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

test.describe('Test Node Page Threads Tab', async () => {
    test('Threads tab is hidden when node has no thread data', async ({page}) => {
        // Mock the node API to return no thread data
        await page.route(`${backend}/viewer/json/sysinfo?*`, async (route) => {
            await route.fulfill({
                json: {
                    SystemStateInfo: [
                        {
                            Host: 'localhost',
                            NodeId: 1,
                            SystemState: 1, // Green
                            Version: 'test-version',
                        },
                    ],
                    // No Threads property
                },
            });
        });

        // Navigate directly to node page
        const nodePage = new NodePage(page, '1');
        await nodePage.goto();
        await nodePage.waitForNodePageLoad();

        // Verify threads tab is not visible
        const isThreadsTabVisible = await nodePage.isThreadsTabVisible();
        expect(isThreadsTabVisible).toBe(false);

        // Verify other tabs are still visible
        const tabNames = await nodePage.getAllTabNames();
        expect(tabNames).toContain('Tablets');
        expect(tabNames).not.toContain('Threads');
    });

    test('Threads tab is visible when node has thread data', async ({page}) => {
        // Mock the node API to return thread data
        await page.route(`${backend}/viewer/json/sysinfo?*`, async (route) => {
            await route.fulfill({
                json: {
                    SystemStateInfo: [
                        {
                            Host: 'localhost',
                            NodeId: 1,
                            SystemState: 1, // Green
                            Version: 'test-version',
                        },
                    ],
                    Threads: [
                        {
                            Name: 'TestPool',
                            Threads: 4,
                        },
                    ],
                },
            });
        });

        // Navigate directly to node page
        const nodePage = new NodePage(page, '1');
        await nodePage.goto();
        await nodePage.waitForNodePageLoad();

        // Verify threads tab is visible
        const isThreadsTabVisible = await nodePage.isThreadsTabVisible();
        expect(isThreadsTabVisible).toBe(true);

        // Verify can click on threads tab
        await nodePage.clickThreadsTab();
        await page.waitForURL(/\/node\/\d+\/threads/);

        // Verify other tabs are also visible
        const tabNames = await nodePage.getAllTabNames();
        expect(tabNames).toContain('Tablets');
        expect(tabNames).toContain('Threads');
    });

    test('Threads tab is hidden when node has empty thread array', async ({page}) => {
        // Mock the node API to return empty thread data
        await page.route(`${backend}/viewer/json/sysinfo?*`, async (route) => {
            await route.fulfill({
                json: {
                    SystemStateInfo: [
                        {
                            Host: 'localhost',
                            NodeId: 1,
                            SystemState: 1, // Green
                            Version: 'test-version',
                        },
                    ],
                    Threads: [], // Empty array
                },
            });
        });

        // Navigate directly to node page
        const nodePage = new NodePage(page, '1');
        await nodePage.goto();
        await nodePage.waitForNodePageLoad();

        // Verify threads tab is not visible
        const isThreadsTabVisible = await nodePage.isThreadsTabVisible();
        expect(isThreadsTabVisible).toBe(false);

        // Verify other tabs are still visible
        const tabNames = await nodePage.getAllTabNames();
        expect(tabNames).toContain('Tablets');
        expect(tabNames).not.toContain('Threads');
    });
});
