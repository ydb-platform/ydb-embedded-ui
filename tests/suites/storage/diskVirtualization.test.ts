import type {Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {ClusterStorageTable} from '../paginatedTable/paginatedTable';

import {StoragePage} from './StoragePage';
import {createMockStorageGroupsResponse} from './mockStorageGroups';
import {DATABASE, setupVDiskColoringMocks} from './vdiskColoringMocks';

const GROUP_ID = '9000000000';

async function openGroups(
    page: Page,
    expertMode: boolean,
    response = createMockStorageGroupsResponse(),
) {
    await page.setViewportSize({width: 480, height: 720});
    await page.addInitScript((expert) => {
        localStorage.setItem('enableStorageExpertMode', 'true');
        localStorage.setItem('storageExpertMode', JSON.stringify(expert));
        localStorage.setItem('storageVDisksGroupBy', JSON.stringify('All'));
        localStorage.setItem('storagePDisksGroupBy', JSON.stringify('All'));
        localStorage.setItem(
            'storageGroupsSelectedColumns',
            JSON.stringify([
                {id: 'GroupId', selected: true},
                {id: expert ? 'VDisksPDisks' : 'VDisks', selected: true},
            ]),
        );
    }, expertMode);
    await setupVDiskColoringMocks(page, response);
    await page.route('**/storage/groups?*', (route) => {
        const params = new URL(route.request().url()).searchParams;
        const offset = Number(params.get('offset') || 0);
        const limit = Number(params.get('limit') ?? response.StorageGroups?.length ?? 0);
        return route.fulfill({
            json: {
                ...response,
                StorageGroups: response.StorageGroups?.slice(offset, offset + limit),
            },
        });
    });
    const storagePage = new StoragePage(page);
    await storagePage.goto({
        database: DATABASE,
        type: 'groups',
        storageExpertMode: String(expertMode),
        vdisksGroupBy: 'All',
        pdisksGroupBy: 'All',
    });
    await expect(storagePage.getGroupRow(GROUP_ID)).toBeVisible();
    return storagePage;
}

for (const expertMode of [false, true]) {
    test(`renders group disks as they enter the viewport (expert: ${expertMode})`, async ({
        page,
    }) => {
        const storagePage = await openGroups(page, expertMode);
        const items = storagePage.getGroupVDiskItems(GROUP_ID, expertMode);
        await expect(items).toHaveCount(11);
        await expect(items.first().getByRole('link').first()).toBeVisible();
        const disk = items.nth(7);
        await expect(disk).not.toBeInViewport();
        await expect(disk.getByRole('link')).toHaveCount(0);

        const width = await disk.evaluate((element) => element.getBoundingClientRect().width);
        await disk.scrollIntoViewIfNeeded();
        await expect(disk.getByRole('link')).toBeInViewport();
        await expect(disk.getByRole('link')).toHaveAttribute('href', /9000000000-1-0-0-7/);
        expect(await disk.evaluate((element) => element.getBoundingClientRect().width)).toBe(width);
        await disk.getByRole('link').hover();
        await expect(page.locator('.ydb-popover').filter({visible: true})).toContainText(
            '9000000000-1-0-0-7',
        );
        await page.mouse.move(0, 0);
        await expect(page.locator('.ydb-popover').filter({visible: true})).toHaveCount(0);
        await items.first().scrollIntoViewIfNeeded();
        await expect(disk.getByRole('link')).toHaveCount(0);
        await page.setViewportSize({width: 1600, height: 720});
        await expect(disk.getByRole('link')).toBeInViewport();
    });
}

test('virtualizes group PDisks while preserving their width and paired hover', async ({page}) => {
    const storagePage = await openGroups(page, true);
    const pDisk = storagePage.getGroupPDiskItems(GROUP_ID).nth(5);
    await expect(pDisk).not.toBeInViewport();
    await expect(pDisk.getByRole('link')).toHaveCount(0);
    const width = await pDisk.evaluate((element) => element.getBoundingClientRect().width);
    await pDisk.scrollIntoViewIfNeeded();
    await expect(pDisk.getByRole('link')).toBeInViewport();
    expect(await pDisk.evaluate((element) => element.getBoundingClientRect().width)).toBe(width);
    await pDisk.getByRole('link').hover();
    await expect(page.locator('.ydb-popover').filter({visible: true})).toContainText('7005-105');
    const pairedVDisk = storagePage.getGroupVDiskItems(GROUP_ID, true).nth(5);
    await expect(pairedVDisk.locator('.storage-disk-progress-bar')).toHaveClass(/_highlighted/);
    await page.mouse.move(0, 0);
    await expect(page.locator('.ydb-popover').filter({visible: true})).toHaveCount(0);
    await pairedVDisk.scrollIntoViewIfNeeded();
    await expect(pairedVDisk.getByRole('link')).toBeInViewport();
    await expect(pDisk.getByRole('link')).toHaveCount(0);
});

test('keeps keyboard access to valid PDisks when boundary disk data is missing', async ({
    page,
    browserName,
}) => {
    const response = createMockStorageGroupsResponse();
    const vDisks = response.StorageGroups?.[0]?.VDisks;
    if (!vDisks) {
        throw new Error('Missing storage group fixture');
    }
    delete vDisks[0].PDisk;
    delete vDisks[10].PDisk;
    const storagePage = await openGroups(page, true, response);
    const lastVDisk = storagePage.getGroupVDiskItems(GROUP_ID, true).last();
    await lastVDisk.evaluate((element) =>
        element.scrollIntoView({block: 'nearest', inline: 'end'}),
    );
    await lastVDisk
        .getByRole('link')
        .evaluate((element: HTMLElement) => element.focus({preventScroll: true}));
    const modifier = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+' : '';
    await page.keyboard.press(`${modifier}Tab`);
    const firstValidPDisk = storagePage.getGroupPDiskItems(GROUP_ID).nth(1).getByRole('link');
    await expect(firstValidPDisk).toBeFocused();
    await expect(firstValidPDisk).toHaveAttribute('href', /nodeId=7001.*pDiskId=101/);
});

test('keeps a donor stack mounted until its delayed popup close finishes', async ({page}) => {
    const storagePage = await openGroups(page, true);
    const items = storagePage.getGroupVDiskItems('9000000001', true);
    const disk = items.nth(7);
    await disk.scrollIntoViewIfNeeded();
    const mainDisk = disk.getByRole('link').first();
    const donor = disk.getByRole('link').nth(1);
    await expect(mainDisk).toBeInViewport();
    await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
    await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
    await mainDisk.hover();
    await page.clock.runFor(250);
    await donor.hover();
    await page.clock.runFor(250);
    const popup = page.locator('.ydb-popover').filter({visible: true});
    await expect(
        popup.filter({has: page.getByText('9000000001-1-0-0-107', {exact: true})}),
    ).toBeVisible();
    await page.mouse.move(0, 0);
    await page.locator('.ydb-cluster').evaluate((element) => element.scrollTo({left: 0}));
    await expect(disk).not.toBeInViewport();
    await expect(disk.getByRole('link')).toHaveCount(2);
    await page.clock.resume();
    await expect(disk.getByRole('link')).toHaveCount(0);
    await disk.scrollIntoViewIfNeeded();
    await expect(mainDisk).toBeInViewport();
    await expect(popup).toHaveCount(0);
});

for (const expertMode of [false, true]) {
    test(`keeps group disk rendering bounded during vertical scrolling (expert: ${expertMode})`, async ({
        page,
    }, testInfo) => {
        const response = createMockStorageGroupsResponse();
        const group = response.StorageGroups?.[0];
        const vDisks = group?.VDisks;
        if (!group || !vDisks) {
            throw new Error('Missing storage group fixture');
        }
        response.StorageGroups = Array.from({length: 40}, (_, index) => {
            const groupId = 9000000000 + index;
            return {
                ...group,
                GroupId: String(groupId),
                VDisks: vDisks.map((disk, diskIndex) => ({
                    ...disk,
                    VDiskId: `${groupId}-1-0-0-${diskIndex}`,
                    Whiteboard: disk.Whiteboard
                        ? {
                              ...disk.Whiteboard,
                              VDiskId: {...disk.Whiteboard.VDiskId, GroupID: groupId},
                          }
                        : undefined,
                })),
            };
        });
        response.TotalGroups = response.FoundGroups = 40;
        await page.addInitScript(
            (theme) => localStorage.setItem('theme', theme),
            expertMode ? 'dark' : 'light',
        );
        const storagePage = await openGroups(page, expertMode, response);
        const renderedVDisks = storagePage.table.locator('.ydb-vdisk-component');
        await expect.poll(() => renderedVDisks.count()).toBeLessThan(200);
        const table = new ClusterStorageTable(page);
        await table.scrollToBottom();
        const lastRowDisk = storagePage.getGroupVDiskItems('9000000039', expertMode).first();
        await expect(lastRowDisk.getByRole('link')).toBeInViewport();
        await expect(lastRowDisk.getByRole('link')).toHaveAttribute('href', /9000000039-1-0-0-0/);
        await expect.poll(() => renderedVDisks.count()).toBeLessThan(200);
        await table.scrollToPosition(0);
        await expect(
            storagePage.getGroupVDiskItems(GROUP_ID, expertMode).first().getByRole('link'),
        ).toBeInViewport();
        await page.screenshot({path: testInfo.outputPath('virtualized-storage-groups.png')});
    });
}

for (const width of [320, 480]) {
    test(`keeps keyboard navigation across virtualized VDisks and PDisks (viewport: ${width})`, async ({
        page,
        browserName,
    }) => {
        const storagePage = await openGroups(page, true);
        await page.setViewportSize({width, height: 720});
        const modifier = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+' : '';
        const vDisks = storagePage.getGroupVDiskItems(GROUP_ID, true);
        const pDisks = storagePage.getGroupPDiskItems(GROUP_ID);
        const links = [vDisks, pDisks].flatMap((items) =>
            Array.from({length: 11}, (_, index) => items.nth(index).getByRole('link')),
        );
        await links[0].focus();
        for (const link of links.slice(1)) {
            await page.keyboard.press(`${modifier}Tab`);
            await expect(link).toBeFocused();
            await expect(link).toBeInViewport();
        }
        for (const link of links.slice(0, -1).toReversed()) {
            await page.keyboard.press(`${modifier}Shift+Tab`);
            await expect(link).toBeFocused();
            await expect(link).toBeInViewport();
        }
    });
}
