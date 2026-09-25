import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TMemoryStats} from '../../../src/types/api/nodes';
import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

import {NodesPage} from './NodesPage';

async function mockMemory(page: Page, memoryStats: TMemoryStats | undefined, legacyUsed: string) {
    await page.addInitScript(() => {
        localStorage.setItem(
            'nodesTableSelectedColumns',
            JSON.stringify(['NodeId', 'Host', 'RAM']),
        );
    });
    await page.route(/\/viewer\//, async (route) => {
        const url = new URL(route.request().url());
        let json: unknown = {};
        if (url.pathname.endsWith('/whoami')) {
            json = {UserSID: 'memory-test', IsMonitoringAllowed: true, IsViewerAllowed: true};
        } else if (url.pathname.endsWith('/nodelist')) {
            json = [{Id: 42, Host: 'memory-test-node'}];
        } else if (url.pathname.endsWith('/capabilities')) {
            json = {Capabilities: {'/viewer/nodes': 20}};
        } else if (url.pathname.endsWith('/nodes')) {
            const fields = url.searchParams.get('fields_required')?.split(',') || [];
            json = {
                TotalNodes: '1',
                FoundNodes: '1',
                Nodes: [
                    {
                        NodeId: 42,
                        SystemState: {
                            Host: 'memory-test-node',
                            SystemState: 'Green',
                            MemoryUsed: legacyUsed,
                            MemoryLimit: '32000000000',
                            MemoryStats: fields.includes('MemoryDetailed')
                                ? memoryStats
                                : undefined,
                        },
                    },
                ],
            };
        }
        await route.fulfill({json});
    });
}

const cases: {
    name: string;
    memoryStats?: TMemoryStats;
    legacyUsed: string;
    limit: number;
    width: string;
}[] = [
    {
        name: 'effective hard limit',
        memoryStats: {AnonRss: '20000000000', HardLimit: '24000000000'},
        legacyUsed: '19000000000',
        limit: 24,
        width: '83%',
    },
    {
        name: 'allocator usage including caches',
        memoryStats: {
            AllocatedMemory: '18000000000',
            AllocatorCachesMemory: '2000000000',
            HardLimit: '24000000000',
        },
        legacyUsed: '18000000000',
        limit: 24,
        width: '83%',
    },
    {
        name: 'legacy backend',
        legacyUsed: '20000000000',
        limit: 32,
        width: '62%',
    },
    {
        name: 'partial detailed stats',
        memoryStats: {HardLimit: '24000000000'},
        legacyUsed: '20000000000',
        limit: 24,
        width: '83%',
    },
];

for (const {name, memoryStats, legacyUsed, limit, width} of cases) {
    test(`RAM agrees with Detailed Memory for ${name}`, async ({page}, testInfo) => {
        await mockMemory(page, memoryStats, legacyUsed);
        const nodesPage = new NodesPage(page);
        const request = page.waitForRequest((req) => {
            const url = new URL(req.url());
            return url.pathname.endsWith('/nodes') && url.searchParams.has('fields_required');
        });
        await nodesPage.goto();
        const fields = new URL((await request).url()).searchParams
            .get('fields_required')
            ?.split(',');
        expect(fields).toContain('MemoryDetailed');

        const row = nodesPage.table.getByRole('row').filter({hasText: 'memory-test-node'});
        const ram = row.locator('.ydb-nodes-columns__column-ram');
        await expect(ram).toHaveText(/20\s*GB/);
        await expect(ram.locator('.progress-viewer__line')).toHaveAttribute(
            'style',
            `width: ${width};`,
        );
        await expect(
            nodesPage.table.getByRole('columnheader', {name: 'Detailed Memory'}),
        ).toHaveCount(0);
        await ram.hover();
        const popup = page.locator('.g-popup_open').filter({hasText: 'Memory limit'});
        await expect(popup).toContainText(new RegExp(`Memory limit${limit}\\s*GB`));
        await page.mouse.move(0, 0);

        const controls = new ClusterNodesTable(page).getControls();
        await controls.openColumnSetup();
        await controls.setColumnChecked('Memory');
        await controls.closeColumnSetup();
        const detailed = memoryStats
            ? row.locator('.memory-viewer')
            : row.locator('.progress-viewer').last();
        await expect(detailed).toHaveText(new RegExp(`20 / ${limit}\\s*GB`));
        await expect(ram.locator('.progress-viewer__line')).toHaveAttribute(
            'style',
            `width: ${width};`,
        );
        await page.screenshot({path: testInfo.outputPath('node-memory.png')});
    });
}
