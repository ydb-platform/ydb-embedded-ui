import {expect, test} from '@playwright/test';

import {STATISTICS_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {TenantPage} from '../TenantPage';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

test.describe('Test Plan to SVG functionality', async () => {
    const testQuery = 'SELECT 1;'; // Simple query that will generate a plan

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'query',
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

        // 4. Check if dropdown button appears and click it to open menu
        const controls = page.locator('.ydb-query-result__controls-right');
        const dropdownButton = controls.locator('.g-dropdown-menu__switcher-wrapper button');
        await expect(dropdownButton).toBeVisible();
        await dropdownButton.click();

        // 5. Verify dropdown menu items are visible
        const openInNewTabOption = page.getByRole('menuitem', {name: /Open Execution Plan/i});
        const downloadPlanOption = page.getByRole('menuitem', {name: /Download Execution Plan/i});
        await expect(openInNewTabOption).toBeVisible();
        await expect(downloadPlanOption).toBeVisible();

        // 6. Click "Open Execution Plan" option and verify a new tab opens with SVG content
        const popupPromise = page.waitForEvent('popup');
        await openInNewTabOption.click();
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');

        // 7. Verify the new tab contains SVG content
        const svgElement = popup.locator('svg').first();
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

        // 4. Click dropdown button to open menu
        const controls = page.locator('.ydb-query-result__controls-right');
        const dropdownButton = controls.locator('.g-dropdown-menu__switcher-wrapper button');
        await expect(dropdownButton).toBeVisible();
        await dropdownButton.click();

        // 5. Setup download listener before clicking download
        const downloadPromise = page.waitForEvent('download');

        // 6. Click download execution plan option
        const downloadPlanOption = page.getByRole('menuitem', {name: /Download Execution Plan/i});
        await expect(downloadPlanOption).toBeVisible();
        await downloadPlanOption.click();

        // 7. Wait for download to start and verify filename
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('query-plan.svg');
    });

    test('Plan to SVG handles API errors correctly', async ({page}) => {
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

        // 4. Mock the plan2svg API to return an error
        await page.route('**/plan2svg**', (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: 'Failed to generate SVG',
            });
        });

        // 5. Click dropdown button to open menu
        const controls = page.locator('.ydb-query-result__controls-right');
        const dropdownButton = controls.locator('.g-dropdown-menu__switcher-wrapper button');
        await expect(dropdownButton).toBeVisible();
        await dropdownButton.click();

        // 6. Click "Open Execution Plan" option and wait for error state
        const openExecutionPlanOption = page.getByRole('menuitem', {name: /Open Execution Plan/i});
        await expect(openExecutionPlanOption).toBeVisible();
        await openExecutionPlanOption.click();
        await page.waitForTimeout(1000); // Wait for error to be processed

        // 7. Close the dropdown
        await page.keyboard.press('Escape');

        // 8. Verify error toast appears
        const errorToast = page.locator('.g-toast.g-toast_theme_danger');
        await expect(errorToast).toBeVisible();

        // 9. Verify error message in toast
        const toastTitle = errorToast.locator('.g-toast__title');
        await expect(toastTitle).toContainText('Error');

        // 10. Verify dropdown is still enabled and functional
        await dropdownButton.click();
        await expect(openExecutionPlanOption).toBeVisible();
        await expect(page.getByRole('menuitem', {name: /Download Execution Plan/i})).toBeVisible();
    });

    test('Some statistics options becomes disabled when execution plan experiment is enabled', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);

        // Open settings dialog
        await queryEditor.clickGearButton();

        // All statistics options are enabled before experiment
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.none),
        ).resolves.toBe(false);
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.basic),
        ).resolves.toBe(false);
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.full),
        ).resolves.toBe(false);
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.profile),
        ).resolves.toBe(false);

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);

        // Turn on execution plan experiment
        await toggleExperiment(page, 'on', 'Execution plan');

        // Open settings dialog
        await queryEditor.clickGearButton();

        // Options not compatible with SVG are disabled
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.none),
        ).resolves.toBe(true);
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.basic),
        ).resolves.toBe(true);

        // Options compatible with SVG remain enabled
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.full),
        ).resolves.toBe(false);
        await expect(
            queryEditor.settingsDialog.isStatisticsOptionDisabled(STATISTICS_MODES.profile),
        ).resolves.toBe(false);
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
