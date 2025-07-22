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

    test('Info tab shows healthcheck status', async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            tenantPage: 'diagnostics',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Info);

        const status = await diagnostics.getHealthcheckStatus();
        expect(status).toBeTruthy();

        const isGood = await diagnostics.hasHealthcheckStatusClass(
            'ydb-healthcheck-preview__icon_good',
        );
        expect(isGood).toBe(true);
    });
});
