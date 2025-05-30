import {expect, test} from '@playwright/test';

import {NodesPage} from '../nodes/NodesPage';

import {setupEmptyNodesMock, setupLargeNodesMock, setupNodesMock} from './mocks';
import {ClusterNodesTable} from './paginatedTable';

test.describe('PaginatedTable', () => {
    test('loads data in chunks when scrolling', async ({page}) => {
        // Setup mocks
        await setupNodesMock(page);

        // Navigate to nodes page which uses PaginatedTable
        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();

        // Get initial row count (should be first chunk)
        const initialVisibleRows = await paginatedTable.getRowCount();

        // Safari shows 40 rows initially (1 + 1 overscan), other browsers show 60 (1 + 2 overscan)
        const expectedRows = page.context().browser()?.browserType().name() === 'webkit' ? 40 : 60;
        expect(initialVisibleRows).toEqual(expectedRows); // Should not show all rows initially

        // Get data from first visible row to verify initial chunk
        const firstRowData = await paginatedTable.getRowData(0);
        expect(firstRowData['Host']).toBe('host-0.test');
        expect(firstRowData['Version']).toBe('main.b7cfb36');

        await paginatedTable.scrollToBottom();

        await paginatedTable.waitForTableData();

        // Get data from last row to verify second chunk loaded
        const rowCount = await paginatedTable.getRowCount();
        const lastRowData = await paginatedTable.getRowData(rowCount - 1);
        expect(lastRowData['Host']).toBe('host-99.test');
        expect(lastRowData['Version']).toBe('main.b7cfb36');

        // Verify uptime format matches the pattern from nodes.test.ts
        const uptimeValues = await paginatedTable.getColumnValues('Uptime');
        for (const uptime of uptimeValues) {
            expect(uptime).toMatch(/^(\d+d\s)?(\d+):(\d{2}):(\d{2})$/); // Format: DDd? HH:MM:SS
        }
    });

    test('loads data when scrolling to middle of table', async ({page}) => {
        // Setup mocks with large dataset
        await setupLargeNodesMock(page);

        // Navigate to nodes page which uses PaginatedTable
        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();

        // Get initial row count
        const initialVisibleRows = await paginatedTable.getRowCount();
        expect(initialVisibleRows).toBeGreaterThan(0);
        expect(initialVisibleRows).toBeLessThan(1000); // Should not show all rows initially

        // Scroll to middle of container
        await paginatedTable.scrollToMiddle();
        await paginatedTable.waitForTableData();

        // Get data from middle rows to verify middle chunk loaded
        const rowCount = await paginatedTable.getRowCount();
        const middleRowIndex = Math.floor(rowCount / 2);
        const middleRowData = await paginatedTable.getRowData(middleRowIndex);
        expect(middleRowData['Host']).toBe('host-500.test');
        expect(middleRowData['Version']).toBe('main.b7cfb36');
    });

    test('displays empty state when no data is present', async ({page}) => {
        // Setup mocks with empty data
        await setupEmptyNodesMock(page);

        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();

        // Verify empty state
        const rowCount = await paginatedTable.getRowCount();
        expect(rowCount).toBe(1);
        const emptyDataMessage = await paginatedTable.getEmptyDataMessageLocator();
        await expect(emptyDataMessage).toContainText('No such nodes');
    });

    test('handles 10 pages of data correctly', async ({page}) => {
        // Setup mocks with 1000 nodes (100 per page * 10 pages)
        await setupLargeNodesMock(page);

        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();

        // Verify initial data load
        const initialRowCount = await paginatedTable.getRowCount();
        expect(initialRowCount).toBeGreaterThan(0);
        expect(initialRowCount).toBeLessThan(1000); // Should not load all rows at once

        await paginatedTable.scrollToBottom();
        await paginatedTable.waitForTableData();

        // Verify we can load data from the last page
        const finalRowCount = await paginatedTable.getRowCount();
        const lastRowData = await paginatedTable.getRowData(finalRowCount - 1);
        expect(lastRowData['Host']).toBe('host-999.test'); // Last node in 1000 nodes (0-999)
    });

    test('handles 100 pages of data correctly', async ({page}) => {
        // Setup mocks with 10000 nodes (100 per page * 10 pages)
        await setupLargeNodesMock(page, 10000);

        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();

        // Verify initial data load
        const initialRowCount = await paginatedTable.getRowCount();
        expect(initialRowCount).toBeGreaterThan(0);
        expect(initialRowCount).toBeLessThan(10000); // Should not load all rows at once

        await paginatedTable.scrollToBottom();
        await paginatedTable.waitForTableData();

        // Verify we can load data from the last page
        const finalRowCount = await paginatedTable.getRowCount();
        const lastRowData = await paginatedTable.getRowData(finalRowCount - 1);
        expect(lastRowData['Host']).toBe('host-9999.test'); // Last node in 1000 nodes (0-999)
    });
});
