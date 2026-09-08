import {expect, test} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {NodePage} from '../nodes/NodePage';
import {ClusterStorageTable} from '../paginatedTable/paginatedTable';

import {StoragePage} from './StoragePage';
import {DATABASE, GROUP_ID, NODE_ID, setupVDiskPageMocks} from './vdiskPageMocks';

test.describe('Storage groups API without capabilities', () => {
    test.beforeEach(async ({page}) => {
        await setupVDiskPageMocks(page);
        await page.route('**/viewer/capabilities*', (route) =>
            route.fulfill({json: {Capabilities: {}}}),
        );
    });

    for (const path of ['cluster/storage', 'storageGroup']) {
        test(`loads ${path} through storage/groups`, async ({page}) => {
            const storageRequests: string[] = [];
            page.on('request', (request) => {
                if (/\/(storage\/groups|viewer\/json\/storage)(\?|$)/.test(request.url())) {
                    storageRequests.push(new URL(request.url()).pathname);
                }
            });

            const storageResponse = page.waitForResponse(
                (response) => response.url().includes('/storage/groups?') && response.ok(),
            );
            await new PageModel(page, path, {groupId: GROUP_ID}).goto();
            await storageResponse;

            await expect(
                page.getByRole('link', {name: GROUP_ID, exact: true}).first(),
            ).toBeVisible();
            expect(storageRequests).toContain('/storage/groups');
            expect(storageRequests.every((requestPath) => requestPath === '/storage/groups')).toBe(
                true,
            );
        });
    }

    for (const environment of [undefined, 'cloud-prod']) {
        test(`preserves node scope through legacy redirects and tabs (${environment ?? 'default'})`, async ({
            page,
        }) => {
            const nodePath = [environment, 'node', NODE_ID].filter(Boolean).join('/');
            const backendOverride = environment ? 'http://127.0.0.1:8765' : undefined;
            const legacyStorageRequests: string[] = [];
            page.on('request', (request) => {
                if (request.url().includes('/viewer/json/storage')) {
                    legacyStorageRequests.push(request.url());
                }
            });

            const storageResponse = page.waitForResponse(
                (response) => response.url().includes('/storage/groups?') && response.ok(),
            );
            await new PageModel(page, `${nodePath}/structure`, {
                database: DATABASE,
                clusterName: 'storage-test-cluster',
                backend: backendOverride,
            }).goto();
            const response = await storageResponse;
            const requestParams = new URL(response.url()).searchParams;
            const nodePage = new NodePage(page, NODE_ID);

            await expect(
                nodePage.tabs.getByRole('tab', {name: 'Storage', exact: true}),
            ).toHaveAttribute('aria-selected', 'true');
            await expect(
                page.getByRole('link', {name: GROUP_ID, exact: true}).first(),
            ).toBeVisible();
            await expect(page).toHaveURL(new RegExp(`/${nodePath}/storage\\?`));
            expect(new URL(page.url()).searchParams.get('database')).toBe(DATABASE);
            expect(new URL(page.url()).searchParams.get('clusterName')).toBe(
                'storage-test-cluster',
            );
            expect(new URL(page.url()).searchParams.get('backend')).toBe(backendOverride ?? null);
            if (backendOverride) {
                expect(new URL(response.url()).origin).toBe(backendOverride);
            }
            expect(requestParams.get('database')).toBe(DATABASE);
            expect(requestParams.get('node_id')).toBe(NODE_ID);
            expect(await nodePage.getAllTabNames()).not.toContain('Structure');

            for (const {name, path} of [
                {name: 'Tablets', path: 'tablets'},
                {name: 'Storage', path: 'storage'},
            ]) {
                const tab = nodePage.tabs.getByRole('tab', {name, exact: true});
                await tab.click();

                await expect(tab).toHaveAttribute('aria-selected', 'true');
                await expect(page).toHaveURL(new RegExp(`/${nodePath}/${path}\\?`));
                expect(new URL(page.url()).searchParams.get('database')).toBe(DATABASE);
                expect(new URL(page.url()).searchParams.get('clusterName')).toBe(
                    'storage-test-cluster',
                );
                expect(new URL(page.url()).searchParams.get('backend')).toBe(
                    backendOverride ?? null,
                );
            }

            await expect(
                page.getByRole('link', {name: GROUP_ID, exact: true}).first(),
            ).toBeVisible();
            expect(legacyStorageRequests).toEqual([]);
        });
    }
});

test.describe('Test Storage page', async () => {
    test('Storage page is OK', async ({page}) => {
        const storagePage = new StoragePage(page);
        const response = await storagePage.goto();
        expect(response?.ok()).toBe(true);
    });

    test('Storage page has groups table', async ({page}) => {
        const storagePage = new StoragePage(page);
        await storagePage.goto();

        await storagePage.selectEntityType('Groups');

        await expect(storagePage.table).toBeVisible();
    });

    test('Storage page has nodes table', async ({page}) => {
        const storagePage = new StoragePage(page);
        await storagePage.goto();

        await storagePage.selectEntityType('Nodes');

        await expect(storagePage.table).toBeVisible();
    });
});

test.describe('Test Storage Paginated Table', async () => {
    test.beforeEach(async ({page}) => {
        const nodesPage = new StoragePage(page);
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
        const paginatedTable = new ClusterStorageTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const rowCount = await paginatedTable.getRowCount();
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Search by pool name filters the table', async ({page}) => {
        const paginatedTable = new ClusterStorageTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialRowCount = await paginatedTable.getRowCount();
        await paginatedTable.search('static');

        await expect
            .poll(async () => {
                const values = await paginatedTable.getColumnValues('Pool Name');
                return values.length > 0 && values.every((value) => value.includes('static'));
            })
            .toBe(true);

        const filteredRowCount = await paginatedTable.getRowCount();
        expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
    });

    test('Radio button selection changes displayed data', async ({page}) => {
        const paginatedTable = new ClusterStorageTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialRowCount = await paginatedTable.getRowCount();
        await paginatedTable.getControls().selectRadioOption(0, 'Nodes');

        await expect.poll(() => paginatedTable.getRowCount()).not.toBe(initialRowCount);

        const nodesRowCount = await paginatedTable.getRowCount();
        expect(nodesRowCount).not.toEqual(initialRowCount);
    });

    test('Groups count is displayed correctly', async ({page}) => {
        const paginatedTable = new ClusterStorageTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        await expect
            .poll(async () => {
                const [count, rowCount] = await Promise.all([
                    paginatedTable.getCount(),
                    paginatedTable.getRowCount(),
                ]);
                return count === rowCount;
            })
            .toBe(true);

        const nodeCount = await paginatedTable.getCount();
        const rowCount = await paginatedTable.getRowCount();

        expect(nodeCount).toBe(rowCount);
    });

    test('Row data can be retrieved correctly', async ({page}) => {
        const storageTable = new ClusterStorageTable(page);

        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const rowData = await storageTable.getRowData(0);

        expect(rowData).toHaveProperty('Group ID');
        expect(rowData).toHaveProperty('Pool Name');
        expect(rowData).toHaveProperty('Erasure');
        expect(rowData).toHaveProperty('Used');
        expect(rowData).toHaveProperty('VDisks');
    });

    test('Column values can be retrieved correctly', async ({page}) => {
        const paginatedTable = new ClusterStorageTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const poolValues = await paginatedTable.getColumnValues('Pool Name');
        const erasureValues = await paginatedTable.getColumnValues('Erasure');

        expect(poolValues.length).toBeGreaterThan(0);
        expect(erasureValues.length).toBeGreaterThan(0);
        expect(poolValues.length).toBe(erasureValues.length);
    });

    test('Clicking on Group ID header sorts the table', async ({page}) => {
        const storageTable = new ClusterStorageTable(page);

        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const initialGroupIds = await storageTable.getColumnValues('Group ID');

        await storageTable.sortByColumn('Group ID');

        const sortedGroupIds = await storageTable.getColumnValues('Group ID');

        expect(sortedGroupIds).not.toEqual(initialGroupIds);

        const sortedDescending = [...sortedGroupIds].sort((a, b) => {
            return parseInt(b, 10) - parseInt(a, 10);
        });
        expect(sortedGroupIds).toEqual(sortedDescending);

        await storageTable.sortByColumn('Group ID');

        const sortedAscGroupIds = await storageTable.getColumnValues('Group ID');

        const sortedAscending = [...sortedAscGroupIds].sort((a, b) => {
            return parseInt(a, 10) - parseInt(b, 10);
        });
        expect(sortedAscGroupIds).toEqual(sortedAscending);
    });
});
