import {expect, test} from '@playwright/test';

import {tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {QueryEditor, VISIBILITY_TIMEOUT} from './QueryEditor';

test.describe('Test Query Editor', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';

    test.beforeEach(async ({context, page}) => {
        // Clear all browser storage
        await context.clearCookies();
        await context.clearPermissions();

        // Clear localStorage and sessionStorage
        await context.addInitScript(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });

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

        await expect(queryEditor.settingsDialog).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        await queryEditor.clickCancelInSettingsDialog();
        await expect(queryEditor.settingsDialog).toBeHidden({timeout: VISIBILITY_TIMEOUT});
    });

    test('Settings dialog saves changes and updates Gear button', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.changeQueryMode('Scan');
        await queryEditor.clickSaveInSettingsDialog();

        await expect(async () => {
            const text = await queryEditor.gearButtonText();
            expect(text).toContain('(1)');
        }).toPass({timeout: VISIBILITY_TIMEOUT});
    });

    test('Run button executes YQL script', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, 'YQL Script');

        await expect(queryEditor.getRunResultTable()).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Run button executes Scan', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, 'Scan');

        await expect(queryEditor.getRunResultTable()).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Explain button executes YQL script explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, 'YQL Script');

        const explainSchema = await queryEditor.getExplainResult('Schema');
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainJSON = await queryEditor.getExplainResult('JSON');
        await expect(explainJSON).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Explain button executes Scan explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, 'Scan');

        const explainSchema = await queryEditor.getExplainResult('Schema');
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainJSON = await queryEditor.getExplainResult('JSON');
        await expect(explainJSON).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainAST = await queryEditor.getExplainResult('AST');
        await expect(explainAST).toBeVisible({timeout: VISIBILITY_TIMEOUT});
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
        await expect(queryEditor.banner).toBeVisible({timeout: VISIBILITY_TIMEOUT});
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

        await expect(queryEditor.indicatorIcon).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Gear button shows number of changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.changeQueryMode('Scan');
        await queryEditor.changeIsolationLevel('Snapshot');
        await queryEditor.clickSaveInSettingsDialog();

        await expect(async () => {
            const text = await queryEditor.gearButtonText();
            expect(text).toContain('(2)');
        }).toPass({timeout: 10000});
    });

    test('Run and Explain buttons are disabled when query is empty', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await expect(queryEditor.runButton).toBeDisabled({timeout: VISIBILITY_TIMEOUT});
        await expect(queryEditor.explainButton).toBeDisabled({timeout: VISIBILITY_TIMEOUT});

        await queryEditor.setQuery(testQuery);

        await expect(queryEditor.runButton).toBeEnabled({timeout: VISIBILITY_TIMEOUT});
        await expect(queryEditor.explainButton).toBeEnabled({timeout: VISIBILITY_TIMEOUT});
    });

    test('Banner does not appear when executing script with default settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.banner).toBeHidden({timeout: VISIBILITY_TIMEOUT});
    });
});
