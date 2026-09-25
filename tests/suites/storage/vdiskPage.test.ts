import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../../../src/containers/Storage/shared';
import {EMPTY_DATA_PLACEHOLDER} from '../../../src/utils/emptyDataPlaceholder';
import {ClusterStorageTable} from '../paginatedTable/paginatedTable';
import {Sidebar} from '../sidebar/Sidebar';

import {
    GROUP_ID,
    LONG_DATACENTER,
    LONG_HOST,
    LONG_PDISK_ID,
    LONG_RACK,
    NODE_ID,
    PDISK_ID,
    STORAGE_POOL_NAME,
    VDISK_ID,
    VDISK_PAGE_PATH,
    setupDiskNodeMetadataMock,
    setupPDiskInfoMock,
    setupVDiskBlobIndexStatMock,
    setupVDiskPageMocks,
} from './vdiskPageMocks';

const VDISK_TABLETS_PAGE_PATH = VDISK_PAGE_PATH.replace('activeTab=storage', 'activeTab=tablets');
const VDISK_TABLETS_WITH_STORAGE_STATE_PAGE_PATH = `${VDISK_TABLETS_PAGE_PATH}&groupsSearch=review-marker`;

async function enableNewStorageView(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('enableNewStorageView', JSON.stringify(true));
    });
}

async function enableBlobStorageCapacityMetrics(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('blobStorageCapacityMetrics', JSON.stringify(true));
    });
}

async function enableStorageNodesCapacityColumns(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            'storageNodesSelectedColumns',
            JSON.stringify([
                {id: 'NodeId', selected: true},
                {id: 'PDisks', selected: true},
                {id: 'MaxPDiskUsage', selected: true},
                {id: 'MaxVDiskSlotUsage', selected: true},
                {id: 'MaxVDiskRawUsage', selected: true},
                {id: 'CapacityAlert', selected: true},
                {id: 'DiskSpaceUsage', selected: true},
            ]),
        );
    });
}

async function enableStorageNodesVDiskSlotUsageOnly(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            'storageNodesSelectedColumns',
            JSON.stringify([
                {id: 'NodeId', selected: true},
                {id: 'MaxVDiskSlotUsage', selected: true},
            ]),
        );
    });
}

async function enableStorageGroupsLegacyCapacityColumns(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            'storageGroupsSelectedColumns',
            JSON.stringify([
                {id: 'GroupId', selected: true},
                {id: 'Usage', selected: true},
                {id: 'DiskSpaceUsage', selected: true},
                {id: 'DiskSpace', selected: true},
                {id: 'MaxVDiskSlotUsage', selected: true},
            ]),
        );
    });
}

async function enableStorageDisksColumn(page: Page) {
    await page.addInitScript(() => {
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
    });
}

async function waitForDiskPopup(page: Page, actionName: string) {
    const popup = page
        .getByRole('link', {name: actionName, exact: true})
        .filter({visible: true})
        .locator(
            'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " ydb-popover ")][1]',
        )
        .last();
    await expect(popup).toBeVisible();
    return popup;
}

async function closeDiskPopup(page: Page, popup: Locator) {
    await page.mouse.move(0, 0);
    await expect(popup).toBeHidden();
}

function getDeveloperUIActorPath(actorType: 'vdisks' | 'pdisks') {
    return `/node/${NODE_ID}/actors/${actorType}/`;
}

async function expectDeveloperUILink(popup: Locator, expectedPath: string) {
    const developerUILink = popup.locator(`a[href*="${expectedPath}"]`, {
        hasText: /Open in Developer UI/,
    });

    await expect(developerUILink).toBeVisible();
}

test.describe('VDisk page tabs', () => {
    test('shows Tablets tab and loads its content for viewer users', async ({page}) => {
        const blobIndexStatRequests: string[] = [];

        await setupVDiskPageMocks(page);
        await setupVDiskBlobIndexStatMock(page, (requestUrl) => {
            blobIndexStatRequests.push(requestUrl);
        });

        await page.goto(VDISK_TABLETS_PAGE_PATH);

        const tabs = page.locator('.ydb-vdisk-page__tabs');
        await expect(tabs.getByText('Storage', {exact: true})).toBeVisible();
        await expect(tabs.getByText('Tablets', {exact: true})).toBeVisible();
        await expect(page.locator('.ydb-vdisk-page__tablets-content')).toBeVisible();
        await expect.poll(() => blobIndexStatRequests.length).toBeGreaterThan(0);
    });

    test('hides Tablets tab for database-scoped users', async ({page}) => {
        await setupVDiskPageMocks(page, {isViewerAllowed: false});

        await page.goto(VDISK_PAGE_PATH);

        const tabs = page.locator('.ydb-vdisk-page__tabs');
        await expect(tabs.getByText('Storage', {exact: true})).toBeVisible();
        await expect(tabs.getByText('Tablets', {exact: true})).toHaveCount(0);
    });

    test('preserves storage query state when redirecting restricted Tablets URLs', async ({
        page,
    }) => {
        const blobIndexStatRequests: string[] = [];

        await page.addInitScript(() => {
            localStorage.setItem('storageType', JSON.stringify('nodes'));
        });
        await setupVDiskPageMocks(page, {isViewerAllowed: false});
        await setupVDiskBlobIndexStatMock(page, (requestUrl) => {
            blobIndexStatRequests.push(requestUrl);
        });

        await page.goto(VDISK_TABLETS_WITH_STORAGE_STATE_PAGE_PATH);

        const tabs = page.locator('.ydb-vdisk-page__tabs');
        await expect(tabs.getByText('Storage', {exact: true})).toBeVisible();
        await expect(page.locator('.ydb-vdisk-page__tablets-content')).toHaveCount(0);
        await expect(page.locator('.ydb-paginated-table__table')).toBeVisible();
        await expect.poll(() => new URL(page.url()).searchParams.get('activeTab')).toBe('storage');
        await expect.poll(() => new URL(page.url()).searchParams.get('type')).toBe('groups');
        expect(new URL(page.url()).searchParams.get('groupsSearch')).toBe('review-marker');
        expect(blobIndexStatRequests).toHaveLength(0);
    });

    test('redirects restricted Tablets URLs before VDisk data loads', async ({page}) => {
        let releaseStorageRequest = () => {};
        const storageRequestPending = new Promise<void>((resolve) => {
            releaseStorageRequest = resolve;
        });
        let markStorageRequestStarted = () => {};
        const storageRequestStarted = new Promise<void>((resolve) => {
            markStorageRequestStarted = resolve;
        });
        const blobIndexStatRequests: string[] = [];

        await setupVDiskPageMocks(page, {isViewerAllowed: false});
        await setupVDiskBlobIndexStatMock(page, (requestUrl) => {
            blobIndexStatRequests.push(requestUrl);
        });
        await page.route('**/storage/groups?*', async (route) => {
            markStorageRequestStarted();
            await storageRequestPending;
            await route.fallback();
        });

        try {
            await page.goto(VDISK_TABLETS_PAGE_PATH);
            await storageRequestStarted;

            await expect
                .poll(() => new URL(page.url()).searchParams.get('activeTab'))
                .toBe('storage');
            expect(blobIndexStatRequests).toHaveLength(0);
        } finally {
            releaseStorageRequest();
        }
    });
});

function getInfoViewerRow(container: Locator, label: string) {
    const exactLabel = container
        .locator('.info-viewer__label-text')
        .getByText(label, {exact: true});

    return exactLabel.locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " info-viewer__row ")][1]',
    );
}

function getDefinitionListRow(container: Locator, label: string) {
    const exactLabel = container
        .locator('.g-definition-list__term-wrapper')
        .getByText(label, {exact: true});

    return exactLabel.locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " g-definition-list__item ")][1]',
    );
}

async function getDiskPopupPanel(container: Locator, title: 'VDisk' | 'PDisk', id: string) {
    const panel = container.locator('.ydb-disk-popup__panel').filter({
        has: container.page().getByText(title, {exact: true}),
    });

    await expect(panel).toBeVisible();
    await expect(panel.locator('.ydb-disk-popup__id')).toHaveText(id);
    return panel;
}

async function expectDiskLocationDisclosure(
    panel: Locator,
    title: 'VDisk' | 'PDisk',
    withPDiskDetails = true,
) {
    const details = panel.locator('.ydb-disk-popup__location-details');
    const expand = panel.getByRole('button', {name: `Show ${title} location details`, exact: true});

    await expect(getDefinitionListRow(panel, 'FQDN')).toBeVisible();
    await expect(getDefinitionListRow(panel, 'Rack')).toBeVisible();
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await expect(details).toBeHidden();
    await expand.click();

    const collapse = panel.getByRole('button', {
        name: `Hide ${title} location details`,
        exact: true,
    });
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    await expect(details).toBeVisible();
    await expectDefinitionListRowValue(details, 'Node ID', NODE_ID);
    if (withPDiskDetails) {
        await expectDefinitionListRowValue(details, 'PDisk ID', PDISK_ID);
    } else {
        await expect(getDefinitionListRow(details, 'PDisk ID')).toHaveCount(0);
        await expect(getDefinitionListRow(details, 'PDisk Path')).toHaveCount(0);
    }
    if (title === 'VDisk') {
        await expectDefinitionListRowValue(details, 'VDisk Slot ID', '1001');
    }

    await collapse.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await expect(details).toBeHidden();
}

async function expectHDDLabel(panel: Locator) {
    const label = panel.getByText('HDD', {exact: true});
    await expect(label).toBeVisible();
    await label.hover();
    const tooltip = panel.page().getByRole('tooltip').filter({hasText: 'Hard disk drive'});
    await expect(tooltip).toBeVisible();
    await panel.locator('.ydb-disk-popup__id').hover();
    await expect(tooltip).toBeHidden();
}

function getDefinitionListValue(container: Locator, label: string) {
    return getDefinitionListRow(container, label).locator('.g-definition-list__definition');
}

async function expectDefinitionListLabelOnOneLine(container: Locator, label: string) {
    const termWrapper = getDefinitionListRow(container, label).locator(
        '.g-definition-list__term-wrapper',
    );

    await expect(termWrapper).toBeVisible();
    const textLineCount = await termWrapper.evaluate((element) => {
        const textNode = Array.from(element.childNodes).find(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );

        if (!textNode) {
            return 0;
        }

        const range = document.createRange();
        range.selectNodeContents(textNode);
        return range.getClientRects().length;
    });

    expect(textLineCount).toBe(1);
}

async function expectInfoViewerRowPlaceholder(container: Locator, label: string) {
    const row = getInfoViewerRow(container, label);

    await expect(row).toBeVisible();
    await expect(row.getByText(EMPTY_DATA_PLACEHOLDER, {exact: true})).toBeVisible();
}

async function expectInfoViewerRowValue(container: Locator, label: string, value: string) {
    const row = getInfoViewerRow(container, label);

    await expect(row).toBeVisible();
    await expect(row.getByText(value, {exact: true})).toBeVisible();
}

async function expectDefinitionListRowPlaceholder(container: Locator, label: string) {
    const row = getDefinitionListRow(container, label);

    await expect(row).toBeVisible();
    await expect(getDefinitionListValue(container, label)).toHaveText(EMPTY_DATA_PLACEHOLDER);
}

async function expectDefinitionListRowValue(container: Locator, label: string, value: string) {
    const row = getDefinitionListRow(container, label);

    await expect(row).toBeVisible();
    await expect(getDefinitionListValue(container, label)).toHaveText(value);
}

test.describe('VDisk page storage details', () => {
    test('does not render storage details when experiment is disabled', async ({page}) => {
        await setupVDiskPageMocks(page);

        await page.goto(VDISK_PAGE_PATH);

        await expect(page.locator('.ydb-vdisk-storage-details')).toHaveCount(0);
        await expect(page.locator('.ydb-paginated-table__table')).toBeVisible();
    });

    test('renders experimental storage details summary', async ({page}) => {
        await enableNewStorageView(page);
        await setupVDiskPageMocks(page, {
            datacenter: LONG_DATACENTER,
            rack: LONG_RACK,
            host: LONG_HOST,
            pDiskId: LONG_PDISK_ID,
            allocatedSize: '1000000',
            availableSize: '35999999990000',
        });
        await page.goto(VDISK_PAGE_PATH);

        const storageDetails = page.locator('.ydb-vdisk-storage-details');

        await expect(storageDetails).toBeVisible();
        await expect(storageDetails.getByText('Storage details')).toBeVisible();
        await expect(storageDetails.getByText('Go to PDisk')).toBeVisible();
        await expect(
            storageDetails.locator('.ydb-vdisk-storage-details__value-row button'),
        ).toHaveCount(3);
        await expect(page.locator('.ydb-paginated-table__table')).toBeVisible();

        await page.setViewportSize({width: 1500, height: 1000});
        await expect(storageDetails).toHaveScreenshot('vdisk-storage-details-wide.png');

        await storageDetails
            .locator('.ydb-vdisk-storage-details__detail')
            .first()
            .locator('.ydb-cell-with-popover__children-wrapper')
            .hover();
        await expect(page.getByText(LONG_DATACENTER, {exact: true})).toBeVisible();

        await page.setViewportSize({width: 900, height: 1000});
        await expect(storageDetails).toHaveScreenshot('vdisk-storage-details-medium.png');

        await page.setViewportSize({width: 560, height: 1000});
        await expect(storageDetails).toHaveScreenshot('vdisk-storage-details-narrow.png');
    });

    test('hides PDisk navigation for database-scoped users', async ({page}) => {
        await enableNewStorageView(page);
        await setupVDiskPageMocks(page, {isViewerAllowed: false});
        await page.goto(VDISK_PAGE_PATH);

        const storageDetails = page.locator('.ydb-vdisk-storage-details');
        const vDiskInfo = page.locator('.ydb-vdisk-page__info');

        await expect(vDiskInfo.getByText(PDISK_ID, {exact: true})).toBeVisible();
        await expect(vDiskInfo.getByRole('link', {name: PDISK_ID})).toHaveCount(0);
        await expect(storageDetails).toBeVisible();
        await expect(storageDetails.getByRole('link', {name: 'Go to PDisk'})).toHaveCount(0);
        await expect(storageDetails.getByText(PDISK_ID, {exact: true})).toBeVisible();
        await expect(
            storageDetails.locator('.ydb-vdisk-storage-details__value-row button'),
        ).toHaveCount(3);
    });
});

test.describe('VDisk page storage tab', () => {
    test.beforeEach(async ({page}) => {
        await enableNewStorageView(page);
    });

    test('renders storage table in VDisk context', async ({page}) => {
        await enableStorageDisksColumn(page);
        await setupVDiskPageMocks(page);
        await page.goto(VDISK_PAGE_PATH);

        const storageDetails = page.locator('.ydb-vdisk-storage-details');
        const storageTable = new ClusterStorageTable(page);

        await expect(storageDetails).toBeVisible();
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        expect(await storageTable.getRowCount()).toBe(1);

        const rowData = await storageTable.getRowData(0);
        expect(rowData['Group ID']).toBe(GROUP_ID);
        expect(rowData['Pool Name']).toBe(STORAGE_POOL_NAME);

        const disksColumn = page
            .locator('.ydb-paginated-table__row')
            .first()
            .locator('.ydb-storage-vdisks__wrapper');
        await expect(disksColumn).toBeVisible();

        const activeDisks = disksColumn.locator(
            '.storage-disk-progress-bar:not(.storage-disk-progress-bar_inactive)',
        );
        const inactiveDisks = disksColumn.locator(
            '.storage-disk-progress-bar.storage-disk-progress-bar_inactive',
        );

        await expect(activeDisks).toHaveCount(1);
        await expect(inactiveDisks).toHaveCount(2);

        const pDisksColumn = page
            .locator('.ydb-paginated-table__row')
            .first()
            .locator('.ydb-storage-disks__pdisks-wrapper');
        const activePDisks = pDisksColumn.locator(
            '.ydb-storage-disks__pdisk-progress-bar:not(.storage-disk-progress-bar_inactive)',
        );
        const inactivePDisks = pDisksColumn.locator(
            '.ydb-storage-disks__pdisk-progress-bar.storage-disk-progress-bar_inactive',
        );

        await expect(activePDisks).toHaveCount(2);
        await expect(inactivePDisks).toHaveCount(1);
    });

    test('expands vDisk stack on hover', async ({page}) => {
        await setupVDiskPageMocks(page, {withDonors: true});
        await page.goto(VDISK_PAGE_PATH);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const row = page.locator('.ydb-paginated-table__row').first();
        const stack = row.locator('.ydb-stack').first();
        const items = stack.locator('.ydb-stack__item');
        const background = stack.locator('.ydb-stack__background');

        await expect(stack).toBeVisible();
        await expect(items).toHaveCount(3);
        await expect(items.nth(0)).toBeVisible();
        await expect(items.nth(1)).not.toBeVisible();
        await expect(items.nth(2)).toBeVisible();
        await expect(background).not.toBeVisible();

        await items.nth(0).hover();

        await expect(background).toBeVisible();
        await expect(items.nth(2)).toBeVisible();
        await expect(row).toHaveCSS('z-index', '2');

        await page.mouse.move(0, 0);
        await expect(background).not.toBeVisible();

        const visibleDonorBox = await items
            .nth(2)
            .locator('.storage-disk-progress-bar')
            .boundingBox();
        expect(visibleDonorBox).not.toBeNull();
        await page.mouse.move(
            visibleDonorBox!.x + visibleDonorBox!.width - 1,
            visibleDonorBox!.y + visibleDonorBox!.height - 1,
        );

        await expect(background).toBeVisible();
        await expect(items.nth(2)).toBeVisible();
    });

    test('renders expanded vDisk stack snapshot', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setupVDiskPageMocks(page, {withDonors: true});
        await page.goto(VDISK_PAGE_PATH);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const row = page.locator('.ydb-paginated-table__row').first();
        const stack = row.locator('.ydb-stack').first();

        await expect(stack).toBeVisible();
        await stack.hover();
        const background = stack.locator('.ydb-stack__background').first();
        await expect(background).toBeVisible();

        await expect(background).toHaveCSS('height', '80px');

        const backgroundBox = await background.boundingBox();
        expect(backgroundBox).not.toBeNull();

        await expect(page).toHaveScreenshot('vdisk-stack-expanded.png', {clip: backgroundBox!});
    });

    test('Go to PDisk navigates to PDisk page', async ({page}) => {
        await setupVDiskPageMocks(page);
        await setupPDiskInfoMock(page);
        await page.goto(VDISK_PAGE_PATH);

        const storageDetails = page.locator('.ydb-vdisk-storage-details');
        const goToPDiskLink = storageDetails.getByRole('link', {name: 'Go to PDisk'});

        await expect(goToPDiskLink).toBeVisible();
        await expect(goToPDiskLink).toHaveAttribute(
            'href',
            new RegExp(`/pDisk\\?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}$`),
        );

        await goToPDiskLink.click();

        await expect(page).toHaveURL(new RegExp(`/pDisk\\?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}$`));
        await expect(page.locator('.ydb-pdisk-page')).toBeVisible();
        await expect(page.locator('.ydb-pdisk-page__info')).toBeVisible();
        await expect(page.locator('.ydb-pdisk-space-distribution')).toBeVisible();
        await expect(page.getByText('Space distribution', {exact: true})).toBeVisible();
    });
});

test.describe('Storage disk popup snapshots', () => {
    test.beforeEach(async ({page}) => {
        await enableNewStorageView(page);
        await enableStorageDisksColumn(page);
    });

    for (const viewportWidth of [1280, 560]) {
        for (const combined of [false, true]) {
            test(`wraps long content in ${combined ? 'combined' : 'single'} disk popup at ${viewportWidth}px`, async ({
                page,
            }, testInfo) => {
                const host = `storage-${'long-hostname-'.repeat(12)}.ydb`;
                const rack = 'rack-'.repeat(35);
                await page.setViewportSize({width: viewportWidth, height: 1000});
                await setupVDiskPageMocks(page, {
                    host,
                    rack,
                    withoutCompaction: true,
                    storagePoolName: 'storage-pool-'.repeat(40),
                });
                await setupDiskNodeMetadataMock(page, {host, rack});
                await page.goto(VDISK_PAGE_PATH);
                const table = new ClusterStorageTable(page);
                await table.waitForTableData();
                const trigger = page
                    .locator(
                        combined
                            ? '.ydb-storage-vdisks__wrapper .storage-disk-progress-bar'
                            : '.ydb-storage-disks__pdisk-progress-bar',
                    )
                    .first();
                await trigger.hover();

                const popup = page.locator('.ydb-disk-popup').filter({
                    has: page.getByRole('link', {
                        name: combined ? 'Go to VDisk' : 'Go to PDisk',
                        exact: true,
                    }),
                });
                await expect(popup).toBeVisible();
                await expect(popup.locator('.ydb-disk-popup__panel')).toHaveCount(combined ? 2 : 1);
                const baseWidth = combined && viewportWidth > 700 ? 593 : 368;
                const maxWidth = baseWidth + (combined ? 120 : 50);
                await expect(popup).toHaveCSS('max-width', `${maxWidth}px`);
                const width = await popup.evaluate(
                    (element) => element.getBoundingClientRect().width,
                );
                const outerWidth = await popup
                    .locator('xpath=..')
                    .evaluate((element) => element.getBoundingClientRect().width);
                expect(outerWidth).toBeCloseTo(width + 32, 2);
                if (combined && viewportWidth > 700) {
                    expect(width).toBeGreaterThan(baseWidth);
                    expect(width).toBeLessThanOrEqual(maxWidth);
                } else {
                    expect(width).toBeCloseTo(baseWidth, 0);
                }
                await expect
                    .poll(() =>
                        popup.evaluate((element) => element.scrollWidth - element.clientWidth),
                    )
                    .toBeLessThanOrEqual(1);

                if (combined) {
                    await expect(
                        popup.locator('.g-label__key').filter({hasText: 'Not available'}),
                    ).toHaveCount(2);
                    const compactionTextLines = await popup
                        .locator('.ydb-vdisk-popup__compaction .g-label__text')
                        .evaluateAll((labels) =>
                            labels.map((label) => {
                                const range = document.createRange();
                                range.selectNodeContents(label);
                                return new Set(
                                    Array.from(range.getClientRects(), (rect) =>
                                        Math.round(rect.top),
                                    ),
                                ).size;
                            }),
                        );
                    expect(compactionTextLines).toEqual([1, 1]);
                }
                const clippedLabelText = await popup
                    .locator('.ydb-disk-status__label')
                    .evaluateAll((labels) =>
                        labels.flatMap((label) => {
                            const box = label.getBoundingClientRect();
                            const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
                            const clipped: string[] = [];
                            while (walker.nextNode()) {
                                if (!walker.currentNode.textContent?.trim()) {
                                    continue;
                                }
                                const range = document.createRange();
                                range.selectNodeContents(walker.currentNode);
                                for (const rect of range.getClientRects()) {
                                    if (
                                        rect.width &&
                                        (rect.left < box.left - 1 ||
                                            rect.right > box.right + 1 ||
                                            rect.bottom > box.bottom + 1)
                                    ) {
                                        clipped.push(walker.currentNode.textContent);
                                    }
                                }
                            }
                            return clipped;
                        }),
                    );
                expect(clippedLabelText).toEqual([]);
                const hostname = popup
                    .locator('.ydb-disk-popup__text')
                    .filter({hasText: host})
                    .first();
                await expect(hostname).toHaveCSS('text-overflow', 'ellipsis');
                await expect(hostname).toHaveCSS('white-space', 'nowrap');
                await expect
                    .poll(() =>
                        hostname.evaluate((element) => element.scrollWidth > element.clientWidth),
                    )
                    .toBe(true);
                const rackValue = popup
                    .locator('.g-definition-list__definition')
                    .filter({hasText: rack})
                    .first();
                const rackLines = await rackValue.evaluate((element, text) => {
                    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
                    while (walker.nextNode()) {
                        if (walker.currentNode.textContent === text) {
                            const range = document.createRange();
                            range.selectNodeContents(walker.currentNode);
                            return range.getClientRects().length;
                        }
                    }
                    return 0;
                }, rack);
                expect(rackLines).toBeGreaterThan(1);
                await testInfo.attach('disk-popup-wrapped-content', {
                    body: await page.screenshot(),
                    contentType: 'image/png',
                });
            });
        }
    }

    for (const combined of [false, true]) {
        test(`only Compaction may expand the ${combined ? 'combined' : 'single'} disk popup`, async ({
            page,
        }) => {
            await page.setViewportSize({width: 1280, height: 1000});
            for (const longValues of [false, true]) {
                const host = longValues
                    ? `storage-${'long-hostname-'.repeat(12)}.ydb`
                    : 'host.test';
                const rack = longValues ? 'rack-'.repeat(35) : 'rack-1';
                const storagePoolName = longValues ? 'storage-pool-'.repeat(40) : STORAGE_POOL_NAME;
                const options = longValues
                    ? {
                          allocatedSize: '9000000000000000000',
                          availableSize: '9000000000000000000',
                          pDiskBscAvailableSize: '9000000000000000000',
                          pDiskBscTotalSize: '18000000000000000000',
                      }
                    : {};
                await setupVDiskPageMocks(page, {storagePoolName, ...options});
                await setupDiskNodeMetadataMock(page, {host, rack});
                await page.goto(VDISK_PAGE_PATH);
                await new ClusterStorageTable(page).waitForTableData();
                await page
                    .locator(
                        combined
                            ? '.ydb-storage-vdisks__wrapper .storage-disk-progress-bar'
                            : '.ydb-storage-disks__pdisk-progress-bar',
                    )
                    .first()
                    .hover();
                const popup = (
                    await waitForDiskPopup(page, combined ? 'Go to VDisk' : 'Go to PDisk')
                ).locator('.ydb-disk-popup');
                await expect(popup).toHaveCSS('width', `${combined ? 593 : 368}px`);
                await expect(popup.locator('xpath=..')).toHaveCSS(
                    'width',
                    `${combined ? 625 : 400}px`,
                );
                expect(
                    await popup.evaluate((element) => element.scrollWidth - element.clientWidth),
                ).toBeLessThanOrEqual(1);
                if (longValues && combined) {
                    await expect(popup.getByText(storagePoolName, {exact: true})).toBeVisible();
                }
            }
        });
    }

    for (const closeBy of ['blur', 'escape'] as const) {
        test(`popup review: retains PDisk focus until ${closeBy}`, async ({page}) => {
            await page.clock.install();
            await page.setViewportSize({width: 1500, height: 1000});
            await setupVDiskPageMocks(page);
            await page.goto(VDISK_PAGE_PATH);
            await new ClusterStorageTable(page).waitForTableData();
            await page.locator('.ydb-storage-disks__pdisk-progress-bar').first().hover();
            const popup = await waitForDiskPopup(page, 'Go to PDisk');
            const toggle = popup.getByRole('button', {
                name: /^(Show|Hide) PDisk location details$/,
            });
            await toggle.click();
            await expect(toggle).toBeFocused();
            await page.mouse.move(0, 0);
            await page.clock.fastForward(DISKS_POPUP_DEBOUNCE_TIMEOUT * 2);
            await expect(popup).toBeVisible();
            await expect(
                page.locator('.ydb-storage-disks__pdisk-progress-bar').first(),
            ).toHaveClass(/storage-disk-progress-bar_highlighted/);
            if (closeBy === 'escape') {
                await page.keyboard.press('Escape');
            } else {
                await page.getByRole('button', {name: 'Refresh', exact: true}).first().focus();
            }
            await expect(popup).toBeHidden();
        });

        test(`keeps the donor stack expanded until the focused popup closes by ${closeBy}`, async ({
            page,
        }) => {
            await page.clock.install();
            await page.setViewportSize({width: 1500, height: 1000});
            await setupVDiskPageMocks(page, {withDonors: true});
            await page.goto(VDISK_PAGE_PATH);

            const storageTable = new ClusterStorageTable(page);
            await storageTable.waitForTableData();
            const stack = page.locator('.ydb-storage-vdisks__wrapper .ydb-stack').first();
            await stack.locator('.ydb-stack__item_main').hover();
            const popup = await waitForDiskPopup(page, 'Go to VDisk');
            const panel = await getDiskPopupPanel(popup, 'VDisk', VDISK_ID);
            const locationToggle = panel.getByRole('button', {
                name: 'Show VDisk location details',
                exact: true,
            });
            await locationToggle.focus();
            await expect(locationToggle).toBeFocused();
            await page.mouse.move(0, 0);
            await page.clock.fastForward(DISKS_POPUP_DEBOUNCE_TIMEOUT * 2);

            await expect(popup).toBeVisible();
            await expect(stack).toHaveClass(/ydb-stack_expanded/);

            const goToVDisk = panel.getByRole('link', {name: 'Go to VDisk', exact: true});
            await goToVDisk.focus();
            await page.clock.fastForward(DISKS_POPUP_DEBOUNCE_TIMEOUT * 2);
            await expect(goToVDisk).toBeFocused();
            await expect(stack).toHaveClass(/ydb-stack_expanded/);

            if (closeBy === 'escape') {
                await page.keyboard.press('Escape');
            } else {
                await page.getByRole('button', {name: 'Refresh', exact: true}).first().focus();
            }
            await expect(popup).toBeHidden();
            await expect(stack).not.toHaveClass(/ydb-stack_expanded/);
        });
    }

    for (const disk of ['PDisk', 'VDisk'] as const) {
        test(`popup review: keeps ${disk} open while selecting text outside the card`, async ({
            page,
        }) => {
            await page.clock.install();
            await page.setViewportSize({width: 1500, height: 1200});
            await setupVDiskPageMocks(page);
            await page.goto(VDISK_PAGE_PATH);
            await new ClusterStorageTable(page).waitForTableData();
            await page
                .locator(
                    disk === 'PDisk'
                        ? '.ydb-storage-disks__pdisk-progress-bar'
                        : '.ydb-storage-vdisks__wrapper .storage-disk-progress-bar',
                )
                .first()
                .hover();
            const popup = await waitForDiskPopup(page, `Go to ${disk}`);
            const panel = await getDiskPopupPanel(
                popup,
                disk,
                disk === 'PDisk' ? `${NODE_ID}-${PDISK_ID}` : VDISK_ID,
            );
            const heading = panel.getByText(disk, {exact: true});
            await heading.hover();
            const headingBox = await heading.boundingBox();
            const popupBox = await popup.boundingBox();
            if (!headingBox || !popupBox) {
                throw new Error('Missing disk popup selection bounds');
            }
            const x = headingBox.x + headingBox.width;
            const y = headingBox.y + headingBox.height / 2;
            await page.mouse.move(headingBox.x + 1, y);
            await page.mouse.down();
            const focusOwner = popup.locator('xpath=..');
            await expect(focusOwner).toBeFocused();
            await expect(focusOwner).toHaveCSS('outline-style', 'none');
            await page.mouse.move(x, y, {steps: 5});
            await expect
                .poll(() => page.evaluate(() => window.getSelection()?.toString()))
                .toContain(disk);
            await page.mouse.move(x, popupBox.y + popupBox.height + 8, {steps: 5});
            await page.clock.fastForward(DISKS_POPUP_DEBOUNCE_TIMEOUT * 2);
            await expect(popup).toBeVisible();
            await page.mouse.up();
            await expect
                .poll(() =>
                    popup.evaluate((element) => {
                        const selection = window.getSelection();
                        return Boolean(
                            selection?.anchorNode &&
                                element.contains(selection.anchorNode) &&
                                !selection.isCollapsed,
                        );
                    }),
                )
                .toBe(true);
            await page.getByRole('button', {name: 'Refresh', exact: true}).first().focus();
            await expect(popup).toBeHidden();
        });
    }

    test('renders redesigned VDisk popup actions', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setupVDiskPageMocks(page);
        await page.goto(VDISK_PAGE_PATH);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const vDisk = page
            .locator('.ydb-storage-vdisks__wrapper .storage-disk-progress-bar')
            .first();
        await expect(vDisk).toBeVisible();
        await vDisk.hover();

        const popup = await waitForDiskPopup(page, 'Go to VDisk');
        await expectDeveloperUILink(popup, getDeveloperUIActorPath('vdisks'));
        await expect(popup.getByRole('link', {name: 'Go to VDisk'})).toBeVisible();
        await expect(popup.getByRole('button', {name: 'Evict VDisk'})).toBeVisible();

        const vDiskPanel = await getDiskPopupPanel(popup, 'VDisk', VDISK_ID);
        const pDiskPanel = await getDiskPopupPanel(popup, 'PDisk', `${NODE_ID}-${PDISK_ID}`);
        await expect(vDiskPanel.getByText('No data', {exact: true})).toBeVisible();
        await expect(pDiskPanel.getByText('Unknown', {exact: true})).toBeVisible();
        await expect(vDiskPanel.getByText('HDD', {exact: true})).toHaveCount(0);
        await expectHDDLabel(pDiskPanel);
        for (const label of ['Device', 'Realtime']) {
            await expectDefinitionListRowValue(pDiskPanel, label, 'Not available');
        }
        await expect(popup).toHaveScreenshot('vdisk-popup-actions.png');
        await expectDiskLocationDisclosure(vDiskPanel, 'VDisk', false);
        await expectDiskLocationDisclosure(pDiskPanel, 'PDisk');
    });

    test('renders a slot-only donor popup with available location data', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setupVDiskPageMocks(page, {
            host: 'donor-node-42.ydb',
            rack: 'Rack-D42',
            datacenter: 'KLG',
        });
        await setupPDiskInfoMock(page, {withSlotOnlyDonor: true});
        await page.goto(`/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`);

        const slot = page.locator('.ydb-pdisk-space-distribution__slot-wrapper a').first();
        await expect(slot).toBeVisible();
        await slot.hover();
        const popup = page
            .locator('.ydb-pdisk-space-distribution__vdisk-popup')
            .filter({visible: true})
            .last();
        await expect(popup).toBeVisible();
        await expect(popup.locator('.ydb-disk-popup__panel')).toHaveCount(1);
        await expect(popup.locator('a[href$="_000001011"]')).toBeVisible();
        await expectDefinitionListRowValue(popup, 'FQDN', 'donor-node-42.ydb');
        await expectDefinitionListRowValue(popup, 'Rack', 'Rack-D42');
        await expectDefinitionListRowValue(popup, 'Storage Pool Name', STORAGE_POOL_NAME);

        await popup.getByRole('button', {name: 'Show VDisk location details'}).click();
        await expectDefinitionListRowValue(popup, 'Datacenter', 'KLG');
        await expectDefinitionListRowValue(popup, 'Node ID', NODE_ID);
        await expectDefinitionListRowValue(popup, 'PDisk ID', PDISK_ID);
        await expectDefinitionListRowValue(popup, 'VDisk Slot ID', '1011');
        await expect(popup).toHaveScreenshot('unavailable-donor-popup.png');
    });

    test('closes VDisk popup after successful eviction', async ({page}) => {
        let evictRequestCount = 0;

        await page.route('**/vdisk/evict*', async (route) => {
            evictRequestCount++;

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({result: true}),
            });
        });

        await page.setViewportSize({width: 1500, height: 1000});
        await setupVDiskPageMocks(page);
        await page.goto(VDISK_PAGE_PATH);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const vDisk = page
            .locator('.ydb-storage-vdisks__wrapper .storage-disk-progress-bar')
            .first();
        await expect(vDisk).toBeVisible();
        await vDisk.hover();

        const popup = await waitForDiskPopup(page, 'Go to VDisk');
        await popup.getByRole('button', {name: 'Evict VDisk'}).click();

        const dialog = page.locator('.g-dialog').filter({hasText: 'Evict VDisk?'});
        await expect(dialog).toBeVisible();

        await Promise.all([
            page.waitForResponse(
                (response) => response.url().includes('/vdisk/evict') && response.ok(),
            ),
            dialog.getByRole('button', {name: 'Evict', exact: true}).click(),
        ]);

        expect(evictRequestCount).toBe(1);
        await expect(dialog).toBeHidden();
        await expect(popup).toBeHidden();
    });

    test('renders redesigned PDisk popup actions', async ({page}) => {
        await page.setViewportSize({width: 1500, height: 1000});
        await setupVDiskPageMocks(page);
        await page.goto(VDISK_PAGE_PATH);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const pDisk = page.locator('.ydb-storage-disks__pdisk-progress-bar').first();
        await expect(pDisk).toBeVisible();
        await pDisk.hover();

        const popup = await waitForDiskPopup(page, 'Go to PDisk');
        await expectDeveloperUILink(popup, getDeveloperUIActorPath('pdisks'));
        await expect(popup.getByRole('link', {name: 'Go to PDisk'})).toBeVisible();

        const panel = await getDiskPopupPanel(popup, 'PDisk', `${NODE_ID}-${PDISK_ID}`);
        await expect(panel.getByText('Unknown', {exact: true})).toBeVisible();
        await expectHDDLabel(panel);
        for (const label of ['Device', 'Realtime']) {
            await expectDefinitionListRowValue(panel, label, 'Not available');
        }
        await expect(popup).toHaveScreenshot('pdisk-popup-actions.png');
        await expectDiskLocationDisclosure(panel, 'PDisk');
    });
});

test.describe('Blob storage capacity metrics integration', () => {
    test.describe.configure({timeout: 60_000});

    for (const scenario of [
        {
            name: 'the setting is disabled on a capable backend',
            enableSetting: false,
            capacityVersions: {storageGroups: 10, viewerNodes: 20},
        },
        {
            name: 'the storage groups capability is below threshold',
            enableSetting: true,
            capacityVersions: {storageGroups: 9, viewerNodes: 20},
        },
        {
            name: 'the viewer nodes capability is below threshold',
            enableSetting: true,
            capacityVersions: {storageGroups: 10, viewerNodes: 19},
        },
    ]) {
        test(`keeps legacy rows when ${scenario.name}`, async ({page}) => {
            if (scenario.enableSetting) {
                await enableBlobStorageCapacityMetrics(page);
            }
            await setupVDiskPageMocks(page, {
                capacityVersions: scenario.capacityVersions,
                withCapacityMetrics: true,
            });
            await setupPDiskInfoMock(page, {withCapacityMetrics: true});

            await page.goto(VDISK_PAGE_PATH);

            const vDiskInfo = page.locator('.ydb-vdisk-page__info');
            await expect(vDiskInfo.getByText('Usage', {exact: true})).toBeVisible();
            await expect(vDiskInfo.getByText('Disk Space', {exact: true})).toBeVisible();
            await expect(vDiskInfo.getByText('VDisk Slot Usage', {exact: true})).toHaveCount(0);

            await page.goto(`/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`);

            const pDiskInfo = page.locator('.ydb-pdisk-page__info');
            await expect(pDiskInfo.getByText('Usage', {exact: true})).toBeVisible();
            await expect(pDiskInfo.getByText('PDisk Usage', {exact: true})).toHaveCount(0);

            await page.goto(`/storageGroup?database=/local&groupId=${GROUP_ID}`);

            const groupInfo = page.locator('.ydb-storage-group-page__info');
            await expect(groupInfo.getByText('Usage', {exact: true})).toBeVisible();
            await expect(groupInfo.getByText('Disk Space', {exact: true})).toBeVisible();
            await expect(groupInfo.getByText('VDisk Slot Usage', {exact: true})).toHaveCount(0);
        });
    }

    test('shows the same explicit metrics across pages and Groups, Nodes, and PDisk popups', async ({
        page,
    }) => {
        await enableBlobStorageCapacityMetrics(page);
        await enableStorageDisksColumn(page);
        await enableStorageNodesCapacityColumns(page);
        const capacityFixture = {
            withCapacityMetrics: true,
            rack: 'Rack-from-node-response',
            allocatedSize: '1000000000',
            availableSize: '3000000000',
            whiteboardAllocatedSize: '1000000000',
            whiteboardAvailableSize: '21000000000',
            whiteboardSlotSize: '22000000000',
            pDiskBscAvailableSize: '3000000000',
            pDiskBscTotalSize: '4000000000',
            pDiskWhiteboardAvailableSize: '21000000000',
            pDiskWhiteboardTotalSize: '22000000000',
        };
        const expectedVDiskSize = /1 \/ 22\s*GB/;
        const expectedPDiskSpace = /1 \/ 22\s*GB/;
        const expectedVDiskSlotUsage = '82.3%';
        const expectedPDiskUsage = '70.5%';
        const expectedPopupSize = /1\.00 \/ 22\.00\s*GB/;
        const expectedPopupVDiskSlotUsage = '82.25%';
        const expectedPopupPDiskUsage = '70.50%';
        await setupVDiskPageMocks(page, capacityFixture);
        await setupPDiskInfoMock(page, capacityFixture);
        await setupDiskNodeMetadataMock(page, {rack: 'Rack-from-nodelist'});

        await page.goto(VDISK_PAGE_PATH);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const vDiskInfo = page.locator('.ydb-vdisk-page__info');
        for (const label of [
            'Size',
            'VDisk Slot Usage',
            'VDisk Raw Usage',
            'Group Size In Units',
            'Capacity Alert',
        ]) {
            await expect(vDiskInfo.getByText(label, {exact: true})).toBeVisible();
        }
        await expect(getDefinitionListValue(vDiskInfo, 'Size')).toHaveText(expectedVDiskSize);
        await expect(getDefinitionListValue(vDiskInfo, 'VDisk Slot Usage')).toHaveText(
            expectedVDiskSlotUsage,
        );

        const groupsVDisk = page
            .locator('.ydb-storage-vdisks__wrapper .storage-disk-progress-bar')
            .first();
        await groupsVDisk.hover();
        const groupsVDiskPopup = await waitForDiskPopup(page, 'Go to VDisk');
        const groupsVDiskInfo = await getDiskPopupPanel(groupsVDiskPopup, 'VDisk', VDISK_ID);
        await expectDefinitionListRowPlaceholder(groupsVDiskInfo, 'Rack');
        await expect(getDefinitionListValue(groupsVDiskInfo, 'Size')).toHaveText(expectedPopupSize);
        await expect(getDefinitionListValue(groupsVDiskInfo, 'VDisk Slot Usage')).toHaveText(
            expectedPopupVDiskSlotUsage,
        );
        for (const label of ['VDisk Slot Usage', 'Capacity alert']) {
            await expectDefinitionListLabelOnOneLine(groupsVDiskInfo, label);
        }
        const nestedPDiskInfo = await getDiskPopupPanel(
            groupsVDiskPopup,
            'PDisk',
            `${NODE_ID}-${PDISK_ID}`,
        );
        await expectDefinitionListRowPlaceholder(nestedPDiskInfo, 'Rack');
        await expect(getDefinitionListValue(nestedPDiskInfo, 'PDisk Usage')).toHaveText(
            expectedPopupPDiskUsage,
        );
        for (const label of ['PDisk Usage', 'Slot Size In Units', 'Capacity Alert']) {
            await expectDefinitionListLabelOnOneLine(nestedPDiskInfo, label);
        }
        await closeDiskPopup(page, groupsVDiskPopup);

        const groupsPDisk = page.locator('.ydb-storage-disks__pdisk-progress-bar').first();
        await groupsPDisk.hover();
        const groupsPDiskPopup = await waitForDiskPopup(page, 'Go to PDisk');
        const groupsPDiskInfo = await getDiskPopupPanel(
            groupsPDiskPopup,
            'PDisk',
            `${NODE_ID}-${PDISK_ID}`,
        );
        await expectDefinitionListRowPlaceholder(groupsPDiskInfo, 'Rack');
        for (const label of [
            'Space',
            'PDisk Usage',
            'Slots',
            'Slot Size In Units',
            'Capacity Alert',
        ]) {
            await expect(getDefinitionListRow(groupsPDiskInfo, label)).toBeVisible();
        }
        await expect(getDefinitionListValue(groupsPDiskInfo, 'Space')).toHaveText(
            expectedPopupSize,
        );
        await expect(getDefinitionListValue(groupsPDiskInfo, 'PDisk Usage')).toHaveText(
            expectedPopupPDiskUsage,
        );
        for (const label of ['PDisk Usage', 'Slot Size In Units', 'Capacity Alert']) {
            await expectDefinitionListLabelOnOneLine(groupsPDiskInfo, label);
        }
        await expect(
            getDefinitionListRow(groupsPDiskInfo, 'PDisk Usage').locator(
                '.g-definition-list__term-container',
            ),
        ).toHaveCSS('max-width', '150px');
        const pDiskSlotSizeText = await getDefinitionListValue(
            groupsPDiskInfo,
            'Slot Size In Units',
        ).innerText();

        await page.goto(`/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`);

        const pDiskInfo = page.locator('.ydb-pdisk-page__info');
        await expect(pDiskInfo.getByText('PDisk Usage', {exact: true})).toBeVisible();
        await expect(
            getInfoViewerRow(pDiskInfo, 'PDisk Usage').locator('.info-viewer__value'),
        ).toHaveText(expectedPDiskUsage);
        await expect(pDiskInfo.getByText('Slot Size In Units', {exact: true})).toBeVisible();
        await expect(
            getInfoViewerRow(pDiskInfo, 'Space').locator('.info-viewer__value'),
        ).toHaveText(expectedPDiskSpace);

        const vDiskOnPDiskPage = page
            .locator('.ydb-pdisk-space-distribution__slot-wrapper a')
            .first();
        await expect(vDiskOnPDiskPage).toBeVisible();
        await vDiskOnPDiskPage.hover();
        const nestedVDiskPopup = page
            .locator('.ydb-pdisk-space-distribution__vdisk-popup')
            .filter({visible: true})
            .last();
        await expect(nestedVDiskPopup).toBeVisible();
        await getDiskPopupPanel(nestedVDiskPopup, 'VDisk', VDISK_ID);
        await expectDefinitionListRowValue(nestedVDiskPopup, 'Rack', capacityFixture.rack);
        await expectDeveloperUILink(nestedVDiskPopup, getDeveloperUIActorPath('vdisks'));
        await expect(nestedVDiskPopup.getByRole('link', {name: 'Go to VDisk'})).toHaveCount(0);
        await expect(nestedVDiskPopup.getByRole('button', {name: 'Evict VDisk'})).toHaveCount(0);
        await expect(nestedVDiskPopup.locator('.ydb-disk-popup__panel')).toHaveCount(1);
        await expect(getDefinitionListValue(nestedVDiskPopup, 'Size')).toHaveText(
            expectedPopupSize,
        );
        await expect(getDefinitionListValue(nestedVDiskPopup, 'VDisk Slot Usage')).toHaveText(
            expectedPopupVDiskSlotUsage,
        );
        await closeDiskPopup(page, nestedVDiskPopup);

        await page.goto(`/storageGroup?database=/local&groupId=${GROUP_ID}`);

        const groupInfo = page.locator('.ydb-storage-group-page__info');
        for (const label of [
            'Group Generation',
            'Erasure Species',
            'Media Type',
            'Group Size In Units',
            'VDisk Slot Usage',
            'VDisk Raw Usage',
            'Capacity Alert',
        ]) {
            await expect(groupInfo.getByText(label, {exact: true})).toBeVisible();
        }
        await expect(groupInfo.getByText('Usage', {exact: true})).toHaveCount(0);
        await expect(groupInfo.getByText('Disk Space', {exact: true})).toHaveCount(0);
        const groupInfoColumns = groupInfo.locator(':scope > .info-viewer');
        await expect(groupInfoColumns).toHaveCount(2);
        const configurationInfo = groupInfoColumns.nth(0);
        const runtimeInfo = groupInfoColumns.nth(1);
        await expect(
            configurationInfo.getByText('Group Size In Units', {exact: true}),
        ).toBeVisible();
        await expect(configurationInfo.getByText('Units', {exact: true})).toHaveCount(0);
        const allocationUnitsLabel = runtimeInfo.getByText('Allocation Units', {exact: true});
        await expect(allocationUnitsLabel).toBeVisible();
        await allocationUnitsLabel.getByRole('button').hover();
        await expect(
            page.getByText(
                'The number of channels used by tablets to write data to the storage group.',
                {exact: true},
            ),
        ).toBeVisible();

        const runtimeLabels = await runtimeInfo
            .locator('.info-viewer__label-text')
            .allTextContents();
        expect(runtimeLabels.indexOf('Allocation Units')).toBe(
            runtimeLabels.indexOf('Available Space') + 1,
        );
        expect(runtimeLabels.indexOf('VDisk Slot Usage')).toBe(
            runtimeLabels.indexOf('Allocation Units') + 1,
        );

        const nodesRequestPromise = page.waitForRequest((request) =>
            new URL(request.url()).pathname.endsWith('/viewer/json/nodes'),
        );
        await page.goto(VDISK_PAGE_PATH.replace('type=groups', 'type=nodes'));
        const nodesRequest = await nodesRequestPromise;
        const fieldsRequired = new URL(nodesRequest.url()).searchParams.get('fields_required');
        expect(fieldsRequired?.split(',')).toContain('Rack');

        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();
        const nodesTable = page.locator('.ydb-paginated-table__table');
        await expect(nodesTable.getByText('VDisk Raw Usage', {exact: true})).toBeVisible();
        await expect(nodesTable.getByText('Disk Usage', {exact: true})).toHaveCount(0);

        const nodesVDisk = page
            .locator('.ydb-paginated-table__row')
            .first()
            .locator('.pdisk-storage__vdisks .storage-disk-progress-bar')
            .first();
        await nodesVDisk.hover();
        const nodesVDiskPopup = await waitForDiskPopup(page, 'Go to VDisk');
        const nodesVDiskInfo = await getDiskPopupPanel(nodesVDiskPopup, 'VDisk', VDISK_ID);
        await expectDefinitionListRowValue(nodesVDiskInfo, 'Rack', capacityFixture.rack);
        await expect(getDefinitionListValue(nodesVDiskInfo, 'Size')).toHaveText(expectedPopupSize);
        await expect(getDefinitionListValue(nodesVDiskInfo, 'VDisk Slot Usage')).toHaveText(
            expectedPopupVDiskSlotUsage,
        );
        for (const label of ['VDisk Slot Usage', 'Capacity alert']) {
            await expectDefinitionListLabelOnOneLine(nodesVDiskInfo, label);
        }
        await closeDiskPopup(page, nodesVDiskPopup);

        const nodesPDisk = page
            .locator('.ydb-paginated-table__row')
            .first()
            .locator('.pdisk-storage__content .storage-disk-progress-bar')
            .first();
        await nodesPDisk.hover();
        const nodesPDiskPopup = await waitForDiskPopup(page, 'Go to PDisk');
        const nodesPDiskInfo = await getDiskPopupPanel(
            nodesPDiskPopup,
            'PDisk',
            `${NODE_ID}-${PDISK_ID}`,
        );
        await expectDefinitionListRowValue(nodesPDiskInfo, 'Rack', capacityFixture.rack);
        await expect(getDefinitionListValue(nodesPDiskInfo, 'Space')).toHaveText(expectedPopupSize);
        await expect(getDefinitionListValue(nodesPDiskInfo, 'PDisk Usage')).toHaveText(
            expectedPopupPDiskUsage,
        );
        await expect(getDefinitionListValue(nodesPDiskInfo, 'Slot Size In Units')).toHaveText(
            pDiskSlotSizeText,
        );
        for (const label of ['PDisk Usage', 'Slot Size In Units', 'Capacity Alert']) {
            await expectDefinitionListLabelOnOneLine(nodesPDiskInfo, label);
        }
    });

    test('requests Capacity Alert for slot-only Nodes coloring', async ({page}) => {
        await enableBlobStorageCapacityMetrics(page);
        await enableStorageNodesVDiskSlotUsageOnly(page);
        await setupVDiskPageMocks(page, {withCapacityMetrics: true});

        const nodesRequestPromise = page.waitForRequest((request) => {
            const url = new URL(request.url());
            return (
                url.pathname.endsWith('/viewer/json/nodes') &&
                Boolean(url.searchParams.get('fields_required')?.includes('MaxVDiskSlotUsage'))
            );
        });

        await page.goto(VDISK_PAGE_PATH.replace('type=groups', 'type=nodes'));

        const nodesRequest = await nodesRequestPromise;
        expect(new URL(nodesRequest.url()).searchParams.get('fields_required')).toBe(
            'CapacityAlert,MaxVDiskSlotUsage,NodeId',
        );

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const table = page.locator('.ydb-paginated-table__table');
        await expect(table.getByText('VDisk Slot Usage', {exact: true})).toBeVisible();
        await expect(table.getByText('Capacity Alert', {exact: true})).toHaveCount(0);
        await expect(
            table.locator('.g-label_theme_warning').getByText('82.25%', {exact: true}),
        ).toBeVisible();
    });

    test('removes enabled Groups legacy columns and legacy group-by state', async ({page}) => {
        await enableStorageGroupsLegacyCapacityColumns(page);
        await setupVDiskPageMocks(page, {withCapacityMetrics: true});

        await page.goto(`${VDISK_PAGE_PATH}&storageGroupsGroupBy=DiskSpaceUsage`);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();

        const groupBySelect = page.getByTestId('storage-groups-group-by');
        await expect(groupBySelect).toHaveText('Disk usage');

        const sidebar = new Sidebar(page);
        await sidebar.clickSettings();
        await sidebar.clickExperimentsSection();
        await sidebar.toggleExperimentByTitle('Blob storage capacity metrics');
        await sidebar.closeDrawer();

        await expect
            .poll(() => new URL(page.url()).searchParams.get('storageGroupsGroupBy'))
            .toBeNull();
        await storageTable.waitForTableData();

        const table = page.locator('.ydb-paginated-table__table');
        for (const legacyHeader of ['Usage', 'Disk Usage', 'Space']) {
            await expect(table.getByText(legacyHeader, {exact: true})).toHaveCount(0);
        }
        await expect(table.getByText('VDisk Slot Usage', {exact: true})).toBeVisible();

        await storageTable.getControls().openColumnSetup();
        const columnSetup = page.locator('.g-popup.g-tree-select__popup');
        for (const legacyColumnId of ['Usage', 'DiskSpaceUsage', 'DiskSpace']) {
            await expect(columnSetup.locator(`[data-list-item="${legacyColumnId}"]`)).toHaveCount(
                0,
            );
        }
        await expect(columnSetup.locator('[data-list-item="MaxVDiskSlotUsage"]')).toBeVisible();
        await storageTable.getControls().closeColumnSetup();

        await expect(groupBySelect).toHaveText('-');
        await groupBySelect.click();
        const groupByOptions = page.locator('.g-select-list');
        await expect(groupByOptions.getByText('Usage', {exact: true})).toHaveCount(0);
        await expect(groupByOptions.getByText('Disk Usage', {exact: true})).toHaveCount(0);
        await expect(groupByOptions.getByText('Capacity Alert', {exact: true})).toBeVisible();

        await page.keyboard.press('Escape');
        await sidebar.clickSettings();
        await sidebar.clickExperimentsSection();
        await sidebar.toggleExperimentByTitle('Blob storage capacity metrics');
        await sidebar.closeDrawer();

        await expect
            .poll(() => new URL(page.url()).searchParams.get('storageGroupsGroupBy'))
            .toBeNull();
        await expect(groupBySelect).toHaveText('-');
    });

    test('shows row-scoped placeholders when optional capacity fields are absent', async ({
        page,
    }) => {
        await enableBlobStorageCapacityMetrics(page);
        await enableStorageDisksColumn(page);
        await setupVDiskPageMocks(page);
        await setupPDiskInfoMock(page);

        await page.goto(VDISK_PAGE_PATH);

        const storageTable = new ClusterStorageTable(page);
        await storageTable.waitForTableToLoad();
        await storageTable.waitForTableData();

        const vDiskInfo = page.locator('.ydb-vdisk-page__info');
        for (const label of ['VDisk Slot Usage', 'VDisk Raw Usage', 'Capacity Alert']) {
            await expectDefinitionListRowPlaceholder(vDiskInfo, label);
        }
        await expectDefinitionListRowValue(vDiskInfo, 'Group Size In Units', '1 (implicit)');

        const groupsVDisk = page
            .locator('.ydb-storage-vdisks__wrapper .storage-disk-progress-bar')
            .first();
        await groupsVDisk.hover();
        const vDiskPopup = await waitForDiskPopup(page, 'Go to VDisk');
        const vDiskPopupInfo = await getDiskPopupPanel(vDiskPopup, 'VDisk', VDISK_ID);
        await expectDefinitionListRowPlaceholder(vDiskPopupInfo, 'VDisk Slot Usage');
        await expectDefinitionListRowValue(vDiskPopupInfo, 'Capacity alert', 'Not available');
        await expectDefinitionListRowValue(vDiskPopupInfo, 'Group Size in Units', '1 (implicit)');
        await closeDiskPopup(page, vDiskPopup);

        const groupsPDisk = page.locator('.ydb-storage-disks__pdisk-progress-bar').first();
        await groupsPDisk.hover();
        const pDiskPopup = await waitForDiskPopup(page, 'Go to PDisk');
        const pDiskPopupInfo = await getDiskPopupPanel(
            pDiskPopup,
            'PDisk',
            `${NODE_ID}-${PDISK_ID}`,
        );
        await expectDefinitionListRowPlaceholder(pDiskPopupInfo, 'PDisk Usage');
        for (const label of ['Device', 'Realtime', 'Capacity Alert']) {
            await expectDefinitionListRowValue(pDiskPopupInfo, label, 'Not available');
        }
        await expectDefinitionListRowValue(pDiskPopupInfo, 'Slot Size In Units', '1 (implicit)');

        await page.goto(`/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`);

        const pDiskInfo = page.locator('.ydb-pdisk-page__info');
        await expectInfoViewerRowPlaceholder(pDiskInfo, 'PDisk Usage');
        await expectInfoViewerRowValue(pDiskInfo, 'Slot Size In Units', '1 (implicit)');

        await page.goto(`/storageGroup?database=/local&groupId=${GROUP_ID}`);

        const groupInfo = page.locator('.ydb-storage-group-page__info');
        for (const label of ['VDisk Slot Usage', 'VDisk Raw Usage', 'Capacity Alert']) {
            await expectInfoViewerRowPlaceholder(groupInfo, label);
        }
        await expectInfoViewerRowValue(groupInfo, 'Group Size In Units', '1 (implicit)');
    });
});
