import {expect, test} from '@playwright/test';

import {STATISTICS_MODES} from '../../../../src/utils/query';
import {tenantName} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

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

    test('Plan to SVG dropdown shows options and opens plan in new tab', async ({page}) => {
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

        // 4. Check if Execution Plan button appears and click it to open dropdown
        const executionPlanButton = page.locator('button:has-text("Execution plan")');
        await expect(executionPlanButton).toBeVisible();
        await executionPlanButton.click();

        // 5. Verify dropdown menu items are visible
        const openInNewTabOption = page.locator('text="Open in new tab"');
        const downloadOption = page.locator('text="Download"');
        await expect(openInNewTabOption).toBeVisible();
        await expect(downloadOption).toBeVisible();

        // 6. Click "Open in new tab" option
        await openInNewTabOption.click();
        await page.waitForTimeout(1000); // Wait for new tab to open

        // 7. Verify we're taken to a new tab with SVG content
        const svgElement = page.locator('svg').first();
        await expect(svgElement).toBeVisible();
    });

    test('Plan to SVG download option triggers file download', async ({page}) => {
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

        // 4. Click execution plan button to open dropdown
        const executionPlanButton = page.locator('button:has-text("Execution plan")');
        await executionPlanButton.click();

        // 5. Setup download listener before clicking download
        const downloadPromise = page.waitForEvent('download');

        // 6. Click download option
        const downloadOption = page.locator('text="Download"');
        await downloadOption.click();

        // 7. Wait for download to start and verify filename
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('query-plan.svg');
    });

    test('Statistics setting becomes disabled when execution plan experiment is enabled', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);

        // Open settings dialog
        await queryEditor.clickGearButton();

        // Statistics is enabled
        await expect(queryEditor.settingsDialog.isStatisticsSelectDisabled()).resolves.toBe(false);

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);

        // Turn on execution plan experiment
        await toggleExperiment(page, 'on', 'Execution plan');

        // Open settings dialog
        await queryEditor.clickGearButton();

        // Verify statistics mode is disabled
        await expect(queryEditor.settingsDialog.isStatisticsSelectDisabled()).resolves.toBe(true);
    });

    test('Statistics mode changes when toggling execution plan experiment', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Set initial state
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.none);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Turn on execution plan experiment
        await toggleExperiment(page, 'on', 'Execution plan');

        // Verify statistics changed to Full
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.getStatsLevel()).resolves.toBe('Full');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);

        // Turn off execution plan experiment
        await toggleExperiment(page, 'off', 'Execution plan');

        // Verify statistics returned to None
        await queryEditor.clickGearButton();
        await expect(queryEditor.settingsDialog.getStatsLevel()).resolves.toBe('None');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
    });

    test('Statistics setting shows tooltip when disabled by execution plan experiment', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);

        await toggleExperiment(page, 'on', 'Execution plan');
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.hoverStatisticsSelect();
        await expect(queryEditor.settingsDialog.isStatsTooltipVisible()).resolves.toBe(true);
    });
});
