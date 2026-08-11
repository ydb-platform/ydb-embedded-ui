import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {NodesPage} from '../nodes/NodesPage';

import {setupEmptyNodesMock, setupLargeNodesMock, setupNodesWithChunkErrorMock} from './mocks';
import {ClusterNodesTable} from './paginatedTable';

function waitForNodeRequest(page: Page, nodeIndex: number) {
    return page.waitForRequest((request) => {
        const url = new URL(request.url());
        if (url.pathname !== '/viewer/json/nodes') {
            return false;
        }

        const offset = Number(url.searchParams.get('offset'));
        const limit = Number(url.searchParams.get('limit'));

        return offset <= nodeIndex && nodeIndex < offset + limit;
    });
}

async function expectLastHost(paginatedTable: ClusterNodesTable, expectedHost: string) {
    await expect
        .poll(async () => (await paginatedTable.getColumnValues('Host')).at(-1))
        .toBe(expectedHost);
}

test.describe('PaginatedTable', () => {
    test('loads data in chunks when scrolling', async ({page}) => {
        const totalNodes = 500;
        await setupLargeNodesMock(page, totalNodes);
        const lastNodeRequest = waitForNodeRequest(page, totalNodes - 1);

        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();
        await expect.poll(() => paginatedTable.getCount()).toBe(totalNodes);

        // Get data from first visible row to verify initial chunk
        const firstRowData = await paginatedTable.getRowData(0);
        expect(firstRowData['Host']).toBe('host-0.test');
        expect(firstRowData['Version']).toBe('main.b7cfb36');

        await paginatedTable.scrollToBottom();
        await lastNodeRequest;
        await expectLastHost(paginatedTable, 'host-499.test');
        await paginatedTable.waitForTableData();

        // Get data from last row to verify the last chunk loaded
        const rowCount = await paginatedTable.getRowCount();
        const lastRowData = await paginatedTable.getRowData(rowCount - 1);
        expect(lastRowData['Host']).toBe('host-499.test');
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
        const lastNodeRequest = waitForNodeRequest(page, 999);

        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();
        await expect.poll(() => paginatedTable.getCount()).toBe(1000);

        await paginatedTable.scrollToBottom();
        await lastNodeRequest;
        await expectLastHost(paginatedTable, 'host-999.test');
    });

    test('handles 100 pages of data correctly', async ({page}) => {
        // Setup mocks with 10000 nodes (100 per page * 100 pages)
        await setupLargeNodesMock(page, 10000);
        const lastNodeRequest = waitForNodeRequest(page, 9999);

        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();
        await expect.poll(() => paginatedTable.getCount()).toBe(10000);

        await paginatedTable.scrollToBottom();
        await lastNodeRequest;
        await expectLastHost(paginatedTable, 'host-9999.test');
    });

    test('displays inline error when a chunk fails to load', async ({page}) => {
        await setupNodesWithChunkErrorMock(page);

        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();

        const firstRowData = await paginatedTable.getRowData(0);
        expect(firstRowData['Host']).toBe('host-0.test');

        // chunkSize=20, rowHeight=40 → chunk 10 starts at offset 200 (8000px)
        await paginatedTable.scrollToPosition(8000);

        await paginatedTable.waitForErrorInTable();

        const errorRow = paginatedTable.getErrorRowLocator();
        await expect(errorRow.first()).toBeVisible();

        const errorText = await errorRow.first().innerText();
        expect(errorText).toContain('Internal error');

        await expect(errorRow.first()).toHaveScreenshot('error-paginated-table-chunk-500.png');
        await page.screenshot({
            path: 'playwright-artifacts/full-page-screenshots/full-paginated-table-chunk-error.png',
            fullPage: true,
        });
    });
});
