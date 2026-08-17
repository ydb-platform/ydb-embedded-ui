import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {
    PDisksGroupBy,
    VDisksGroupBy,
} from '../../../src/containers/Storage/StorageExpertModePanel/constants';
import type {
    PDisksGroupByValue,
    VDisksGroupByValue,
} from '../../../src/containers/Storage/StorageExpertModePanel/constants';
import {TPDiskState} from '../../../src/types/api/pdisk';
import {storagePage} from '../../utils/constants';

import {
    ALL_GREEN_VDISK_INDEX,
    MISSING_FRONT_QUEUES_VDISK_INDEX,
    MISSING_STATE_VDISK_INDEX,
    MISSING_WHITEBOARD_VDISK_INDEX,
    createMockStorageGroupsResponse,
} from './mockStorageGroups';
import {DATABASE, setupVDiskColoringMocks} from './vdiskColoringMocks';

const VDISKS_COUNT = 11;
const FRONT_QUEUES_YELLOW_VDISK_INDEX = 2;
const STATE_ONLY_OK_VDISK_INDEX = 4;
const INITIAL_VDISK_INDEX = 5;
const RECOVERY_ERROR_VDISK_INDEX = 8;
const PDISK_ERROR_VDISK_INDEX = 9;
const TRANSPARENT_BACKGROUND = 'rgba(0, 0, 0, 0)';
const MISSING_INDICATOR_COLOR = 'rgb(162, 162, 162)';
const INITIAL_ICON_COLOR_TOKEN = '--g-color-base-warning-heavy';
const PDISK_ERROR_ICON_COLOR_TOKEN = '--g-color-base-danger-heavy';
const RECOVERY_ERROR_ICON_COLOR_TOKEN = '--g-color-text-primary';

const VDISK_GROUP_BY_MODES: {value: VDisksGroupByValue; slug: string}[] = [
    {value: VDisksGroupBy.State, slug: 'state'},
    {value: VDisksGroupBy.Space, slug: 'space'},
    {value: VDisksGroupBy.FrontQueues, slug: 'frontqueues'},
    {value: VDisksGroupBy.Compaction, slug: 'compaction'},
    {value: VDisksGroupBy.All, slug: 'all'},
];

const PDISK_GROUP_BY_MODES: {value: PDisksGroupByValue; slug: string}[] = [
    {value: PDisksGroupBy.State, slug: 'state'},
    {value: PDisksGroupBy.Space, slug: 'space'},
    {value: PDisksGroupBy.Drive, slug: 'drive'},
    {value: PDisksGroupBy.Decommit, slug: 'decommit'},
    {value: PDisksGroupBy.Maintenance, slug: 'maintenance'},
    {value: PDisksGroupBy.Device, slug: 'device'},
];

const STORAGE_GROUPS = [
    {index: 0, hasDonors: false},
    {index: 1, hasDonors: true},
] as const;

const FORCED_HOVER_ROW_CLASS = 'ydb-paginated-table__row_forced-hover';
const FORCED_HOVERED_DISK_CLASS = 'storage-disk-progress-bar_highlighted';
const FORCED_EXPANDED_STACK_CLASS = 'ydb-stack_expanded';
const ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR =
    '.storage-disk-progress-bar__all-mode-capacity-alert-indicator-slot';
const ALL_MODE_FRONT_QUEUES_SLOT_SELECTOR =
    '.storage-disk-progress-bar__all-mode-front-queues-indicator-slot';
const ALL_MODE_COMPACTION_SLOT_SELECTOR =
    '.storage-disk-progress-bar__all-mode-compaction-indicator-slot';

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

    const [storageGroupsResponse] = await Promise.all([
        page.waitForResponse(
            (response) => response.url().includes('/storage/groups') && response.ok(),
        ),
        page.goto(`${url.pathname}${url.search}`),
    ]);
    await storageGroupsResponse.finished();
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

function getPDiskItems(row: Locator) {
    return getStorageDisksArea(row).locator('.ydb-storage-disks__pdisk-item');
}

function getPDisksArea(row: Locator) {
    return getStorageDisksArea(row).locator('.ydb-storage-disks__pdisks-wrapper').first();
}

function getPDiskProgressBar(item: Locator) {
    return item.locator('.storage-disk-progress-bar').first();
}

async function getIconSvgMarkup(icon: Locator) {
    return icon.evaluate((element) => {
        const svg = element instanceof SVGElement ? element : element.querySelector('svg');

        if (!svg) {
            throw new Error('Expected an SVG icon');
        }

        return svg.innerHTML;
    });
}

function getVDiskFillBar(progressBar: Locator) {
    return progressBar.locator('.storage-disk-progress-bar__fill-bar');
}

async function expectAllocationFill(progressBar: Locator, allocatedPercent: number) {
    const fillBar = getVDiskFillBar(progressBar);

    await expect(progressBar).toHaveAttribute('aria-valuenow', String(allocatedPercent));
    await expect(fillBar).toHaveCount(1);
}

async function expectTransparentBackgroundWithFill(progressBar: Locator) {
    await expect(getVDiskFillBar(progressBar)).toHaveCount(1);
    await expect(progressBar).toHaveCSS('background-color', TRANSPARENT_BACKGROUND);
}

async function resolveThemeColor(page: Page, colorToken: string) {
    return page.locator('body').evaluate((element, token) => {
        const tokenDefinition = getComputedStyle(element).getPropertyValue(token).trim();
        if (!tokenDefinition) {
            throw new Error(`Theme color token ${token} is not defined`);
        }

        const probe = document.createElement('span');
        probe.style.setProperty('background-color', `var(${token})`);
        probe.style.setProperty('position', 'absolute');
        probe.style.setProperty('visibility', 'hidden');
        element.appendChild(probe);

        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();

        return color;
    }, colorToken);
}

async function resolveCaption2Typography(page: Page) {
    return page.locator('body').evaluate((element) => {
        const probe = document.createElement('span');
        probe.style.setProperty('position', 'absolute');
        probe.style.setProperty('visibility', 'hidden');
        probe.style.setProperty('font-family', 'var(--g-text-caption-font-family)');
        probe.style.setProperty('font-size', 'var(--g-text-caption-2-font-size)');
        probe.style.setProperty('font-weight', 'var(--g-text-caption-font-weight)');
        probe.style.setProperty('line-height', 'var(--g-text-caption-2-line-height)');
        element.appendChild(probe);

        const styles = getComputedStyle(probe);
        const typography = {
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            lineHeight: styles.lineHeight,
        };
        probe.remove();

        return typography;
    });
}

async function expectStatusIconMatchesReference(
    page: Page,
    progressBar: Locator,
    expectedColorToken: string,
    checkOverlap = false,
) {
    const icon = progressBar.locator('.storage-disk-progress-bar__icon_overlap-top-left');

    await expect(icon).toBeVisible();

    const [expectedColor, expectedBackgroundColor, actualColors] = await Promise.all([
        resolveThemeColor(page, expectedColorToken),
        resolveThemeColor(page, '--g-color-base-background'),
        icon.evaluate((element) => {
            return {
                actualBackgroundColor: getComputedStyle(element).backgroundColor,
                actualBackgroundImage: getComputedStyle(element).backgroundImage,
                actualColor: getComputedStyle(element).color,
            };
        }),
    ]);

    expect(actualColors.actualColor).toBe(expectedColor);
    expect(actualColors.actualBackgroundColor).toBe(TRANSPARENT_BACKGROUND);
    expect(actualColors.actualBackgroundImage).toContain(expectedBackgroundColor);

    if (checkOverlap) {
        const progressBarBox = await progressBar.boundingBox();
        const iconBox = await icon.boundingBox();

        if (!progressBarBox || !iconBox) {
            throw new Error('Cannot compare VDisk progress bar and status icon bounding boxes');
        }

        expect(iconBox.x).toBeLessThan(progressBarBox.x);
        expect(iconBox.y).toBeLessThan(progressBarBox.y);
        expect(iconBox.x + iconBox.width).toBeGreaterThan(progressBarBox.x);
        expect(iconBox.y + iconBox.height).toBeGreaterThan(progressBarBox.y);
    }
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

async function expectPDiskScreenshot(pDisks: Locator, name: string) {
    await expect(pDisks).toHaveScreenshot(name, {
        timeout: 60_000,
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

async function preparePDiskPage(page: Page, pdisksGroupBy: PDisksGroupByValue) {
    await page.addInitScript((groupByValue) => {
        localStorage.setItem('storagePDisksGroupBy', JSON.stringify(groupByValue));
    }, pdisksGroupBy);
    await preparePage(page, VDisksGroupBy.State);
}

test.describe('VDisk Coloring - Expert Mode visual snapshots', () => {
    test.describe.configure({timeout: 60_000});

    test('renders the PDisk State and Maintenance legends', async ({page}) => {
        await preparePage(page, VDisksGroupBy.State);

        const pDiskSelector = page.getByTestId('storage-pdisks-expert-mode');
        const legend = page.getByTestId('storage-pdisks-expert-mode-legend');
        const legendLabels = legend.locator('.g-label');
        const vDiskLegendLabels = page
            .locator('.ydb-storage-expert-mode-panel')
            .locator(':scope > .g-flex')
            .first()
            .locator('.g-label');

        await expect(pDiskSelector).toBeVisible();
        await expect(legendLabels).toHaveText([
            'Ok',
            'Initial',
            'Attention',
            'Stopped',
            'Error',
            'N/D',
        ]);
        await expect(legendLabels.nth(0)).toHaveClass(/g-label_theme_success/);
        await expect(legendLabels.nth(1)).toHaveClass(/g-label_theme_warning/);
        await expect(legendLabels.nth(2)).toHaveClass(/g-label_theme_danger/);
        await expect(legendLabels.nth(3)).toHaveClass(/g-label_theme_danger/);
        await expect(legendLabels.nth(4)).toHaveClass(/g-label_theme_danger/);
        await expect(legendLabels.nth(4)).toHaveClass(
            /ydb-storage-expert-mode-panel__label-danger-heavy/,
        );
        await expect(legendLabels.nth(5)).toHaveClass(/g-label_theme_unknown/);
        await expect(legendLabels.nth(0).locator('svg')).toHaveCount(0);
        await expect(legendLabels.nth(1).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(2).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(3).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(4).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(5).locator('svg')).toHaveCount(0);
        await expect(legend).toContainText('No statistics available');

        const matchingLegendIconIndexes = [
            {pDisk: 1, vDisk: 2},
            {pDisk: 2, vDisk: 3},
            {pDisk: 4, vDisk: 4},
        ] as const;

        for (const {pDisk, vDisk} of matchingLegendIconIndexes) {
            expect(await getIconSvgMarkup(legendLabels.nth(pDisk))).toBe(
                await getIconSvgMarkup(vDiskLegendLabels.nth(vDisk)),
            );
        }

        await pDiskSelector.getByRole('radio', {name: 'Maintenance'}).check();

        await expect(legendLabels).toHaveText(['Long term planned', 'No new VDisks', 'No request']);
        await expect(legendLabels.nth(0)).toHaveClass(/g-label_theme_danger/);
        await expect(legendLabels.nth(1)).toHaveClass(/g-label_theme_warning/);
        await expect(legendLabels.nth(2)).toHaveClass(/g-label_theme_success/);
        await expect(legendLabels.nth(0).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(1).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(2).locator('svg')).toHaveCount(0);
        await expect(page).toHaveURL(/pdisksGroupBy=Maintenance/);
    });

    test('renders storage group PDisks by State without allocation fill', async ({page}) => {
        const response = createMockStorageGroupsResponse();
        const vDisks = response.StorageGroups?.[0]?.VDisks;

        if (!vDisks) {
            throw new Error('Cannot prepare storage group PDisk State fixtures');
        }

        const pDiskStates = [
            undefined,
            TPDiskState.Normal,
            TPDiskState.Initial,
            TPDiskState.OpenFileError,
            TPDiskState.Stopped,
            TPDiskState.ChunkQuotaError,
        ] as const;
        const pDiskIndexes = [0, 4, 5, 6, 7, 8] as const;

        pDiskIndexes.forEach((pDiskIndex, index) => {
            if (vDisks[pDiskIndex].PDisk?.Whiteboard) {
                vDisks[pDiskIndex].PDisk.Whiteboard.State = pDiskStates[index];
            }
        });

        await page.setViewportSize({width: 1500, height: 1000});
        await enableExpertMode(page, VDisksGroupBy.State);
        await setupVDiskColoringMocks(page, response);
        await gotoStoragePage(page, VDisksGroupBy.State);
        await hideFloatingPopups(page);
        await expectStorageGroupRowsReady(page);

        const pDiskItems = getPDiskItems(getStorageGroupRow(page, 0));
        const vDiskItems = getVDiskItems(getStorageGroupRow(page, 0));
        const pDiskLegendLabels = page
            .getByTestId('storage-pdisks-expert-mode-legend')
            .locator('.g-label');
        const cases = [
            {
                pDiskIndex: 0,
                vDiskIndex: MISSING_STATE_VDISK_INDEX,
                color: 'grey',
                iconReference: 'vdisk',
            },
            {pDiskIndex: 4, vDiskIndex: 4, color: 'green', iconReference: undefined},
            {pDiskIndex: 5, vDiskIndex: 5, color: 'yellow', iconReference: 'vdisk'},
            {pDiskIndex: 6, vDiskIndex: 9, color: 'red', iconReference: 'vdisk'},
            {pDiskIndex: 7, vDiskIndex: 9, color: 'red', iconReference: 'stopped-legend'},
            {pDiskIndex: 8, vDiskIndex: 8, color: 'solidred', iconReference: 'vdisk'},
        ] as const;

        for (const {pDiskIndex, vDiskIndex, color, iconReference} of cases) {
            const pDiskItem = pDiskItems.nth(pDiskIndex);
            const progressBar = getPDiskProgressBar(pDiskItem);
            const vDiskProgressBar = getVDiskProgressBar(vDiskItems.nth(vDiskIndex));
            const icon = progressBar.locator('.storage-disk-progress-bar__icon');

            await expect(progressBar).toHaveClass(/storage-disk-progress-bar_mode-state/);
            await expect(progressBar).toHaveClass(new RegExp(`storage-disk-progress-bar_${color}`));
            await expect(progressBar.locator('.storage-disk-progress-bar__fill-bar')).toHaveCount(
                0,
            );
            await expect(progressBar).not.toHaveAttribute('aria-valuenow', /.+/);
            expect((await pDiskItem.boundingBox())?.width).toBe(55);

            if (iconReference === undefined) {
                await expect(icon).toHaveCount(0);
            } else {
                await expect(icon).toBeVisible();
                const expectedIcon =
                    iconReference === 'vdisk'
                        ? vDiskProgressBar.locator('.storage-disk-progress-bar__icon')
                        : pDiskLegendLabels.nth(3);

                expect(await getIconSvgMarkup(icon)).toBe(await getIconSvgMarkup(expectedIcon));
            }

            const [pDiskStyles, vDiskStyles] = await Promise.all(
                [progressBar, vDiskProgressBar].map((bar) =>
                    bar.evaluate((element) => {
                        const styles = getComputedStyle(element);

                        return {
                            backgroundColor: styles.backgroundColor,
                            borderColor: styles.borderColor,
                            iconColor: styles.getPropertyValue('--entity-state-icon-color').trim(),
                        };
                    }),
                ),
            );

            expect(pDiskStyles).toEqual(vDiskStyles);
        }
    });

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

    test.describe('All mode', () => {
        test('clamps allocation markers to their fixed VDisk cells', async ({page}) => {
            const response = createMockStorageGroupsResponse();
            const storageGroup = response.StorageGroups?.[0];

            if (!storageGroup) {
                throw new Error('Cannot prepare a single-VDisk storage group');
            }

            storageGroup.VDisks = storageGroup.VDisks?.slice(0, 1);
            response.TotalGroups = 1;
            response.FoundGroups = 1;
            response.StorageGroups = [storageGroup];

            await page.setViewportSize({width: 1500, height: 1000});
            await enableExpertMode(page, VDisksGroupBy.All);
            await setupVDiskColoringMocks(page, response);
            await gotoStoragePage(page, VDisksGroupBy.All);

            const vDiskItem = getVDiskItems(getStorageGroupRow(page, 0)).first();
            const allocationMarker = vDiskItem.locator('.ydb-storage-disks__vdisk-size-indicator');

            await expect(vDiskItem).toBeVisible();
            await expect(allocationMarker).toBeVisible();

            const [vDiskItemBox, allocationMarkerBox] = await Promise.all([
                vDiskItem.boundingBox(),
                allocationMarker.boundingBox(),
            ]);

            if (!vDiskItemBox || !allocationMarkerBox) {
                throw new Error('Cannot compare All-mode VDisk and allocation marker boxes');
            }

            expect(vDiskItemBox.width).toBe(65);
            expect(allocationMarkerBox.width).toBeLessThanOrEqual(65);
        });

        test('uses State visuals, keeps fill without labels, and preserves replication', async ({
            page,
        }) => {
            await preparePage(page, VDisksGroupBy.All);

            const ordinaryItems = getVDiskItems(getStorageGroupRow(page, 0));
            const stateOnlyOk = getVDiskProgressBar(ordinaryItems.nth(STATE_ONLY_OK_VDISK_INDEX));
            const initial = getVDiskProgressBar(ordinaryItems.nth(INITIAL_VDISK_INDEX));
            const missingCapacityAlert = getVDiskProgressBar(
                ordinaryItems.nth(PDISK_ERROR_VDISK_INDEX),
            );
            const initialCapacityAlertSlot = initial.locator(ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR);
            const missingCapacityAlertSlot = missingCapacityAlert.locator(
                ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR,
            );
            const frontQueuesYellow = getVDiskProgressBar(
                ordinaryItems.nth(FRONT_QUEUES_YELLOW_VDISK_INDEX),
            );
            const frontQueuesYellowSlot = frontQueuesYellow.locator(
                ALL_MODE_FRONT_QUEUES_SLOT_SELECTOR,
            );
            const missingFrontQueuesSlot = getVDiskProgressBar(
                ordinaryItems.nth(MISSING_FRONT_QUEUES_VDISK_INDEX),
            ).locator(ALL_MODE_FRONT_QUEUES_SLOT_SELECTOR);
            const initialFrontQueuesSlot = initial.locator(ALL_MODE_FRONT_QUEUES_SLOT_SELECTOR);
            const initialCompactionSlot = initial.locator(ALL_MODE_COMPACTION_SLOT_SELECTOR);
            const missingCompactionSlot = missingCapacityAlert.locator(
                ALL_MODE_COMPACTION_SLOT_SELECTOR,
            );

            await expect(stateOnlyOk).toHaveClass(/storage-disk-progress-bar_mode-all/);
            await expect(stateOnlyOk).toHaveClass(/storage-disk-progress-bar_green/);
            await expect(stateOnlyOk).toHaveAttribute('aria-valuenow', '50');
            await expect(stateOnlyOk.locator('.storage-disk-progress-bar__fill-bar')).toHaveCount(
                1,
            );
            await expect(stateOnlyOk).not.toContainText(/\d+%/);

            await expect(initial).toHaveClass(/storage-disk-progress-bar_yellow/);
            await expect(initial).not.toContainText(/\d+%/);
            await expect(initialCapacityAlertSlot).toHaveCount(1);
            await expect(initialCapacityAlertSlot).toHaveCSS('width', '16px');
            await expect(initialCapacityAlertSlot).toHaveText('LY');

            const [expectedCaption2, expectedTextColor, actualTypography] = await Promise.all([
                resolveCaption2Typography(page),
                resolveThemeColor(page, '--g-color-text-primary'),
                initialCapacityAlertSlot.evaluate((element) => {
                    const styles = getComputedStyle(element);

                    return {
                        color: styles.color,
                        fontFamily: styles.fontFamily,
                        fontSize: styles.fontSize,
                        fontWeight: styles.fontWeight,
                        lineHeight: styles.lineHeight,
                    };
                }),
            ]);

            expect(actualTypography).toEqual({
                ...expectedCaption2,
                color: expectedTextColor,
            });

            const [initialBox, initialSlotBox] = await Promise.all([
                initial.boundingBox(),
                initialCapacityAlertSlot.boundingBox(),
            ]);

            if (!initialBox || !initialSlotBox) {
                throw new Error('Cannot compare All-mode VDisk and Capacity Alert slot boxes');
            }

            expect(initialSlotBox.x - initialBox.x).toBeCloseTo(4, 5);

            await expect(missingCapacityAlertSlot).toHaveCount(1);
            await expect(missingCapacityAlertSlot).toHaveCSS('width', '16px');
            const missingCapacityAlertIcon = missingCapacityAlertSlot.locator('.g-icon');
            await expect(missingCapacityAlertIcon).toBeVisible();
            await expect(missingCapacityAlertIcon).toHaveCSS('color', MISSING_INDICATOR_COLOR);

            await expect(frontQueuesYellowSlot).toHaveCount(1);
            await expect(frontQueuesYellowSlot).toHaveCSS('width', '12px');
            const frontQueuesYellowIcon = frontQueuesYellowSlot.locator('.g-icon');
            await expect(frontQueuesYellowIcon).toBeVisible();
            await expect(frontQueuesYellowIcon).toHaveCSS('color', expectedTextColor);

            const [frontQueuesYellowBox, frontQueuesYellowSlotBox] = await Promise.all([
                frontQueuesYellow.boundingBox(),
                frontQueuesYellowSlot.boundingBox(),
            ]);

            if (!frontQueuesYellowBox || !frontQueuesYellowSlotBox) {
                throw new Error('Cannot compare All-mode VDisk and FrontQueues slot boxes');
            }

            expect(frontQueuesYellowSlotBox.x - frontQueuesYellowBox.x).toBeCloseTo(24, 5);

            await expect(missingFrontQueuesSlot).toHaveCount(1);
            const missingFrontQueuesIcon = missingFrontQueuesSlot.locator('.g-icon');
            await expect(missingFrontQueuesIcon).toBeVisible();
            await expect(missingFrontQueuesIcon).toHaveCSS('color', expectedTextColor);

            await expect(initialFrontQueuesSlot).toHaveCount(1);
            await expect(initialFrontQueuesSlot).toBeEmpty();

            await expect(initialCompactionSlot).toHaveCount(1);
            await expect(initialCompactionSlot).toHaveCSS('width', '17px');
            const initialCompactionIcons = initialCompactionSlot.locator('.g-icon');
            await expect(initialCompactionIcons).toHaveCount(2);
            await expect(initialCompactionIcons.nth(0)).toHaveCSS('color', MISSING_INDICATOR_COLOR);
            await expect(initialCompactionIcons.nth(1)).toHaveCSS('color', expectedTextColor);

            const [initialCompactionSlotBox, initialCompactionIconBoxes] = await Promise.all([
                initialCompactionSlot.boundingBox(),
                initialCompactionIcons.evaluateAll((icons) =>
                    icons.map((icon) => {
                        const box = icon.getBoundingClientRect();

                        return {
                            height: box.height,
                            left: box.left,
                            right: box.right,
                            width: box.width,
                        };
                    }),
                ),
            ]);

            if (!initialCompactionSlotBox) {
                throw new Error('Cannot compare All-mode VDisk and Compaction slot boxes');
            }

            expect(initialCompactionSlotBox.x - initialBox.x).toBeCloseTo(40, 5);
            expect(initialCompactionIconBoxes).toHaveLength(2);
            initialCompactionIconBoxes.forEach((box) => {
                expect(box.width).toBeCloseTo(10, 5);
                expect(box.height).toBeCloseTo(10, 5);
            });
            expect(
                initialCompactionIconBoxes[1].left - initialCompactionIconBoxes[0].left,
            ).toBeCloseTo(7, 5);
            expect(
                initialCompactionIconBoxes[1].right - initialCompactionIconBoxes[0].left,
            ).toBeCloseTo(17, 5);

            await expect(missingCompactionSlot).toHaveCount(1);
            await expect(missingCompactionSlot).toHaveCSS('width', '17px');
            const missingCompactionIcons = missingCompactionSlot.locator('.g-icon');
            await expect(missingCompactionIcons).toHaveCount(2);
            await Promise.all(
                [0, 1].map((index) =>
                    expect(missingCompactionIcons.nth(index)).toHaveCSS(
                        'color',
                        MISSING_INDICATOR_COLOR,
                    ),
                ),
            );

            const replicatingItems = getVDiskItems(getStorageGroupRow(page, 1));
            const healthyReplicating = getVDiskProgressBar(replicatingItems.nth(0));
            const healthyCapacityAlertSlot = healthyReplicating.locator(
                ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR,
            );
            const initialUnreplicated = getVDiskProgressBar(
                replicatingItems.nth(INITIAL_VDISK_INDEX),
            );

            await expect(healthyReplicating).toHaveClass(/storage-disk-progress-bar_blue/);
            await expect(healthyReplicating).toHaveClass(/storage-disk-progress-bar_striped/);
            await expect(healthyReplicating).toHaveCSS(
                'background-image',
                /repeating-linear-gradient/,
            );
            await expect(
                healthyReplicating.locator('.storage-disk-progress-bar__icon'),
            ).toHaveCount(0);
            await expect(healthyCapacityAlertSlot).toHaveCount(1);
            await expect(healthyCapacityAlertSlot).toHaveCSS('width', '16px');
            await expect(healthyCapacityAlertSlot).toBeEmpty();
            await expect(initialUnreplicated).toHaveClass(/storage-disk-progress-bar_yellow/);
            await expect(initialUnreplicated).not.toHaveClass(/storage-disk-progress-bar_striped/);
        });

        test('uses State normal and hover colors while preserving allocation fills', async ({
            page,
        }) => {
            await preparePage(page, VDisksGroupBy.All);

            const ordinaryItems = getVDiskItems(getStorageGroupRow(page, 0));
            const stateOnlyOk = getVDiskProgressBar(ordinaryItems.nth(STATE_ONLY_OK_VDISK_INDEX));
            const allGreen = getVDiskProgressBar(ordinaryItems.nth(ALL_GREEN_VDISK_INDEX));
            const initial = getVDiskProgressBar(ordinaryItems.nth(INITIAL_VDISK_INDEX));
            const pDiskError = getVDiskProgressBar(ordinaryItems.nth(PDISK_ERROR_VDISK_INDEX));
            const recoveryError = getVDiskProgressBar(
                ordinaryItems.nth(RECOVERY_ERROR_VDISK_INDEX),
            );
            const recoveryErrorFill = getVDiskFillBar(recoveryError);
            const ordinaryStateBars = [stateOnlyOk, allGreen, initial, pDiskError];
            const [
                positiveMedium,
                positiveLight,
                warningLight,
                dangerLight,
                dangerHeavy,
                dangerMedium,
                dangerHeavyHover,
                dangerMediumHover,
            ] = await Promise.all([
                resolveThemeColor(page, '--g-color-base-positive-medium'),
                resolveThemeColor(page, '--g-color-base-positive-light'),
                resolveThemeColor(page, '--g-color-base-warning-light'),
                resolveThemeColor(page, '--g-color-base-danger-light'),
                resolveThemeColor(page, '--g-color-base-danger-heavy'),
                resolveThemeColor(page, '--g-color-base-danger-medium'),
                resolveThemeColor(page, '--g-color-base-danger-heavy-hover'),
                resolveThemeColor(page, '--g-color-base-danger-medium-hover'),
            ]);
            const ordinaryNormalFillColors = [
                positiveMedium,
                positiveLight,
                warningLight,
                dangerLight,
            ];

            await expect(stateOnlyOk).toHaveClass(/storage-disk-progress-bar_all-mode-has-issues/);
            await expect(allGreen).toHaveClass(/storage-disk-progress-bar_green/);
            await expect(allGreen).not.toHaveClass(/storage-disk-progress-bar_all-mode-has-issues/);

            await Promise.all(
                ordinaryStateBars.map(async (progressBar, index) => {
                    await expectTransparentBackgroundWithFill(progressBar);
                    await expect(getVDiskFillBar(progressBar)).toHaveCSS(
                        'background-color',
                        ordinaryNormalFillColors[index],
                    );
                }),
            );

            const pDiskAllocation = Number(await pDiskError.getAttribute('aria-valuenow'));
            expect(pDiskAllocation).toBeGreaterThan(0);
            expect(pDiskAllocation).toBeLessThan(100);

            await expect(recoveryErrorFill).toHaveCount(1);
            await expect(recoveryErrorFill).toHaveCSS('background-color', dangerHeavy);
            await expect(recoveryError).toHaveCSS('border-color', dangerHeavy);
            await expect(recoveryError).toHaveCSS('background-color', dangerMedium);

            await forceHoverStorageGroupVDiskItems(page, 0);

            await Promise.all(
                ordinaryStateBars.map(async (progressBar, index) => {
                    const fillBar = getVDiskFillBar(progressBar);

                    await expect(fillBar).toHaveCSS(
                        'background-color',
                        ordinaryNormalFillColors[index],
                    );
                    await expect(progressBar).toHaveCSS(
                        'background-color',
                        ordinaryNormalFillColors[index],
                    );
                }),
            );

            await expect(getVDiskFillBar(recoveryError)).toHaveCSS(
                'background-color',
                dangerHeavyHover,
            );
            await expect(recoveryError).toHaveCSS('border-color', dangerHeavyHover);
            await expect(recoveryError).toHaveCSS('background-color', dangerMediumHover);
        });

        test('keeps a partial Initial fill rounded at the lower-left corner', async ({page}) => {
            await preparePage(page, VDisksGroupBy.All);

            const initial = getVDiskProgressBar(
                getVDiskItems(getStorageGroupRow(page, 0)).nth(INITIAL_VDISK_INDEX),
            );
            const initialFill = getVDiskFillBar(initial);

            const bottomLeftRadius = await initialFill.evaluate(
                (element) => getComputedStyle(element).borderBottomLeftRadius,
            );

            expect(Number.parseFloat(bottomLeftRadius)).toBeGreaterThan(0);
        });

        test('renders missing Whiteboard data on a filled no-data background', async ({page}) => {
            await preparePage(page, VDisksGroupBy.All);

            const noWhiteboardVDisk = getVDiskProgressBar(
                getVDiskItems(getStorageGroupRow(page, 0)).nth(MISSING_WHITEBOARD_VDISK_INDEX),
            );
            const [normalColor, highlightedColor] = await Promise.all([
                resolveThemeColor(page, '--g-color-base-neutral-medium'),
                resolveThemeColor(page, '--g-color-base-neutral-medium-hover'),
            ]);

            await expectAllocationFill(noWhiteboardVDisk, 10);
            await expect(noWhiteboardVDisk).toHaveClass(/storage-disk-progress-bar_grey/);
            await expect(noWhiteboardVDisk).toContainText('N/D');
            await expect(noWhiteboardVDisk).toHaveCSS('background-color', normalColor);
            await expect(getVDiskFillBar(noWhiteboardVDisk)).toHaveCSS(
                'background-color',
                normalColor,
            );
            await expect(noWhiteboardVDisk).toHaveCSS('border-style', 'none');
            const noWhiteboardCapacityAlertSlot = noWhiteboardVDisk.locator(
                ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR,
            );
            await expect(noWhiteboardCapacityAlertSlot).toHaveCount(1);
            await expect(noWhiteboardCapacityAlertSlot).toBeEmpty();
            await expect(noWhiteboardCapacityAlertSlot.locator('.g-icon')).toHaveCount(0);
            const noWhiteboardFrontQueuesSlot = noWhiteboardVDisk.locator(
                ALL_MODE_FRONT_QUEUES_SLOT_SELECTOR,
            );
            await expect(noWhiteboardFrontQueuesSlot).toHaveCount(1);
            await expect(noWhiteboardFrontQueuesSlot).toBeEmpty();
            await expect(noWhiteboardFrontQueuesSlot.locator('.g-icon')).toHaveCount(0);
            const noWhiteboardCompactionSlot = noWhiteboardVDisk.locator(
                ALL_MODE_COMPACTION_SLOT_SELECTOR,
            );
            await expect(noWhiteboardCompactionSlot).toHaveCount(1);
            await expect(noWhiteboardCompactionSlot).toBeEmpty();
            await expect(noWhiteboardCompactionSlot.locator('.g-icon')).toHaveCount(0);

            await forceHoverStorageGroupVDiskItems(page, 0);

            await expect(noWhiteboardVDisk).toHaveCSS('background-color', highlightedColor);
            await expect(getVDiskFillBar(noWhiteboardVDisk)).toHaveCSS(
                'background-color',
                highlightedColor,
            );
            await expect(noWhiteboardVDisk).toHaveCSS('border-style', 'none');
        });

        test('overlaps State status icons with the top-left bar corner', async ({page}) => {
            await preparePage(page, VDisksGroupBy.All);

            const ordinaryItems = getVDiskItems(getStorageGroupRow(page, 0));
            const initial = getVDiskProgressBar(ordinaryItems.nth(INITIAL_VDISK_INDEX));
            const pDiskError = getVDiskProgressBar(ordinaryItems.nth(PDISK_ERROR_VDISK_INDEX));
            const recoveryError = getVDiskProgressBar(
                ordinaryItems.nth(RECOVERY_ERROR_VDISK_INDEX),
            );

            await expectStatusIconMatchesReference(page, initial, INITIAL_ICON_COLOR_TOKEN, true);
            await expectStatusIconMatchesReference(page, pDiskError, PDISK_ERROR_ICON_COLOR_TOKEN);
            await expectStatusIconMatchesReference(
                page,
                recoveryError,
                RECOVERY_ERROR_ICON_COLOR_TOKEN,
            );
        });
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

test.describe('PDisk Coloring - Expert Mode visual snapshots', () => {
    test.describe.configure({timeout: 300_000});

    for (const mode of PDISK_GROUP_BY_MODES) {
        test.describe(`PDisk ${mode.value} mode`, () => {
            test(`renders the first storage group PDisk row in ${mode.slug} mode`, async ({
                page,
            }) => {
                await preparePDiskPage(page, mode.value);
                const pDisks = getPDisksArea(getStorageGroupRow(page, 0));

                await expectPDiskScreenshot(pDisks, `pdisk-${mode.slug}-first-row.png`);

                await forceHoverStorageGroupVDiskItems(page, 0);
                await expectPDiskScreenshot(pDisks, `pdisk-${mode.slug}-first-row-hover.png`);
            });
        });
    }
});
