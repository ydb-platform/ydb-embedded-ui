import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {backend} from '../../utils/constants';
import {NodePage} from '../nodes/NodePage';
import {NodesPage} from '../nodes/NodesPage';
import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

const THREADS_TEST_DATABASE = '/Root/db';
const TEST_THREAD_POOL = [
    {
        Name: 'TestPool',
        Threads: 4,
    },
];

async function setupNodePageUserMock(
    page: Page,
    {
        isDatabaseAllowed = true,
        isViewerAllowed = true,
    }: {isDatabaseAllowed?: boolean; isViewerAllowed?: boolean} = {},
) {
    await page.route(`**/viewer/json/whoami*`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                UserSID: 'node-page-user',
                UserID: 'node-page-user',
                AuthType: 'Login',
                IsDatabaseAllowed: isDatabaseAllowed,
                IsViewerAllowed: isViewerAllowed,
            }),
        });
    });
}

async function setupNodePageSysinfoMock(
    page: Page,
    {
        threads,
        onRequest,
    }: {threads?: typeof TEST_THREAD_POOL; onRequest?: (requestUrl: string) => void} = {},
) {
    await page.route(`**/viewer/json/sysinfo?*`, async (route) => {
        onRequest?.(route.request().url());

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                SystemStateInfo: [
                    {
                        Host: 'localhost',
                        NodeId: 1,
                        SystemState: 'Green',
                        Version: 'test-version',
                        ...(threads === undefined ? {} : {Threads: threads}),
                    },
                ],
            }),
        });
    });
}

test.describe('Test Nodes page', async () => {
    test('Nodes page is OK', async ({page}) => {
        const nodesPage = new NodesPage(page);
        const response = await nodesPage.goto();
        expect(response?.ok()).toBe(true);
    });

    test('Nodes page has nodes table', async ({page}) => {
        const nodesPage = new NodesPage(page);

        // Get table with all nodes
        await nodesPage.goto();

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
        const filteredResponse = page.waitForResponse(
            (response) => response.url().includes('/viewer/json/nodes?') && response.ok(),
        );
        await paginatedTable.getControls().search('localhost');
        await filteredResponse;
        await paginatedTable.waitForTableData();

        const filteredRowCount = await paginatedTable.getRowCount();
        expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
    });

    test('Table groups displayed correctly if group by option is selected', async ({page}) => {
        const nodesPage = new NodesPage(page);

        await nodesPage.selectGroupByOption('Host');
        await nodesPage.waitForTableGroupsLoaded();

        await expect(nodesPage.selectFirstTableGroup()).toBeVisible();

        await nodesPage.expandFirstTableGroup();
        await expect(nodesPage.selectFirstTableGroupContent()).toBeVisible();
    });

    test('Node count is displayed correctly', async ({page}) => {
        const paginatedTable = new ClusterNodesTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        await expect
            .poll(async () => {
                const [count, rowCount] = await Promise.all([
                    paginatedTable.getControls().getCount(),
                    paginatedTable.getRowCount(),
                ]);
                return count === rowCount;
            })
            .toBe(true);

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
    test('Threads tab is visible for database-only user and sysinfo keeps database param', async ({
        page,
    }) => {
        const sysinfoRequestUrls: string[] = [];

        await setupNodePageUserMock(page, {isDatabaseAllowed: true, isViewerAllowed: false});
        await setupNodePageSysinfoMock(page, {
            threads: TEST_THREAD_POOL,
            onRequest: (requestUrl) => sysinfoRequestUrls.push(requestUrl),
        });

        const nodePage = new NodePage(page, '1');
        await nodePage.goto({database: THREADS_TEST_DATABASE});
        await nodePage.waitForNodePageLoad();

        const tabNames = await nodePage.getAllTabNames();
        expect(tabNames).toContain('Threads');
        expect(tabNames).not.toContain('Network');
        expect(tabNames).not.toContain('Configs');

        await nodePage.clickThreadsTab();
        await page.waitForURL(/\/node\/\d+\/threads/);
        await expect(page.getByText('TestPool')).toBeVisible();

        expect(sysinfoRequestUrls.length).toBeGreaterThan(0);
        expect(
            sysinfoRequestUrls.every(
                (requestUrl) =>
                    new URL(requestUrl).searchParams.get('database') === THREADS_TEST_DATABASE,
            ),
        ).toBe(true);
    });

    test('Threads tab is hidden when node has no thread data', async ({page}) => {
        await setupNodePageUserMock(page);
        await setupNodePageSysinfoMock(page);

        // Navigate directly to node page
        const nodePage = new NodePage(page, '1');
        await nodePage.goto();
        await nodePage.waitForNodePageLoad();

        // Verify other tabs are still visible
        const tabNames = await nodePage.getAllTabNames();
        expect(tabNames).toContain('Tablets');
        expect(tabNames).not.toContain('Threads');
    });

    test('Threads tab is visible when node has thread data', async ({page}) => {
        await setupNodePageUserMock(page);
        await setupNodePageSysinfoMock(page, {threads: TEST_THREAD_POOL});

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
        await setupNodePageUserMock(page);
        await setupNodePageSysinfoMock(page, {threads: []});

        // Navigate directly to node page
        const nodePage = new NodePage(page, '1');
        await nodePage.goto();
        await nodePage.waitForNodePageLoad();

        // Verify other tabs are still visible
        const tabNames = await nodePage.getAllTabNames();
        expect(tabNames).toContain('Tablets');
        expect(tabNames).not.toContain('Threads');
    });
});

test.describe('Datacenter nodes screenshots', () => {
    for (const theme of ['light', 'dark']) {
        test(`shows normalized datacenters and unknown in ${theme} theme`, async ({page}) => {
            const piles = [
                undefined,
                undefined,
                undefined,
                undefined,
                'pile-a',
                'pile-b',
                'pile-c',
            ];
            const nodes = ['dc-a', 'DC-A', 'DC-B', undefined, 'dc-a', 'dc-a', undefined].map(
                (dc, index) => ({
                    NodeId: index + 1,
                    PileName: piles[index],
                    SystemState: {
                        NodeId: index + 1,
                        Host: `dc-node-${index + 1}`,
                        SystemState: 'Green',
                        Location: {DataCenter: dc},
                    },
                }),
            );
            const responses: Record<string, unknown> = {
                whoami: {IsViewerAllowed: true, IsMonitoringAllowed: true},
                capabilities: {
                    Capabilities: {'/viewer/nodes': 20},
                    Settings: {Cluster: {BridgeModeEnabled: true}},
                },
                cluster: {
                    Overall: 'Green',
                    DataCenters: ['DC-A', 'DC-B', 'P=pile-a/dc-a', 'P=pile-b/dc-a', 'P=pile-c/'],
                },
                nodes: {
                    TotalNodes: String(nodes.length),
                    FoundNodes: String(nodes.length),
                    Nodes: nodes,
                },
                nodelist: nodes.map(({NodeId, SystemState, PileName}) => ({
                    Id: NodeId,
                    Host: SystemState.Host,
                    Location: {...SystemState.Location, BridgePileName: PileName},
                })),
            };
            await page.route('**/viewer/**', (route) => {
                const endpoint = new URL(route.request().url()).pathname.split('/').pop() ?? '';
                return route.fulfill({json: responses[endpoint] ?? {}});
            });
            await page.addInitScript((value) => {
                localStorage.setItem('theme', value);
                localStorage.setItem(
                    'nodesTableSelectedColumns',
                    JSON.stringify(['Host', 'DC', 'PileName']),
                );
                localStorage.setItem(
                    'nodesTableColumnsWidth',
                    JSON.stringify({Host: 240, DC: 140, PileName: 120}),
                );
            }, theme);
            await page.setViewportSize({width: 1100, height: 700});
            const nodesPage = new NodesPage(page);
            await nodesPage.goto();

            const labels = nodesPage.table.locator('.ydb-datacenter-label');
            await expect(labels).toHaveText([
                'DC-A',
                'DC-A',
                'DC-B',
                'Unknown',
                'DC-A',
                'DC-A',
                'Unknown',
            ]);
            for (const [index, color] of [
                'turquoise',
                'turquoise',
                'purple',
                'neutral',
                'blue',
                'orange',
                'red',
            ].entries()) {
                await expect(labels.nth(index)).toHaveClass(
                    new RegExp(`ydb-datacenter-color_color_${color}`),
                );
            }
            for (const pile of ['pile-a', 'pile-b', 'pile-c']) {
                await expect(
                    nodesPage.table.getByRole('cell', {name: pile, exact: true}),
                ).toBeVisible();
            }
            const label = labels.first();
            await expect(nodesPage.table).toHaveScreenshot(`nodes-datacenters-${theme}.png`);
            const background = await label.evaluate(
                (element) => getComputedStyle(element).backgroundColor,
            );
            await label.hover();
            await label.evaluate((element) => {
                element.getAnimations().forEach((animation) => animation.finish());
            });
            await expect(label).toHaveCSS('background-color', background);
            await expect(label).not.toHaveClass(/g-label_interactive/);
            await page.mouse.move(0, 0);
            await expect(label).toHaveCSS('background-color', background);
            if (theme === 'dark') {
                const color = await label.evaluate((element) => getComputedStyle(element).color);
                await page
                    .locator('.g-root_theme_dark')
                    .first()
                    .evaluate((element) => {
                        element.classList.replace('g-root_theme_dark', 'g-root_theme_dark-hc');
                    });
                await expect(label).toHaveCSS('color', color);
            }
        });
    }
});
