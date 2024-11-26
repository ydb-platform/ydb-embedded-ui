import {expect, test} from '@playwright/test';

import {PaginatedTable} from '../paginatedTable/paginatedTable';

import {StoragePage} from './StoragePage';

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
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const rowCount = await paginatedTable.getRowCount();
        expect(rowCount).toBeGreaterThan(0);
    });

    test('Search by pool name filters the table', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialRowCount = await paginatedTable.getRowCount();
        await paginatedTable.search('static');

        await page.waitForTimeout(1000); // Wait for the table to update

        const filteredRowCount = await paginatedTable.getRowCount();
        expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);
    });

    test('Radio button selection changes displayed data', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const initialRowCount = await paginatedTable.getRowCount();
        await paginatedTable.selectRadioOption(0, 'Nodes');

        await page.waitForTimeout(1000); // Wait for the table to update

        const nodesRowCount = await paginatedTable.getRowCount();
        expect(nodesRowCount).not.toEqual(initialRowCount);
    });

    test('Groups count is displayed correctly', async ({page}) => {
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const nodeCount = await paginatedTable.getCount();
        const rowCount = await paginatedTable.getRowCount();

        expect(nodeCount).toBe(rowCount);
    });

    test('Row data can be retrieved correctly', async ({page}) => {
        const storageTable = new PaginatedTable(page);

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
        const paginatedTable = new PaginatedTable(page);

        await paginatedTable.waitForTableToLoad();
        await paginatedTable.waitForTableData();

        const poolValues = await paginatedTable.getColumnValues('Pool Name');
        const erasureValues = await paginatedTable.getColumnValues('Erasure');

        expect(poolValues.length).toBeGreaterThan(0);
        expect(erasureValues.length).toBeGreaterThan(0);
        expect(poolValues.length).toBe(erasureValues.length);
    });

    test('Clicking on Group ID header sorts the table', async ({page}) => {
        const storageTable = new PaginatedTable(page);

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
