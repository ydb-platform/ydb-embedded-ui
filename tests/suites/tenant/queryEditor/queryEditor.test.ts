import {expect, test} from '@playwright/test';

import {tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {QueryEditor} from './QueryEditor';

test.describe('Test Query Editor', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            name: tenantName,
            general: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Settings dialog opens on Gear click and closes on Cancel', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await expect(queryEditor.settingsDialogIsVisible()).toBeTruthy();

        await queryEditor.clickCancelInSettingsDialog();
        await expect(queryEditor.settingsDialogIsNotVisible()).toBeTruthy();
    });

    test('Settings dialog saves changes and updates Gear button', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.changeQueryMode('Scan');
        await queryEditor.clickSaveInSettingsDialog();

        await expect(queryEditor.gearButtonContainsText('(1)')).toBeTruthy();
    });

    test('Run button executes YQL script', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, 'YQL Script');

        await expect(queryEditor.getRunResultTable()).toBeVisible();
    });

    test('Run button executes Scan', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, 'Scan');

        await expect(queryEditor.getRunResultTable()).toBeVisible();
    });

    test('Explain button executes YQL script explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, 'YQL Script');

        const explainSchema = await queryEditor.getExplainResult('Schema');
        await expect(explainSchema).toBeVisible();

        const explainJSON = await queryEditor.getExplainResult('JSON');
        await expect(explainJSON).toBeVisible();
    });

    test('Explain button executes Scan explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, 'Scan');

        const explainSchema = await queryEditor.getExplainResult('Schema');
        await expect(explainSchema).toBeVisible();

        const explainJSON = await queryEditor.getExplainResult('JSON');
        await expect(explainJSON).toBeVisible();

        const explainAST = await queryEditor.getExplainResult('AST');
        await expect(explainAST).toBeVisible();
    });

    test('Banner appears after executing script with changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Change a setting
        await queryEditor.clickGearButton();
        await queryEditor.changeQueryMode('Scan');
        await queryEditor.clickSaveInSettingsDialog();

        // Execute a script
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        // Check if banner appears
        await expect(queryEditor.isBannerVisible()).toBeTruthy();
    });

    test('Indicator icon appears after closing banner', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Change a setting
        await queryEditor.clickGearButton();
        await queryEditor.changeQueryMode('Scan');
        await queryEditor.clickSaveInSettingsDialog();

        // Execute a script to make the banner appear
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        // Close the banner
        await queryEditor.closeBanner();

        // Check tooltip on hover
        await queryEditor.hoverGearButton();
        await expect(queryEditor.isIndicatorIconVisible()).toBeTruthy();
    });

    test('Gear button shows number of changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.changeQueryMode('Scan');
        await queryEditor.changeIsolationLevel('Serializable');
        await queryEditor.clickSaveInSettingsDialog();

        await expect(queryEditor.gearButtonContainsText('(2)')).toBeTruthy();
    });

    test('Run and Explain buttons are disabled when query is empty', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await expect(queryEditor.isRunButtonDisabled()).toBeTruthy();
        await expect(queryEditor.isExplainButtonDisabled()).toBeTruthy();

        await queryEditor.setQuery(testQuery);

        await expect(queryEditor.isRunButtonEnabled()).toBeTruthy();
        await expect(queryEditor.isExplainButtonEnabled()).toBeTruthy();
    });

    test('Banner does not appear when executing script with default settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isBannerHidden()).toBeTruthy();
    });
});
