import {expect, test} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

const METRIC_SUMMARY_SCREENSHOT_VIEWPORT = {width: 1600, height: 1000};

async function expectMetricTabsScreenshot(metricTabs: Locator, name: string) {
    await expect(metricTabs).toBeVisible();
    await expect(metricTabs).toHaveScreenshot(name);
}

async function setupMonitoringUserMock(page: Page) {
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

async function setupMetricTabsTenantInfoMock(
    page: Page,
    tenantType: 'Dedicated' | 'Serverless' = 'Dedicated',
    {
        memoryLimit = '1073741824',
        memoryUsed = '536870912',
    }: {
        memoryLimit?: string;
        memoryUsed?: string;
    } = {},
) {
    await page.route('**/viewer/json/tenantinfo?*', async (route) => {
        await route.fulfill({
            json: {
                TenantInfo: [
                    {
                        Name: database,
                        Type: tenantType,
                        Overall: 'Green',
                        CoresTotal: 100,
                        PoolStats: [
                            {Name: 'System', Usage: 0.05, Threads: 100},
                            {Name: 'User', Usage: 0.023, Threads: 100},
                            {Name: 'IO', Usage: 0.9, Threads: 100},
                        ],
                        MemoryUsed: memoryUsed,
                        MemoryLimit: memoryLimit,
                        DatabaseQuotas: {
                            data_size_soft_quota: '1000000000',
                        },
                        TablesStorage: [
                            {
                                Type: 'SSD',
                                Size: '900000000',
                            },
                        ],
                        NetworkUtilization: 0.96,
                        NetworkWriteThroughput: '1048576',
                    },
                ],
            },
        });
    });
}

async function setupTenantInfoWithoutMetricsMock(page: Page) {
    await page.route('**/viewer/json/tenantinfo?*', async (route) => {
        await route.fulfill({
            json: {
                TenantInfo: [
                    {
                        Name: database,
                        Type: 'Dedicated',
                        Overall: 'Green',
                    },
                ],
            },
        });
    });
}

async function openInfoTab(page: Page) {
    const pageQueryParams = {
        schema: database,
        database,
        databasePage: 'database',
        diagnosticsTab: 'database',
    };
    const tenantPage = new TenantPage(page);
    await tenantPage.goto(pageQueryParams);

    const diagnostics = new Diagnostics(page);
    return diagnostics;
}

test.describe('Diagnostics Info tab', async () => {
    test('Info tab shows main page elements', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'database',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await expect(diagnostics.areInfoCardsVisible()).resolves.toBe(true);
    });

    test('Info tab shows resource utilization', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'database',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        const utilization = await diagnostics.getResourceUtilization();

        expect(utilization.cpu.title).toBe('CPU');
        expect(utilization.cpu.percentage).toMatch(/\d+(\.\d+)?%/);
        expect(utilization.cpu.description).toBe('Load across all actor system pools');

        expect(utilization.storage.title).toBe('Storage');
        expect(utilization.storage.percentage).toMatch(/\d+(\.\d+)?%/);
        expect(utilization.storage.description).toBe('Total usage including user data');

        expect(utilization.memory.title).toBe('Memory');
        expect(utilization.memory.percentage).toMatch(/\d+(\.\d+)?%/);
        expect(utilization.memory.description).toBe('Total consumed by DB processes');
    });

    test('Info metric tabs match visual baseline', async ({page}) => {
        await setupMetricTabsTenantInfoMock(page);
        const diagnostics = await openInfoTab(page);
        await expect(diagnostics.areInfoCardsVisible({includeNetwork: true})).resolves.toBe(true);

        const metricTabs = diagnostics.getMetricTabs();
        await expectMetricTabsScreenshot(metricTabs, 'info-metric-tabs.png');
    });

    test('Info metric tabs match visual baseline without tenant metrics', async ({page}) => {
        await setupTenantInfoWithoutMetricsMock(page);
        const diagnostics = await openInfoTab(page);
        await expect(diagnostics.areInfoCardsVisible()).resolves.toBe(true);

        const metricTabs = diagnostics.getMetricTabs();
        await expectMetricTabsScreenshot(metricTabs, 'info-empty-tenant-metric-tabs.png');
    });

    test('Info serverless metric tabs match visual baseline', async ({page}) => {
        await setupMetricTabsTenantInfoMock(page, 'Serverless');
        const diagnostics = await openInfoTab(page);
        await expect(diagnostics.areServerlessInfoCardsVisible()).resolves.toBe(true);

        const metricTabs = diagnostics.getMetricTabs();
        await expectMetricTabsScreenshot(metricTabs, 'info-serverless-metric-tabs.png');
    });

    test('Info metric tabs keep the same width when active tab changes', async ({page}) => {
        await setupMetricTabsTenantInfoMock(page);
        const diagnostics = await openInfoTab(page);
        await expect(diagnostics.areInfoCardsVisible({includeNetwork: true})).resolves.toBe(true);

        const tabsWidthBefore = await diagnostics.getMetricTabsWidth();

        await diagnostics.getMetricTab('Storage').click();

        expect(await diagnostics.getMetricTabsWidth()).toEqual(tabsWidthBefore);
    });

    test('Info metric page summaries match snapshots', async ({page}) => {
        await page.setViewportSize(METRIC_SUMMARY_SCREENSHOT_VIEWPORT);
        await setupMetricTabsTenantInfoMock(page);
        const diagnostics = await openInfoTab(page);

        const cpuSummary = diagnostics.getMetricPageSummary('cpu');
        await expect(cpuSummary).toBeVisible();
        await expect(cpuSummary).toHaveScreenshot('tenant-info-metric-summary-cpu.png');

        await diagnostics.clickMetricTab('Memory');
        const memorySummary = diagnostics.getMetricPageSummary('memory');
        await expect(memorySummary).toBeVisible();
        await expect(memorySummary).toHaveScreenshot('tenant-info-metric-summary-memory.png');

        await diagnostics.clickMetricTab('Network');
        const networkSummary = diagnostics.getMetricPageSummary('network');
        await expect(networkSummary).toBeVisible();
        await expect(networkSummary).toHaveScreenshot('tenant-info-metric-summary-network.png');
    });

    test('Info memory metric summary renders adaptive units when values differ by threshold', async ({
        page,
    }) => {
        await page.setViewportSize(METRIC_SUMMARY_SCREENSHOT_VIEWPORT);
        await setupMonitoringUserMock(page);
        await setupMetricTabsTenantInfoMock(page, 'Dedicated', {
            memoryUsed: '1000000',
            memoryLimit: '36000000000000',
        });
        const diagnostics = await openInfoTab(page);

        await diagnostics.clickMetricTab('Memory');
        const memorySummary = diagnostics.getMetricPageSummary('memory');

        await expect(memorySummary).toBeVisible();
        await expect(memorySummary).toHaveScreenshot(
            'tenant-info-metric-summary-memory-mixed-units.png',
        );
    });

    test('Info tab shows healthcheck status when there are issues', async ({page}) => {
        // Mock healthcheck API to return DEGRADED status with issues
        await page.route(`**/viewer/json/healthcheck?*`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    self_check_result: 'DEGRADED',
                    issue_log: [
                        {
                            id: 'issue-1',
                            status: 'YELLOW',
                            message: 'Some degraded component',
                            location: {
                                database: {
                                    name: database,
                                },
                            },
                        },
                    ],
                }),
            });
        });

        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'diagnostics',
            diagnosticsTab: 'overview',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        await expect(page.getByRole('button', {name: 'Degraded: 1 issue'})).toBeVisible();
    });

    test('Info tab shows healthcheck GOOD status with zero issues', async ({page}) => {
        // Mock healthcheck API to return GOOD status with no issues
        await page.route(`**/viewer/json/healthcheck?*`, async (route) => {
            await route.fulfill({
                json: {
                    self_check_result: 'GOOD',
                    issue_log: [],
                },
            });
        });

        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'diagnostics',
            diagnosticsTab: 'overview',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        await expect(page.getByRole('button', {name: 'Good: 0 issues'})).toBeVisible();
    });

    test('Info tab shows healthcheck status when status is GOOD but has issues', async ({page}) => {
        // Mock healthcheck API to return GOOD status but with issues (edge case)
        await page.route(`**/viewer/json/healthcheck?*`, async (route) => {
            await route.fulfill({
                json: {
                    self_check_result: 'GOOD',
                    issue_log: [
                        {
                            id: 'issue-1',
                            status: 'GREEN',
                            message: 'Some informational issue',
                            location: {
                                database: {
                                    name: database,
                                },
                            },
                        },
                    ],
                },
            });
        });

        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'diagnostics',
            diagnosticsTab: 'overview',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        await expect(page.getByRole('button', {name: 'Good: 1 issue'})).toBeVisible();
    });

    test('Info tab displays overlap_clusters for vector index', async ({page}) => {
        const mockIndexPath = '/local/test_table/my_vector_index';

        // Mock describe API to return a vector index with overlap_clusters
        await page.route(`**/viewer/json/describe?*`, async (route) => {
            const url = new URL(route.request().url());
            const path = url.searchParams.get('path');

            if (path === mockIndexPath) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        Status: 'StatusSuccess',
                        Path: mockIndexPath,
                        PathDescription: {
                            Self: {
                                Name: 'my_vector_index',
                                PathType: 'EPathTypeTableIndex',
                            },
                            TableIndex: {
                                Name: 'my_vector_index',
                                Type: 'EIndexTypeGlobalVectorKmeansTree',
                                State: 'EIndexStateReady',
                                KeyColumnNames: ['embedding'],
                                VectorIndexKmeansTreeDescription: {
                                    Settings: {
                                        clusters: 128,
                                        levels: 2,
                                        overlap_clusters: 3,
                                        settings: {
                                            metric: 'cosine',
                                            vector_type: 'VECTOR_TYPE_FLOAT',
                                            vector_dimension: 512,
                                        },
                                    },
                                },
                            },
                        },
                    }),
                });
            } else {
                await route.continue();
            }
        });

        const pageQueryParams = {
            schema: mockIndexPath,
            database,
            databasePage: 'diagnostics',
            diagnosticsTab: 'overview',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        // Verify vector index settings are displayed including overlap_clusters
        const infoContent = page.locator('.ydb-diagnostics-table-info');
        await infoContent.waitFor({state: 'visible', timeout: 10000});

        // Check Index Settings section contains Overlap Clusters
        const indexSettings = infoContent.locator('.info-viewer');
        await expect(indexSettings.getByText('Overlap Clusters')).toBeVisible();
        await expect(indexSettings.getByText('3')).toBeVisible();

        // Also verify other vector index settings are displayed
        await expect(indexSettings.getByText('Clusters', {exact: true})).toBeVisible();
        await expect(indexSettings.getByText('Levels')).toBeVisible();
        await expect(indexSettings.getByText('Vector Dimension')).toBeVisible();

        // Visual snapshot of vector index info with all settings
        await expect(infoContent).toHaveScreenshot('vector-index-info-overlap-clusters.png');
    });

    test('Info tab displays fulltext index settings with use_filter_snowball', async ({page}) => {
        const mockIndexPath = '/local/test_table/my_fulltext_index';

        // Mock describe API to return a fulltext index with all settings
        await page.route(`**/viewer/json/describe?*`, async (route) => {
            const url = new URL(route.request().url());
            const path = url.searchParams.get('path');

            if (path === mockIndexPath) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        Status: 'StatusSuccess',
                        Path: mockIndexPath,
                        PathDescription: {
                            Self: {
                                Name: 'my_fulltext_index',
                                PathType: 'EPathTypeTableIndex',
                            },
                            TableIndex: {
                                Name: 'my_fulltext_index',
                                Type: 'EIndexTypeGlobalFulltext',
                                State: 'EIndexStateReady',
                                KeyColumnNames: ['text_column'],
                                FulltextIndexDescription: {
                                    Settings: {
                                        layout: 'FLAT_RELEVANCE',
                                        columns: [
                                            {
                                                column: 'text_column',
                                                analyzers: {
                                                    tokenizer: 'standard',
                                                    language: 'english',
                                                    use_filter_lowercase: true,
                                                    use_filter_stopwords: true,
                                                    use_filter_snowball: true,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    }),
                });
            } else {
                await route.continue();
            }
        });

        const pageQueryParams = {
            schema: mockIndexPath,
            database,
            databasePage: 'diagnostics',
            diagnosticsTab: 'overview',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        // Verify fulltext index settings are displayed
        const infoContent = page.locator('.ydb-diagnostics-table-info');
        await infoContent.waitFor({state: 'visible', timeout: 10000});

        // Check Index Settings section contains fulltext-specific fields
        const indexSettings = infoContent.locator('.info-viewer');
        await expect(indexSettings.getByText('Tokenizer')).toBeVisible();
        await expect(indexSettings.getByText('Language')).toBeVisible();
        await expect(indexSettings.getByText('Filter Snowball')).toBeVisible();
        await expect(indexSettings.getByText('Filter Lowercase')).toBeVisible();
        await expect(indexSettings.getByText('Filter Stopwords')).toBeVisible();

        // Visual snapshot of fulltext index info with all settings
        await expect(infoContent).toHaveScreenshot('fulltext-index-info-settings.png');
    });
});
