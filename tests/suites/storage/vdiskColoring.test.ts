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
import {ECapacityAlert, EFlag} from '../../../src/types/api/enums';
import {TPDiskState} from '../../../src/types/api/pdisk';
import {EVDiskState} from '../../../src/types/api/vdisk';
import {storagePage} from '../../utils/constants';
import {ClusterStorageTable} from '../paginatedTable/paginatedTable';

import {
    ALL_GREEN_VDISK_INDEX,
    MISSING_FRONT_QUEUES_VDISK_INDEX,
    MISSING_PDISK_TYPE_INDEX,
    MISSING_WHITEBOARD_PDISK_INDEX,
    MISSING_WHITEBOARD_VDISK_INDEX,
    UNKNOWN_PDISK_TYPE_INDEX,
    createMockStorageGroupsResponse,
    createMockStorageNodesResponse,
} from './mockStorageGroups';
import {DATABASE, setupVDiskColoringMocks} from './vdiskColoringMocks';

const VDISKS_COUNT = 11;
const FRONT_QUEUES_YELLOW_VDISK_INDEX = 2;
const STATE_ONLY_OK_VDISK_INDEX = 4;
const LIGHT_YELLOW_VDISK_INDEX = 5;
const RECOVERY_ERROR_VDISK_INDEX = 8;
const PDISK_ERROR_VDISK_INDEX = 9;
const TRANSPARENT_BACKGROUND = 'rgba(0, 0, 0, 0)';
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
    {value: PDisksGroupBy.All, slug: 'all'},
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
const PDISK_ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR =
    '.storage-disk-progress-bar__pdisk-all-mode-capacity-alert-indicator-slot';
const PDISK_ALL_MODE_DRIVE_SLOT_SELECTOR =
    '.storage-disk-progress-bar__pdisk-all-mode-drive-indicator-slot';
const PDISK_ALL_MODE_DECOMMIT_SLOT_SELECTOR =
    '.storage-disk-progress-bar__pdisk-all-mode-decommit-indicator-slot';
const PDISK_ALL_MODE_MAINTENANCE_SLOT_SELECTOR =
    '.storage-disk-progress-bar__pdisk-all-mode-maintenance-indicator-slot';
const PDISK_ALL_MODE_DEVICE_SLOT_SELECTOR =
    '.storage-disk-progress-bar__pdisk-all-mode-device-indicator-slot';

async function enableExpertMode(page: Page, vdisksGroupBy: VDisksGroupByValue, expertMode = true) {
    await page.addInitScript(
        ({groupByValue, expertModeEnabled}) => {
            localStorage.setItem('enableStorageExpertMode', JSON.stringify(true));
            localStorage.setItem('storageExpertMode', JSON.stringify(expertModeEnabled));
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
        },
        {groupByValue: vdisksGroupBy, expertModeEnabled: expertMode},
    );
}

async function gotoStoragePage(page: Page, vdisksGroupBy: VDisksGroupByValue, expertMode = true) {
    const url = new URL(storagePage, 'http://localhost');
    url.searchParams.set('database', DATABASE);
    url.searchParams.set('type', 'groups');
    if (expertMode) {
        url.searchParams.set('storageExpertMode', 'true');
    }
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

function getVDisksArea(row: Locator) {
    return getStorageDisksArea(row).locator(':scope > .g-flex').first();
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
    const diskItem = getVDiskItems(row).first();
    const getDiskGeometry = () =>
        diskItem.evaluate((element) => {
            const {y, height} = element.getBoundingClientRect();
            return {y, height};
        });
    const geometry = await getDiskGeometry();

    await row.evaluate((element, rowClass) => {
        element.classList.add(rowClass);
    }, FORCED_HOVER_ROW_CLASS);
    await row.locator('.storage-disk-progress-bar').evaluateAll((disks, diskClass) => {
        disks.forEach((disk) => disk.classList.add(diskClass));
    }, FORCED_HOVERED_DISK_CLASS);
    await row.locator('.ydb-stack').evaluateAll((stacks, stackClass) => {
        stacks.forEach((stack) => stack.classList.add(stackClass));
    }, FORCED_EXPANDED_STACK_CLASS);

    await expect.poll(getDiskGeometry).toEqual(geometry);
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
    await pDisks.scrollIntoViewIfNeeded();
    await expect(pDisks.locator('.pdisk-storage')).toHaveCount(VDISKS_COUNT);
    await expect(pDisks).toHaveScreenshot(name, {
        timeout: 60_000,
    });
}

async function expectPDiskAllScreenshot(page: Page, pDisks: Locator, name: string) {
    await pDisks.scrollIntoViewIfNeeded();
    await expect(pDisks.locator('.pdisk-storage')).toHaveCount(VDISKS_COUNT);

    const box = await pDisks.boundingBox();

    if (!box) {
        throw new Error(`Cannot take screenshot "${name}": PDisk row has no bounding box`);
    }

    const x = Math.max(0, box.x - 8);
    const y = Math.max(0, box.y - 8);
    const right = box.x + box.width + 8;
    const bottom = box.y + box.height + 8;
    const viewport = page.viewportSize();

    await expect(page).toHaveScreenshot(name, {
        clip: {
            x,
            y,
            width: viewport ? Math.min(right - x, viewport.width - x) : right - x,
            height: viewport ? Math.min(bottom - y, viewport.height - y) : bottom - y,
        },
        timeout: 60_000,
    });
}

async function expectVDiskScreenshot(vDisks: Locator, name: string) {
    await expect(vDisks).toHaveScreenshot(name, {
        timeout: 60_000,
    });
}

async function expectStorageGroupRowsReady(page: Page, expertMode = true) {
    for (const group of STORAGE_GROUPS) {
        const row = getStorageGroupRow(page, group.index);
        const storageDisksArea = getStorageDisksArea(row);
        const vDiskItems = getVDiskItems(row);

        await expect(storageDisksArea).toBeVisible();
        await expect(vDiskItems).toHaveCount(VDISKS_COUNT);
        await expect(getVDiskProgressBar(vDiskItems.first())).toBeVisible();
        if (expertMode) {
            await expect(row.locator('.ydb-stack')).toHaveCount(group.hasDonors ? VDISKS_COUNT : 0);
        }
    }
}

async function preparePage(page: Page, vdisksGroupBy: VDisksGroupByValue, expertMode = true) {
    await page.setViewportSize({width: 1500, height: 1000});
    await enableExpertMode(page, vdisksGroupBy, expertMode);
    await setupVDiskColoringMocks(page);
    await gotoStoragePage(page, vdisksGroupBy, expertMode);
    await hideFloatingPopups(page);
    await setupForcedHoverStyles(page);
    await expectStorageGroupRowsReady(page, expertMode);
}

async function preparePDiskPage(
    page: Page,
    pdisksGroupBy: PDisksGroupByValue,
    storageGroupsResponse = createMockStorageGroupsResponse(),
) {
    await page.addInitScript((groupByValue) => {
        localStorage.setItem('storagePDisksGroupBy', JSON.stringify(groupByValue));
    }, pdisksGroupBy);
    await page.setViewportSize({width: 1500, height: 1000});
    await enableExpertMode(page, VDisksGroupBy.State);
    await setupVDiskColoringMocks(page, storageGroupsResponse);
    await gotoStoragePage(page, VDisksGroupBy.State);
    await hideFloatingPopups(page);
    await setupForcedHoverStyles(page);
    await expectStorageGroupRowsReady(page);
    await getPDisksArea(getStorageGroupRow(page, 0)).scrollIntoViewIfNeeded();
}

async function prepareNodesPage(
    page: Page,
    vdisksGroupBy: VDisksGroupByValue,
    pdisksGroupBy: PDisksGroupByValue,
    nodesData = createMockStorageNodesResponse(),
    {hidePopups = true}: {hidePopups?: boolean} = {},
) {
    await page.setViewportSize({width: 1500, height: 1000});
    await enableExpertMode(page, vdisksGroupBy);
    await page.addInitScript(() => {
        localStorage.setItem(
            'storageNodesSelectedColumns',
            JSON.stringify([
                {id: 'NodeId', selected: true},
                {id: 'PDisks', selected: true},
            ]),
        );
    });
    await setupVDiskColoringMocks(page);
    await page.route('**/viewer/json/nodes?*', async (route) => {
        await route.fulfill({json: nodesData});
    });

    const url = new URL(storagePage, 'http://localhost');
    url.searchParams.set('database', DATABASE);
    url.searchParams.set('type', 'nodes');
    url.searchParams.set('visible', 'all');
    url.searchParams.set('storageExpertMode', 'true');
    url.searchParams.set('nodesVdisksGroupBy', vdisksGroupBy);
    url.searchParams.set('nodesPdisksGroupBy', pdisksGroupBy);
    const [nodesResponse] = await Promise.all([
        page.waitForResponse(
            (response) => response.url().includes('/viewer/json/nodes?') && response.ok(),
        ),
        page.goto(`${url.pathname}${url.search}`),
    ]);
    await nodesResponse.finished();
    if (hidePopups) {
        await hideFloatingPopups(page);
    }
}

test('keeps paired disk popups inside the viewport without expanding the page', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({width: 1500, height: 1000});
    await enableExpertMode(page, VDisksGroupBy.All);
    await page.addInitScript(() => {
        localStorage.setItem('storagePDisksGroupBy', JSON.stringify('All'));
    });
    await setupVDiskColoringMocks(page);
    await gotoStoragePage(page, VDisksGroupBy.All);
    await expectStorageGroupRowsReady(page);

    const row = getStorageGroupRow(page, 0);
    const vDisk = getVDiskItems(row).nth(8);
    const pDisk = getPDiskItems(row).nth(8);
    await expect(vDisk).toBeInViewport();
    await expect(pDisk).not.toBeInViewport();

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    await vDisk.hover();

    const vDiskPopup = page.locator('.ydb-popover').filter({
        has: page.getByText('9000000000-1-0-0-8', {exact: true}),
    });
    const pDiskPopup = page.locator('.ydb-popover').filter({
        has: page.getByText('7008-108', {exact: true}),
    });
    await expect(vDiskPopup).toBeVisible();
    await expect(pDiskPopup).toBeHidden();
    await expect(getPDiskProgressBar(pDisk)).toHaveClass(/storage-disk-progress-bar_highlighted/);
    await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(pageWidth);

    await page.mouse.move(0, 0);
    await expect(vDiskPopup).toBeHidden();
    await pDisk.evaluate((element) => {
        const container = element.closest('.ydb-cluster');
        if (!container) {
            throw new Error('Missing cluster scroll container');
        }
        const visibleRight = container.getBoundingClientRect().left + container.clientWidth;
        container.scrollLeft += element.getBoundingClientRect().left - visibleRight;
    });
    await expect(vDisk).toBeInViewport();
    await vDisk.hover();
    await expect(vDiskPopup).toBeVisible();
    await page.locator('.ydb-cluster').evaluate((element) => {
        element.scrollTo({left: element.scrollLeft + 10});
    });
    await expect(pDisk).toBeInViewport();
    await expect(pDiskPopup).toBeVisible();
    for (const popup of [vDiskPopup, pDiskPopup]) {
        await expect(popup).toBeInViewport({ratio: 1});
    }
    await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(pageWidth);
    await pDiskPopup.getByRole('link', {name: 'Go to PDisk', exact: true}).hover();
    await expect(vDiskPopup).toBeVisible();
    await expect(pDiskPopup).toBeVisible();

    await testInfo.attach('paired-disk-popups', {
        body: await page.screenshot({path: testInfo.outputPath('paired-disk-popups.png')}),
        contentType: 'image/png',
    });
    await page.keyboard.press('Escape');
    await expect(vDiskPopup).toBeHidden();
    await expect(pDiskPopup).toBeHidden();

    await pDisk.hover();
    await expect(vDiskPopup).toBeVisible();
    await expect(pDiskPopup).toBeVisible();

    const maxPageWidthWhileClosing = await pDiskPopup.evaluate((popup) => {
        const container = document.querySelector('.ydb-cluster');
        if (!container) {
            throw new Error('Missing cluster scroll container');
        }
        return new Promise<number>((resolve) => {
            let maxWidth = document.documentElement.scrollWidth;
            const sample = () => {
                maxWidth = Math.max(maxWidth, document.documentElement.scrollWidth);
                if (!popup.isConnected) {
                    resolve(maxWidth);
                    return;
                }
                requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
            container.scrollTo({left: 0});
        });
    });
    expect(maxPageWidthWhileClosing).toBe(pageWidth);
});

test('wheel over disk popups scrolls the page', async ({page}) => {
    const response = createMockStorageGroupsResponse();
    const group = response.StorageGroups?.[0];
    if (!group) {
        throw new Error('Missing storage group fixture');
    }
    response.StorageGroups = Array.from({length: 40}, (_, index) => ({
        ...group,
        GroupId: String(9000000000 + index),
    }));
    response.TotalGroups = response.FoundGroups = 40;
    await page.setViewportSize({width: 1500, height: 800});
    await enableExpertMode(page, VDisksGroupBy.State, false);
    await setupVDiskColoringMocks(page, response);
    await gotoStoragePage(page, VDisksGroupBy.State, false);
    await expectStorageGroupRowsReady(page, false);
    const scroll = page.locator('.ydb-cluster');
    for (const name of ['PDisk', 'VDisk']) {
        await scroll.evaluate((element) => element.scrollTo({top: 0, left: 0}));
        const row = getStorageGroupRow(page, 0);
        await (name === 'PDisk' ? getPDiskItems(row) : getVDiskItems(row)).first().hover();
        const action = page.getByRole('link', {name: `Go to ${name}`, exact: true});
        await expect(action).toHaveAttribute('href', /nodeId=7000/);
        const popup = page.locator('.ydb-popover').filter({has: action});
        await expect(popup).toHaveCSS('max-height', 'none');
        await expect(popup).toHaveCSS('overflow-y', 'visible');
        await action.hover();
        const before = await scroll.evaluate((element) => element.scrollTop);
        await page.mouse.wheel(0, 200);
        await expect
            .poll(() => scroll.evaluate((element) => element.scrollTop))
            .toBeGreaterThan(before);
        await page.keyboard.press('Escape');
    }
});

test.describe('Drive type - groups expert mode', () => {
    for (const theme of ['light', 'dark']) {
        test(`shows drive types and preserves group-only selection in ${theme} theme`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
            await page.addInitScript(() => {
                localStorage.setItem('enableStorageExpertMode', 'true');
                localStorage.setItem('storageExpertMode', 'true');
                localStorage.setItem(
                    'storageGroupsSelectedColumns',
                    JSON.stringify([
                        {id: 'GroupId', selected: true},
                        {id: 'VDisksPDisks', selected: true},
                    ]),
                );
            });
            await page.setViewportSize({width: 1900, height: 1000});
            await setupVDiskColoringMocks(page);
            await gotoStoragePage(page, VDisksGroupBy.State);
            await hideFloatingPopups(page);
            await expectStorageGroupRowsReady(page);

            const panel = page.locator('.ydb-storage-expert-mode-panel');
            const selectors = panel.getByRole('radio', {name: 'Drive type', exact: true});
            await expect(selectors).toHaveCount(2);
            const row = page.locator('.ydb-paginated-table__row').filter({
                has: page.getByRole('link', {name: '9000000000', exact: true}),
            });
            await expect(row).toBeVisible();
            await expect(getVDiskItems(row).nth(0).getByRole('link')).toHaveText('N/D');
            await expect(
                row.locator('.ydb-storage-disks__pdisk-item').nth(9).getByRole('link'),
            ).toHaveText('N/D');
            await selectors.first().check();
            await selectors.last().check();
            await expect(page).toHaveURL(/vdisksGroupBy=DriveType/);
            await expect(page).toHaveURL(/pdisksGroupBy=DriveType/);

            for (const [index, type, color] of [
                [1, 'SSD', 'misc-medium'],
                [2, 'HDD', 'utility-light'],
                [6, 'NVMe', 'info-light'],
            ] as const) {
                const vDisk = getVDiskItems(row).nth(index).getByRole('link');
                const pDisk = row
                    .locator('.ydb-storage-disks__pdisk-item')
                    .nth(index)
                    .getByRole('link');
                for (const disk of [vDisk, pDisk]) {
                    await expect(disk).toHaveAccessibleName(new RegExp(`Drive type: ${type}\\.$`));
                    await expect(disk).toHaveText(type);
                    const bar = disk.getByRole('meter');
                    await expect(bar).toHaveCSS(
                        'background-color',
                        await resolveThemeColor(page, `--g-color-base-${color}`),
                    );
                    await expect(getVDiskFillBar(bar)).toHaveCount(0);
                }
            }
            await expect(
                row.locator('.ydb-storage-disks__pdisk-item').nth(0).getByRole('link'),
            ).toHaveText('NVMe');
            for (const index of [MISSING_PDISK_TYPE_INDEX, UNKNOWN_PDISK_TYPE_INDEX]) {
                for (const disk of [
                    getVDiskItems(row).nth(index).getByRole('link'),
                    row.locator('.ydb-storage-disks__pdisk-item').nth(index).getByRole('link'),
                ]) {
                    await expect(disk).toHaveAccessibleName(/Drive type: N\/D\.$/);
                    await expect(disk.locator('.g-icon')).toHaveCount(1);
                    await expect(disk).not.toContainText('future-drive-type');
                }
            }
            const donor = page.getByRole('link', {
                name: 'Donor VDisk 9000000001-1-0-0-100 on node 7100. Drive type: SSD.',
                exact: true,
            });
            await expect(donor).toHaveText('SSD');
            await expect(donor.getByRole('meter')).not.toHaveClass(/_striped/);
            for (const disk of [
                getVDiskItems(row).nth(0).getByRole('link'),
                getVDiskItems(row).nth(9).getByRole('link'),
                row.locator('.ydb-storage-disks__pdisk-item').nth(9).getByRole('link'),
                page.getByRole('link', {
                    name: 'Donor VDisk 9000000001-1-0-0-109 on node 7109. PDisk Whiteboard: N/D. Drive type: N/D.',
                    exact: true,
                }),
            ]) {
                await expect(disk).toHaveText('N/D');
                await expect(disk).toHaveAccessibleName(/Whiteboard: N\/D\. Drive type: N\/D\.$/);
                await expect(disk.locator('.g-icon')).toHaveCount(0);
                await expect(disk.getByRole('meter')).toHaveClass(/storage-disk-progress-bar_grey/);
            }
            await expectStorageRowsScreenshot(page, `drive-type-${theme}.png`);
            await page.screenshot({path: testInfo.outputPath(`drive-type-${theme}-page.png`)});

            await page.reload();
            await expect(selectors.first()).toBeChecked();
            await expect(selectors.last()).toBeChecked();
            await page.route('**/viewer/json/nodes?*', (route) =>
                route.fulfill({json: createMockStorageNodesResponse()}),
            );
            await page
                .getByTestId('storage-type-filter')
                .getByRole('radio', {name: 'Nodes', exact: true})
                .check();
            await expect(panel.getByRole('radio', {name: 'Drive type', exact: true})).toHaveCount(
                0,
            );
            await expect(page.locator('.storage-disk-progress-bar_mode-drivetype')).toHaveCount(0);
            await page
                .getByTestId('storage-type-filter')
                .getByRole('radio', {name: 'Groups', exact: true})
                .check();
            await expect(selectors.first()).toBeChecked();
            await expect(selectors.last()).toBeChecked();
            await page.goto(
                `${storagePage}?database=${encodeURIComponent(DATABASE)}&type=groups&storageExpertMode=true`,
            );
            await expect(selectors.first()).toBeChecked();
            await expect(selectors.last()).toBeChecked();
        });
    }

    test('does not apply Drive type outside expert mode', async ({page}) => {
        await page.addInitScript(() =>
            localStorage.setItem('storagePDisksGroupBy', JSON.stringify('DriveType')),
        );
        await preparePage(page, VDisksGroupBy.DriveType, false);
        await expect(page.locator('.ydb-storage-expert-mode-panel')).toHaveCount(0);
        await expect(page.locator('.storage-disk-progress-bar_mode-drivetype')).toHaveCount(0);
    });
});

test.describe('VDisk Coloring - Expert Mode visual snapshots', () => {
    test.describe.configure({timeout: 60_000});

    for (const scope of ['groups', 'nodes']) {
        test(`labels Expert mode radio groups in ${scope}`, async ({page}) => {
            if (scope === 'groups') {
                await preparePage(page, VDisksGroupBy.State);
            } else {
                await prepareNodesPage(page, VDisksGroupBy.State, PDisksGroupBy.State);
            }

            const panel = page.locator('.ydb-storage-expert-mode-panel');
            for (const label of ['VDisks:', 'PDisks:']) {
                const group = panel.getByRole('radiogroup', {name: label, exact: true});
                await expect(group).toBeVisible();
                await group.getByRole('radio', {name: 'All', exact: true}).check();
                await expect(group.getByRole('radio', {name: 'All', exact: true})).toBeChecked();
            }
        });
    }

    test('requires the node PDisks column only in Expert mode', async ({page}) => {
        await prepareNodesPage(page, VDisksGroupBy.All, PDisksGroupBy.All, undefined, {
            hidePopups: false,
        });
        const controls = new ClusterStorageTable(page).getControls();
        const row = page.locator('.ydb-paginated-table__row').filter({
            has: page.getByText('7000', {exact: true}),
        });
        const panel = page.locator('.ydb-storage-expert-mode-panel');
        const expertModeButton = page.getByRole('button', {name: 'Expert mode', exact: true});
        const pDisks = row.locator('.ydb-storage-pdisks__pdisks-item');

        await expertModeButton.click();
        await expect(panel).toBeHidden();
        await controls.openColumnSetup();
        await controls.setColumnUnchecked('PDisks');
        await controls.closeColumnSetup();
        await expect(pDisks).toHaveCount(0);
        await expect(row).toHaveCSS('height', '41px');

        await expertModeButton.click();
        await expect(pDisks).toHaveCount(4);
        await expect(row).toHaveCSS('height', '155px');
        await expect(
            panel.getByRole('radiogroup', {name: 'VDisks:', exact: true}).getByRole('radio', {
                name: 'All',
                exact: true,
            }),
        ).toBeChecked();
        await controls.openColumnSetup();
        await page.locator('.g-tree-select__popup [data-list-item="PDisks"]').click();
        await controls.closeColumnSetup();
        await expect(pDisks).toHaveCount(4);
        await expect(row).toHaveCSS('height', '155px');

        await expertModeButton.click();
        await expect(panel).toBeHidden();
        await controls.openColumnSetup();
        await controls.setColumnUnchecked('PDisks');
        await controls.closeColumnSetup();
        await expect(pDisks).toHaveCount(0);
        await expect(row).toHaveCSS('height', '41px');

        await controls.openColumnSetup();
        await controls.setColumnChecked('PDisks');
        await controls.closeColumnSetup();
        await expect(pDisks).toHaveCount(4);
        await expect(row).toHaveCSS('height', '51px');
    });

    test('keeps Expert disk rendering scoped to Storage when navigating to Nodes', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            localStorage.setItem('storageType', JSON.stringify('nodes'));
            localStorage.setItem(
                'nodesTableSelectedColumns',
                JSON.stringify([
                    {id: 'NodeId', selected: true},
                    {id: 'PDisks', selected: true},
                ]),
            );
        });
        await prepareNodesPage(page, VDisksGroupBy.State, PDisksGroupBy.State);
        const expertPanel = page.locator('.ydb-storage-expert-mode-panel');
        await expertPanel.getByRole('radio', {name: 'All', exact: true}).first().check();
        await expertPanel.getByRole('radio', {name: 'All', exact: true}).last().check();

        const row = page
            .locator('.ydb-paginated-table__row')
            .filter({has: page.getByText('7000', {exact: true})});
        const pDisk = row.locator('.ydb-storage-pdisks__pdisks-item').nth(2);
        await expect(row).toHaveCSS('height', '155px');
        await expect(pDisk.locator('.pdisk-storage__vdisks-row')).toHaveCount(6);
        await expect(pDisk.locator('.pdisk-storage__vdisk-size-indicator')).toHaveCount(24);
        await expect(pDisk.locator(PDISK_ALL_MODE_DRIVE_SLOT_SELECTOR)).toHaveCount(1);

        await page.locator('[data-cluster-tab-id="nodes"]').click();
        await expect(page).toHaveURL(/\/cluster\/nodes/);
        await expect(row).toHaveCSS('height', '51px');
        await expect(pDisk.locator('.pdisk-storage__vdisks-item')).toHaveCount(24);
        await expect(pDisk.locator('.pdisk-storage__vdisks-row')).toHaveCount(1);
        await expect(pDisk.locator('.pdisk-storage')).toHaveCSS('width', '165px');
        await expect(row.locator('.ydb-storage-pdisks__pdisks-wrapper')).toHaveCSS(
            'height',
            '40px',
        );
        await expect(pDisk.locator('.pdisk-storage__vdisk-size-indicator')).toHaveCount(0);
        await expect(pDisk.locator(PDISK_ALL_MODE_DRIVE_SLOT_SELECTOR)).toHaveCount(0);
        await expect(pDisk.locator(ALL_MODE_FRONT_QUEUES_SLOT_SELECTOR)).toHaveCount(0);

        await page.locator('[data-cluster-tab-id="storage"]').click();
        await expect(
            expertPanel.getByRole('radio', {name: 'All', exact: true}).first(),
        ).toBeChecked();
        await expect(
            expertPanel.getByRole('radio', {name: 'All', exact: true}).last(),
        ).toBeChecked();
        await expect(row).toHaveCSS('height', '155px');
        await expect(pDisk.locator('.pdisk-storage__vdisks-row')).toHaveCount(6);
        await expect(pDisk.locator('.pdisk-storage__vdisk-size-indicator')).toHaveCount(24);
        await expect(pDisk.locator(PDISK_ALL_MODE_DRIVE_SLOT_SELECTOR)).toHaveCount(1);
    });

    test('labels node VDisk links in every Expert mode', async ({page}) => {
        const response = createMockStorageNodesResponse();
        const vDisk = response.Nodes?.[0]?.VDisks?.[1];
        const donor = response.Nodes?.[0]?.VDisks?.[2];
        if (!vDisk || !donor) {
            throw new Error('Cannot prepare VDisks for accessible names');
        }
        Object.assign(vDisk, {
            VDiskState: EVDiskState.OK,
            Replicated: false,
            CapacityAlert: ECapacityAlert.RED,
            FrontQueues: EFlag.Yellow,
            SatisfactionRank: {
                FreshRank: {Flag: EFlag.Green},
                LevelRank: {Flag: EFlag.Red},
            },
        });
        donor.DonorMode = true;

        await prepareNodesPage(page, VDisksGroupBy.State, PDisksGroupBy.All, response);
        const row = page.locator('.ydb-paginated-table__row').filter({
            has: page.getByText('7000', {exact: true}),
        });
        const disks = row
            .locator('.ydb-storage-pdisks__pdisks-item')
            .first()
            .locator('.pdisk-storage__vdisks-item');

        for (const {mode, status, missingStatus} of [
            {
                mode: 'State',
                status: 'State: OK. Replication: in progress.',
                missingStatus: 'State: N/D. Replication: N/D.',
            },
            {mode: 'Space', status: 'Capacity alert: RED.', missingStatus: 'Capacity alert: N/D.'},
            {
                mode: 'Front queues',
                status: 'Front queues: Notice.',
                missingStatus: 'Front queues: N/D.',
            },
            {
                mode: 'Compaction',
                status: 'Fresh compaction: OK. Level compaction: Impaired.',
                missingStatus: 'Fresh compaction: N/D. Level compaction: N/D.',
            },
        ]) {
            await page
                .locator('.ydb-storage-expert-mode-panel')
                .getByRole('radio', {name: mode, exact: true})
                .first()
                .check();
            await expect(disks.nth(1).getByRole('link')).toHaveAccessibleName(
                `VDisk 9000000000-1-0-0-1 on node 7000. ${status}`,
            );
            await expect(disks.first().getByRole('link')).toHaveAccessibleName(
                `VDisk 7000-100-200 on node 7000. Whiteboard: N/D. ${missingStatus}`,
            );
            await expect(disks.nth(2).getByRole('link')).toHaveAccessibleName(
                /^Donor VDisk 9000000000-1-0-0-2 on node 7000\./,
            );
        }

        await page
            .locator('.ydb-storage-expert-mode-panel')
            .getByRole('radio', {name: 'All', exact: true})
            .first()
            .check();
        await expect(disks.nth(1).getByRole('link')).toHaveAccessibleName(
            /^VDisk 9000000000-1-0-0-1\. Health: issues detected\. State: OK\. Replication: in progress\. Capacity alert: RED\. Front queues: Yellow\. Fresh compaction: Green\. Level compaction: Red\. Allocated: \d+%\.$/,
        );
    });

    test('renders loaded node rows at their final height on initial and cached loads', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            const heights: number[] = [];
            Object.assign(window, {observedNodeRowHeights: heights});
            const observer = new MutationObserver(() => {
                const row = Array.from(
                    document.querySelectorAll<HTMLTableRowElement>('.ydb-paginated-table__row'),
                ).find((element) =>
                    Array.from(element.cells).some((cell) => cell.textContent === '7000'),
                );
                if (!row?.querySelector('.pdisk-storage__vdisks-item')) {
                    return;
                }
                const height = row.getBoundingClientRect().height;
                if (height > 0 && height !== heights[heights.length - 1]) {
                    heights.push(height);
                }
            });
            observer.observe(document, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: ['style', 'class'],
            });
        });
        const getObservedHeights = () =>
            page.evaluate(
                () =>
                    (window as typeof window & {observedNodeRowHeights: number[]})
                        .observedNodeRowHeights,
            );

        await prepareNodesPage(page, VDisksGroupBy.All, PDisksGroupBy.Space);
        const row = page.locator('.ydb-paginated-table__row').filter({
            has: page.getByText('7000', {exact: true}),
        });
        await expect(row).toHaveCSS('height', '155px');
        expect(await getObservedHeights()).toEqual([155]);

        const typeFilter = page.getByTestId('storage-type-filter');
        await typeFilter.getByRole('radio', {name: 'Groups', exact: true}).check();
        await expect(page.getByRole('link', {name: '9000000000', exact: true})).toBeVisible();
        await page.evaluate(() => {
            (
                window as typeof window & {observedNodeRowHeights: number[]}
            ).observedNodeRowHeights.length = 0;
        });
        await typeFilter.getByRole('radio', {name: 'Nodes', exact: true}).check();
        await expect(row).toHaveCSS('height', '155px');
        expect(await getObservedHeights()).toEqual([155]);
    });

    test('keeps node PDisk layout stable across hover and Expert mode changes', async ({page}) => {
        await prepareNodesPage(page, VDisksGroupBy.State, PDisksGroupBy.All);

        const row = page
            .locator('.ydb-paginated-table__row')
            .filter({has: page.getByText('7000', {exact: true})});
        await expect(row).toBeVisible();
        const pDisks = row.locator('.ydb-storage-pdisks__pdisks-item');
        await expect(pDisks).toHaveCount(4);
        const vDiskCounts = [8, 16, 24, 8];

        for (const {mode, width, disksPerRow, rowHeight} of [
            {mode: 'State', width: 165, disksPerRow: 8, rowHeight: 83},
            {mode: 'All', width: 186, disksPerRow: 4, rowHeight: 155},
            {mode: 'State', width: 165, disksPerRow: 8, rowHeight: 83},
        ]) {
            await page
                .locator('.ydb-storage-expert-mode-panel')
                .getByRole('radio', {name: mode, exact: true})
                .first()
                .check();
            await expect(row).toHaveCSS('height', `${rowHeight}px`);
            for (const [index, count] of vDiskCounts.entries()) {
                const pDisk = pDisks.nth(index);
                await expect(pDisk.locator('.pdisk-storage')).toHaveCSS('width', `${width}px`);
                await expect(pDisk.locator('.pdisk-storage__vdisks-item')).toHaveCount(count);
                await expect(pDisk.locator('.pdisk-storage__vdisks-row')).toHaveCount(
                    count / disksPerRow,
                );
            }

            const vDisk = pDisks.nth(2).locator('.pdisk-storage__vdisks-item').first();
            const bar = getVDiskProgressBar(vDisk);
            await vDisk.hover();
            await expect(bar).toHaveClass(/storage-disk-progress-bar_highlighted/);
            await page.mouse.move(0, 0);
            await expect(bar).not.toHaveClass(/storage-disk-progress-bar_highlighted/);
            await expect(pDisks.nth(2).locator('.pdisk-storage__vdisks-item')).toHaveCount(24);
            await expect(row).toHaveCSS('height', `${rowHeight}px`);
        }
    });

    for (const vDiskMode of VDISK_GROUP_BY_MODES) {
        for (const pDiskMode of PDISK_GROUP_BY_MODES) {
            if (vDiskMode.value !== VDisksGroupBy.State && pDiskMode.value !== PDisksGroupBy.All) {
                continue;
            }

            test(`renders all three node rows with VDisks ${vDiskMode.value} and PDisks ${pDiskMode.value}`, async ({
                page,
            }) => {
                await prepareNodesPage(page, vDiskMode.value, pDiskMode.value);

                const table = page.locator('.ydb-paginated-table__table');
                const rows = table.locator('.ydb-paginated-table__row');
                await expect(rows).toHaveCount(3);

                for (const [index, vDiskCount] of [56, 64, 72].entries()) {
                    const row = rows.nth(index);
                    await expect(
                        row.getByRole('cell', {name: String(7000 + index), exact: true}),
                    ).toBeVisible();
                    await expect(row.locator('.ydb-storage-pdisks__pdisks-item')).toHaveCount(4);
                    await expect(row.locator('.pdisk-storage__vdisks-item')).toHaveCount(
                        vDiskCount,
                    );
                }

                await page.mouse.move(0, 0);
                await expect(table).toHaveScreenshot(
                    `nodes-vdisks-${vDiskMode.slug}-pdisks-${pDiskMode.slug}.png`,
                );
            });
        }
    }

    test('renders No data last in Expert Mode legends except All', async ({page}, testInfo) => {
        await preparePage(page, VDisksGroupBy.State);

        const pDiskSelector = page.getByTestId('storage-pdisks-expert-mode');
        const legend = page.getByTestId('storage-pdisks-expert-mode-legend');
        const legendLabels = legend.locator('.g-label');

        await expect(pDiskSelector).toBeVisible();
        await expect(legendLabels).toHaveText([
            'Ok',
            'Initial',
            'Attention',
            'Stopped',
            'Error',
            'No data',
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

        await pDiskSelector.getByRole('radio', {name: 'Maintenance'}).check();

        await expect(legendLabels.nth(0)).toHaveClass(/g-label_theme_danger/);
        await expect(legendLabels.nth(1)).toHaveClass(/g-label_theme_warning/);
        await expect(legendLabels.nth(2)).toHaveClass(/g-label_theme_success/);
        await expect(legendLabels.nth(0).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(1).locator('svg').first()).toBeVisible();
        await expect(legendLabels.nth(2).locator('svg')).toHaveCount(0);
        await expect(page).toHaveURL(/pdisksGroupBy=Maintenance/);

        const panel = page.locator('.ydb-storage-expert-mode-panel');
        for (const [index, modes] of [VDISK_GROUP_BY_MODES, PDISK_GROUP_BY_MODES].entries()) {
            const legendRow = panel.locator(':scope > .g-flex').nth(index);
            for (const mode of [...modes, {value: VDisksGroupBy.DriveType}]) {
                await legendRow.locator(`input[type="radio"][value="${mode.value}"]`).check();
                const noData = legendRow.locator('.g-label').filter({hasText: /^No data$/});
                if (mode.value === VDisksGroupBy.All) {
                    await expect(legendRow.getByRole('combobox')).toBeVisible();
                    await expect(noData).toHaveCount(0);
                    continue;
                }
                await expect(noData).toHaveCount(1);
                await expect(noData).toBeVisible();
                await expect(noData).toHaveClass(/g-label_theme_unknown/);
                await expect(noData.locator('svg')).toHaveCount(0);
                await expect(legendRow.locator('.g-label').last()).toHaveText('No data');
            }
        }

        await testInfo.attach('expert-mode-legends-all', {
            body: await panel.screenshot({
                path: testInfo.outputPath('expert-mode-legends-all.png'),
            }),
            contentType: 'image/png',
        });
    });

    test('uses filled colors for compact VDisks outside Expert Mode', async ({page}) => {
        await preparePage(page, VDisksGroupBy.State, false);

        const vDiskItems = getVDiskItems(getStorageGroupRow(page, 0));
        const greenVDisk = getVDiskProgressBar(vDiskItems.nth(MISSING_FRONT_QUEUES_VDISK_INDEX));

        await expect(greenVDisk).toHaveClass(/storage-disk-progress-bar_compact/);
        await expect(greenVDisk).toHaveClass(/storage-disk-progress-bar_green/);
        await expect(greenVDisk).not.toHaveClass(/storage-disk-progress-bar_expert-mode/);

        const [fillLayerColor, actualStyles] = await Promise.all([
            resolveThemeColor(page, '--g-color-base-positive-light'),
            greenVDisk.evaluate((element) => {
                const styles = getComputedStyle(element);

                return {
                    backgroundColor: styles.backgroundColor,
                    backgroundImage: styles.backgroundImage,
                };
            }),
        ]);

        expect(actualStyles.backgroundColor).toBe(fillLayerColor);
        expect(actualStyles.backgroundImage).toContain(fillLayerColor);
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
        await getPDisksArea(getStorageGroupRow(page, 0)).scrollIntoViewIfNeeded();
        const pDiskLegendLabels = page
            .getByTestId('storage-pdisks-expert-mode-legend')
            .locator('.g-label');
        const cases = [
            {
                pDiskIndex: 0,
                color: 'light-grey',
                iconReference: 'present',
            },
            {pDiskIndex: 4, color: 'green', iconReference: undefined},
            {pDiskIndex: 5, color: 'yellow', iconReference: 1},
            {pDiskIndex: 6, color: 'red', iconReference: 2},
            {pDiskIndex: 7, color: 'red', iconReference: 3},
            {pDiskIndex: 8, color: 'solidred', iconReference: 4},
        ] as const;

        for (const {pDiskIndex, color, iconReference} of cases) {
            const pDiskItem = pDiskItems.nth(pDiskIndex);
            const progressBar = getPDiskProgressBar(pDiskItem);
            const icon = progressBar.locator('.storage-disk-progress-bar__icon');

            await expect(progressBar).toHaveClass(/storage-disk-progress-bar_mode-state/);
            await expect(progressBar).toHaveClass(new RegExp(`storage-disk-progress-bar_${color}`));
            if (color === 'light-grey') {
                await expect(progressBar).not.toHaveClass(/storage-disk-progress-bar_grey(?:\s|$)/);
            }
            await expect(progressBar.locator('.storage-disk-progress-bar__fill-bar')).toHaveCount(
                0,
            );
            await expect(progressBar).not.toHaveAttribute('aria-valuenow', /.+/);
            expect((await pDiskItem.boundingBox())?.width).toBe(55);

            if (iconReference === undefined) {
                await expect(icon).toHaveCount(0);
            } else {
                await expect(icon).toBeVisible();
                if (typeof iconReference === 'number') {
                    expect(await getIconSvgMarkup(icon)).toBe(
                        await getIconSvgMarkup(pDiskLegendLabels.nth(iconReference)),
                    );
                }
            }
        }
    });

    for (const mode of [
        {value: PDisksGroupBy.Drive, slug: 'drive'},
        {value: PDisksGroupBy.Decommit, slug: 'decommit'},
        {value: PDisksGroupBy.Maintenance, slug: 'maintenance'},
    ] as const) {
        test(`renders N/D for PDisks without Whiteboard in ${mode.value} mode`, async ({page}) => {
            await preparePDiskPage(page, mode.value);

            const pDiskItems = getPDiskItems(getStorageGroupRow(page, 0));
            const progressBar = getPDiskProgressBar(pDiskItems.nth(MISSING_WHITEBOARD_PDISK_INDEX));

            await expect(progressBar).toHaveClass(
                new RegExp(`storage-disk-progress-bar_mode-${mode.slug}`),
            );
            await expect(progressBar).toHaveClass(/storage-disk-progress-bar_grey(?:\s|$)/);
            await expect(progressBar).not.toHaveClass(/storage-disk-progress-bar_light-grey/);
            await expect(progressBar).toContainText('N/D');
            const icon = progressBar.locator('.storage-disk-progress-bar__icon');
            if (mode.value === PDisksGroupBy.Drive) {
                await expect(icon).toBeVisible();
                const inactiveLegendItem = page
                    .getByTestId('storage-pdisks-expert-mode-legend')
                    .locator('.g-label')
                    .filter({hasText: 'Inactive'});
                expect(await getIconSvgMarkup(icon)).toBe(
                    await getIconSvgMarkup(inactiveLegendItem),
                );
            } else {
                await expect(icon).toHaveCount(0);
            }
            await expect(progressBar.locator('.storage-disk-progress-bar__fill-bar')).toHaveCount(
                0,
            );
        });
    }

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
            const missingIndicatorColor = await resolveThemeColor(page, '--g-color-text-hint');

            const ordinaryItems = getVDiskItems(getStorageGroupRow(page, 0));
            const stateOnlyOk = getVDiskProgressBar(ordinaryItems.nth(STATE_ONLY_OK_VDISK_INDEX));
            const lightYellow = getVDiskProgressBar(ordinaryItems.nth(LIGHT_YELLOW_VDISK_INDEX));
            const missingCapacityAlert = getVDiskProgressBar(
                ordinaryItems.nth(PDISK_ERROR_VDISK_INDEX),
            );
            const lightYellowCapacityAlertSlot = lightYellow.locator(
                ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR,
            );
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
            const lightYellowFrontQueuesSlot = lightYellow.locator(
                ALL_MODE_FRONT_QUEUES_SLOT_SELECTOR,
            );
            const lightYellowCompactionSlot = lightYellow.locator(
                ALL_MODE_COMPACTION_SLOT_SELECTOR,
            );
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

            await expect(lightYellow).toHaveClass(/storage-disk-progress-bar_green/);
            await expect(lightYellow).toHaveClass(/storage-disk-progress-bar_all-mode-has-issues/);
            await expect(lightYellow).not.toContainText(/\d+%/);
            await expect(lightYellowCapacityAlertSlot).toHaveCount(1);
            await expect(lightYellowCapacityAlertSlot).toHaveCSS('width', '16px');
            await expect(lightYellowCapacityAlertSlot).toHaveText('LY');

            const [expectedCaption2, expectedTextColor, actualTypography] = await Promise.all([
                resolveCaption2Typography(page),
                resolveThemeColor(page, '--g-color-text-primary'),
                lightYellowCapacityAlertSlot.evaluate((element) => {
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

            const [lightYellowBox, lightYellowSlotBox] = await Promise.all([
                lightYellow.boundingBox(),
                lightYellowCapacityAlertSlot.boundingBox(),
            ]);

            if (!lightYellowBox || !lightYellowSlotBox) {
                throw new Error('Cannot compare All-mode VDisk and Capacity Alert slot boxes');
            }

            expect(lightYellowSlotBox.x - lightYellowBox.x).toBeCloseTo(4, 5);

            await expect(missingCapacityAlertSlot).toHaveCount(1);
            await expect(missingCapacityAlertSlot).toHaveCSS('width', '16px');
            const missingCapacityAlertIcon = missingCapacityAlertSlot.locator('.g-icon');
            await expect(missingCapacityAlertIcon).toBeVisible();
            await expect(missingCapacityAlertIcon).toHaveCSS('color', missingIndicatorColor);

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
            await expect(missingFrontQueuesIcon).toHaveCSS('color', missingIndicatorColor);

            await expect(lightYellowFrontQueuesSlot).toHaveCount(1);
            const lightYellowFrontQueuesIcon = lightYellowFrontQueuesSlot.locator('.g-icon');
            await expect(lightYellowFrontQueuesIcon).toBeVisible();
            await expect(lightYellowFrontQueuesIcon).toHaveCSS('color', expectedTextColor);

            await expect(lightYellowCompactionSlot).toHaveCount(1);
            await expect(lightYellowCompactionSlot).toHaveCSS('width', '17px');
            const lightYellowCompactionIcons = lightYellowCompactionSlot.locator('.g-icon');
            await expect(lightYellowCompactionIcons).toHaveCount(2);
            await expect(lightYellowCompactionIcons.nth(0)).toHaveCSS(
                'color',
                missingIndicatorColor,
            );
            await expect(lightYellowCompactionIcons.nth(1)).toHaveCSS('color', expectedTextColor);

            const [lightYellowCompactionSlotBox, lightYellowCompactionIconBoxes] =
                await Promise.all([
                    lightYellowCompactionSlot.boundingBox(),
                    lightYellowCompactionIcons.evaluateAll((icons) =>
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

            if (!lightYellowCompactionSlotBox) {
                throw new Error('Cannot compare All-mode VDisk and Compaction slot boxes');
            }

            expect(lightYellowCompactionSlotBox.x - lightYellowBox.x).toBeCloseTo(40, 5);
            expect(lightYellowCompactionIconBoxes).toHaveLength(2);
            lightYellowCompactionIconBoxes.forEach((box) => {
                expect(box.width).toBeCloseTo(10, 5);
                expect(box.height).toBeCloseTo(10, 5);
            });
            expect(
                lightYellowCompactionIconBoxes[1].left - lightYellowCompactionIconBoxes[0].left,
            ).toBeCloseTo(7, 5);
            expect(
                lightYellowCompactionIconBoxes[1].right - lightYellowCompactionIconBoxes[0].left,
            ).toBeCloseTo(17, 5);

            await expect(missingCompactionSlot).toHaveCount(1);
            await expect(missingCompactionSlot).toHaveCSS('width', '17px');
            const missingCompactionIcons = missingCompactionSlot.locator('.g-icon');
            await expect(missingCompactionIcons).toHaveCount(2);
            await Promise.all(
                [0, 1].map((index) =>
                    expect(missingCompactionIcons.nth(index)).toHaveCSS(
                        'color',
                        missingIndicatorColor,
                    ),
                ),
            );

            const replicatingItems = getVDiskItems(getStorageGroupRow(page, 1));
            const healthyReplicating = getVDiskProgressBar(replicatingItems.nth(0));
            const healthyCapacityAlertSlot = healthyReplicating.locator(
                ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR,
            );
            const lightYellowReplicating = getVDiskProgressBar(
                replicatingItems.nth(LIGHT_YELLOW_VDISK_INDEX),
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
            await expect(lightYellowReplicating).toHaveClass(/storage-disk-progress-bar_blue/);
            await expect(lightYellowReplicating).toHaveClass(/storage-disk-progress-bar_striped/);
        });

        test('uses State normal and hover colors while preserving allocation fills', async ({
            page,
        }) => {
            await preparePage(page, VDisksGroupBy.All);

            const ordinaryItems = getVDiskItems(getStorageGroupRow(page, 0));
            const stateOnlyOk = getVDiskProgressBar(ordinaryItems.nth(STATE_ONLY_OK_VDISK_INDEX));
            const allGreen = getVDiskProgressBar(ordinaryItems.nth(ALL_GREEN_VDISK_INDEX));
            const lightYellow = getVDiskProgressBar(ordinaryItems.nth(LIGHT_YELLOW_VDISK_INDEX));
            const pDiskError = getVDiskProgressBar(ordinaryItems.nth(PDISK_ERROR_VDISK_INDEX));
            const recoveryError = getVDiskProgressBar(
                ordinaryItems.nth(RECOVERY_ERROR_VDISK_INDEX),
            );
            const recoveryErrorFill = getVDiskFillBar(recoveryError);
            const ordinaryStateBars = [stateOnlyOk, allGreen, lightYellow, pDiskError];
            const [
                positiveMedium,
                positiveLight,
                dangerLight,
                dangerHeavy,
                dangerMedium,
                dangerHeavyHover,
                dangerMediumHover,
            ] = await Promise.all([
                resolveThemeColor(page, '--g-color-base-positive-medium'),
                resolveThemeColor(page, '--g-color-base-positive-light'),
                resolveThemeColor(page, '--g-color-base-danger-light'),
                resolveThemeColor(page, '--g-color-base-danger-heavy'),
                resolveThemeColor(page, '--g-color-base-danger-medium'),
                resolveThemeColor(page, '--g-color-base-danger-heavy-hover'),
                resolveThemeColor(page, '--g-color-base-danger-medium-hover'),
            ]);
            const ordinaryNormalFillColors = [
                positiveMedium,
                positiveLight,
                positiveMedium,
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

        test('keeps a partial All-mode fill rounded at the lower-left corner', async ({page}) => {
            await preparePage(page, VDisksGroupBy.All);

            const lightYellow = getVDiskProgressBar(
                getVDiskItems(getStorageGroupRow(page, 0)).nth(LIGHT_YELLOW_VDISK_INDEX),
            );
            const lightYellowFill = getVDiskFillBar(lightYellow);

            const bottomLeftRadius = await lightYellowFill.evaluate(
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
            await expect(
                noWhiteboardVDisk.locator('.storage-disk-progress-bar__all-mode-indicators'),
            ).toHaveCount(0);
            await expect(noWhiteboardVDisk.locator('.g-icon')).toHaveCount(0);

            await forceHoverStorageGroupVDiskItems(page, 0);

            await expect(noWhiteboardVDisk).toHaveCSS('background-color', highlightedColor);
            await expect(getVDiskFillBar(noWhiteboardVDisk)).toHaveCSS(
                'background-color',
                highlightedColor,
            );
            await expect(noWhiteboardVDisk).toHaveCSS('border-style', 'none');
        });

        test('omits OK State icons and overlaps error icons with the top-left corner', async ({
            page,
        }) => {
            await preparePage(page, VDisksGroupBy.All);

            const ordinaryItems = getVDiskItems(getStorageGroupRow(page, 0));
            const lightYellow = getVDiskProgressBar(ordinaryItems.nth(LIGHT_YELLOW_VDISK_INDEX));
            const pDiskError = getVDiskProgressBar(ordinaryItems.nth(PDISK_ERROR_VDISK_INDEX));
            const recoveryError = getVDiskProgressBar(
                ordinaryItems.nth(RECOVERY_ERROR_VDISK_INDEX),
            );

            await expect(
                lightYellow.locator('.storage-disk-progress-bar__icon_overlap-top-left'),
            ).toHaveCount(0);
            await expectStatusIconMatchesReference(page, pDiskError, PDISK_ERROR_ICON_COLOR_TOKEN);
            await expectStatusIconMatchesReference(
                page,
                recoveryError,
                RECOVERY_ERROR_ICON_COLOR_TOKEN,
            );
        });
    });

    test('keeps donor styling without Whiteboard data in every Expert mode', async ({page}) => {
        const response = createMockStorageGroupsResponse();
        const donor = response.StorageGroups?.[1]?.VDisks?.[0]?.Donors?.[0];
        if (!donor) {
            throw new Error('Cannot prepare donor without Whiteboard data');
        }
        delete donor.Whiteboard;

        await page.setViewportSize({width: 1500, height: 1000});
        await enableExpertMode(page, VDisksGroupBy.State);
        await setupVDiskColoringMocks(page, response);

        for (const mode of VDISK_GROUP_BY_MODES) {
            await gotoStoragePage(page, mode.value);
            await hideFloatingPopups(page);
            await expectStorageGroupRowsReady(page);
            await forceHoverStorageGroupVDiskItems(page, 1);

            const donorItem = getVDiskItems(getStorageGroupRow(page, 1))
                .first()
                .locator('.ydb-stack__item_donor');
            const donorBar = getVDiskProgressBar(donorItem);
            await expect(donorItem.getByRole('link')).toHaveAttribute('href', /nodeId=7100/);
            await expect(donorBar).toHaveClass(/storage-disk-progress-bar_darkgrey/);
            await expect(donorBar).toHaveClass(/storage-disk-progress-bar_striped/);
            await expect(donorBar).toHaveCSS('background-image', /repeating-linear-gradient/);
            await expect(donorBar).toContainText('N/D');

            const unavailableBar = getVDiskProgressBar(
                getVDiskItems(getStorageGroupRow(page, 0)).nth(MISSING_WHITEBOARD_VDISK_INDEX),
            );
            await expect(unavailableBar).toHaveClass(/storage-disk-progress-bar_grey(?:\s|$)/);
            await expect(unavailableBar).not.toHaveClass(/storage-disk-progress-bar_striped/);
        }
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

    test('labels node PDisk links in every Expert mode', async ({page}) => {
        const response = createMockStorageNodesResponse();
        const [missing, bscOnly, withWhiteboard, partial] = response.Nodes?.[0]?.PDisks ?? [];
        if (!missing || !bscOnly || !withWhiteboard || !partial) {
            throw new Error('Cannot prepare PDisks for accessible names');
        }
        Object.assign(missing, {AvailableSize: undefined, TotalSize: undefined});
        Object.assign(bscOnly, {
            DriveStatus: 'BROKEN',
            DecommitStatus: 'DECOMMIT_IMMINENT',
            MaintenanceStatus: 'LONG_TERM_MAINTENANCE_PLANNED',
            AvailableSize: '50',
            TotalSize: '100',
        });
        Object.assign(withWhiteboard, {
            State: TPDiskState.OpenFileError,
            PDiskCapacityAlert: ECapacityAlert.RED,
            Device: EFlag.Green,
            Realtime: EFlag.Red,
            DriveStatus: 'FAULTY',
            DecommitStatus: 'DECOMMIT_PENDING',
            MaintenanceStatus: 'NO_NEW_VDISKS',
            AvailableSize: '100',
            TotalSize: '100',
        });
        Object.assign(partial, {
            State: TPDiskState.Normal,
            PDiskCapacityAlert: undefined,
            Device: undefined,
            Realtime: undefined,
            DriveStatus: undefined,
            DecommitStatus: undefined,
            MaintenanceStatus: undefined,
            AvailableSize: undefined,
            TotalSize: undefined,
        });
        await prepareNodesPage(page, VDisksGroupBy.State, PDisksGroupBy.State, response);

        const row = page.locator('.ydb-paginated-table__row').filter({
            has: page.getByText('7000', {exact: true}),
        });
        const disks = row.locator('.ydb-storage-pdisks__pdisks-item');
        const selector = page.getByTestId('storage-nodes-pdisks-expert-mode');
        for (const {mode, status, bscStatus, missingStatus, partialStatus = missingStatus} of [
            {
                mode: 'State',
                status: 'State: OpenFileError.',
                bscStatus: 'State: N/D.',
                missingStatus: 'State: N/D.',
                partialStatus: 'State: Normal.',
            },
            {
                mode: 'Space',
                status: 'Capacity alert: RED. Allocated: 0%.',
                bscStatus: 'Capacity alert: N/D. Allocated: 50%.',
                missingStatus: 'Capacity alert: N/D. Allocated: N/D.',
            },
            {
                mode: 'Drive',
                status: 'Drive: FAULTY.',
                bscStatus: 'Drive: BROKEN.',
                missingStatus: 'Drive: N/D.',
            },
            {
                mode: 'Decommit',
                status: 'Decommit: DECOMMIT_PENDING.',
                bscStatus: 'Decommit: DECOMMIT_IMMINENT.',
                missingStatus: 'Decommit: N/D.',
            },
            {
                mode: 'Maintenance',
                status: 'Maintenance: NO_NEW_VDISKS.',
                bscStatus: 'Maintenance: LONG_TERM_MAINTENANCE_PLANNED.',
                missingStatus: 'Maintenance: N/D.',
            },
            {
                mode: 'Device',
                status: 'Device: Green. Realtime: Red.',
                bscStatus: 'Device: N/D. Realtime: N/D.',
                missingStatus: 'Device: N/D. Realtime: N/D.',
            },
        ]) {
            await selector.getByRole('radio', {name: mode, exact: true}).check();
            await expect(disks.nth(2).locator('.pdisk-storage__content')).toHaveAccessibleName(
                `PDisk 7000-102. ${status}`,
            );
            await expect(disks.nth(1).locator('.pdisk-storage__content')).toHaveAccessibleName(
                `PDisk 7000-101. Whiteboard: N/D. ${bscStatus}`,
            );
            await expect(disks.first().locator('.pdisk-storage__content')).toHaveAccessibleName(
                `PDisk 7000-100. Whiteboard: N/D. ${missingStatus}`,
            );
            await expect(disks.nth(3).locator('.pdisk-storage__content')).toHaveAccessibleName(
                `PDisk 7000-103. ${partialStatus}`,
            );
        }

        await selector.getByRole('radio', {name: 'All', exact: true}).check();
        await expect(disks.nth(2).locator('.pdisk-storage__content')).toHaveAccessibleName(
            'PDisk 7000-102. Health: issues detected. State: OpenFileError. Capacity alert: RED. Drive: FAULTY. Decommit: DECOMMIT_PENDING. Maintenance: NO_NEW_VDISKS. Device: Green. Realtime: Red. Allocated: 0%.',
        );
    });

    test('keeps top-level PDisk BSC statuses visible across Drive, Decommit, and All modes without Whiteboard', async ({
        page,
    }) => {
        const response = createMockStorageGroupsResponse();
        const targetPDisk =
            response.StorageGroups?.[0]?.VDisks?.[MISSING_WHITEBOARD_PDISK_INDEX]?.PDisk;

        if (!targetPDisk) {
            throw new Error('Cannot prepare PDisk BSC fallback regression fixtures');
        }

        targetPDisk.Status = 'BROKEN';
        targetPDisk.DecommitStatus = 'DECOMMIT_IMMINENT';
        targetPDisk.MaintenanceStatus = 'LONG_TERM_MAINTENANCE_PLANNED';

        await preparePDiskPage(page, PDisksGroupBy.Drive, response);

        const pDiskSelector = page.getByTestId('storage-pdisks-expert-mode');
        const targetPDiskItem = getPDiskItems(getStorageGroupRow(page, 0)).nth(
            MISSING_WHITEBOARD_PDISK_INDEX,
        );
        const targetPDiskBar = getPDiskProgressBar(targetPDiskItem);

        await expect(targetPDiskItem.locator('.pdisk-storage__content')).toHaveAccessibleName(
            'PDisk 7009-109. Whiteboard: N/D. Drive: BROKEN.',
        );
        await expect(targetPDiskBar).toHaveClass(/storage-disk-progress-bar_mode-drive/);
        await expect(targetPDiskBar).toHaveClass(/storage-disk-progress-bar_grey(?:\s|$)/);
        await expect(targetPDiskBar.locator('.storage-disk-progress-bar__icon')).toHaveCount(1);
        await expect(targetPDiskBar).toContainText('N/D');

        await pDiskSelector.getByRole('radio', {name: 'Decommit'}).check();

        await expect(targetPDiskItem.locator('.pdisk-storage__content')).toHaveAccessibleName(
            'PDisk 7009-109. Whiteboard: N/D. Decommit: DECOMMIT_IMMINENT.',
        );
        await expect(targetPDiskBar).toHaveClass(/storage-disk-progress-bar_mode-decommit/);
        await expect(targetPDiskBar).toHaveClass(/storage-disk-progress-bar_grey(?:\s|$)/);
        await expect(targetPDiskBar.locator('.storage-disk-progress-bar__icon')).toHaveCount(1);
        await expect(targetPDiskBar).toContainText('N/D');

        await pDiskSelector.getByRole('radio', {name: 'All'}).check();
        await targetPDiskItem.scrollIntoViewIfNeeded();

        await expect(targetPDiskBar).toHaveClass(/storage-disk-progress-bar_mode-all/);
        await expect(targetPDiskBar).toHaveClass(/storage-disk-progress-bar_grey(?:\s|$)/);
        await expect(targetPDiskBar).toContainText('N/D');
        await expect(
            targetPDiskBar.locator(PDISK_ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(0);
        await expect(
            targetPDiskBar.locator(PDISK_ALL_MODE_DRIVE_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(1);
        await expect(
            targetPDiskBar.locator(PDISK_ALL_MODE_DECOMMIT_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(1);
        await expect(
            targetPDiskBar.locator(PDISK_ALL_MODE_MAINTENANCE_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(1);
        await expect(
            targetPDiskBar.locator(PDISK_ALL_MODE_DEVICE_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(0);
        await expect(targetPDiskItem.locator('.pdisk-storage__content')).toHaveAttribute(
            'aria-label',
            /Drive: BROKEN\. Decommit: DECOMMIT_IMMINENT\. Maintenance: LONG_TERM_MAINTENANCE_PLANNED\./,
        );
    });

    test('renders All-mode PDisk overlays, widths, and accessible labels as a stable contract', async ({
        page,
    }) => {
        await preparePDiskPage(page, PDisksGroupBy.All);

        const pDiskItems = getPDiskItems(getStorageGroupRow(page, 0));
        const healthyPDiskItem = pDiskItems.nth(ALL_GREEN_VDISK_INDEX);
        const errorPDiskItem = pDiskItems.nth(2);
        const missingPDiskItem = pDiskItems.nth(MISSING_WHITEBOARD_PDISK_INDEX);
        const healthyPDiskBar = getPDiskProgressBar(healthyPDiskItem);
        const errorPDiskBar = getPDiskProgressBar(errorPDiskItem);
        const missingPDiskBar = getPDiskProgressBar(missingPDiskItem);
        const healthyOverlay = healthyPDiskBar.locator(
            '.storage-disk-progress-bar__pdisk-all-mode-indicators',
        );

        await expect(healthyPDiskBar).toHaveClass(/storage-disk-progress-bar_mode-all/);
        expect((await healthyPDiskItem.boundingBox())?.width).toBe(98);
        // GREEN/CYAN capacity alerts are hidden by the default PDisk All legend selection.
        await expect(healthyOverlay).toHaveCount(0);
        await expect(healthyPDiskBar.locator('.g-icon')).toHaveCount(0);
        const healthyAccessibleName = new RegExp(
            `PDisk 7010-110\\. Health: healthy\\. State: Normal\\. ` +
                `Capacity alert: ${ECapacityAlert.GREEN}\\. Drive: ACTIVE\\. ` +
                `Decommit: DECOMMIT_NONE\\. Maintenance: NO_REQUEST\\. ` +
                `Device: ${EFlag.Green}\\. Realtime: ${EFlag.Green}\\. Allocated: 75%\\.`,
        );
        await expect(healthyPDiskItem.locator('.pdisk-storage__content')).toHaveAttribute(
            'aria-label',
            healthyAccessibleName,
        );

        await expect(errorPDiskBar).toHaveClass(/storage-disk-progress-bar_mode-all/);
        await expect(errorPDiskBar).toHaveClass(/storage-disk-progress-bar_red/);
        await expect(errorPDiskBar).toHaveClass(/storage-disk-progress-bar_all-mode-has-issues/);
        const errorOverlaySlots = errorPDiskBar.locator(
            '.storage-disk-progress-bar__pdisk-all-mode-indicators > *',
        );
        await expect(errorOverlaySlots).toHaveCount(5);
        await expect(errorOverlaySlots.nth(0)).toHaveClass(
            /pdisk-all-mode-capacity-alert-indicator-slot/,
        );
        await expect(errorOverlaySlots.nth(1)).toHaveClass(/pdisk-all-mode-drive-indicator-slot/);
        await expect(errorOverlaySlots.nth(2)).toHaveClass(
            /pdisk-all-mode-decommit-indicator-slot/,
        );
        await expect(errorOverlaySlots.nth(3)).toHaveClass(
            /pdisk-all-mode-maintenance-indicator-slot/,
        );
        await expect(errorOverlaySlots.nth(4)).toHaveClass(/pdisk-all-mode-device-indicator-slot/);
        await expect(errorPDiskBar.locator(PDISK_ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR)).toHaveText(
            'Y',
        );
        await expect(
            errorPDiskBar.locator(PDISK_ALL_MODE_DRIVE_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(1);
        await expect(
            errorPDiskBar.locator(PDISK_ALL_MODE_DECOMMIT_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(1);
        await expect(
            errorPDiskBar.locator(PDISK_ALL_MODE_MAINTENANCE_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(1);
        await expect(
            errorPDiskBar.locator(PDISK_ALL_MODE_DEVICE_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(2);

        const errorIcon = errorPDiskBar.locator(
            '.storage-disk-progress-bar__icon_overlap-top-left',
        );
        await expect(errorIcon).toBeVisible();

        const [errorPDiskBarBox, errorIconBox] = await Promise.all([
            errorPDiskBar.boundingBox(),
            errorIcon.boundingBox(),
        ]);

        if (!errorPDiskBarBox || !errorIconBox) {
            throw new Error('Cannot compare PDisk All-mode bar and state icon boxes');
        }

        expect(errorIconBox.x).toBeLessThan(errorPDiskBarBox.x);
        expect(errorIconBox.y).toBeLessThan(errorPDiskBarBox.y);
        expect(errorIconBox.x + errorIconBox.width).toBeGreaterThan(errorPDiskBarBox.x);
        expect(errorIconBox.y + errorIconBox.height).toBeGreaterThan(errorPDiskBarBox.y);

        await expect(missingPDiskBar).toHaveClass(/storage-disk-progress-bar_mode-all/);
        await expect(missingPDiskBar).toHaveClass(/storage-disk-progress-bar_grey(?:\s|$)/);
        await expect(missingPDiskBar).toContainText('N/D');
        await expect(missingPDiskBar.locator('.storage-disk-progress-bar__icon')).toHaveCount(0);
        await expect(
            missingPDiskBar.locator(PDISK_ALL_MODE_CAPACITY_ALERT_SLOT_SELECTOR),
        ).toBeEmpty();
        await expect(
            missingPDiskBar.locator(PDISK_ALL_MODE_DRIVE_SLOT_SELECTOR).locator('.g-icon'),
        ).toHaveCount(1);
        await expect(missingPDiskBar.locator(PDISK_ALL_MODE_DECOMMIT_SLOT_SELECTOR)).toBeEmpty();
        await expect(missingPDiskBar.locator(PDISK_ALL_MODE_MAINTENANCE_SLOT_SELECTOR)).toBeEmpty();
        await expect(missingPDiskBar.locator(PDISK_ALL_MODE_DEVICE_SLOT_SELECTOR)).toBeEmpty();
        await expect(missingPDiskBar.locator('.g-icon')).toHaveCount(1);
        await expect(missingPDiskItem.locator('.pdisk-storage__content')).toHaveAttribute(
            'aria-label',
            /PDisk 7009-109\. Health: N\/D\. State: N\/D\. Capacity alert: N\/D\. Drive: INACTIVE\. Decommit: N\/D\. Maintenance: N\/D\. Device: N\/D\. Realtime: N\/D\. Allocated: 50%\./,
        );
    });

    for (const mode of PDISK_GROUP_BY_MODES) {
        test.describe(`PDisk ${mode.value} mode`, () => {
            test(`renders the first storage group PDisk row in ${mode.slug} mode`, async ({
                page,
            }) => {
                await preparePDiskPage(page, mode.value);
                const pDisks = getPDisksArea(getStorageGroupRow(page, 0));

                if (mode.value === PDisksGroupBy.All) {
                    await expectPDiskAllScreenshot(
                        page,
                        pDisks,
                        `pdisk-${mode.slug}-first-row.png`,
                    );
                } else {
                    await expectPDiskScreenshot(pDisks, `pdisk-${mode.slug}-first-row.png`);
                }

                await forceHoverStorageGroupVDiskItems(page, 0);
                if (mode.value === PDisksGroupBy.All) {
                    await expectPDiskAllScreenshot(
                        page,
                        pDisks,
                        `pdisk-${mode.slug}-first-row-hover.png`,
                    );
                } else {
                    await expectPDiskScreenshot(pDisks, `pdisk-${mode.slug}-first-row-hover.png`);
                }
            });
        });
    }
});

test.describe('Disk Coloring - Default Mode visual snapshots', () => {
    test.describe.configure({timeout: 300_000});

    test('renders both storage group VDisk rows with hover states', async ({page}) => {
        await preparePage(page, VDisksGroupBy.State, false);

        const firstRow = getStorageGroupRow(page, 0);
        const secondRow = getStorageGroupRow(page, 1);
        const firstRowVDisks = getVDisksArea(firstRow);
        const secondRowVDisks = getVDisksArea(secondRow);

        await expectVDiskScreenshot(firstRowVDisks, 'vdisk-default-first-row.png');

        await forceHoverStorageGroupVDiskItems(page, 0);
        await expectStorageRowsScreenshot(page, 'vdisk-default-first-row-hover.png');

        await clearForcedHover(page);
        await expectVDiskScreenshot(secondRowVDisks, 'vdisk-default-second-row.png');

        await forceHoverStorageGroupVDiskItems(page, 1);
        await expectStorageRowsScreenshot(page, 'vdisk-default-second-row-hover.png');
    });

    test('renders the first storage group PDisk row with hover state', async ({page}) => {
        await preparePage(page, VDisksGroupBy.State, false);

        const firstRowPDisks = getPDisksArea(getStorageGroupRow(page, 0));

        await expectPDiskScreenshot(firstRowPDisks, 'pdisk-default-first-row.png');

        await forceHoverStorageGroupVDiskItems(page, 0);
        await expectPDiskScreenshot(firstRowPDisks, 'pdisk-default-first-row-hover.png');
    });
});
