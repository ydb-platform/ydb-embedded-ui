import {expect, test} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

import {DATABASE, setupVDiskPageMocks} from './vdiskPageMocks';

const TABLETS = [
    {
        TabletId: '72075186224037901',
        GroupsCount: 2,
        DiskUsage: 1.2,
        Degrade: 2,
        UnavailableDDiskGroups: [{Missing: 2, Count: 1}],
        UnavailablePersistentBufferGroups: [{Missing: 1, Count: 2}],
        GroupsWithUnknownDDiskStatus: 1,
        GroupsWithUnknownPersistentBufferStatus: 0,
    },
    {
        TabletId: '72075186224037902',
        DiskId: 'volume-42',
        GroupsCount: 1,
        DiskUsage: 0.45,
        Degrade: 0,
    },
    {TabletId: '72075186224037903', GroupsCount: 1, Degrade: 1},
];

test.beforeEach(async ({page}) => {
    await setupVDiskPageMocks(page);
    await page.route('**/viewer/capabilities*', (route) =>
        route.fulfill({
            json: {
                Database: DATABASE,
                Capabilities: {
                    '/storage/groups': 10,
                    '/viewer/nodes': 20,
                    '/pdisk/info': 10,
                    '/viewer/nodes/ddisks': 1,
                    '/pdisk/info/ddisks': 1,
                    '/storage/nbs': 1,
                    '/cms/api/json/ddisk/tablets': 1,
                    '/cms/api/json/ddisk/tablet': 1,
                    '/cms/api/json/ddisk/disks': 1,
                },
            },
        }),
    );
    await page.route('**/storage/nbs*', (route) => route.fulfill({json: {Configured: true}}));
    await page.setViewportSize({width: 1600, height: 1100});
});

test('NBS tablets group by usage and degrade and keep unknown monitoring separate', async ({
    page,
}) => {
    await page.route('**/cms/api/json/ddisk/tablets?*', (route) => {
        const params = new URL(route.request().url()).searchParams;
        const groupBy = params.get('group_by');
        const groupsOnly = params.get('groups_only') === 'true';
        const filter = params.get('filter_group');
        const name = (tablet: (typeof TABLETS)[number]) =>
            groupBy === 'degrade'
                ? String(tablet.Degrade)
                : tablet.DiskUsage === undefined
                  ? 'unknown'
                  : String(Math.floor(Math.min(tablet.DiskUsage, 1) * 10) * 10);
        const rows = TABLETS.filter((tablet) => filter === null || name(tablet) === filter);
        return route.fulfill({
            json: {
                Status: {Code: 'OK'},
                TotalCount: rows.length,
                UnfilteredCount: TABLETS.length,
                Groups: groupsOnly
                    ? TABLETS.map((tablet) => ({Name: name(tablet), Count: 1}))
                    : undefined,
                Tablets: groupsOnly
                    ? undefined
                    : rows.slice(
                          Number(params.get('offset') || 0),
                          Number(params.get('offset') || 0) + Number(params.get('limit') || 20),
                      ),
            },
        });
    });
    await new PageModel(page, 'cluster/storage', {type: 'nbs', nbsGroupBy: 'disk_usage'}).goto();
    await expect(page.getByRole('button', {name: /40–50%/})).toBeVisible();
    await page.getByRole('button', {name: /40–50%/}).click();
    await expect(page.getByRole('link', {name: TABLETS[1].TabletId, exact: true})).toBeVisible();
    await expect(page.getByRole('link', {name: TABLETS[1].TabletId, exact: true})).toHaveAttribute(
        'href',
        new RegExp(`/tablets/app\\?TabletID=${TABLETS[1].TabletId}$`),
    );
    await expect(page.getByText('volume-42', {exact: true})).toBeVisible();
    await expect(page.getByText('45.0%', {exact: true})).toBeVisible();
    await page.getByRole('button', {name: /≥100%/}).click();
    await expect(page.getByText('120.0%', {exact: true})).toBeVisible();
    await page.getByRole('button', {name: /No data/}).click();
    await expect(page.getByRole('link', {name: TABLETS[2].TabletId, exact: true})).toBeVisible();
    await page.getByLabel('Group by', {exact: true}).click();
    await page.getByRole('option', {name: 'Degrade', exact: true}).click();
    await expect(page).toHaveURL(/nbsGroupBy=degrade/);
    await page.getByRole('button', {name: /Degrade: 2/}).click();
    await expect(page.getByRole('link', {name: TABLETS[0].TabletId, exact: true})).toBeVisible();
    await expect(page.getByText('−1: 0 · −2: 1 · −3: 0', {exact: true})).toBeVisible();
    await expect(page.getByText('−1: 2 · −2: 0 · −3: 0', {exact: true})).toBeVisible();
    await expect(page.getByText('Groups with unknown status: 1', {exact: true})).toBeVisible();
});

test('DDisk sorting sends the selected role and direction to CMS and survives reload', async ({
    page,
}) => {
    const requests: URLSearchParams[] = [];
    await page.route('**/cms/api/json/ddisk/disks?*', (route) => {
        requests.push(new URL(route.request().url()).searchParams);
        return route.fulfill({
            json: {
                Status: {Code: 'OK'},
                TotalCount: 1,
                UnfilteredCount: 1,
                Disks: [
                    {
                        DiskId: {NodeId: 42, PDiskId: 1000, DDiskSlotId: 1010},
                        StoragePoolName: 'pool-a',
                        DDiskPath: 'actors/ddisks/ddisk_p000001000_s000001010',
                        PersistentBufferId: '[42:5893148750:1010]',
                        State: 'Normal',
                        Available: true,
                        DDiskOccupancy: 0,
                        PersistentBufferOccupancy: 0.75,
                        DDiskTabletCount: 12345,
                        PersistentBufferTabletCount: 67890,
                    },
                ],
            },
        });
    });
    await new PageModel(page, 'cluster/storage', {type: 'ddisks'}).goto();
    await expect(page.getByText('42:1000:1010', {exact: true})).toBeVisible();
    await expect(page.getByText('pool-a', {exact: true})).toBeVisible();
    await expect(page.getByRole('link', {name: '42:1000:1010', exact: true})).toHaveAttribute(
        'href',
        /\/node\/42\/actors\/ddisks\/ddisk_p000001000_s000001010$/,
    );
    await expect(
        page.getByRole('link', {name: '[42:5893148750:1010]', exact: true}),
    ).toHaveAttribute('href', /\/node\/42\/actors\/persistent_buffer\?/);
    await expect(page.getByText('12345', {exact: true})).toBeVisible();
    await expect(page.getByText('67890', {exact: true})).toBeVisible();
    expect(requests[0].get('include_tablet_ids')).toBe('false');
    expect(requests[0].get('inventory')).toBe('true');
    await expect(page.getByText('0.0%', {exact: true})).toBeVisible();
    await expect(page.getByText('75.0%', {exact: true})).toBeVisible();
    await page.getByLabel('Sort by', {exact: true}).click();
    await page.getByRole('option', {name: 'Persistent Buffer usage', exact: true}).click();
    await page.getByRole('checkbox', {name: 'Descending', exact: true}).check();
    await expect
        .poll(() =>
            requests.some(
                (p) =>
                    p.get('sort_by') === 'persistent_buffer_occupancy' &&
                    p.get('sort_desc') === 'true',
            ),
        )
        .toBe(true);
    await page.reload();
    await expect(page.getByRole('checkbox', {name: 'Descending', exact: true})).toBeChecked();
    await expect(page.getByLabel('Sort by', {exact: true})).toContainText(
        'Persistent Buffer usage',
    );
    await page.getByLabel('Sort by', {exact: true}).click();
    await page.getByRole('option', {name: 'DDisk usage', exact: true}).click();
    await expect
        .poll(() => requests.some((p) => p.get('sort_by') === 'ddisk_occupancy'))
        .toBe(true);
});

test('disk inventory groups by PDisk state and applies an exact location', async ({page}) => {
    const requests: URLSearchParams[] = [];
    await page.route('**/cms/api/json/ddisk/disks?*', (route) => {
        const params = new URL(route.request().url()).searchParams;
        requests.push(params);
        const summary = params.get('groups_only') === 'true';
        return route.fulfill({
            json: {
                Status: {Code: 'OK'},
                UnfilteredCount: 1,
                TotalCount: 1,
                Groups: summary ? [{Name: 'Normal', Count: 1}] : undefined,
                Disks: summary
                    ? undefined
                    : [
                          {
                              DiskId: {NodeId: 42, PDiskId: 1000, DDiskSlotId: 1010},
                              State: 'Normal',
                              DDiskStatus: 'Ready',
                              PersistentBufferStatus: 'Broken',
                              PersistentBufferStatusReason: 'PB I/O error',
                          },
                      ],
            },
        });
    });
    await new PageModel(page, 'cluster/storage', {
        type: 'ddisks',
        ddisksGroupBy: 'state',
        ddisksNodeId: '42',
        ddisksPDiskId: '1000',
    }).goto();
    await expect(page.getByText('Node 42', {exact: true})).toBeVisible();
    await expect(page.getByText('PDisk 1000', {exact: true})).toBeVisible();
    await page.getByRole('button', {name: /Normal/}).click();
    await expect(page.getByText('PB I/O error', {exact: true})).toBeVisible();
    expect(
        requests.some(
            (params) =>
                params.get('inventory') === 'true' &&
                params.get('group_by') === 'state' &&
                params.get('node_id') === '42' &&
                params.get('pdisk_id') === '1000' &&
                params.get('groups_only') === 'true',
        ),
    ).toBe(true);
    expect(
        requests.some(
            (params) =>
                params.get('node_id') === '42' &&
                params.get('pdisk_id') === '1000' &&
                params.get('filter_group') === 'Normal' &&
                !params.has('groups_only'),
        ),
    ).toBe(true);
    await page.getByRole('button', {name: 'Clear location filter'}).click();
    await expect(page).not.toHaveURL(/ddisks(?:Node|PDisk)Id=/);
    await expect
        .poll(() =>
            requests.some(
                (params) =>
                    params.get('groups_only') === 'true' &&
                    !params.has('node_id') &&
                    !params.has('pdisk_id'),
            ),
        )
        .toBe(true);
});

for (const scenario of ['unconfigured', 'legacy']) {
    test(`NBS tabs are unavailable on a ${scenario} cluster`, async ({page}) => {
        let discoveryRequests = 0;
        let cmsRequests = 0;
        if (scenario === 'legacy') {
            await page.route('**/viewer/capabilities*', (route) =>
                route.fulfill({json: {Capabilities: {'/storage/groups': 10, '/viewer/nodes': 20}}}),
            );
        }
        await page.route('**/storage/nbs*', (route) => {
            ++discoveryRequests;
            return route.fulfill({json: {Configured: false}});
        });
        await page.route('**/cms/api/json/ddisk/**', (route) => {
            ++cmsRequests;
            return route.fulfill({json: {Status: {Code: 'OK'}, TotalCount: 0}});
        });
        await new PageModel(page, 'cluster/storage', {type: 'ddisks'}).goto();
        await expect(page.getByRole('radio', {name: 'Groups'})).toBeChecked();
        await expect(page.getByRole('radio', {name: 'NBS tablets'})).toHaveCount(0);
        await expect(page.getByRole('radio', {name: 'DDisk', exact: true})).toHaveCount(0);
        await expect(page).not.toHaveURL(/type=ddisks/);
        expect(cmsRequests).toBe(0);
        expect(discoveryRequests > 0).toBe(scenario === 'unconfigured');
    });
}

for (const scenario of [
    {name: 'missing sample', hasWhiteboardData: false, state: 'Normal', failed: false},
    {name: 'faulty PDisk', hasWhiteboardData: true, state: 'DeviceIoError', failed: true},
    {name: 'healthy', hasWhiteboardData: true, state: 'Normal', failed: false},
]) {
    test(`Nodes DDisk color: ${scenario.name}`, async ({page}, testInfo) => {
        await page.route('**/viewer/json/nodes?*', (route) =>
            route.fulfill({
                json: {
                    TotalNodes: '1',
                    FoundNodes: '1',
                    Nodes: [
                        {
                            NodeId: 42,
                            SystemState: {NodeId: 42, Host: 'storage-node.ydb', Roles: ['Storage']},
                            PDisks: [{PDiskId: 1000, NodeId: 42, State: scenario.state}],
                            DDisks: [
                                {
                                    NodeId: 42,
                                    PDiskId: 1000,
                                    DDiskSlotId: 1010,
                                    HasWhiteboardData: scenario.hasWhiteboardData,
                                    PersistentBufferId: '[42:5893148750:1010]',
                                    DDiskOccupancy: 0.25,
                                },
                            ],
                        },
                    ],
                },
            }),
        );
        await new PageModel(page, 'cluster/storage', {type: 'nodes'}).goto();
        const disk = page.getByRole('button', {name: 'DDisk 42:1000:1010', exact: true});
        await expect(disk).toBeVisible();
        if (!scenario.hasWhiteboardData) {
            await expect(disk).toHaveClass(/ydb-ddisk_unavailable/);
        }
        if (scenario.failed) {
            await expect(disk).toHaveClass(/ydb-ddisk_failed/);
        } else {
            await expect(disk).not.toHaveClass(/ydb-ddisk_failed/);
        }
        const colors = await disk.evaluate((element) => {
            const style = getComputedStyle(element);
            const probe = document.createElement('div');
            probe.style.backgroundColor = 'var(--ydb-color-status-red)';
            element.appendChild(probe);
            const red = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return {actual: style.backgroundColor, red};
        });
        expect(colors.actual === colors.red).toBe(scenario.failed);
        await page.screenshot({path: testInfo.outputPath('ddisk-nodes.png')});
    });
}

test('CMS application errors are visible even with HTTP 200', async ({page}) => {
    await page.route('**/cms/api/json/ddisk/tablets?*', (route) =>
        route.fulfill({
            json: {Status: {Code: 'ERROR_TEMP', Reason: 'Cannot collect cluster state'}},
        }),
    );
    await new PageModel(page, 'cluster/storage', {type: 'nbs'}).goto();
    await expect(
        page.getByText('Cannot collect cluster state', {exact: false}).first(),
    ).toBeVisible();
});

test('tablet groups load on click, filter degraded groups and restore the mode', async ({
    page,
}, testInfo) => {
    const snapshots: string[] = [];
    let inventoryRequests = 0;
    const tabletId = TABLETS[0].TabletId;
    const healthy = {NodeId: 1, PDiskId: 1, DDiskSlotId: 1010};
    const failed = {NodeId: 2, PDiskId: 1, DDiskSlotId: 1010};
    await page.route('**/cms/api/json/ddisk/tablets?*', (route) =>
        route.fulfill({
            json: {
                Status: {Code: 'OK'},
                TotalCount: 1,
                Tablets: [TABLETS[0]],
            },
        }),
    );
    await page.route('**/cms/api/json/ddisk/tablet?*', (route) => {
        const params = new URL(route.request().url()).searchParams;
        expect(params.get('include_health')).toBe('true');
        snapshots.push(params.get('tablet_id') || '');
        return route.fulfill({
            json: {
                Status: 'OK',
                TabletId: tabletId,
                Revision: 1,
                Slots: [
                    healthy,
                    {
                        ...failed,
                        PersistentBufferId: '[2:5893148750:1010]',
                        DDiskPath: 'actors/ddisks/ddisk_p000000001_s000001010',
                    },
                ],
                Groups: [
                    {
                        DirectBlockGroupId: 100,
                        NumVChunksClaimed: 1,
                        DDiskId: [healthy],
                        DDiskHealth: [{Status: 'Ready'}],
                        UnavailableDDiskCount: 0,
                        UnknownDDiskCount: 0,
                        MonitoredQuorum: 'Quorum',
                    },
                    {
                        DirectBlockGroupId: 101,
                        NumVChunksClaimed: 2,
                        DDiskId: [failed],
                        DDiskHealth: [{Status: 'Ready'}],
                        UnavailableDDiskCount: 0,
                        UnknownDDiskCount: 0,
                        PersistentBufferDDiskId: [{}, failed],
                        PersistentBufferHealth: [{}, {Status: 'Broken', Reason: 'PB I/O error'}],
                        UnavailablePersistentBufferCount: 1,
                        UnknownPersistentBufferCount: 0,
                        MonitoredQuorum: 'NoQuorum',
                    },
                ],
            },
        });
    });
    await page.route('**/cms/api/json/ddisk/disks?*', (route) => {
        ++inventoryRequests;
        return route.fulfill({
            json: {Status: {Code: 'OK'}, TotalCount: 0},
        });
    });
    await new PageModel(page, 'cluster/storage', {type: 'nbs'}).goto();
    const button = page.getByRole('button', {name: 'Show groups for tablet ' + tabletId});
    await expect(button).toBeVisible();
    expect(snapshots).toEqual([]);
    await button.click();
    await expect(page.getByText('100', {exact: true})).toBeVisible();
    await expect(page.getByText('101', {exact: true})).toBeVisible();
    expect(snapshots).toContain(tabletId);
    expect(inventoryRequests).toBe(0);
    await page.getByLabel('Show groups', {exact: true}).click();
    await page.getByRole('option', {name: 'Groups with problems', exact: true}).click();
    await expect(page.getByText('100', {exact: true})).not.toBeVisible();
    await expect(page.getByText('101', {exact: true})).toBeVisible();
    await expect(page).toHaveURL(/nbsGroupsMode=degraded/);
    await page.reload();
    await expect(page.getByLabel('Show groups', {exact: true})).toContainText(
        'Groups with problems',
    );
    await expect(page.getByText('101', {exact: true})).toBeVisible();
    await expect(page.getByText('100', {exact: true})).not.toBeVisible();
    await expect
        .poll(() =>
            page.getByText('101', {exact: true}).evaluate((cell) => {
                const head = cell.closest('table')?.querySelector('thead');
                return Boolean(
                    head && cell.getBoundingClientRect().top >= head.getBoundingClientRect().bottom,
                );
            }),
        )
        .toBe(true);
    await expect(page.getByText('No quorum', {exact: true})).toBeVisible();
    await expect(page.getByText('1 unavailable · 0 unknown', {exact: true})).toBeVisible();
    await expect(page.getByRole('button', {name: 'DDisk 2:1:1010', exact: true})).not.toHaveClass(
        /ydb-ddisk_failed/,
    );
    const buffer = page.getByRole('button', {name: 'Persistent Buffer 2:1:1010', exact: true});
    await expect(buffer).toHaveClass(/ydb-ddisk_failed/);
    await page.screenshot({path: testInfo.outputPath('tablet-degraded-groups.png')});
    await buffer.hover();
    await expect(
        page.getByRole('link', {name: '[2:5893148750:1010]', exact: true}),
    ).toHaveAttribute('href', /\/node\/2\/actors\/persistent_buffer\?/);
    await page.getByLabel('Show groups', {exact: true}).click();
    await page.getByRole('option', {name: 'All groups', exact: true}).click();
    await expect(page.getByText('100', {exact: true})).toBeVisible();
    await page.locator('button[aria-label="Close"]').click();
    await expect(page.getByText('100', {exact: true})).not.toBeVisible();
    expect(inventoryRequests).toBe(0);
});
