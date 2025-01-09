import {expect, test} from '@playwright/test';

import {QUERY_MODES, STATISTICS_MODES} from '../../../../src/utils/query';
import {tenantName} from '../../../utils/constants';
import {NavigationTabs, TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {createTableQuery, longRunningQuery, longTableSelect} from '../constants';

import {
    ButtonNames,
    ExplainResultType,
    QueryEditor,
    QueryTabs,
    ResultTabNames,
} from './models/QueryEditor';
import {executeSelectedQueryWithKeybinding} from './utils';

test.describe('Test Query Editor', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            general: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Run button executes YQL script', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, QUERY_MODES.script);

        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Run button executes Scan', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, QUERY_MODES.scan);

        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Explain button executes YQL script explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, QUERY_MODES.script);

        const explainSchema = await queryEditor.getExplainResult(ExplainResultType.Schema);
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        const explainJSON = await queryEditor.getExplainResult(ExplainResultType.JSON);
        await expect(explainJSON).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Explain button executes Scan explanation', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explain(testQuery, QUERY_MODES.scan);

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

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);
        const errorMessage = await queryEditor.getErrorMessage();
        await expect(errorMessage).toContain('Column references are not allowed without FROM');
    });

    test('Run and Explain buttons are disabled when query is empty', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(false);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(false);

        await queryEditor.setQuery(testQuery);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(true);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(true);
    });

    test('Stop button and elapsed time label appear when query is running', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isElapsedTimeVisible()).resolves.toBe(true);
    });

    test('Stop button and elapsed time label disappear after query is stopped', async ({page}) => {
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

        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });

    test('Stop button is not visible for quick queries', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const quickQuery = 'SELECT 1;';
        await queryEditor.setQuery(quickQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000); // Wait for the editor to initialize

        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });

    test('Stop button works for Execute mode', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Test for Execute mode
        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });

    test('Stop button works for Explain mode', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Test for Execute mode
        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.data);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        // Test for Explain mode
        await queryEditor.clickExplainButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });

    test('Changing tab inside results pane doesnt change results view', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await queryEditor.paneWrapper.selectTab(ResultTabNames.Schema);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);
        await queryEditor.paneWrapper.selectTab(ResultTabNames.Result);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Changing tab inside editor doesnt change results view', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);
        await queryEditor.queryTabs.selectTab(QueryTabs.Editor);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Changing tab to diagnostics doesnt change results view', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const tenantPage = new TenantPage(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await tenantPage.selectNavigationTab(NavigationTabs.Diagnostics);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);
        await tenantPage.selectNavigationTab(NavigationTabs.Query);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Result head value is 1 for 1 row result', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.getResultHeadText()).resolves.toBe('Result(1)');
    });

    test('No result head value for no result', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(createTableQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000);
        await expect(queryEditor.resultTable.isResultHeaderHidden()).resolves.toBe(true);
    });

    test('Truncated head value is 1 for 1 row truncated result', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(longTableSelect);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(1);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.getResultHeadText()).resolves.toBe('Truncated(1)');
    });

    test('Query execution status changes correctly', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });

    test('Running selected query executes only selected part', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const multiQuery = 'SELECT 1;\nSELECT 2;';

        // First verify running the entire query produces two results
        await queryEditor.setQuery(multiQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        // Verify there are two result tabs
        await expect(queryEditor.resultTable.getResultTabsCount()).resolves.toBe(2);
        await expect(queryEditor.resultTable.getResultTabTitle(0)).resolves.toBe('Result #1');
        await expect(queryEditor.resultTable.getResultTabTitle(1)).resolves.toBe('Result #2');

        // Then verify running only selected part produces one result
        await queryEditor.focusEditor();
        await queryEditor.selectText(1, 1, 1, 9);

        // Use keyboard shortcut to run selected query
        await executeSelectedQueryWithKeybinding(page);

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.hasMultipleResultTabs()).resolves.toBe(false);
        await expect(queryEditor.resultTable.getResultHeadText()).resolves.toBe('Result(1)');
    });
});
