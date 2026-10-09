import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TMemoryStats} from '../../../src/types/api/nodes';
import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

import {NodesPage} from './NodesPage';

async function mockMemory(
    page: Page,
    memoryStats: TMemoryStats | undefined,
    legacyUsed: string | undefined,
) {
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
    legacyUsed?: string;
    used?: number;
    cachesOutsideUsage?: boolean;
    limit: number;
    width: string;
}[] = [
    {
        name: 'effective hard limit',
        memoryStats: {AnonRss: '20000000000', HardLimit: '24000000000'},
        legacyUsed: '19000000000',
        used: 19,
        limit: 24,
        width: '79%',
    },
    {
        name: 'allocator usage including caches',
        memoryStats: {
            AllocatedMemory: '18000000000',
            AllocatorCachesMemory: '2000000000',
            HardLimit: '24000000000',
        },
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

for (const [name, hardLimit] of [
    ['missing hard limit', undefined],
    ['zero hard limit', '0'],
    ['invalid hard limit', 'invalid'],
] as const) {
    cases.push({
        name,
        memoryStats: {AnonRss: '20000000000', HardLimit: hardLimit},
        legacyUsed: '20000000000',
        limit: 32,
        width: '62%',
    });
}

cases.push({
    name: 'allocator caches outside backend usage',
    memoryStats: {
        AllocatedMemory: '2000000000',
        AllocatorCachesMemory: '6000000000',
        HardLimit: '24000000000',
    },
    legacyUsed: '2000000000',
    used: 2,
    cachesOutsideUsage: true,
    limit: 24,
    width: '8%',
});

for (const {name, memoryStats, legacyUsed, used = 20, cachesOutsideUsage, limit, width} of cases) {
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
        await expect(ram).toHaveText(new RegExp(`${used}\\s*GB`));
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
        await expect(detailed).toHaveText(new RegExp(`${used} / ${limit}\\s*GB`));
        await expect(ram.locator('.progress-viewer__line')).toHaveAttribute(
            'style',
            `width: ${width};`,
        );
        if (cachesOutsideUsage) {
            await expect(
                detailed.locator('.memory-viewer__segment_type_AllocatorCachesMemory'),
            ).toHaveCount(0);
            const otherWidth = await detailed
                .locator('.memory-viewer__segment_type_Other')
                .evaluate((element) => parseFloat(element.style.width));
            expect(otherWidth).toBeCloseTo(8.3333, 3);
        }
        if (memoryStats) {
            await detailed.hover();
            const popupLimit = page
                .locator('.g-popup_open .g-definition-list__item')
                .filter({hasText: 'Hard Limit'});
            await expect(popupLimit).toContainText(new RegExp(`${limit}\\s*GB`));
            if (cachesOutsideUsage) {
                const detailedPopup = page.locator('.g-popup_open');
                await expect(
                    detailedPopup
                        .locator('.g-definition-list__item')
                        .filter({hasText: 'Allocator Caches'}),
                ).toContainText(/6\s*GB/);
                await expect(
                    detailedPopup.locator('.g-definition-list__item').filter({hasText: /^Usage/}),
                ).toContainText(/2\s*GB/);
            }
            await page.mouse.move(0, 0);
        }
        await page.screenshot({path: testInfo.outputPath('node-memory.png')});
    });
}

test('sorts RAM by the same backend usage that the cells display', async ({page}) => {
    await mockMemory(page, undefined, '18000000000');
    const lower = {
        NodeId: 42,
        SystemState: {
            Host: 'lower-backend-usage',
            SystemState: 'Green',
            MemoryUsed: '18000000000',
            MemoryLimit: '32000000000',
            MemoryStats: {
                AllocatedMemory: '18000000000',
                AllocatorCachesMemory: '4000000000',
                HardLimit: '24000000000',
            },
        },
    };
    const higher = {
        NodeId: 43,
        SystemState: {
            Host: 'higher-backend-usage',
            SystemState: 'Green',
            MemoryUsed: '20000000000',
            MemoryLimit: '32000000000',
            MemoryStats: {
                AllocatedMemory: '20000000000',
                AllocatorCachesMemory: '0',
                HardLimit: '24000000000',
            },
        },
    };
    await page.route('**/viewer/json/nodes?*', async (route) => {
        const sort = new URL(route.request().url()).searchParams.get('sort');
        await route.fulfill({
            json: {
                TotalNodes: '2',
                FoundNodes: '2',
                Nodes: sort === '-Memory' ? [higher, lower] : [lower, higher],
            },
        });
    });
    const nodesPage = new NodesPage(page);
    await nodesPage.goto();
    await expect(
        nodesPage.table.getByRole('link', {name: 'lower-backend-usage', exact: true}),
    ).toBeVisible();
    const sortedResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname.endsWith('/nodes') && url.searchParams.get('sort') === '-Memory';
    });
    await nodesPage.table.getByRole('columnheader', {name: 'RAM', exact: true}).click();
    await sortedResponse;
    await expect(nodesPage.table.locator('.ydb-nodes-columns__column-ram')).toHaveText([
        /20\s*GB/,
        /18\s*GB/,
    ]);
});

test('keeps the detailed breakdown when both memory limits are missing', async ({page}) => {
    await mockMemory(page, undefined, '20000000000');
    await page.route('**/viewer/json/nodes?*', (route) =>
        route.fulfill({
            json: {
                TotalNodes: '1',
                FoundNodes: '1',
                Nodes: [
                    {
                        NodeId: 42,
                        SystemState: {
                            Host: 'memory-test-node',
                            SystemState: 'Green',
                            MemoryUsed: '20000000000',
                            MemoryStats: {
                                AnonRss: '20000000000',
                                AllocatorCachesMemory: '2000000000',
                                SharedCacheConsumption: '5000000000',
                                QueryExecutionConsumption: '3000000000',
                                MemTableConsumption: '1000000000',
                            },
                        },
                    },
                ],
            },
        }),
    );
    const nodesPage = new NodesPage(page);
    await nodesPage.goto();
    const controls = new ClusterNodesTable(page).getControls();
    await controls.openColumnSetup();
    await controls.setColumnChecked('Memory');
    await controls.closeColumnSetup();
    const row = nodesPage.table.getByRole('row').filter({hasText: 'memory-test-node'});
    const detailedCell = row.getByRole('cell').last();
    await expect(detailedCell).toHaveText(/20\s*GB/);
    await expect(detailedCell.locator('.memory-viewer__progress-container')).toHaveCount(0);
    await detailedCell.hover();
    const popup = page.locator('.g-popup_open');
    for (const [label, value] of [
        ['Shared Cache', 5],
        ['Query Execution', 3],
        ['MemTable', 1],
        ['Allocator Caches', 2],
        ['Usage', 20],
    ] as const) {
        await expect(
            popup.locator('.g-definition-list__item').filter({hasText: label}),
        ).toContainText(new RegExp(`${value}\\s*GB`));
    }
    await expect(
        popup.locator('.g-definition-list__item').filter({hasText: 'Hard Limit'}),
    ).toHaveCount(0);
});
