import {expect, test} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

import {setupVDiskPageMocks} from './vdiskPageMocks';

const TABLETS = [
    {TabletId: '72075186224037901', GroupsCount: 2, DiskUsage: 1.2, Degrade: 2},
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
    await page.setViewportSize({width: 1600, height: 1100});
});

test('NBS tablets group by usage and degrade and keep unknown monitoring separate', async ({
    page,
}) => {
    await page.route('**/cms/api/json/ddisk/tablets?*', (route) => {
        const params = new URL(route.request().url()).searchParams;
        const groupBy = params.get('group_by');
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
                Groups: TABLETS.map((tablet) => ({Name: name(tablet), Count: 1})),
                Tablets: rows.slice(
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

for (const scenario of [
    {name: 'disconnected', hasWhiteboardData: false, state: 'Normal', failed: true},
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
