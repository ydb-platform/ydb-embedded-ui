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
const STATE_ONLY_OK_VDISK_INDEX = 4;
const INITIAL_VDISK_INDEX = 5;
const RECOVERY_ERROR_VDISK_INDEX = 8;
const PDISK_ERROR_VDISK_INDEX = 9;
const TRANSPARENT_BACKGROUND = 'rgba(0, 0, 0, 0)';
const MISSING_CAPACITY_INDICATOR_COLOR = 'rgb(162, 162, 162)';
const INITIAL_ICON_COLOR_TOKEN = '--g-color-base-warning-heavy';
const PDISK_ERROR_ICON_COLOR_TOKEN = '--g-color-base-danger-heavy';
const RECOVERY_ERROR_ICON_COLOR_TOKEN = '--g-color-text-primary';

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
const ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR =
    '.storage-disk-progress-bar__all-mode-capacity-alert-indicator-slot';

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
    const icon = progressBar.locator('.storage-disk-progress-bar__icon');

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

    test.describe('All mode', () => {
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
            await expect(missingCapacityAlertIcon).toHaveCSS(
                'color',
                MISSING_CAPACITY_INDICATOR_COLOR,
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
            const initial = getVDiskProgressBar(ordinaryItems.nth(INITIAL_VDISK_INDEX));
            const pDiskError = getVDiskProgressBar(ordinaryItems.nth(PDISK_ERROR_VDISK_INDEX));
            const recoveryError = getVDiskProgressBar(
                ordinaryItems.nth(RECOVERY_ERROR_VDISK_INDEX),
            );
            const recoveryErrorFill = getVDiskFillBar(recoveryError);
            const ordinaryStateBars = [stateOnlyOk, initial, pDiskError];
            const [
                positiveLight,
                warningLight,
                dangerLight,
                dangerHeavy,
                dangerMedium,
                dangerHeavyHover,
                dangerMediumHover,
            ] = await Promise.all([
                resolveThemeColor(page, '--g-color-base-positive-light'),
                resolveThemeColor(page, '--g-color-base-warning-light'),
                resolveThemeColor(page, '--g-color-base-danger-light'),
                resolveThemeColor(page, '--g-color-base-danger-heavy'),
                resolveThemeColor(page, '--g-color-base-danger-medium'),
                resolveThemeColor(page, '--g-color-base-danger-heavy-hover'),
                resolveThemeColor(page, '--g-color-base-danger-medium-hover'),
            ]);
            const ordinaryNormalFillColors = [positiveLight, warningLight, dangerLight];

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
