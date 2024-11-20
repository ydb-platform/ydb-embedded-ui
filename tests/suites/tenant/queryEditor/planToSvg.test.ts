import {expect, test} from '@playwright/test';

import {tenantName} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';

import {QueryEditor} from './models/QueryEditor';

test.describe('Test Plan to SVG functionality', async () => {
    const testQuery = 'SELECT 1;'; // Simple query that will generate a plan

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            general: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Plan to SVG experiment shows execution plan in new tab', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // 1. Turn on Plan to SVG experiment
        await toggleExperiment(page, 'on', 'Execution plan');

        // 2. Set query and run it
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        // 3. Wait for query execution to complete
        await expect(async () => {
            const status = await queryEditor.getExecutionStatus();
            expect(status).toBe('Completed');
        }).toPass();

        // 4. Check if Execution Plan button appears and click it
        const executionPlanButton = page.locator('button:has-text("Execution plan")');
        await expect(executionPlanButton).toBeVisible();
        await executionPlanButton.click();
        await page.waitForTimeout(1000); // Wait for new tab to open

        // 5. Verify we're taken to a new tab with SVG content
        const svgElement = page.locator('svg').first();
        await expect(svgElement).toBeVisible();
    });
});
