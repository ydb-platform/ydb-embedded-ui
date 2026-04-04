import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {QueryEditor} from '../../queryEditor/models/QueryEditor';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

const MOCK_STORAGE_USAGE_PATH = '/local/storage_usage_table';
const MOCK_COLUMN_STORAGE_USAGE_PATH = '/local/storage_usage_column_table';
const MOCK_STORAGE_USAGE_MEDIA_STATS_PATH = '/local/storage_usage_media_stats_table';

interface StorageUsageMockRow {
    GroupId: string;
    StorageSize: number;
    StorageCount?: number;
}

interface StorageGroupMockInfo {
    GroupId: string;
    Limit: string;
    MediaType: string;
    ErasureSpecies?: string;
    PoolName?: string;
}

interface StorageUsageMockMedia {
    Kind: string;
    StorageSize?: number;
    DataSize?: number;
}

async function setupStorageUsageMocks({
    page,
    path,
    pathType = 'EPathTypeTable',
    dataSize,
    storageSize,
    rows,
    groups,
    media,
    storageGroupsResponseStatus = 200,
}: {
    page: Page;
    path: string;
    pathType?: 'EPathTypeTable' | 'EPathTypeColumnTable';
    dataSize: string;
    storageSize: number;
    rows: StorageUsageMockRow[];
    groups: StorageGroupMockInfo[];
    media?: StorageUsageMockMedia[];
    storageGroupsResponseStatus?: number;
}) {
    await page.route('**/viewer/json/describe?*', async (route) => {
        const url = new URL(route.request().url());
        const requestPath = url.searchParams.get('path');

        if (requestPath === path) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Path: path,
                    PathDescription: {
                        Self: {
                            Name: path.split('/').pop(),
                            PathType: pathType,
                        },
                        TableStats: {
                            DataSize: dataSize,
                        },
                    },
                }),
            });
            return;
        }

        await route.continue();
    });

    await page.route('**/viewer/storage_stats?*', async (route) => {
        const url = new URL(route.request().url());
        const requestPath = url.searchParams.get('path');

        if (requestPath === path) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Paths: [
                        {
                            Path: path,
                            FullPath: path,
                            StorageSize: storageSize,
                            Groups: rows,
                            ...(media ? {Media: media} : {}),
                        },
                    ],
                }),
            });
            return;
        }

        await route.continue();
    });

    await page.route('**/storage/groups?*', async (route) => {
        const url = new URL(route.request().url());
        const requestGroupIds = url.searchParams
            .getAll('group_id')
            .flatMap((groupIds) => groupIds.split(','))
            .filter(Boolean);

        if (requestGroupIds.length > 0) {
            if (storageGroupsResponseStatus !== 200) {
                await route.fulfill({
                    status: storageGroupsResponseStatus,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: `HTTP ${storageGroupsResponseStatus}`,
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    StorageGroups: groups.filter((group) =>
                        requestGroupIds.includes(group.GroupId),
                    ),
                }),
            });
            return;
        }

        await route.continue();
    });
}

test.describe('Diagnostics Storage usage tab', async () => {
    test.beforeEach(async ({page}) => {
        await page.addInitScript(() => {
            localStorage.setItem('enableNewStorageView', JSON.stringify(true));
        });
    });

    test('Storage usage tab is available for row tables and renders the page', async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            tenantPage: 'query',
        });

        const queryEditor = new QueryEditor(page);
        const tableName = await queryEditor.createNewFakeTable();
        const tablePath = `/local/${tableName}`;

        await tenantPage.goto({
            schema: tablePath,
            database,
            tenantPage: 'diagnostics',
        });

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.StorageUsage);

        const storageUsage = page.locator('.ydb-storage-usage');

        await expect(storageUsage).toBeVisible();
        await expect(storageUsage.getByText('Data size')).toBeVisible();
        await expect(storageUsage.getByText('Disk usage')).toBeVisible();
        await expect(storageUsage.getByText(/Storage groups usage/)).toBeVisible();
    });

    test('Storage usage tab is hidden when storage groups handler is unavailable', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            tenantPage: 'query',
        });

        const queryEditor = new QueryEditor(page);
        const tableName = await queryEditor.createNewFakeTable();
        const tablePath = `/local/${tableName}`;

        let storageGroupsRequests = 0;

        await page.route('**/viewer/capabilities*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Database: database,
                    Capabilities: {
                        '/storage/groups': 2,
                    },
                }),
            });
        });

        await page.route('**/storage/groups?*', async (route) => {
            storageGroupsRequests += 1;
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'storage groups should not be requested',
                }),
            });
        });

        await tenantPage.goto({
            schema: tablePath,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'storageUsage',
        });

        const diagnostics = new Diagnostics(page);

        await expect(diagnostics.getTab(DiagnosticsTab.StorageUsage)).toHaveCount(0);
        await expect(page).not.toHaveURL(/diagnosticsTab=storageUsage/);

        expect(storageGroupsRequests).toBe(0);
    });

    test('Storage usage renders single-media layout', async ({page}) => {
        await setupStorageUsageMocks({
            page,
            path: MOCK_STORAGE_USAGE_PATH,
            dataSize: '30000000000',
            storageSize: 61000000000,
            rows: [
                {GroupId: '2181038080', StorageSize: 22000000000, StorageCount: 10},
                {GroupId: '2181038083', StorageSize: 16000000000, StorageCount: 10},
                {GroupId: '2181038082', StorageSize: 12000000000, StorageCount: 10},
                {GroupId: '2181038081', StorageSize: 11000000000, StorageCount: 10},
            ],
            groups: [
                {
                    GroupId: '2181038080',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181038083',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181038082',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181038081',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
            ],
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: MOCK_STORAGE_USAGE_PATH,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'storageUsage',
        });

        const storageUsage = page.locator('.ydb-storage-usage');
        await expect(storageUsage).toBeVisible();
        await expect(storageUsage.getByText('SSD', {exact: true})).toHaveCount(0);
        await expect(storageUsage).toHaveScreenshot('storage-usage-single-media.png');
    });

    test('Storage usage renders multiple media sections', async ({page}) => {
        await setupStorageUsageMocks({
            page,
            path: MOCK_STORAGE_USAGE_PATH,
            dataSize: '100000000000',
            storageSize: 500000000000,
            rows: [
                {GroupId: '2181040008', StorageSize: 100000000000, StorageCount: 10},
                {GroupId: '2181040004', StorageSize: 12000000000, StorageCount: 10},
                {GroupId: '2181040006', StorageSize: 1000000000, StorageCount: 10},
                {GroupId: '2181040010', StorageSize: 200000000000, StorageCount: 10},
                {GroupId: '2181040012', StorageSize: 187000000000, StorageCount: 10},
            ],
            groups: [
                {
                    GroupId: '2181040008',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181040004',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181040006',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181040010',
                    Limit: '3000000000000',
                    MediaType: 'ROT',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181040012',
                    Limit: '3000000000000',
                    MediaType: 'ROT',
                    ErasureSpecies: 'mirror-3-dc',
                },
            ],
            media: [
                {
                    Kind: 'SSD',
                    StorageSize: 113000000000,
                    DataSize: 22600000000,
                },
                {
                    Kind: 'ROT',
                    StorageSize: 387000000000,
                    DataSize: 77400000000,
                },
            ],
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: MOCK_STORAGE_USAGE_PATH,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'storageUsage',
        });

        const storageUsage = page.locator('.ydb-storage-usage');
        await expect(storageUsage).toBeVisible();
        await expect(storageUsage.getByText('SSD', {exact: true}).first()).toBeVisible();
        await expect(storageUsage.getByText('HDD', {exact: true}).first()).toBeVisible();
        await expect(storageUsage).toHaveScreenshot('storage-usage-multi-media.png');
    });

    test('Storage usage renders per-media summary metrics from storage stats media data', async ({
        page,
    }) => {
        await setupStorageUsageMocks({
            page,
            path: MOCK_STORAGE_USAGE_MEDIA_STATS_PATH,
            dataSize: '100000000000',
            storageSize: 500000000000,
            rows: [
                {GroupId: '2181040008', StorageSize: 100000000000, StorageCount: 10},
                {GroupId: '2181040010', StorageSize: 400000000000, StorageCount: 10},
            ],
            groups: [
                {
                    GroupId: '2181040008',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181040010',
                    Limit: '3000000000000',
                    MediaType: 'ROT',
                    ErasureSpecies: 'mirror-3-dc',
                },
            ],
            media: [
                {
                    Kind: 'SSD',
                    StorageSize: 100000000000,
                    DataSize: 50000000000,
                },
                {
                    Kind: 'ROT',
                    StorageSize: 400000000000,
                    DataSize: 50000000000,
                },
            ],
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: MOCK_STORAGE_USAGE_MEDIA_STATS_PATH,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'storageUsage',
        });

        const storageUsageSections = page.locator('.ydb-storage-usage-sections__section');
        await expect(storageUsageSections).toHaveCount(2);
        await expect(storageUsageSections.getByText('SSD', {exact: true}).first()).toBeVisible();
        await expect(storageUsageSections.getByText('HDD', {exact: true}).first()).toBeVisible();
        await expect(storageUsageSections.getByText('2x', {exact: true})).toHaveCount(1);
        await expect(storageUsageSections.getByText('8x', {exact: true})).toHaveCount(1);
        await expect(storageUsageSections.getByText('5x', {exact: true})).toHaveCount(0);
    });

    test('Storage usage shows zero data size when table stats report 0 bytes', async ({page}) => {
        await setupStorageUsageMocks({
            page,
            path: MOCK_STORAGE_USAGE_MEDIA_STATS_PATH,
            dataSize: '0',
            storageSize: 100000000000,
            rows: [{GroupId: '2181040008', StorageSize: 100000000000, StorageCount: 10}],
            groups: [
                {
                    GroupId: '2181040008',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
            ],
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: MOCK_STORAGE_USAGE_MEDIA_STATS_PATH,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'storageUsage',
        });

        const storageUsage = page.locator('.ydb-storage-usage');

        await expect(storageUsage).toBeVisible();
        await expect(storageUsage.getByText(/^0\s*GB$/, {exact: true})).toBeVisible();
    });

    test('Storage usage shows response error when storage groups request fails', async ({page}) => {
        await setupStorageUsageMocks({
            page,
            path: MOCK_STORAGE_USAGE_MEDIA_STATS_PATH,
            dataSize: '100000000000',
            storageSize: 500000000000,
            rows: [
                {GroupId: '2181040008', StorageSize: 100000000000, StorageCount: 10},
                {GroupId: '2181040010', StorageSize: 400000000000, StorageCount: 10},
            ],
            groups: [
                {
                    GroupId: '2181040008',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181040010',
                    Limit: '3000000000000',
                    MediaType: 'ROT',
                    ErasureSpecies: 'mirror-3-dc',
                },
            ],
            media: [
                {
                    Kind: 'SSD',
                    StorageSize: 100000000000,
                    DataSize: 50000000000,
                },
                {
                    Kind: 'ROT',
                    StorageSize: 400000000000,
                    DataSize: 50000000000,
                },
            ],
            storageGroupsResponseStatus: 500,
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: MOCK_STORAGE_USAGE_MEDIA_STATS_PATH,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'storageUsage',
        });

        const responseError = page.locator('.ydb-storage-usage .ydb-response-error');
        await expect(responseError).toBeVisible();
        await expect(page.locator('.ydb-storage-usage-sections__section')).toHaveCount(0);
        await expect(page.locator('.ydb-storage-usage-table')).toHaveCount(0);
    });

    test('Storage usage table renders expanded state', async ({page}) => {
        await setupStorageUsageMocks({
            page,
            path: MOCK_COLUMN_STORAGE_USAGE_PATH,
            pathType: 'EPathTypeColumnTable',
            dataSize: '30000000000',
            storageSize: 61000000000,
            rows: [
                {GroupId: '2181038080', StorageSize: 22000000000, StorageCount: 10},
                {GroupId: '2181038083', StorageSize: 16000000000, StorageCount: 10},
                {GroupId: '2181038082', StorageSize: 12000000000, StorageCount: 10},
                {GroupId: '2181038081', StorageSize: 11000000000, StorageCount: 10},
            ],
            groups: [
                {
                    GroupId: '2181038080',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181038083',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181038082',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
                {
                    GroupId: '2181038081',
                    Limit: '2000000000000',
                    MediaType: 'SSD',
                    ErasureSpecies: 'mirror-3-dc',
                },
            ],
        });

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: MOCK_COLUMN_STORAGE_USAGE_PATH,
            database,
            tenantPage: 'diagnostics',
            diagnosticsTab: 'storageUsage',
        });

        const diagnostics = new Diagnostics(page);

        await expect(diagnostics.getTab(DiagnosticsTab.StorageUsage)).toBeVisible();

        await page.getByRole('button', {name: 'Show 1 more'}).click();

        const storageUsageTable = page.locator('.ydb-storage-usage-table');
        await expect(storageUsageTable).toBeVisible();
        await expect(storageUsageTable).toHaveScreenshot('storage-usage-expanded-column-table.png');
    });
});
