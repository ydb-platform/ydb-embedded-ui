import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

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
    setupVDiskPageMocks,
} from './vdiskPageMocks';

async function enableNewStorageView(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('enableNewStorageView', JSON.stringify(true));
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
        .locator('.g-popup .ydb-popover')
        .filter({has: page.getByRole('link', {name: actionName})})
        .first();
    await expect(popup).toBeVisible();
    return popup;
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
