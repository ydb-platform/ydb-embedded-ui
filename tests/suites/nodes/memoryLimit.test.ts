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
        name: 'usage above the controller hard limit',
        memoryStats: {AnonRss: '27000000000', HardLimit: '24000000000', SoftLimit: '21000000000'},
        legacyUsed: '26000000000',
        used: 26,
        limit: 32,
        width: '81%',
    },
    {
        name: 'allocator usage excluding caches',
        memoryStats: {
            AllocatedMemory: '18000000000',
            AllocatorCachesMemory: '2000000000',
            HardLimit: '24000000000',
        },
        legacyUsed: '18000000000',
        used: 18,
        limit: 32,
        width: '56%',
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
        limit: 32,
        width: '62%',
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
    limit: 32,
    width: '6%',
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
        expect(fields).toContain('Memory');
        expect(fields).not.toContain('MemoryDetailed');

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

        const detailedRequest = page.waitForRequest((req) => {
            const url = new URL(req.url());
            return (
                url.pathname.endsWith('/nodes') &&
                Boolean(
                    url.searchParams.get('fields_required')?.split(',').includes('MemoryDetailed'),
                )
            );
        });
        const controls = new ClusterNodesTable(page).getControls();
        await controls.openColumnSetup();
        await controls.setColumnChecked('Memory');
        await controls.closeColumnSetup();
        expect(
            new URL((await detailedRequest).url()).searchParams.get('fields_required')?.split(','),
        ).toEqual(expect.arrayContaining(['Memory', 'MemoryDetailed']));
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
            expect(otherWidth).toBeCloseTo(6.25, 3);
        }
        if (memoryStats) {
            await detailed.hover();
            const details = page.locator('.g-popup_open .g-definition-list__item');
            await expect(details.filter({hasText: /^Memory Limit/})).toContainText(
                new RegExp(`${limit}\\s*GB`),
            );
            const hardLimit = details.filter({hasText: 'Memory Controller Hard Limit'});
            if (memoryStats.HardLimit === '24000000000') {
                await expect(hardLimit).toContainText(/24\s*GB/);
            } else {
                await expect(hardLimit).toHaveCount(0);
            }
            if (memoryStats.SoftLimit) {
                await expect(
                    details.filter({hasText: 'Memory Controller Soft Limit'}),
                ).toContainText(/21\s*GB/);
            }
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

for (const hardLimit of [undefined, '24000000000']) {
    test(`keeps the breakdown without a system limit (controller limit: ${hardLimit})`, async ({
        page,
    }) => {
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
                                    HardLimit: hardLimit,
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
            popup.locator('.g-definition-list__item').filter({hasText: /^Memory Limit/}),
        ).toHaveCount(0);
        const controllerLimit = popup
            .locator('.g-definition-list__item')
            .filter({hasText: 'Memory Controller Hard Limit'});
        if (hardLimit) {
            await expect(controllerLimit).toContainText(/24\s*GB/);
        } else {
            await expect(controllerLimit).toHaveCount(0);
        }
    });
}
