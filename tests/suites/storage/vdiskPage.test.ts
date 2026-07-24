import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {EMPTY_DATA_PLACEHOLDER} from '../../../src/utils/emptyDataPlaceholder';
import {ClusterStorageTable} from '../paginatedTable/paginatedTable';

import {
    GROUP_ID,
    LONG_DATACENTER,
    LONG_HOST,
    LONG_PDISK_ID,
    LONG_RACK,
    NODE_ID,
    PDISK_ID,
    STORAGE_POOL_NAME,
    VDISK_PAGE_PATH,
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

async function getFirstTitledDefinitionList(container: Locator, title: 'VDisk' | 'PDisk') {
    const definitionList = container.locator('.ydb-definition-list').first();
    const exactTitle = definitionList
        .locator('.ydb-definition-list__header')
        .locator(`xpath=.//*[normalize-space(text()[1])="${title}"]`);

    await expect(exactTitle).toBeVisible();
    return definitionList;
}

function getDefinitionListValue(container: Locator, label: string) {
    return getDefinitionListRow(container, label).locator('.g-definition-list__definition');
}

async function expectInfoViewerRowPlaceholder(container: Locator, label: string) {
    const row = getInfoViewerRow(container, label);

    await expect(row).toBeVisible();
    await expect(row.getByText(EMPTY_DATA_PLACEHOLDER, {exact: true})).toBeVisible();
}

async function expectDefinitionListRowPlaceholder(container: Locator, label: string) {
    const row = getDefinitionListRow(container, label);

    await expect(row).toBeVisible();
    await expect(getDefinitionListValue(container, label)).toHaveText(EMPTY_DATA_PLACEHOLDER);
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

        await expect(popup).toHaveScreenshot('vdisk-popup-actions.png');
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

        await expect(popup).toHaveScreenshot('pdisk-popup-actions.png');
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

    test('shows the same explicit metrics across pages and Groups and Nodes popups', async ({
        page,
    }) => {
        await enableBlobStorageCapacityMetrics(page);
        await enableStorageDisksColumn(page);
        await enableStorageNodesCapacityColumns(page);
        await setupVDiskPageMocks(page, {withCapacityMetrics: true});
        await setupPDiskInfoMock(page, {withCapacityMetrics: true});

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
        const vDiskSizeText = await getDefinitionListValue(vDiskInfo, 'Size').innerText();
        const vDiskSlotUsageText = await getDefinitionListValue(
            vDiskInfo,
            'VDisk Slot Usage',
        ).innerText();

        const groupsVDisk = page
            .locator('.ydb-storage-vdisks__wrapper .storage-disk-progress-bar')
            .first();
        await groupsVDisk.hover();
        const groupsVDiskPopup = await waitForDiskPopup(page, 'Go to VDisk');
        const groupsVDiskInfo = await getFirstTitledDefinitionList(groupsVDiskPopup, 'VDisk');
        await expect(getDefinitionListValue(groupsVDiskInfo, 'Size')).toHaveText(vDiskSizeText);
        await expect(getDefinitionListValue(groupsVDiskInfo, 'VDisk Slot Usage')).toHaveText(
            vDiskSlotUsageText,
        );
        await closeDiskPopup(page, groupsVDiskPopup);

        const groupsPDisk = page.locator('.ydb-storage-disks__pdisk-progress-bar').first();
        await groupsPDisk.hover();
        const groupsPDiskPopup = await waitForDiskPopup(page, 'Go to PDisk');
        const groupsPDiskInfo = await getFirstTitledDefinitionList(groupsPDiskPopup, 'PDisk');
        for (const label of ['Space', 'Slots', 'Slot Size In Units', 'Capacity Alert']) {
            await expect(getDefinitionListRow(groupsPDiskInfo, label)).toBeVisible();
        }
        const pDiskSpaceText = await getDefinitionListValue(groupsPDiskInfo, 'Space').innerText();
        const pDiskSlotSizeText = await getDefinitionListValue(
            groupsPDiskInfo,
            'Slot Size In Units',
        ).innerText();

        await page.goto(`/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`);

        const pDiskInfo = page.locator('.ydb-pdisk-page__info');
        await expect(pDiskInfo.getByText('PDisk Usage', {exact: true})).toBeVisible();
        await expect(pDiskInfo.getByText('Slot Size In Units', {exact: true})).toBeVisible();

        const vDiskOnPDiskPage = page
            .locator('.ydb-pdisk-space-distribution__slot-wrapper a')
            .first();
        await expect(vDiskOnPDiskPage).toBeVisible();
        await vDiskOnPDiskPage.click();
        await expect(page).toHaveURL(/\/vDisk\?/);

        const nestedVDiskInfo = page.locator('.ydb-vdisk-page__info');
        await expect(getDefinitionListValue(nestedVDiskInfo, 'Size')).toHaveText(vDiskSizeText);
        await expect(getDefinitionListValue(nestedVDiskInfo, 'VDisk Slot Usage')).toHaveText(
            vDiskSlotUsageText,
        );

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

        await page.goto(VDISK_PAGE_PATH.replace('type=groups', 'type=nodes'));

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
        const nodesVDiskInfo = await getFirstTitledDefinitionList(nodesVDiskPopup, 'VDisk');
        await expect(getDefinitionListValue(nodesVDiskInfo, 'Size')).toHaveText(vDiskSizeText);
        await expect(getDefinitionListValue(nodesVDiskInfo, 'VDisk Slot Usage')).toHaveText(
            vDiskSlotUsageText,
        );
        await closeDiskPopup(page, nodesVDiskPopup);

        const nodesPDisk = page
            .locator('.ydb-paginated-table__row')
            .first()
            .locator('.pdisk-storage__content .storage-disk-progress-bar')
            .first();
        await nodesPDisk.hover();
        const nodesPDiskPopup = await waitForDiskPopup(page, 'Go to PDisk');
        const nodesPDiskInfo = await getFirstTitledDefinitionList(nodesPDiskPopup, 'PDisk');
        await expect(getDefinitionListValue(nodesPDiskInfo, 'Space')).toHaveText(pDiskSpaceText);
        await expect(getDefinitionListValue(nodesPDiskInfo, 'Slot Size In Units')).toHaveText(
            pDiskSlotSizeText,
        );
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
        for (const label of [
            'VDisk Slot Usage',
            'VDisk Raw Usage',
            'Group Size In Units',
            'Capacity Alert',
        ]) {
            await expectDefinitionListRowPlaceholder(vDiskInfo, label);
        }

        const groupsVDisk = page
            .locator('.ydb-storage-vdisks__wrapper .storage-disk-progress-bar')
            .first();
        await groupsVDisk.hover();
        const vDiskPopup = await waitForDiskPopup(page, 'Go to VDisk');
        const vDiskPopupInfo = await getFirstTitledDefinitionList(vDiskPopup, 'VDisk');
        for (const label of ['VDisk Slot Usage', 'Group Size In Units', 'Capacity Alert']) {
            await expectDefinitionListRowPlaceholder(vDiskPopupInfo, label);
        }
        await closeDiskPopup(page, vDiskPopup);

        const groupsPDisk = page.locator('.ydb-storage-disks__pdisk-progress-bar').first();
        await groupsPDisk.hover();
        const pDiskPopup = await waitForDiskPopup(page, 'Go to PDisk');
        const pDiskPopupInfo = await getFirstTitledDefinitionList(pDiskPopup, 'PDisk');
        for (const label of ['Slot Size In Units', 'Capacity Alert']) {
            await expectDefinitionListRowPlaceholder(pDiskPopupInfo, label);
        }

        await page.goto(`/pDisk?nodeId=${NODE_ID}&pDiskId=${PDISK_ID}`);

        const pDiskInfo = page.locator('.ydb-pdisk-page__info');
        for (const label of ['PDisk Usage', 'Slot Size In Units']) {
            await expectInfoViewerRowPlaceholder(pDiskInfo, label);
        }

        await page.goto(`/storageGroup?database=/local&groupId=${GROUP_ID}`);

        const groupInfo = page.locator('.ydb-storage-group-page__info');
        for (const label of [
            'Group Size In Units',
            'VDisk Slot Usage',
            'VDisk Raw Usage',
            'Capacity Alert',
        ]) {
            await expectInfoViewerRowPlaceholder(groupInfo, label);
        }
    });
});
