import {expect, test} from '@playwright/test';

import {QUERY_MODES, STATISTICS_MODES} from '../../../../src/utils/query';
import {getClipboardContent} from '../../../utils/clipboard';
import {tenantName} from '../../../utils/constants';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {NavigationTabs, TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {
    createTableQuery,
    longRunningQuery,
    longRunningStreamQuery,
    longTableSelect,
    longerRunningStreamQuery,
    simpleQuery,
} from '../constants';

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

    test('Error is displayed for invalid query for run', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);
        const errorMessage = await queryEditor.getErrorMessage();
        await expect(errorMessage).toContain('Column references are not allowed without FROM');
    });

    test('Error is displayed for invalid query for explain', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickExplainButton();

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

    test('Query streaming finishes in reasonable time', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });

    test('Query execution is terminated when stop button is clicked', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();

        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });

    test('Streaming query shows some results and banner when stop button is clicked', async ({
        page,
    }) => {
        // Safari in playwright has problem with painting an array
        // of million values for frequently appearing rows.
        // But still need them for heavy responses to simulate
        // long running queries. Setting their display to none resolves the issue.
        await page.addStyleTag({
            content: '.ydb-query-result-sets-viewer__result tr td:nth-child(3n) { display: none; }',
        });
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.setQuery(longerRunningStreamQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await page.waitForTimeout(1000);

        await queryEditor.clickStopButton();

        await expect(queryEditor.isStopBannerVisible()).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(
            Promise.resolve(Number(await queryEditor.resultTable.getResultTitleCount())),
        ).resolves.toBeGreaterThan(100);
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
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
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
        await queryEditor.setQuery(longTableSelect());
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(1);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Truncated');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
    });

    test('Truncated results for multiple tabs', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(`${longTableSelect(2)}${longTableSelect(2)}`);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(3);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.getResultTabsCount()).resolves.toBe(2);
        await expect(queryEditor.resultTable.getResultTabTitleText(1)).resolves.toBe(
            'Result #2(T)',
        );
        await expect(queryEditor.resultTable.getResultTabTitleCount(1)).resolves.toBe('1');
    });

    test('Query execution status changes correctly', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
    });

    test('Running selected query via keyboard shortcut executes only selected part', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        const multiQuery = 'SELECT 1;\nSELECT 2;';

        // First verify running the entire query produces two results
        await queryEditor.setQuery(multiQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        // Verify there are two result tabs
        await expect(queryEditor.resultTable.getResultTabsCount()).resolves.toBe(2);
        await expect(queryEditor.resultTable.getResultTabTitleText(0)).resolves.toBe('Result #1');
        await expect(queryEditor.resultTable.getResultTabTitleText(1)).resolves.toBe('Result #2');

        // Then verify running only selected part produces one result
        await queryEditor.focusEditor();
        await queryEditor.selectText(1, 1, 1, 9);

        // Use keyboard shortcut to run selected query
        await executeSelectedQueryWithKeybinding(page);

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
    });

    test('Running selected query via context menu executes only selected part', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const multiQuery = 'SELECT 1;\nSELECT 2;';

        // First verify running the entire query produces two results with tabs
        await queryEditor.setQuery(multiQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        // Verify there are two result tabs
        await expect(queryEditor.resultTable.getResultTabsCount()).resolves.toBe(2);
        await expect(queryEditor.resultTable.getResultTabTitleText(0)).resolves.toBe('Result #1');
        await expect(queryEditor.resultTable.getResultTabTitleText(1)).resolves.toBe('Result #2');

        // Then verify running only selected part produces one result without tabs
        await queryEditor.focusEditor();
        await queryEditor.selectText(1, 1, 1, 9);

        // Use context menu to run selected query
        await queryEditor.runSelectedQueryViaContextMenu();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
    });

    test('Results controls collapse and expand functionality', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        // Run a query to show results
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();
        await queryEditor.waitForStatus('Completed');

        // Verify controls are initially visible
        await expect(queryEditor.isResultsControlsVisible()).resolves.toBe(true);
        await expect(queryEditor.isResultsControlsCollapsed()).resolves.toBe(false);

        // Test collapse
        await queryEditor.collapseResultsControls();
        await expect(queryEditor.isResultsControlsCollapsed()).resolves.toBe(true);

        // Test expand
        await queryEditor.expandResultsControls();
        await expect(queryEditor.isResultsControlsCollapsed()).resolves.toBe(false);
    });

    test('Copy result button copies to clipboard', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const query = 'SELECT 42 as answer;';

        // Run query to get results
        await queryEditor.setQuery(query);
        await queryEditor.clickRunButton();
        await queryEditor.waitForStatus('Completed');

        // Click copy button
        await queryEditor.clickCopyResultButton();

        // Wait for clipboard operation to complete
        await page.waitForTimeout(2000);

        // Retry clipboard read a few times if needed
        let clipboardContent = '';
        for (let i = 0; i < 3; i++) {
            clipboardContent = await getClipboardContent(page);
            if (clipboardContent) {
                break;
            }
            await page.waitForTimeout(500);
        }

        // Verify clipboard contains the query result
        expect(clipboardContent).toContain('42');
    });

    test.describe('Statistics Modes Tests', async () => {
        test('Stats tab shows no stats message when STATISTICS_MODES.none', async ({page}) => {
            const queryEditor = new QueryEditor(page);

            // Set query and configure statistics mode to none
            await queryEditor.setQuery(simpleQuery);
            await queryEditor.clickGearButton();
            await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.none);
            await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

            // Execute query
            await queryEditor.clickRunButton();
            await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

            // Check Stats tab content
            const statsContent = await queryEditor.getStatsTabContent();
            expect(statsContent).toContain('There is no Stats for the request');
        });

        test('Stats tab shows JSON viewer when STATISTICS_MODES.basic', async ({page}) => {
            const queryEditor = new QueryEditor(page);

            // Set query and configure statistics mode to basic
            await queryEditor.setQuery(simpleQuery);
            await queryEditor.clickGearButton();
            await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.basic);
            await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

            // Execute query
            await queryEditor.clickRunButton();
            await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

            // Check that Stats tab contains JSON viewer
            const hasJsonViewer = await queryEditor.hasStatsJsonViewer();
            expect(hasJsonViewer).toBe(true);
        });
    });
});
