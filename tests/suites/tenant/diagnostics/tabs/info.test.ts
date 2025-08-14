import {expect, test} from '@playwright/test';

import {tenantName} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics, DiagnosticsTab} from '../Diagnostics';

test.describe('Diagnostics Info tab', async () => {
    test('Info tab shows main page elements', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
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
            schema: tenantName,
            database: tenantName,
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
                                    name: tenantName,
                                },
                            },
                        },
                    ],
                }),
            });
        });

        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
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
            schema: tenantName,
            database: tenantName,
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
                                    name: tenantName,
                                },
                            },
                        },
                    ],
                },
            });
        });

        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
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
});
