import type {Page} from '@playwright/test';
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
