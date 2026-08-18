import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {StatisticsMode} from '../../../../src/types/store/query';
import {STATISTICS_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {ButtonNames, QueryEditor} from './models/QueryEditor';

const testQuery = 'SELECT 1;';

async function setStatisticsMode(queryEditor: QueryEditor, statisticsMode: StatisticsMode) {
    await queryEditor.clickGearButton();
    await queryEditor.settingsDialog.changeStatsLevel(statisticsMode);
    await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
}

async function runQuery(queryEditor: QueryEditor) {
    await queryEditor.setQuery(testQuery);
    await queryEditor.clickRunButton();
    await expect(async () => {
        const status = await queryEditor.getExecutionStatus();
        expect(status).toBe('Completed');
    }).toPass();
}

async function openResultActions(page: Page) {
    const controls = page.locator('.ydb-query-result__controls-right');
    const dropdownButton = controls.locator('.g-dropdown-menu__switcher-wrapper button');
    await expect(dropdownButton).toBeVisible();
    await dropdownButton.click();
    return dropdownButton;
}

test.describe('Plan to SVG functionality', () => {
    test.beforeEach(async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: database,
            database,
            databasePage: 'query',
        });
    });

    test('keeps plan actions for a Full result after current settings change', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.full);
        await runQuery(queryEditor);

        await setStatisticsMode(queryEditor, STATISTICS_MODES.none);
        await openResultActions(page);

        const openInNewTabOption = page.getByRole('menuitem', {name: /Open Execution Plan/i});
        await expect(openInNewTabOption).toBeVisible();
        await expect(page.getByRole('menuitem', {name: /Download Execution Plan/i})).toBeVisible();

        const popupPromise = page.waitForEvent('popup');
        await openInNewTabOption.click();
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        await expect(popup.locator('svg').first()).toBeVisible();
    });

    test('downloads a Profile execution plan as SVG', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.profile);
        await runQuery(queryEditor);
        await openResultActions(page);

        const downloadPromise = page.waitForEvent('download');
        const downloadPlanOption = page.getByRole('menuitem', {
            name: /Download Execution Plan/i,
        });
        await expect(downloadPlanOption).toBeVisible();
        await downloadPlanOption.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('query-plan.svg');
    });

    test('handles plan conversion errors', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.full);
        await runQuery(queryEditor);

        await page.route('**/plan2svg**', (route) => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: 'Failed to generate SVG',
            });
        });

        const dropdownButton = await openResultActions(page);
        const openExecutionPlanOption = page.getByRole('menuitem', {
            name: /Open Execution Plan/i,
        });
        await expect(openExecutionPlanOption).toBeVisible();
        await openExecutionPlanOption.click();

        const errorToast = page.locator('.g-toast.g-toast_theme_danger');
        await expect(errorToast).toBeVisible();
        await expect(errorToast.locator('.g-toast__title')).toContainText('Error');

        await dropdownButton.click();
        await expect(openExecutionPlanOption).toBeVisible();
        await expect(page.getByRole('menuitem', {name: /Download Execution Plan/i})).toBeVisible();
    });

    test('does not show plan actions for a None statistics result', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await setStatisticsMode(queryEditor, STATISTICS_MODES.none);
        await runQuery(queryEditor);
        await openResultActions(page);

        await expect(page.getByRole('menuitem', {name: /Open Execution Plan/i})).toHaveCount(0);
        await expect(page.getByRole('menuitem', {name: /Download Execution Plan/i})).toHaveCount(0);
    });
});
