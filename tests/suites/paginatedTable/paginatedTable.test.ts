import {expect, test} from '@playwright/test';

import {NodesPage} from '../nodes/NodesPage';

import {setupNodesMock, setupSettingsMock} from './mocks';
import {PaginatedTable} from './paginatedTable';

test.describe('PaginatedTable', () => {
    test('loads data in chunks when scrolling', async ({page}) => {
        // Setup mocks
        await setupNodesMock(page);
        await setupSettingsMock(page);

        // Navigate to nodes page which uses PaginatedTable
        const nodesPage = new NodesPage(page);
        await nodesPage.goto();

        const paginatedTable = new PaginatedTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();

        // Get initial row count (should be first chunk)
        const initialVisibleRows = await paginatedTable.getRowCount();
        expect(initialVisibleRows).toBeGreaterThan(0);
        expect(initialVisibleRows).toBeLessThan(100); // Should not show all rows initially

        // Get data from first visible row to verify initial chunk
        const firstRowData = await paginatedTable.getRowData(0);
        expect(firstRowData['Host']).toBe('host-0.test');
        expect(firstRowData['Version']).toBe('main.b7cfb36');

        // Scroll to bottom of container
        await page.evaluate(() => {
            const container = document.querySelector('.ydb-cluster');
            if (container) {
                // Force scroll to bottom
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'instant',
                });
            }
        });

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
});
