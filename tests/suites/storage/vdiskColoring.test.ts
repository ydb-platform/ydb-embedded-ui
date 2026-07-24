import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {VDisksGroupBy} from '../../../src/containers/Storage/StorageExpertModePanel/constants';
import type {VDisksGroupByValue} from '../../../src/containers/Storage/StorageExpertModePanel/constants';
import {storagePage} from '../../utils/constants';

import {
    MISSING_FRONT_QUEUES_VDISK_INDEX,
    MISSING_WHITEBOARD_VDISK_INDEX,
} from './mockStorageGroups';
import {DATABASE, setupVDiskColoringMocks} from './vdiskColoringMocks';

const VDISKS_COUNT = 10;

const VDISK_GROUP_BY_MODES: {value: VDisksGroupByValue; slug: string}[] = [
    {value: VDisksGroupBy.State, slug: 'state'},
    {value: VDisksGroupBy.Space, slug: 'space'},
    {value: VDisksGroupBy.FrontQueues, slug: 'frontqueues'},
    {value: VDisksGroupBy.Compaction, slug: 'compaction'},
];

const STORAGE_GROUPS = [
    {index: 0, hasDonors: false},
    {index: 1, hasDonors: true},
] as const;

const FORCED_HOVER_ROW_CLASS = 'ydb-paginated-table__row_forced-hover';
const FORCED_HOVERED_DISK_CLASS = 'storage-disk-progress-bar_highlighted';
const FORCED_EXPANDED_STACK_CLASS = 'ydb-stack_expanded';

async function enableExpertMode(page: Page, vdisksGroupBy: VDisksGroupByValue) {
    await page.addInitScript((groupByValue) => {
        localStorage.setItem('enableStorageExpertMode', JSON.stringify(true));
        localStorage.setItem('storageExpertMode', JSON.stringify(true));
        localStorage.setItem('storageVDisksGroupBy', JSON.stringify(groupByValue));
        localStorage.setItem(
            'storageGroupsSelectedColumns',
            JSON.stringify([
                {id: 'GroupId', selected: true},
                {id: 'PoolName', selected: true},
                {id: 'Erasure', selected: true},
                {id: 'Used', selected: true},
                {id: 'VDisks', selected: true},
                {id: 'VDisksPDisks', selected: true},
            ]),
        );
    }, vdisksGroupBy);
}

async function gotoStoragePage(page: Page, vdisksGroupBy: VDisksGroupByValue) {
    const url = new URL(storagePage, 'http://localhost');
    url.searchParams.set('database', DATABASE);
    url.searchParams.set('type', 'groups');
    url.searchParams.set('storageExpertMode', 'true');
    url.searchParams.set('vdisksGroupBy', vdisksGroupBy);

    await page.goto(`${url.pathname}${url.search}`);
    await expect(page.locator('.ydb-storage-disks').first()).toBeVisible();
}

async function hideFloatingPopups(page: Page) {
    await page.addStyleTag({
        content: `
            [data-floating-ui-portal] {
                display: none !important;
                pointer-events: none !important;
            }
        `,
    });
}

async function setupForcedHoverStyles(page: Page) {
    await page.addStyleTag({
        content: `
            .ydb-paginated-table__row.${FORCED_HOVER_ROW_CLASS} {
                background: var(--paginated-table-hover-color);
            }

            .ydb-paginated-table__row.${FORCED_HOVER_ROW_CLASS} .ydb-stack__item {
                background: var(--ydb-data-table-color-hover);
            }
        `,
    });
}

function getStorageGroupRow(page: Page, index: number) {
    return page.locator('.ydb-paginated-table__row').nth(index);
}

function getStorageDisksArea(row: Locator) {
    return row.locator('.ydb-storage-disks').first();
}

function getVDiskItems(row: Locator) {
    return getStorageDisksArea(row).locator('.ydb-storage-disks__vdisk-item');
}

function getVDiskProgressBar(item: Locator) {
    return item.locator('.storage-disk-progress-bar').first();
}

async function clearForcedHover(page: Page) {
    await page.locator(`.${FORCED_HOVER_ROW_CLASS}`).evaluateAll((rows, rowClass) => {
        rows.forEach((row) => row.classList.remove(rowClass));
    }, FORCED_HOVER_ROW_CLASS);
    await page.locator(`.${FORCED_HOVERED_DISK_CLASS}`).evaluateAll((disks, diskClass) => {
        disks.forEach((disk) => disk.classList.remove(diskClass));
    }, FORCED_HOVERED_DISK_CLASS);
    await page.locator(`.${FORCED_EXPANDED_STACK_CLASS}`).evaluateAll((stacks, stackClass) => {
        stacks.forEach((stack) => stack.classList.remove(stackClass));
    }, FORCED_EXPANDED_STACK_CLASS);
}

async function forceHoverStorageGroupVDiskItems(page: Page, groupIndex: number) {
    await clearForcedHover(page);

    const row = getStorageGroupRow(page, groupIndex);
    await row.evaluate((element, rowClass) => {
        element.classList.add(rowClass);
    }, FORCED_HOVER_ROW_CLASS);
    await row.locator('.storage-disk-progress-bar').evaluateAll((disks, diskClass) => {
        disks.forEach((disk) => disk.classList.add(diskClass));
    }, FORCED_HOVERED_DISK_CLASS);
    await row.locator('.ydb-stack').evaluateAll((stacks, stackClass) => {
        stacks.forEach((stack) => stack.classList.add(stackClass));
    }, FORCED_EXPANDED_STACK_CLASS);
}

async function expectStorageRowsScreenshot(page: Page, name: string) {
    const firstStorageDisksArea = getStorageDisksArea(getStorageGroupRow(page, 0));
    const secondStorageDisksArea = getStorageDisksArea(getStorageGroupRow(page, 1));
    const firstBox = await firstStorageDisksArea.boundingBox();
    const secondBox = await secondStorageDisksArea.boundingBox();

    if (!firstBox || !secondBox) {
        throw new Error(`Cannot take screenshot "${name}": storage rows have no bounding box`);
    }

    const x = Math.max(0, Math.min(firstBox.x, secondBox.x) - 8);
    const y = Math.max(0, Math.min(firstBox.y, secondBox.y) - 8);
    const right = Math.max(firstBox.x + firstBox.width, secondBox.x + secondBox.width) + 32;
    const bottom = Math.max(firstBox.y + firstBox.height, secondBox.y + secondBox.height) + 72;
    const viewport = page.viewportSize();

    await expect(page).toHaveScreenshot(name, {
        clip: {
            x,
            y,
            width: viewport ? Math.min(right - x, viewport.width - x) : right - x,
            height: viewport ? Math.min(bottom - y, viewport.height - y) : bottom - y,
        },
    });
}

async function expectStorageGroupRowsReady(page: Page) {
    for (const group of STORAGE_GROUPS) {
        const row = getStorageGroupRow(page, group.index);
        const storageDisksArea = getStorageDisksArea(row);
        const vDiskItems = getVDiskItems(row);

        await expect(storageDisksArea).toBeVisible();
        await expect(vDiskItems).toHaveCount(VDISKS_COUNT);
        await expect(getVDiskProgressBar(vDiskItems.first())).toBeVisible();
        await expect(row.locator('.ydb-stack')).toHaveCount(group.hasDonors ? VDISKS_COUNT : 0);
    }
}

async function preparePage(page: Page, vdisksGroupBy: VDisksGroupByValue) {
    await page.setViewportSize({width: 1500, height: 1000});
    await enableExpertMode(page, vdisksGroupBy);
    await setupVDiskColoringMocks(page);
    await gotoStoragePage(page, vdisksGroupBy);
    await hideFloatingPopups(page);
    await setupForcedHoverStyles(page);
    await expectStorageGroupRowsReady(page);
}

test.describe('VDisk Coloring - Expert Mode visual snapshots', () => {
    test.describe.configure({timeout: 60_000});

    test('distinguishes missing Whiteboard data from missing FrontQueues', async ({page}) => {
        await preparePage(page, VDisksGroupBy.FrontQueues);

        const vDiskItems = getVDiskItems(getStorageGroupRow(page, 0));
        const noWhiteboardVDisk = getVDiskProgressBar(
            vDiskItems.nth(MISSING_WHITEBOARD_VDISK_INDEX),
        );
        const noFrontQueuesVDisk = getVDiskProgressBar(
            vDiskItems.nth(MISSING_FRONT_QUEUES_VDISK_INDEX),
        );

        await expect(noWhiteboardVDisk).toHaveText('N/D');
        await expect(noWhiteboardVDisk.locator('.storage-disk-progress-bar__icon')).toHaveCount(0);

        await expect(noFrontQueuesVDisk).not.toContainText('N/D');
        await expect(noFrontQueuesVDisk.locator('.storage-disk-progress-bar__icon')).toHaveCount(1);
    });

    for (const mode of VDISK_GROUP_BY_MODES) {
        test.describe(`${mode.value} mode`, () => {
            test('renders both storage group VDisk rows', async ({page}) => {
                await preparePage(page, mode.value);

                await forceHoverStorageGroupVDiskItems(page, 0);
                await expectStorageRowsScreenshot(
                    page,
                    `vdisk-${mode.slug}-all-disks-hover-group-1.png`,
                );

                await forceHoverStorageGroupVDiskItems(page, 1);
                await expectStorageRowsScreenshot(
                    page,
                    `vdisk-${mode.slug}-all-disks-hover-group-2.png`,
                );
            });
        });
    }
});
