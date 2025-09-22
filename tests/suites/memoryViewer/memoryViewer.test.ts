import {expect, test} from '@playwright/test';

import {NodesPage} from '../nodes/NodesPage';
import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

import {MemoryViewer} from './MemoryViewer';

test.describe('Memory Viewer Widget', () => {
    test.beforeEach(async ({page}) => {
        const nodesPage = new NodesPage(page);
        const memoryViewer = new MemoryViewer(page);
        await nodesPage.goto();

        const paginatedTable = new ClusterNodesTable(page);
        await paginatedTable.waitForTableVisible();
        await paginatedTable.waitForTableData();
        if (!(await memoryViewer.isVisible())) {
            const controls = paginatedTable.getControls();
            await controls.openColumnSetup();
            await controls.setColumnChecked('Memory');
        }
        await memoryViewer.waitForVisible();
    });

    test('Memory viewer is visible and has correct status', async ({page}) => {
        const memoryViewer = new MemoryViewer(page);

        await expect(memoryViewer.container).toBeVisible();
        expect(await memoryViewer.getStatus()).toBe('good');
        expect(await memoryViewer.getTheme()).toBe('system');
    });

    test('Memory viewer shows correct base metrics', async ({page}) => {
        const memoryViewer = new MemoryViewer(page);

        const allocatorWidth = await memoryViewer.getAllocatorSegmentWidth();
        const otherWidth = await memoryViewer.getOtherSegmentWidth();
        const otherOffset = await memoryViewer.getOtherSegmentOffset();

        expect(allocatorWidth).toBeTruthy();
        expect(otherWidth).toBeTruthy();
        expect(otherOffset).toBeTruthy();

        const text = await memoryViewer.getText();
        expect(text).toMatch(/[\d.]+ \/ [\d.]+\s*GB/);
    });

    test('Memory viewer popup shows on hover with all metrics', async ({page}) => {
        const memoryViewer = new MemoryViewer(page);

        await memoryViewer.hover();

        // Check progress viewer metrics
        const sharedCache = await memoryViewer.getSharedCacheInfo();
        expect(sharedCache.status).toBe('good');
        expect(sharedCache.text).toMatch(/\d+ \/ [\d.]+\s*GB/);

        const queryExecution = await memoryViewer.getQueryExecutionInfo();
        expect(queryExecution.status).toBe('good');
        expect(queryExecution.text).toMatch(/\d+ \/ [\d.]+\s*GB/);

        const memTable = await memoryViewer.getMemTableInfo();
        expect(memTable.status).toBe('good');
        expect(memTable.text).toMatch(/\d+(\.\d+)? \/ \d+(\.\d+)?\s*GB/);

        // Check simple metrics
        const allocatorCaches = await memoryViewer.getAllocatorCachesInfo();
        expect(allocatorCaches).toMatch(/[\d.]+\s*GB/);

        const other = await memoryViewer.getOtherInfo();
        expect(other).toMatch(/[\d.]+\s*GB/);

        const usage = await memoryViewer.getUsageInfo();
        expect(usage).toMatch(/[\d.]+\s*GB/);

        const softLimit = await memoryViewer.getSoftLimitInfo();
        expect(softLimit).toMatch(/[\d.]+\s*GB/);

        const hardLimit = await memoryViewer.getHardLimitInfo();
        expect(hardLimit).toMatch(/[\d.]+\s*GB/);
    });
});
