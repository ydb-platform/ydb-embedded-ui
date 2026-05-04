import {expect, test} from '@playwright/test';
import type {Locator, Page, Route} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';

const TOP_ROW_PATH = '/local/kv_test';
const SECOND_TOP_ROW_PATH = '/local/orders_cdc';
const STORAGE_VIEW_SELECTOR = '.ydb-tenant-storage-new';
const STORAGE_SECTIONS_SELECTOR = '.ydb-tenant-storage-new__sections-inner';
const MEDIA_SECTION_SELECTOR = '.ydb-tenant-storage-summary-sections';
const SUMMARY_CARD_SELECTOR = '.ydb-tenant-storage-summary-card';
const SUMMARY_METRIC_SELECTOR = '.ydb-tenant-storage-summary-card__metric';
const SEGMENT_ITEM_INACTIVE_SELECTOR = '.ydb-tenant-storage-segments__item_inactive';
const SEGMENT_EMPTY_INACTIVE_SELECTOR = '.ydb-tenant-storage-segments__empty_inactive';
const LEGEND_ITEM_SELECTOR = '.ydb-tenant-storage-segments__legend-item';
const LEGEND_ITEM_INACTIVE_SELECTOR = '.ydb-tenant-storage-segments__legend-item_inactive';
const STORAGE_SCREENSHOT_THEMES = ['light', 'dark'] as const;

type StorageScreenshotTheme = (typeof STORAGE_SCREENSHOT_THEMES)[number];

async function enableNewStorageView(page: Page, theme?: StorageScreenshotTheme) {
    await page.addInitScript(() => {
        localStorage.setItem('enableNewStorageView', JSON.stringify(true));
    });

    if (theme) {
        await page.addInitScript((themeName) => {
            localStorage.setItem('theme', themeName);
        }, theme);
    }
}

async function setupCapabilities(page: Page, storageStatsVersion: number) {
    await page.route('**/viewer/capabilities*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Database: database,
                Capabilities: {
                    '/viewer/storage_stats': storageStatsVersion,
                },
            }),
        });
    });
}

async function setupWhoami(page: Page) {
    await page.route('**/viewer/json/whoami?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                UserSID: 'test-user',
                UserID: 'test-user-id',
                AuthType: 'Login',
                IsViewerAllowed: true,
                IsMonitoringAllowed: true,
                IsAdministrationAllowed: true,
            }),
        });
    });
}

async function setupTenantInfo(
    page: Page,
    tenantType: 'Dedicated' | 'Serverless' = 'Dedicated',
    {
        databaseStorage,
        tablesStorage,
    }: {
        databaseStorage?: Array<{Type: string; Size: string; Limit: string}>;
        tablesStorage?: Array<{
            Type: string;
            Size: string;
            Limit?: string;
            SoftQuota?: string;
            HardQuota?: string;
        }>;
    } = {},
) {
    await page.route('**/viewer/json/tenantinfo?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                TenantInfo: [
                    {
                        Name: database,
                        Type: tenantType,
                        Overall: 'Green',
                        StorageAllocatedSize: '26400000000000',
                        StorageAllocatedLimit: '201000000000000',
                        StorageGroups: '2',
                        TablesStorage: tablesStorage ?? [
                            {
                                Type: 'SSD',
                                Size: '3100000000000',
                                Limit: '21000000000000',
                                SoftQuota: '21000000000000',
                            },
                        ],
                        DatabaseStorage: databaseStorage ?? [
                            {
                                Type: 'SSD',
                                Size: '26400000000000',
                                Limit: '201000000000000',
                            },
                        ],
                        CoresTotal: 8,
                    },
                ],
            }),
        });
    });
}

async function setupStorageStats(page: Page) {
    await page.route('**/viewer/storage_stats?*', async (route: Route) => {
        const url = new URL(route.request().url());
        const groupBy = url.searchParams.get('group_by');

        if (groupBy === 'tablet_type') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Tablets: [
                        {
                            Type: 'Mediator',
                            StorageSize: 12820,
                            Media: [{Kind: 'ssd', StorageSize: 12820}],
                        },
                        {
                            Type: 'Coordinator',
                            StorageSize: 13026534,
                            Media: [{Kind: 'ssd', StorageSize: 13026534}],
                        },
                        {
                            Type: 'Hive',
                            StorageSize: 142572169,
                            Media: [{Kind: 'ssd', StorageSize: 142572169}],
                        },
                        {
                            Type: 'SchemeShard',
                            StorageSize: 14850162,
                            Media: [{Kind: 'ssd', StorageSize: 14850162}],
                        },
                        {
                            Type: 'DataShard',
                            StorageSize: 71262508656,
                            Media: [{Kind: 'ssd', StorageSize: 71262508656}],
                        },
                        {
                            Type: 'PersQueue',
                            StorageSize: 490192343,
                            Media: [{Kind: 'ssd', StorageSize: 490192343}],
                        },
                        {
                            Type: 'PersQueueReadBalancer',
                            StorageSize: 23506713,
                            Media: [{Kind: 'ssd', StorageSize: 23506713}],
                        },
                        {
                            Type: 'SysViewProcessor',
                            StorageSize: 72956425,
                            Media: [{Kind: 'ssd', StorageSize: 72956425}],
                        },
                        {
                            Type: 'ColumnShard',
                            StorageSize: 2244552896,
                            Media: [{Kind: 'ssd', StorageSize: 2244552896}],
                        },
                        {
                            Type: 'StatisticsAggregator',
                            StorageSize: 2179029,
                            Media: [{Kind: 'ssd', StorageSize: 2179029}],
                        },
                        {
                            Type: 'GraphShard',
                            StorageSize: 15781,
                            Media: [{Kind: 'ssd', StorageSize: 15781}],
                        },
                    ],
                }),
            });
            return;
        }

        if (groupBy === 'path') {
            const requestPath = url.searchParams.get('path') ?? '';
            const requestedPaths = requestPath
                .split(',')
                .map((path) => {
                    return path.startsWith('/') ? path : `${database}/${path}`;
                })
                .filter(Boolean);

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Paths: requestedPaths.map((path) => {
                        if (path === TOP_ROW_PATH) {
                            return {
                                FullPath: TOP_ROW_PATH,
                                StorageSize: 360000000000,
                            };
                        }

                        if (path === SECOND_TOP_ROW_PATH) {
                            return {
                                FullPath: SECOND_TOP_ROW_PATH,
                                StorageSize: 10000000000,
                            };
                        }

                        return {
                            FullPath: path,
                            StorageSize: 0,
                        };
                    }),
                }),
            });
            return;
        }

        await route.continue();
    });
}

async function setupPartitionStatsQuery(page: Page) {
    await page.route('**/viewer/json/query?*', async (route: Route) => {
        const request = route.request().postDataJSON() as {query?: string} | null;
        const queryText = request?.query ?? '';

        if (!queryText.includes('.sys/partition_stats')) {
            await route.continue();
            return;
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                result: [
                    {
                        columns: [
                            {name: 'Path', type: 'Utf8?'},
                            {name: 'Size', type: 'Uint64?'},
                            {name: 'UserData', type: 'Uint64?'},
                        ],
                        rows: [
                            [TOP_ROW_PATH, 112000000000, 112000000000],
                            [SECOND_TOP_ROW_PATH, 4000000000, 4000000000],
                        ],
                    },
                ],
            }),
        });
    });
}

async function setupDescribe(page: Page) {
    await page.route('**/viewer/json/describe?*', async (route: Route) => {
        const url = new URL(route.request().url());
        const requestPath = url.searchParams.get('path');

        if (requestPath === database) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Path: database,
                    PathDescription: {
                        Self: {
                            Name: 'local',
                            PathType: 'EPathTypeSubDomain',
                        },
                        DomainDescription: {
                            DiskSpaceUsage: {
                                Tables: {
                                    DataSize: '3100000000000',
                                },
                                Topics: {
                                    DataSize: '0',
                                },
                            },
                        },
                        Children: [
                            {
                                Name: 'kv_test',
                                PathType: 'EPathTypeTable',
                            },
                            {
                                Name: 'orders_cdc',
                                PathType: 'EPathTypePersQueueGroup',
                            },
                        ],
                    },
                }),
            });
            return;
        }

        await route.continue();
    });
}

async function openStorageMetricsTab(page: Page) {
    const storageTab = page.locator('.tenant-metrics-tabs__link-container:has-text("Storage")');
    await storageTab.click();
}

function getSummaryCard(container: Locator, title: string) {
    return container.locator(SUMMARY_CARD_SELECTOR).filter({hasText: title});
}

function getSummaryMetric(card: Locator, label: string) {
    return card.locator(SUMMARY_METRIC_SELECTOR).filter({hasText: label});
}

test.describe('Tenant Overview storage metrics tab', () => {
    test.describe.configure({timeout: 60_000});

    for (const theme of STORAGE_SCREENSHOT_THEMES) {
        test(`renders the new storage layout in ${theme} theme`, async ({page}) => {
            await enableNewStorageView(page, theme);
            await setupWhoami(page);
            await setupCapabilities(page, 1);
            await setupTenantInfo(page, 'Dedicated');
            await setupPartitionStatsQuery(page);
            await setupStorageStats(page);
            await setupDescribe(page);

            const tenantPage = new TenantPage(page);
            await tenantPage.goto({
                schema: database,
                database,
                tenantPage: 'diagnostics',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const userDataSummary = getSummaryCard(storageView, 'User data');
            const physicalSummary = getSummaryCard(storageView, 'Physical disk usage');

            await expect(storageView).toBeVisible();
            await expect(storageView.getByText('User data', {exact: true})).toBeVisible();
            await expect(storageView.getByText('Physical disk usage', {exact: true})).toBeVisible();
            await expect(
                storageView.getByText('Top 10 by space usage', {exact: true}),
            ).toBeVisible();
            await expect(storageView.getByText('Row table', {exact: true})).toBeVisible();
            await expect(storageView.getByText('System', {exact: true})).toBeVisible();
            await expect(
                getSummaryMetric(userDataSummary, 'Used').getByText('3.10 TB', {exact: true}),
            ).toBeVisible();
            await expect(
                getSummaryMetric(physicalSummary, 'Used').getByText('26.40 TB', {exact: true}),
            ).toBeVisible();
            await expect(userDataSummary.getByText('used 15%', {exact: true})).toBeVisible();
            await expect(physicalSummary.getByText('used 13%', {exact: true})).toBeVisible();
            await expect(storageView.getByRole('link', {name: 'kv_test'})).toHaveAttribute(
                'href',
                /schema=%2Flocal%2Fkv_test/,
            );
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-single-media-${theme}.png`,
            );
        });

        test(`renders separate summary sections for multiple storage types in ${theme} theme`, async ({
            page,
        }) => {
            await enableNewStorageView(page, theme);
            await setupWhoami(page);
            await setupCapabilities(page, 1);
            await setupTenantInfo(page, 'Dedicated', {
                databaseStorage: [
                    {Type: 'SSD', Size: '400000000000', Limit: '1000000000000'},
                    {Type: 'HDD', Size: '600000000000', Limit: '2000000000000'},
                ],
                tablesStorage: [
                    {
                        Type: 'SSD',
                        Size: '250000000000',
                        Limit: '500000000000',
                        SoftQuota: '500000000000',
                    },
                    {
                        Type: 'HDD',
                        Size: '50000000000',
                        Limit: '200000000000',
                        SoftQuota: '200000000000',
                    },
                ],
            });
            await setupPartitionStatsQuery(page);
            await setupStorageStats(page);
            await setupDescribe(page);

            const tenantPage = new TenantPage(page);
            await tenantPage.goto({
                schema: database,
                database,
                tenantPage: 'diagnostics',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const ssdSection = storageView.locator(MEDIA_SECTION_SELECTOR).filter({hasText: 'SSD'});
            const hddSection = storageView.locator(MEDIA_SECTION_SELECTOR).filter({hasText: 'HDD'});
            const ssdUserDataSummary = getSummaryCard(ssdSection, 'User data');
            const hddPhysicalSummary = getSummaryCard(hddSection, 'Physical disk usage');

            await expect(storageView.getByText('SSD', {exact: true})).toBeVisible();
            await expect(storageView.getByText('HDD', {exact: true})).toBeVisible();
            await expect(
                getSummaryMetric(ssdUserDataSummary, 'Used').getByText('250 GB', {exact: true}),
            ).toBeVisible();
            await expect(
                getSummaryMetric(hddPhysicalSummary, 'Used').getByText('0.60 TB', {exact: true}),
            ).toBeVisible();
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-multi-media-${theme}.png`,
            );
        });
    }

    test('keeps legacy dedicated storage layout when experiment is disabled', async ({page}) => {
        await setupWhoami(page);
        await setupCapabilities(page, 1);
        await setupTenantInfo(page, 'Dedicated');
        await setupPartitionStatsQuery(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            tenantPage: 'diagnostics',
        });

        await openStorageMetricsTab(page);

        await expect(page.locator(STORAGE_VIEW_SELECTOR)).toHaveCount(0);
        await expect(page.getByText('Storage Details', {exact: true})).toBeVisible();
        await expect(page.getByText('Top tables by size', {exact: true})).toBeVisible();
    });

    for (const theme of STORAGE_SCREENSHOT_THEMES) {
        test(`highlights hovered storage segment and shows rich tooltip in ${theme} theme`, async ({
            page,
        }) => {
            await enableNewStorageView(page, theme);
            await setupWhoami(page);
            await setupCapabilities(page, 1);
            await setupTenantInfo(page, 'Dedicated');
            await setupPartitionStatsQuery(page);
            await setupStorageStats(page);
            await setupDescribe(page);

            const tenantPage = new TenantPage(page);
            await tenantPage.goto({
                schema: database,
                database,
                tenantPage: 'diagnostics',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const physicalSummary = getSummaryCard(storageView, 'Physical disk usage');
            const columnSegment = physicalSummary.getByRole('button', {name: /Column tables:/});

            await columnSegment.hover();

            await expect(page.getByText('of total physical disk usage')).toBeVisible();
            await expect(physicalSummary.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(4);
            await expect(physicalSummary.locator(SEGMENT_EMPTY_INACTIVE_SELECTOR)).toHaveCount(1);
            await expect(physicalSummary.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(4);
            await expect(
                physicalSummary.locator(LEGEND_ITEM_SELECTOR).filter({hasText: 'Column tables'}),
            ).not.toHaveClass(/legend-item_inactive/);
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-hover-${theme}.png`,
            );

            await page.mouse.move(0, 0);

            await expect(physicalSummary.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);
            await expect(physicalSummary.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);
        });

        test(`shows tooltip on legend hover and pins state on click in ${theme} theme`, async ({
            page,
        }) => {
            await enableNewStorageView(page, theme);
            await setupWhoami(page);
            await setupCapabilities(page, 1);
            await setupTenantInfo(page, 'Dedicated');
            await setupPartitionStatsQuery(page);
            await setupStorageStats(page);
            await setupDescribe(page);

            const tenantPage = new TenantPage(page);
            await tenantPage.goto({
                schema: database,
                database,
                tenantPage: 'diagnostics',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const physicalSummary = getSummaryCard(storageView, 'Physical disk usage');
            const columnLegendItem = physicalSummary
                .locator(LEGEND_ITEM_SELECTOR)
                .filter({hasText: 'Column tables'});
            const columnSegment = physicalSummary.getByRole('button', {name: /Column tables:/});

            await columnLegendItem.hover();

            await expect(page.getByText('of total physical disk usage')).toBeVisible();
            await expect(physicalSummary.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(4);
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-legend-hover-${theme}.png`,
            );

            await columnSegment.click();
            await page.mouse.move(0, 0);

            await expect(page.getByText('of total physical disk usage')).toBeVisible();
            await expect(physicalSummary.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(4);
            await expect(physicalSummary.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(4);
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-pinned-${theme}.png`,
            );

            await storageView.getByText('Top 10 by space usage', {exact: true}).click();

            await expect(physicalSummary.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);
            await expect(physicalSummary.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);
        });
    }

    test('keeps legacy dedicated storage layout when storage_stats capability is unavailable', async ({
        page,
    }) => {
        await enableNewStorageView(page);
        await setupWhoami(page);
        await setupCapabilities(page, 0);
        await setupTenantInfo(page, 'Dedicated');
        await setupPartitionStatsQuery(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            tenantPage: 'diagnostics',
        });

        await openStorageMetricsTab(page);

        await expect(page.locator(STORAGE_VIEW_SELECTOR)).toHaveCount(0);
        await expect(page.getByText('Storage Details', {exact: true})).toBeVisible();
        await expect(page.getByText('Top tables by size', {exact: true})).toBeVisible();
    });

    test('keeps legacy serverless storage layout when experiment is enabled', async ({page}) => {
        await enableNewStorageView(page);
        await setupWhoami(page);
        await setupCapabilities(page, 1);
        await setupTenantInfo(page, 'Serverless');
        await setupPartitionStatsQuery(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            tenantPage: 'diagnostics',
        });

        await openStorageMetricsTab(page);

        await expect(page.locator(STORAGE_VIEW_SELECTOR)).toHaveCount(0);
        await expect(page.getByText('Top tables by size', {exact: true})).toBeVisible();
    });
});
