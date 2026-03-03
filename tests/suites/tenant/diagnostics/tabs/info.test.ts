import {expect, test} from '@playwright/test';

import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

test.describe('Diagnostics Info tab', async () => {
    test('Info tab shows main page elements', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);
        await expect(diagnostics.areInfoCardsVisible()).resolves.toBe(true);
    });

    test('Info tab shows resource utilization', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        const utilization = await diagnostics.getResourceUtilization();
        // Test the new aggregated metric structure
        expect(utilization.cpu.percentage).toMatch(/\d+(\.\d+)?%/);
        expect(utilization.cpu.usage).toBeTruthy();
        expect(utilization.storage.percentage).toMatch(/\d+(\.\d+)?%/);
        expect(utilization.storage.usage).toBeTruthy();
        expect(utilization.memory.percentage).toMatch(/\d+(\.\d+)?%/);
        expect(utilization.memory.usage).toBeTruthy();
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
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        // Healthcheck card should be visible when there are issues
        const status = await diagnostics.getHealthcheckStatus();
        expect(status).toBeTruthy();

        // Check for degraded status class
        const isDegraded = await diagnostics.hasHealthcheckStatusClass(
            'ydb-healthcheck-preview__icon_degraded',
        );
        expect(isDegraded).toBe(true);
    });

    test('Info tab hides healthcheck status when status is GOOD with no issues', async ({page}) => {
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
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        // Healthcheck card should not be visible when status is GOOD with no issues
        const healthcheckCard = page.locator('.ydb-healthcheck-preview');
        await expect(healthcheckCard).toHaveCount(0);
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
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        // Healthcheck card should be visible when there are issues, even if status is GOOD
        const status = await diagnostics.getHealthcheckStatus();
        expect(status).toBeTruthy();

        // Check for good status class
        const isGood = await diagnostics.hasHealthcheckStatusClass(
            'ydb-healthcheck-preview__icon_good',
        );
        expect(isGood).toBe(true);
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
            tenantPage: 'diagnostics',
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
        await expect(indexSettings.getByText('Clusters')).toBeVisible();
        await expect(indexSettings.getByText('Levels')).toBeVisible();
        await expect(indexSettings.getByText('Vector Dimension')).toBeVisible();

        // Visual snapshot of vector index info with all settings
        await expect(infoContent).toHaveScreenshot('vector-index-info-overlap-clusters.png');
    });
});
