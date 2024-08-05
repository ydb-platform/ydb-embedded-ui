import {expect, test} from '@playwright/test';

import {tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';

import {
    ButtonNames,
    ExplainResultType,
    QueryEditor,
    QueryMode,
    VISIBILITY_TIMEOUT,
} from './QueryEditor';
import {longRunningQuery} from './constants';

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

        await expect(queryEditor.settingsDialog.isVisible()).resolves.toBe(true);

        await queryEditor.settingsDialog.clickButton(ButtonNames.Cancel);
        await expect(queryEditor.settingsDialog.isHidden()).resolves.toBe(true);
    });

    test('Settings dialog saves changes and updates Gear button', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeQueryMode(QueryMode.Scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await expect(async () => {
            const text = await queryEditor.gearButtonText();
            expect(text).toContain('(1)');
        }).toPass({timeout: VISIBILITY_TIMEOUT});
    });

    test('Run button executes YQL script', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, QueryMode.YQLScript);

        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Run button executes Scan', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, QueryMode.Scan);

        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Explain button executes YQL script explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, QueryMode.YQLScript);

        const explainSchema = await queryEditor.getExplainResult(ExplainResultType.Schema);
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainJSON = await queryEditor.getExplainResult(ExplainResultType.JSON);
        await expect(explainJSON).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Explain button executes Scan explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, QueryMode.Scan);

        const explainSchema = await queryEditor.getExplainResult(ExplainResultType.Schema);
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainJSON = await queryEditor.getExplainResult(ExplainResultType.JSON);
        await expect(explainJSON).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainAST = await queryEditor.getExplainResult(ExplainResultType.AST);
        await expect(explainAST).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Error is displayed for invalid query', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickRunButton();

        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Failed');

        const errorMessage = await queryEditor.getErrorMessage();
        await expect(errorMessage).toContain('Column references are not allowed without FROM');
    });

    test('Banner appears after executing script with changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Change a setting
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QueryMode.Scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Execute a script
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        // Check if banner appears
        await expect(queryEditor.isBannerVisible()).resolves.toBe(true);
    });

    test('Indicator icon appears after closing banner', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Change a setting
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QueryMode.Scan);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Execute a script to make the banner appear
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        // Close the banner
        await queryEditor.closeBanner();

        await expect(queryEditor.isIndicatorIconVisible()).resolves.toBe(true);
    });

    test('Gear button shows number of changed settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.clickGearButton();

        await queryEditor.settingsDialog.changeQueryMode(QueryMode.Scan);
        await queryEditor.settingsDialog.changeIsolationLevel('Snapshot');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await expect(async () => {
            const text = await queryEditor.gearButtonText();
            expect(text).toContain('(2)');
        }).toPass({timeout: VISIBILITY_TIMEOUT});
    });

    test('Run and Explain buttons are disabled when query is empty', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(false);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(false);

        await queryEditor.setQuery(testQuery);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(true);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(true);
    });

    test('Banner does not appear when executing script with default settings', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isBannerHidden()).resolves.toBe(true);
    });

    test('Stop button and elapsed time label appears when query is running', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isElapsedTimeVisible()).resolves.toBe(true);
    });

    test('Stop button and elapsed time label disappears after query is stopped', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.clickStopButton();

        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
        await expect(queryEditor.isElapsedTimeHidden()).resolves.toBe(true);
    });

    test('Query execution is terminated when stop button is clicked', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.clickStopButton();
        await page.waitForTimeout(1000); // Wait for the editor to initialize

        // Check for a message or indicator that the query was stopped
        const statusElement = await queryEditor.getExecutionStatus();
        await expect(statusElement).toBe('Stopped');
    });

    test('Stop button is not visible for quick queries', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const quickQuery = 'SELECT 1;';
        await queryEditor.setQuery(quickQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000); // Wait for the editor to initialize

        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });

    test('Stop button works for both Execute and Explain modes', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Test for Execute mode
        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);

        // Test for Explain mode
        await queryEditor.clickExplainButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });
});
