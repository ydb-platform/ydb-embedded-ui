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
const SUMMARY_ROW_SELECTOR = '.ydb-tenant-storage-summary-card__row';
const SEGMENT_ITEM_INACTIVE_SELECTOR = '.ydb-tenant-storage-segments__item_inactive';
const SEGMENT_EMPTY_INACTIVE_SELECTOR = '.ydb-tenant-storage-segments__empty_inactive';
const LEGEND_ITEM_SELECTOR = '.ydb-tenant-storage-segments__legend-item';
const LEGEND_ITEM_INACTIVE_SELECTOR = '.ydb-tenant-storage-segments__legend-item_inactive';
const TOP_USAGE_TABLE_SELECTOR = '.ydb-tenant-storage-top-usage-table';
const TOP_USAGE_PATH_COPY_SELECTOR = '.ydb-tenant-storage-top-usage-table__path-copy';
const HELP_MARK_SELECTOR = '.g-help-mark';
const USER_DATA_SUMMARY_CARD_QA = 'tenant-storage-user-data-summary-card';
const PHYSICAL_SUMMARY_CARD_QA = 'tenant-storage-physical-summary-card';
const GROUPED_USER_DATA_SUMMARY_CARD_QA = 'tenant-storage-grouped-user-data-summary-card';
const GROUPED_PHYSICAL_SUMMARY_CARD_QA = 'tenant-storage-grouped-physical-summary-card';
const STORAGE_SCREENSHOT_THEMES = ['light', 'dark'] as const;
const STORAGE_SCREENSHOT_VIEWPORT = {width: 1600, height: 1000};
const EXACT_COLUMN_TABLE_TOOLTIP_REGEXP = /2\s245\sMB/;
const NO_DATA_TEXT = 'No data';
const QUOTA_MISSING_TITLE = 'No quota? This is wrong.';
const QUOTA_MISSING_DESCRIPTION =
    'This mode lets your database consume shared storage and is only for dev/test. Set a quota for stability.';

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

async function setupStorageScreenshotViewport(page: Page) {
    await page.setViewportSize(STORAGE_SCREENSHOT_VIEWPORT);
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
        databaseQuotas,
        databaseStorage,
        storageAllocatedLimit = '201000000000000',
        tablesStorage,
    }: {
        databaseQuotas?: {
            data_size_soft_quota?: string;
            storage_quotas?: Array<{
                data_size_hard_quota?: string;
                data_size_soft_quota?: string;
                unit_kind: string;
            }>;
        };
        databaseStorage?: Array<{Type: string; Size: string; Limit?: string}>;
        storageAllocatedLimit?: string;
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
                        StorageAllocatedLimit: storageAllocatedLimit,
                        StorageGroups: '2',
                        DatabaseQuotas: databaseQuotas,
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

async function setupStorageStats(
    page: Page,
    {withMultiMedia = false}: {withMultiMedia?: boolean} = {},
) {
    await page.route('**/viewer/storage_stats?*', async (route: Route) => {
        const url = new URL(route.request().url());
        const groupBy = url.searchParams.get('group_by');

        if (groupBy === 'tablet_type') {
            const tablets = withMultiMedia
                ? [
                      {
                          Type: 'Unknown',
                          StorageSize: 6605648,
                          Media: [{Kind: 'ssd', StorageSize: 6605648}],
                      },
                      {
                          Type: 'Mediator',
                          StorageSize: 9873,
                          Media: [{Kind: 'ssd', StorageSize: 9873}],
                      },
                      {
                          Type: 'Coordinator',
                          StorageSize: 13759836,
                          Media: [{Kind: 'ssd', StorageSize: 13759836}],
                      },
                      {
                          Type: 'Hive',
                          StorageSize: 36872858,
                          Media: [{Kind: 'ssd', StorageSize: 36872858}],
                      },
                      {
                          Type: 'SchemeShard',
                          StorageSize: 39347449,
                          Media: [{Kind: 'ssd', StorageSize: 39347449}],
                      },
                      {
                          Type: 'DataShard',
                          StorageSize: 1045486055921,
                          Media: [
                              {Kind: 'hdd', StorageSize: 1045106959268},
                              {Kind: 'ssd', StorageSize: 379096653},
                          ],
                      },
                      {
                          Type: 'SysViewProcessor',
                          StorageSize: 15764712,
                          Media: [{Kind: 'ssd', StorageSize: 15764712}],
                      },
                      {
                          Type: 'StatisticsAggregator',
                          StorageSize: 1448581,
                          Media: [{Kind: 'ssd', StorageSize: 1448581}],
                      },
                  ]
                : [
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
                  ];

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Tablets: tablets,
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
                                StorageSize: 300000000,
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
                            [SECOND_TOP_ROW_PATH, 500000, 500000],
                        ],
                    },
                ],
            }),
        });
    });
}

async function setupDescribe(
    page: Page,
    {
        tablesDataSize = '3100000000000',
        topicsDataSize = '0',
    }: {tablesDataSize?: string; topicsDataSize?: string} = {},
) {
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
                                    DataSize: tablesDataSize,
                                },
                                Topics: {
                                    DataSize: topicsDataSize,
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

function getSummaryRow(card: Locator, label: string) {
    return card.locator(SUMMARY_ROW_SELECTOR).filter({hasText: label});
}

async function expectQuotaMissingHelpMark(page: Page, metric: Locator) {
    const helpMark = metric.locator(HELP_MARK_SELECTOR);

    await expect(metric.getByText(NO_DATA_TEXT, {exact: true})).toBeVisible();
    await expect(helpMark).toHaveCount(1);

    await helpMark.hover();

    await expect(page.getByText(QUOTA_MISSING_TITLE, {exact: true})).toBeVisible();
    await expect(page.getByText(QUOTA_MISSING_DESCRIPTION, {exact: true})).toBeVisible();
    await expect(page.getByText('Learn more', {exact: true})).toHaveCount(0);
    await expect(page.getByText('Set up quota', {exact: true})).toHaveCount(0);
}

async function openTenantStorageMetricsTab(page: Page) {
    const tenantPage = new TenantPage(page);

    await tenantPage.goto({
        schema: database,
        database,
        databasePage: 'database',
        diagnosticsTab: 'database',
    });

    await openStorageMetricsTab(page);

    const storageView = page.locator(STORAGE_VIEW_SELECTOR);

    await expect(storageView).toBeVisible();

    return storageView;
}

async function setupSingleMediaSummaryScreenshotMocks(page: Page) {
    await setupStorageScreenshotViewport(page);
    await enableNewStorageView(page, 'light');
    await setupWhoami(page);
    await setupCapabilities(page, 1);
    await setupTenantInfo(page, 'Dedicated', {
        storageAllocatedLimit: 'invalid',
        databaseStorage: [
            {
                Type: 'SSD',
                Size: '26400000000000',
            },
        ],
        tablesStorage: [
            {
                Type: 'SSD',
                Size: '0',
            },
        ],
    });
    await setupPartitionStatsQuery(page);
    await setupStorageStats(page);
    await setupDescribe(page, {
        tablesDataSize: '2700000000000',
        topicsDataSize: '400000000000',
    });
}

async function setupGroupedSummaryScreenshotMocks(page: Page) {
    await setupStorageScreenshotViewport(page);
    await enableNewStorageView(page, 'light');
    await setupWhoami(page);
    await setupCapabilities(page, 1);
    await setupTenantInfo(page, 'Dedicated', {
        storageAllocatedLimit: 'invalid',
        databaseStorage: [
            {Type: 'HDD', Size: '1353743073280'},
            {Type: 'SSD', Size: '98419343360'},
        ],
        tablesStorage: [
            {
                Type: 'HDD',
                Size: '0',
            },
            {
                Type: 'SSD',
                Size: '0',
            },
        ],
    });
    await setupPartitionStatsQuery(page);
    await setupStorageStats(page, {withMultiMedia: true});
    await setupDescribe(page);
}

test.describe('Tenant Overview storage metrics tab', () => {
    test.describe.configure({timeout: 60_000});

    test('screenshots single-media user data summary card', async ({page}) => {
        await setupSingleMediaSummaryScreenshotMocks(page);

        const storageView = await openTenantStorageMetricsTab(page);
        const userDataSummary = storageView.getByTestId(USER_DATA_SUMMARY_CARD_QA);

        await expect(userDataSummary).toBeVisible();
        await expect(userDataSummary.getByText('Row tables', {exact: true})).toBeVisible();
        await expect(userDataSummary.getByText('Topics', {exact: true})).toBeVisible();
        await expect(
            getSummaryMetric(userDataSummary, 'Available').getByText(NO_DATA_TEXT),
        ).toBeVisible();
        await expect(
            getSummaryMetric(userDataSummary, 'Quota').getByText(NO_DATA_TEXT),
        ).toBeVisible();

        await expect(userDataSummary).toHaveScreenshot(
            'tenant-overview-storage-user-data-summary-card.png',
        );
    });

    test('screenshots single-media physical summary card', async ({page}) => {
        await setupSingleMediaSummaryScreenshotMocks(page);

        const storageView = await openTenantStorageMetricsTab(page);
        const physicalSummary = storageView.getByTestId(PHYSICAL_SUMMARY_CARD_QA);

        await expect(physicalSummary).toBeVisible();
        await expect(physicalSummary.getByText('System', {exact: true})).toBeVisible();
        await expect(
            getSummaryMetric(physicalSummary, 'Overhead').getByText(NO_DATA_TEXT),
        ).toBeVisible();
        await expect(
            getSummaryMetric(physicalSummary, 'Available').getByText(NO_DATA_TEXT),
        ).toBeVisible();
        await expect(
            getSummaryMetric(physicalSummary, 'Total').getByText(NO_DATA_TEXT),
        ).toBeVisible();

        await expect(physicalSummary).toHaveScreenshot(
            'tenant-overview-storage-physical-summary-card.png',
        );
    });

    test('screenshots grouped user data summary card', async ({page}) => {
        await setupGroupedSummaryScreenshotMocks(page);

        const storageView = await openTenantStorageMetricsTab(page);
        const userDataSummary = storageView.getByTestId(GROUPED_USER_DATA_SUMMARY_CARD_QA);
        const ssdUserDataRow = getSummaryRow(userDataSummary, 'SSD');
        const hddUserDataRow = getSummaryRow(userDataSummary, 'HDD');

        await expect(userDataSummary).toBeVisible();
        await expect(ssdUserDataRow).toBeVisible();
        await expect(hddUserDataRow).toBeVisible();
        for (const row of [ssdUserDataRow, hddUserDataRow]) {
            await expect(getSummaryMetric(row, 'Available').getByText(NO_DATA_TEXT)).toBeVisible();
            await expect(getSummaryMetric(row, 'Quota').getByText(NO_DATA_TEXT)).toBeVisible();
        }

        await expect(userDataSummary).toHaveScreenshot(
            'tenant-overview-storage-grouped-user-data-card.png',
        );
    });

    test('screenshots grouped physical summary card', async ({page}) => {
        await setupGroupedSummaryScreenshotMocks(page);

        const storageView = await openTenantStorageMetricsTab(page);
        const physicalSummary = storageView.getByTestId(GROUPED_PHYSICAL_SUMMARY_CARD_QA);
        const ssdPhysicalRow = getSummaryRow(physicalSummary, 'SSD');
        const hddPhysicalRow = getSummaryRow(physicalSummary, 'HDD');

        await expect(physicalSummary).toBeVisible();
        await expect(ssdPhysicalRow).toBeVisible();
        await expect(hddPhysicalRow).toBeVisible();
        await expect(ssdPhysicalRow.getByText('System', {exact: true})).toBeVisible();
        for (const row of [ssdPhysicalRow, hddPhysicalRow]) {
            await expect(getSummaryMetric(row, 'Overhead').getByText(NO_DATA_TEXT)).toBeVisible();
            await expect(getSummaryMetric(row, 'Available').getByText(NO_DATA_TEXT)).toBeVisible();
            await expect(getSummaryMetric(row, 'Total').getByText(NO_DATA_TEXT)).toBeVisible();
        }

        await expect(physicalSummary).toHaveScreenshot(
            'tenant-overview-storage-grouped-physical-card.png',
        );
    });

    test('screenshots user data summary values in adaptive units at mixed threshold', async ({
        page,
    }) => {
        await setupStorageScreenshotViewport(page);
        await enableNewStorageView(page, 'light');
        await setupWhoami(page);
        await setupCapabilities(page, 1);
        await setupTenantInfo(page, 'Dedicated', {
            databaseQuotas: {
                data_size_soft_quota: '36000000000000',
            },
            tablesStorage: [
                {
                    Type: 'SSD',
                    Size: '1000000',
                    Limit: '36000000000000',
                    SoftQuota: '36000000000000',
                },
            ],
        });
        await setupPartitionStatsQuery(page);
        await setupStorageStats(page);
        await setupDescribe(page, {
            tablesDataSize: '1000000',
        });

        const storageView = await openTenantStorageMetricsTab(page);
        const userDataSummary = storageView.getByTestId(USER_DATA_SUMMARY_CARD_QA);

        await expect(userDataSummary).toBeVisible();
        await expect(userDataSummary).toHaveScreenshot(
            'tenant-overview-storage-user-data-mixed-units.png',
        );
    });

    for (const theme of STORAGE_SCREENSHOT_THEMES) {
        test(`renders the new storage layout in ${theme} theme`, async ({page}) => {
            await setupStorageScreenshotViewport(page);
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
                databasePage: 'database',
                diagnosticsTab: 'database',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const topUsageTable = storageView.locator(TOP_USAGE_TABLE_SELECTOR);
            const userDataSummary = getSummaryCard(storageView, 'User data');
            const physicalSummary = getSummaryCard(storageView, 'Physical disk usage');

            await expect(storageView).toBeVisible();
            await expect(userDataSummary).toBeVisible();
            await expect(physicalSummary).toBeVisible();
            await expect(topUsageTable.getByText('Top 10', {exact: true})).toBeVisible();
            await expect(topUsageTable.getByText('by space usage', {exact: true})).toBeVisible();
            await expect(storageView.getByText('Row table', {exact: true})).toBeVisible();
            await expect(storageView.getByText('System', {exact: true})).toBeVisible();
            await expect(
                getSummaryMetric(userDataSummary, 'Used').getByText('3.1 TB', {exact: true}),
            ).toBeVisible();
            await expect(
                getSummaryMetric(physicalSummary, 'Used').getByText('26.4 TB', {exact: true}),
            ).toBeVisible();
            await expect(
                physicalSummary
                    .locator(LEGEND_ITEM_SELECTOR)
                    .filter({hasText: 'System'})
                    .getByText('246 MB', {exact: true}),
            ).toBeVisible();
            await expect(
                physicalSummary
                    .locator(LEGEND_ITEM_SELECTOR)
                    .filter({hasText: 'Row tables'})
                    .getByText('71.3 GB', {exact: true}),
            ).toBeVisible();
            await expect(
                physicalSummary
                    .locator(LEGEND_ITEM_SELECTOR)
                    .filter({hasText: 'Column tables'})
                    .getByText('2.2 GB', {exact: true}),
            ).toBeVisible();
            await expect(
                physicalSummary
                    .locator(LEGEND_ITEM_SELECTOR)
                    .filter({hasText: 'Unknown'})
                    .getByText('26.3 TB', {exact: true}),
            ).toBeVisible();
            await expect(physicalSummary.getByText('0 TB', {exact: true})).toHaveCount(0);
            await expect(topUsageTable.getByText('User data, GB', {exact: true})).toHaveCount(0);
            await expect(topUsageTable.getByText('Physical disk, GB', {exact: true})).toHaveCount(
                0,
            );
            await expect(topUsageTable.getByText('User data', {exact: true}).first()).toBeVisible();
            await expect(
                topUsageTable.getByText('Physical disk', {exact: true}).first(),
            ).toBeVisible();
            await expect(topUsageTable.getByText('112 GB', {exact: true})).toBeVisible();
            await expect(topUsageTable.getByText('360 GB', {exact: true})).toBeVisible();
            await expect(topUsageTable.getByText('500 KB', {exact: true})).toBeVisible();
            await expect(topUsageTable.getByText('300 MB', {exact: true})).toBeVisible();
            await expect(topUsageTable.getByText('>500x', {exact: true})).toBeVisible();
            await expect(topUsageTable.locator(TOP_USAGE_PATH_COPY_SELECTOR).first()).toBeVisible();
            await expect(userDataSummary.getByText('used 15%', {exact: true})).toBeVisible();
            await expect(physicalSummary.getByText('used 13%', {exact: true})).toBeVisible();
            await expect(storageView.getByRole('link', {name: 'kv_test'})).toHaveAttribute(
                'href',
                /schema=%2Flocal%2Fkv_test/,
            );
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-single-media-${theme}.png`,
            );
            await expect(topUsageTable).toHaveScreenshot(
                `tenant-overview-storage-top-usage-${theme}.png`,
            );
            await expect(storageView).toHaveScreenshot(`tenant-overview-storage-full-${theme}.png`);
        });

        test(`renders grouped summary sections for multiple storage types in ${theme} theme`, async ({
            page,
        }) => {
            await setupStorageScreenshotViewport(page);
            await enableNewStorageView(page, theme);
            await setupWhoami(page);
            await setupCapabilities(page, 1);
            await setupTenantInfo(page, 'Dedicated', {
                databaseQuotas: {
                    data_size_soft_quota: '612032839680',
                    storage_quotas: [
                        {
                            unit_kind: 'ssd',
                            data_size_soft_quota: '306016419840',
                            data_size_hard_quota: '322122547200',
                        },
                        {
                            unit_kind: 'hdd',
                            data_size_soft_quota: '2089072092774',
                            data_size_hard_quota: '2199023255552',
                        },
                    ],
                },
                databaseStorage: [
                    {Type: 'HDD', Size: '1353743073280', Limit: '17999012094860'},
                    {Type: 'SSD', Size: '98419343360', Limit: '1873981472766'},
                ],
                tablesStorage: [
                    {
                        Type: 'HDD',
                        Size: '289166965049',
                        Limit: '612032839680',
                        SoftQuota: '612032839680',
                        HardQuota: '644245094400',
                    },
                    {
                        Type: 'SSD',
                        Size: '986',
                    },
                ],
            });
            await setupPartitionStatsQuery(page);
            await setupStorageStats(page, {withMultiMedia: true});
            await setupDescribe(page);

            const tenantPage = new TenantPage(page);
            await tenantPage.goto({
                schema: database,
                database,
                databasePage: 'database',
                diagnosticsTab: 'database',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const userDataSummary = getSummaryCard(storageView, 'User data');
            const physicalSummary = getSummaryCard(storageView, 'Physical disk usage');
            const ssdUserDataRow = getSummaryRow(userDataSummary, 'SSD');
            const hddUserDataRow = getSummaryRow(userDataSummary, 'HDD');
            const ssdPhysicalRow = getSummaryRow(physicalSummary, 'SSD');
            const hddPhysicalRow = getSummaryRow(physicalSummary, 'HDD');

            await expect(storageView.locator(MEDIA_SECTION_SELECTOR)).toHaveCount(1);
            await expect(userDataSummary).toHaveCount(1);
            await expect(physicalSummary).toHaveCount(1);
            await expect(ssdUserDataRow).toBeVisible();
            await expect(hddUserDataRow).toBeVisible();
            await expect(ssdPhysicalRow).toBeVisible();
            await expect(hddPhysicalRow).toBeVisible();
            await expect(
                getSummaryMetric(hddUserDataRow, 'Used').getByText('289.2 GB', {exact: true}),
            ).toBeVisible();
            await expect(
                getSummaryMetric(ssdUserDataRow, 'Quota').getByText('306 GB', {exact: true}),
            ).toBeVisible();
            await expect(hddUserDataRow.getByText('used 47%', {exact: true})).toBeVisible();
            await expect(userDataSummary.locator(LEGEND_ITEM_SELECTOR)).toHaveCount(0);
            await expect(
                getSummaryMetric(hddPhysicalRow, 'Overhead').getByText('4.7x', {exact: true}),
            ).toBeVisible();
            await expect(
                hddPhysicalRow.locator(LEGEND_ITEM_SELECTOR).filter({hasText: 'Row tables'}),
            ).toBeVisible();
            await expect(
                hddPhysicalRow.locator(LEGEND_ITEM_SELECTOR).filter({hasText: 'Unknown'}),
            ).toBeVisible();
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-multi-media-${theme}.png`,
            );

            const hddRowTablesSegment = hddPhysicalRow.locator(
                '.ydb-tenant-storage-segments__item[aria-label^="Row tables:"]',
            );

            await hddRowTablesSegment.hover();

            await expect(
                page.getByText('77.2% of total physical disk usage', {exact: true}),
            ).toBeVisible();
            await expect(hddPhysicalRow.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(1);
            await expect(hddPhysicalRow.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(1);
            await expect(ssdPhysicalRow.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);
            await expect(ssdPhysicalRow.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);

            await hddRowTablesSegment.click();
            await page.mouse.move(0, 0);

            await expect(hddPhysicalRow.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);
            await expect(ssdPhysicalRow.locator(SEGMENT_ITEM_INACTIVE_SELECTOR)).toHaveCount(0);
        });
    }

    test('shows quota missing helpmark for a single-media user data summary without quota', async ({
        page,
    }) => {
        await enableNewStorageView(page);
        await setupWhoami(page);
        await setupCapabilities(page, 1);
        await setupTenantInfo(page, 'Dedicated', {
            tablesStorage: [
                {
                    Type: 'SSD',
                    Size: '3100000000000',
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
            databasePage: 'database',
            diagnosticsTab: 'database',
        });

        await openStorageMetricsTab(page);

        const storageView = page.locator(STORAGE_VIEW_SELECTOR);
        const userDataSummary = getSummaryCard(storageView, 'User data');
        const quotaMetric = getSummaryMetric(userDataSummary, 'Quota');

        await expectQuotaMissingHelpMark(page, quotaMetric);
    });

    test('shows quota missing helpmark only for multi-media rows without quota', async ({page}) => {
        await enableNewStorageView(page);
        await setupWhoami(page);
        await setupCapabilities(page, 1);
        await setupTenantInfo(page, 'Dedicated', {
            databaseQuotas: {
                storage_quotas: [
                    {
                        unit_kind: 'ssd',
                        data_size_soft_quota: '306016419840',
                    },
                ],
            },
            databaseStorage: [
                {Type: 'HDD', Size: '1353743073280', Limit: '17999012094860'},
                {Type: 'SSD', Size: '98419343360', Limit: '1873981472766'},
            ],
            tablesStorage: [
                {
                    Type: 'HDD',
                    Size: '289166965049',
                },
                {
                    Type: 'SSD',
                    Size: '986',
                },
            ],
        });
        await setupPartitionStatsQuery(page);
        await setupStorageStats(page, {withMultiMedia: true});
        await setupDescribe(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'database',
        });

        await openStorageMetricsTab(page);

        const storageView = page.locator(STORAGE_VIEW_SELECTOR);
        const userDataSummary = getSummaryCard(storageView, 'User data');
        const hddUserDataRow = getSummaryRow(userDataSummary, 'HDD');
        const ssdUserDataRow = getSummaryRow(userDataSummary, 'SSD');
        const hddQuotaMetric = getSummaryMetric(hddUserDataRow, 'Quota');
        const ssdQuotaMetric = getSummaryMetric(ssdUserDataRow, 'Quota');

        await expectQuotaMissingHelpMark(page, hddQuotaMetric);
        await expect(ssdQuotaMetric.locator(HELP_MARK_SELECTOR)).toHaveCount(0);
        await expect(ssdQuotaMetric.getByText('306 GB', {exact: true})).toBeVisible();
    });

    test('keeps legacy dedicated storage layout when experiment is disabled', async ({page}) => {
        await setupWhoami(page);
        await setupCapabilities(page, 1);
        await setupTenantInfo(page, 'Dedicated');
        await setupPartitionStatsQuery(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'database',
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
            await setupStorageScreenshotViewport(page);
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
                databasePage: 'database',
                diagnosticsTab: 'database',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const physicalSummary = getSummaryCard(storageView, 'Physical disk usage');
            const columnSegment = physicalSummary.locator('[aria-label^="Column tables:"]').first();

            await columnSegment.hover();

            await expect(page.getByText(EXACT_COLUMN_TABLE_TOOLTIP_REGEXP)).toBeVisible();
            await expect(page.getByText('2.2 GB', {exact: true})).toBeVisible();
            await expect(
                page.getByText('0.01% of total physical disk usage', {exact: true}),
            ).toBeVisible();
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

        test(`shows tooltip on legend hover and clears state after click in ${theme} theme`, async ({
            page,
        }) => {
            await setupStorageScreenshotViewport(page);
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
                databasePage: 'database',
                diagnosticsTab: 'database',
            });

            await openStorageMetricsTab(page);

            const storageView = page.locator(STORAGE_VIEW_SELECTOR);
            const physicalSummary = getSummaryCard(storageView, 'Physical disk usage');
            const columnLegendItem = physicalSummary
                .locator(LEGEND_ITEM_SELECTOR)
                .filter({hasText: 'Column tables'});

            await columnLegendItem.hover();

            await expect(
                page.getByText('0.01% of total physical disk usage', {exact: true}),
            ).toBeVisible();
            await expect(physicalSummary.locator(LEGEND_ITEM_INACTIVE_SELECTOR)).toHaveCount(4);
            await expect(storageView.locator(STORAGE_SECTIONS_SELECTOR)).toHaveScreenshot(
                `tenant-overview-storage-legend-hover-${theme}.png`,
            );

            await columnLegendItem.click();
            await page.mouse.move(0, 0);

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
            databasePage: 'database',
            diagnosticsTab: 'database',
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
            databasePage: 'database',
            diagnosticsTab: 'database',
        });

        await openStorageMetricsTab(page);

        await expect(page.locator(STORAGE_VIEW_SELECTOR)).toHaveCount(0);
        await expect(page.getByText('Top tables by size', {exact: true})).toBeVisible();
    });
});
