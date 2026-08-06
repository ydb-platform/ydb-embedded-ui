import {expect, test} from '@playwright/test';
import type {Locator, Page, Request} from '@playwright/test';

import {QUERY_MODES, STATISTICS_MODES} from '../../../../src/utils/query';
import {getClipboardContent} from '../../../utils/clipboard';
import {backend, database} from '../../../utils/constants';
import {
    cleanupMockStreamingFetch,
    setupMockStreamingFetch,
    setupMockStreamingHttpError,
} from '../../../utils/mockStreamingFetch';
import {
    executeQueryWithKeybinding,
    executeSelectedQueryWithKeybinding,
} from '../../../utils/queryHotkeys';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {NavigationTabs, TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {
    createTableQuery,
    longRunningQuery,
    longRunningStreamQuery,
    longTableSelect,
    simpleQuery,
} from '../constants';

import {
    ButtonNames,
    ExplainResultType,
    QueryEditor,
    QueryTabs,
    ResultTabNames,
} from './models/QueryEditor';

async function setupPendingNonStreamingQueryMock(page: Page) {
    let markStarted!: VoidFunction;
    const started = new Promise<void>((resolve) => {
        markStarted = resolve;
    });
    let finishQuery!: VoidFunction;
    const queryFinished = new Promise<void>((resolve) => {
        finishQuery = resolve;
    });
    const queryRoute = `${backend}/viewer/json/query?*`;

    await page.route(queryRoute, async (route) => {
        const body = route.request().postDataJSON() as {action?: string};

        if (body.action === 'cancel-query') {
            await route.fulfill({json: {version: 8, result: []}});
            finishQuery();
            return;
        }

        markStarted();
        await queryFinished;
        await route
            .fulfill({
                json: {
                    error: {severity: 1, message: 'Query was cancelled'},
                    issues: [],
                },
            })
            .catch(() => undefined);
    });

    return {
        async waitUntilStarted() {
            await started;
        },
        async cleanup() {
            finishQuery();
            await page.unroute(queryRoute);
        },
    };
}

type ViewerQueryRequestBody = {
    action?: string;
    query?: string;
    query_id?: string;
    stats?: string;
};

function getViewerQueryRequestBody(request: Request): ViewerQueryRequestBody | undefined {
    if (!request.url().includes('/viewer/json/query') || request.method() !== 'POST') {
        return undefined;
    }

    try {
        return request.postDataJSON() as ViewerQueryRequestBody;
    } catch {
        return undefined;
    }
}

function isExplainAnalyzeRequest(request: Request) {
    const body = getViewerQueryRequestBody(request);
    return body?.action === 'execute-query' && body.stats === 'full';
}

function getLocatorWidth(locator: Locator) {
    return locator.evaluate((element) => element.getBoundingClientRect().width);
}

async function expectLocatorWidth(locator: Locator, expectedWidth: number) {
    await expect.poll(() => getLocatorWidth(locator)).toBe(expectedWidth);
}

test.describe('Test Query Editor', async () => {
    const testQuery = 'SELECT 1, 2, 3, 4, 5;';
    const queryActionScreenshotThemes = ['light', 'dark'] as const;

    test.beforeEach(async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.gotoQueryEditor({
            schema: database,
            database,
        });
    });

    test.afterEach(async ({page}) => {
        await cleanupMockStreamingFetch(page);
    });

    test('Run button executes YQL script', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.run(testQuery, QUERY_MODES.script);

        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await expect(queryEditor.isQueryActionButtonHighlighted(ButtonNames.Run)).resolves.toBe(
            true,
        );
        await expect(queryEditor.isQueryActionButtonHighlighted(ButtonNames.Explain)).resolves.toBe(
            false,
        );
        await expect(
            queryEditor.isQueryActionButtonHighlighted(ButtonNames.ExplainAnalyze),
        ).resolves.toBe(false);
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
        await expect(queryEditor.isQueryActionButtonHighlighted(ButtonNames.Run)).resolves.toBe(
            false,
        );
        await expect(queryEditor.isQueryActionButtonHighlighted(ButtonNames.Explain)).resolves.toBe(
            true,
        );
        await expect(
            queryEditor.isQueryActionButtonHighlighted(ButtonNames.ExplainAnalyze),
        ).resolves.toBe(false);
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

    test('Explain Analyze runs full-stats explanation and shows plan tabs without result tab', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.explainAnalyze(testQuery, QUERY_MODES.query);

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(
            queryEditor.paneWrapper.isTabSelected(ResultTabNames.ExplainPlan),
        ).resolves.toBe(true);
        await expect(queryEditor.isResultTabVisible(ResultTabNames.Schema)).resolves.toBe(true);
        await expect(queryEditor.isResultTabVisible(ResultTabNames.ExplainPlan)).resolves.toBe(
            true,
        );
        await expect(queryEditor.isResultTabVisible(ResultTabNames.Stats)).resolves.toBe(true);
        await expect(queryEditor.isResultTabVisible(ResultTabNames.Result, 1000)).resolves.toBe(
            false,
        );

        await queryEditor.paneWrapper.selectTab(ResultTabNames.Stats);
        await expect(queryEditor.paneWrapper.isTabSelected(ResultTabNames.Stats)).resolves.toBe(
            true,
        );

        const repeatedExplainAnalyzeRequest = page.waitForRequest(isExplainAnalyzeRequest);
        await queryEditor.clickExplainAnalyzeButton();
        await repeatedExplainAnalyzeRequest;
        await expect(
            queryEditor.paneWrapper.isTabSelected(ResultTabNames.ExplainPlan),
        ).resolves.toBe(true);

        const explainSchema = await queryEditor.getExplainResult(ExplainResultType.Schema);
        await expect(explainSchema).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await expect(queryEditor.hasStatsJsonViewer()).resolves.toBe(true);
        await expect(queryEditor.isQueryActionButtonHighlighted(ButtonNames.Run)).resolves.toBe(
            false,
        );
        await expect(queryEditor.isQueryActionButtonHighlighted(ButtonNames.Explain)).resolves.toBe(
            false,
        );
        await expect(
            queryEditor.isQueryActionButtonHighlighted(ButtonNames.ExplainAnalyze),
        ).resolves.toBe(true);
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

    test('Error on non-Result tab shows Query Failed message for failed run', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);

        // Switch to Explain tab — execute errors should show simple "Query Failed" with redirect
        await queryEditor.paneWrapper.selectTab(ResultTabNames.ExplainPlan);

        const resultArea = queryEditor.getResultAreaLocator();
        await expect(resultArea).toHaveScreenshot('query-error-on-explain-tab.png');
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

    test('Error is displayed for invalid query for explain analyze', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        const invalidQuery = 'Select d';
        await queryEditor.setQuery(invalidQuery);
        await queryEditor.clickExplainAnalyzeButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);
        const errorMessage = await queryEditor.getErrorMessage();
        await expect(errorMessage).toContain('Column references are not allowed without FROM');
    });

    test('Run, Explain, and Explain Analyze buttons are disabled when query is empty', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(false);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(false);
        await expect(queryEditor.isExplainAnalyzeButtonEnabled()).resolves.toBe(false);

        await queryEditor.setQuery(testQuery);

        await expect(queryEditor.isRunButtonEnabled()).resolves.toBe(true);
        await expect(queryEditor.isExplainButtonEnabled()).resolves.toBe(true);
        await expect(queryEditor.isExplainAnalyzeButtonEnabled()).resolves.toBe(true);
    });

    test('Explain Analyze warns that the query is executed and its results are ignored', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery(testQuery);

        await queryEditor.getQueryActionButton(ButtonNames.ExplainAnalyze).hover();

        await expect(page.getByText('The query will be executed')).toBeVisible();
        await expect(
            page.getByText(
                'Any changes will be applied to the database. Query results are ignored.',
            ),
        ).toBeVisible();
    });

    for (const theme of queryActionScreenshotThemes) {
        test(`renders three query actions in ${theme} theme`, async ({page}) => {
            await page.evaluate((themeName) => {
                localStorage.setItem('theme', themeName);
            }, theme);
            await page.reload({waitUntil: 'domcontentloaded'});

            const queryEditor = new QueryEditor(page);
            await queryEditor.setQuery(testQuery);

            await expect(queryEditor.getQueryActionsLocator()).toBeVisible();
            await expect(queryEditor.getQueryActionButton(ButtonNames.Run)).toBeVisible();
            await expect(queryEditor.getQueryActionButton(ButtonNames.Explain)).toBeVisible();
            await expect(
                queryEditor.getQueryActionButton(ButtonNames.ExplainAnalyze),
            ).toBeVisible();
            await expect(queryEditor.getExplainAnalyzeButtonText()).resolves.toBe(
                ButtonNames.ExplainAnalyze,
            );
            await expect(queryEditor.hasExplainActionDropdown()).resolves.toBe(false);
            await expect(queryEditor.getQueryActionsGap()).resolves.toBe('12px');

            const queryActionsBoundingBox = await queryEditor
                .getQueryActionsLocator()
                .boundingBox();
            if (!queryActionsBoundingBox) {
                throw new Error('Query actions bounding box is unavailable');
            }

            // Locator screenshots round fractional bounds outwards and can gain an empty top row.
            await expect(page).toHaveScreenshot(`query-actions-${theme}.png`, {
                clip: {
                    x: Math.ceil(queryActionsBoundingBox.x),
                    y: Math.ceil(queryActionsBoundingBox.y),
                    width: Math.ceil(queryActionsBoundingBox.width),
                    height: Math.round(queryActionsBoundingBox.height),
                },
            });
        });
    }

    test('Stop button has distinct view when query is running', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page);

        await queryEditor.setQuery(simpleQuery);
        const runButton = queryEditor.getQueryActionButton(ButtonNames.Run);
        await expectLocatorWidth(runButton, 76);
        const runButtonWidth = await getLocatorWidth(runButton);
        const queryActionsWidth = await getLocatorWidth(queryEditor.getQueryActionsLocator());
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        const stopButton = queryEditor
            .getQueryActionsLocator()
            .getByRole('button', {name: ButtonNames.Stop});
        await expectLocatorWidth(stopButton, runButtonWidth);
        await expectLocatorWidth(queryEditor.getQueryActionsLocator(), queryActionsWidth);
        await expect(queryEditor.isStopButtonActionView()).resolves.toBe(false);
        await expect(queryEditor.isElapsedTimeVisible()).resolves.toBe(true);
    });

    test('Query streaming finishes with data', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        // Streaming query may exceed default row limit, so title can be "Result" or "Truncated"
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toMatch(
            /^(Result|Truncated)$/,
        );
        const resultCount = Number(await queryEditor.resultTable.getResultTitleCount());
        expect(resultCount).toBeGreaterThan(0);
        const resultView = queryEditor.resultTable.getResultWrapperLocator();
        await expect(resultView).toHaveScreenshot('streaming-query-completed.png');
    });

    test('Streaming non-JSON HTTP error shows actual error body, not empty object', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        const htmlBody = '<html><body><h1>502 Bad Gateway</h1><p>nginx</p></body></html>';
        await setupMockStreamingHttpError(page, {
            status: 502,
            statusText: 'Bad Gateway',
            body: htmlBody,
        });

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);

        // The error alert should show "502 Bad Gateway" title
        const errorAlert = queryEditor.getResultAreaLocator().locator('.g-alert');
        await expect(errorAlert).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await expect(errorAlert).toContainText('502 Bad Gateway');

        // Click the "Response" expand button to reveal the body section
        const responseButton = errorAlert.getByRole('button', {name: 'Response'});
        await expect(responseButton).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await responseButton.click();

        // The response body section should show the actual HTML content, not "{}"
        const responseBody = errorAlert.locator('.ydb-response-body-section__code');
        await expect(responseBody).toBeVisible({timeout: VISIBILITY_TIMEOUT});
        await expect(responseBody).toContainText('502 Bad Gateway');
        await expect(responseBody).not.toContainText('{}');

        // Screenshot for visual verification
        await expect(queryEditor.getResultAreaLocator()).toHaveScreenshot(
            'streaming-non-json-error.png',
        );
    });

    test('Query execution is terminated when stop button is clicked', async ({page}) => {
        const queryEditor = new QueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();

        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });

    test('Stopped non-streaming selection does not create a History entry', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'off', 'Query Streaming');
        const pendingQuery = await setupPendingNonStreamingQueryMock(page);
        const query = 'SELECT 1;\nSELECT 2;';

        try {
            await queryEditor.setQuery(query);
            await queryEditor.selectText(1, 1, 1, 'SELECT 1;'.length + 1);
            await executeSelectedQueryWithKeybinding(page);
            await pendingQuery.waitUntilStarted();
            await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
            await queryEditor.clickStopButton();
            await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);

            await queryEditor.queryTabs.selectTab(QueryTabs.History);
            await queryEditor.historyQueries.isVisible();
            await expect(queryEditor.historyQueries.getQueryCount()).resolves.toBe(0);
        } finally {
            await pendingQuery.cleanup();
        }
    });

    test('Streaming query shows some results and banner when stop button is clicked', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');

        // Mock fetch to create a controlled streaming response.
        // Real streaming overwhelms Safari's main thread, making
        // the Stop button unresponsive (the root cause of the flake).
        await setupMockStreamingFetch(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        // Wait for streaming data to arrive (status changes to Fetching when chunks are received)
        await queryEditor.waitForStatus('Fetching');

        await queryEditor.clickStopButton();

        await expect(queryEditor.isStopBannerVisible()).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        const stoppedResultCount = Number(await queryEditor.resultTable.getResultTitleCount());
        expect(stoppedResultCount).toBeGreaterThan(0);
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
        const pendingQuery = await setupPendingNonStreamingQueryMock(page);

        try {
            await queryEditor.setQuery(longRunningQuery);
            await queryEditor.clickGearButton();
            await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.data);
            await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

            await queryEditor.clickExplainButton();
            await pendingQuery.waitUntilStarted();

            await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
            await queryEditor.clickStopButton();
            await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
        } finally {
            await pendingQuery.cleanup();
        }
    });

    test('Stop cancels Explain Analyze on the server when streaming is enabled', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await queryEditor.setQuery(longRunningQuery);
        const explainAnalyzeButton = queryEditor.getQueryActionButton(ButtonNames.ExplainAnalyze);
        await expectLocatorWidth(explainAnalyzeButton, 111);
        const explainAnalyzeButtonWidth = await getLocatorWidth(explainAnalyzeButton);
        const queryActionsWidth = await getLocatorWidth(queryEditor.getQueryActionsLocator());

        const explainAnalyzeRequest = page.waitForRequest(isExplainAnalyzeRequest);
        const cancelRequest = page.waitForRequest(
            (request) => getViewerQueryRequestBody(request)?.action === 'cancel-query',
            {timeout: VISIBILITY_TIMEOUT},
        );

        await queryEditor.clickExplainAnalyzeButton();
        await explainAnalyzeRequest;
        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        const stopButton = queryEditor
            .getQueryActionsLocator()
            .getByRole('button', {name: ButtonNames.Stop});
        await expect(stopButton).toHaveClass(
            /ydb-query-editor-button__stop-button_explain-analyze/,
        );
        await expectLocatorWidth(stopButton, explainAnalyzeButtonWidth);
        await expectLocatorWidth(queryEditor.getQueryActionsLocator(), queryActionsWidth);
        await queryEditor.clickStopButton();

        const cancelRequestBody = getViewerQueryRequestBody(await cancelRequest);
        expect(cancelRequestBody?.query_id).toBeTruthy();
    });

    test('repeated Explain Analyze hotkey aborts the previous request', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const pendingQuery = await setupPendingNonStreamingQueryMock(page);

        try {
            await queryEditor.setQuery(simpleQuery);

            const firstRequestPromise = page.waitForRequest(isExplainAnalyzeRequest);
            await queryEditor.clickExplainAnalyzeButton();
            const firstRequest = await firstRequestPromise;
            await pendingQuery.waitUntilStarted();

            const firstRequestFailed = page.waitForEvent('requestfailed', {
                predicate: (request) => request === firstRequest,
                timeout: VISIBILITY_TIMEOUT,
            });
            const secondRequest = page.waitForRequest(
                (request) => request !== firstRequest && isExplainAnalyzeRequest(request),
            );

            await queryEditor.runQueryViaEditorAction();

            await secondRequest;
            await firstRequestFailed;
        } finally {
            await pendingQuery.cleanup();
        }
    });

    test('repeating non-streaming Run marks its history entry as stopped', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const queryMarker = '-- abort history regression';
        const query = `${longRunningQuery}\n${queryMarker}`;
        let resolveRunRequestCaptured: (() => void) | undefined;
        let releaseRunRequest: (() => void) | undefined;
        const runRequestCaptured = new Promise<void>((resolve) => {
            resolveRunRequestCaptured = resolve;
        });
        const runRequestRelease = new Promise<void>((resolve) => {
            releaseRunRequest = resolve;
        });
        let runRequestIsHeld = false;

        await page.route('**/viewer/json/query**', async (route) => {
            const requestBody = getViewerQueryRequestBody(route.request());
            if (
                requestBody?.action?.startsWith('execute-') &&
                requestBody.query?.includes(queryMarker)
            ) {
                if (!runRequestIsHeld) {
                    runRequestIsHeld = true;
                    resolveRunRequestCaptured?.();
                }
                await runRequestRelease;

                try {
                    await route.continue();
                } catch {
                    // The first Run is intentionally aborted by the repeated editor action.
                }
                return;
            }

            await route.continue();
        });

        await toggleExperiment(page, 'off', 'Query Streaming');
        await queryEditor.setQuery(query);
        await queryEditor.clickRunButton();
        await runRequestCaptured;
        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.runQueryViaEditorAction();

        try {
            await expect
                .poll(
                    () =>
                        page.evaluate((marker) => {
                            const history = JSON.parse(
                                localStorage.getItem('queries_history') ?? '[]',
                            ) as Array<{
                                durationUs?: number;
                                queryText?: string;
                                status?: string;
                            }>;
                            const entry = history
                                .toReversed()
                                .find((item) => item.queryText?.includes(marker));

                            return {
                                hasDuration: Boolean(entry?.durationUs && entry.durationUs > 0),
                                status: entry?.status,
                            };
                        }, queryMarker),
                    {timeout: VISIBILITY_TIMEOUT},
                )
                .toEqual({hasDuration: true, status: 'stopped'});
        } finally {
            releaseRunRequest?.();
        }
    });

    test('Stop button appears when query is started via hotkey', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page);

        await queryEditor.setQuery(simpleQuery);
        await queryEditor.focusEditor();
        await executeQueryWithKeybinding(page);

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isElapsedTimeVisible()).resolves.toBe(true);
    });

    test('Query started via hotkey is terminated when stop button is clicked', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page);

        await queryEditor.setQuery(simpleQuery);
        await queryEditor.focusEditor();
        await executeQueryWithKeybinding(page);

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });

    test('Stop button stays available after switching away and back during running query', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page);

        await queryEditor.setQuery(simpleQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.queryTabs.selectTab(QueryTabs.Editor);

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
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
        const multiQuery = 'SELECT 1 + 2;\nSELECT 20;';

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
        await expect(queryEditor.resultTable.getCellValue(1, 2)).resolves.toBe('1');

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();
        await expect(queryEditor.historyQueries.getQueryCount()).resolves.toBe(1);
        await expect(queryEditor.historyQueries.getQueryText(0)).resolves.toContain(
            'SELECT 1 + 2;',
        );
        await expect(queryEditor.historyQueries.getQueryText(0)).resolves.toContain('SELECT 20;');
    });

    test('Selected-query hotkey executes the highlighted statement without a selection', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;\n\nSELECT 2;');
        await queryEditor.setCursor(3, 3);

        await expect(queryEditor.getSelectedText()).resolves.toBe('');
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 2;');
        await executeSelectedQueryWithKeybinding(page);

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(queryEditor.resultTable.getCellValue(1, 2)).resolves.toContain('2');
    });

    test('Single executable statement is not highlighted but remains executable', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('; -- leading comment\n\nSELECT 7;\n\n-- trailing comment');
        await queryEditor.setCursor(3, 3);

        await expect(queryEditor.getSelectedText()).resolves.toBe('');
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBeUndefined();
        await executeSelectedQueryWithKeybinding(page);

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.getCellValue(1, 2)).resolves.toContain('7');

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();
        await expect(queryEditor.historyQueries.getQueryCount()).resolves.toBe(0);
    });

    test('Selected-query action is unavailable for multiple Monaco selections', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;\nSELECT 2;');
        await queryEditor.setCursor(2, 3);
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 2;');

        const actionState = await queryEditor.editorTextArea.evaluate(() => {
            const editor = window.ydbEditor;
            if (!editor) {
                throw new Error('Expected active Monaco editor');
            }

            editor.setSelections([
                {
                    selectionStartLineNumber: 1,
                    selectionStartColumn: 1,
                    positionLineNumber: 1,
                    positionColumn: 7,
                },
                {
                    selectionStartLineNumber: 2,
                    selectionStartColumn: 1,
                    positionLineNumber: 2,
                    positionColumn: 7,
                },
            ]);

            return {
                selectionCount: editor.getSelections()?.length,
                isSupported: editor.getAction('sendSelectedQuery')?.isSupported(),
            };
        });

        expect(actionState).toEqual({selectionCount: 2, isSupported: false});
    });

    test('Current-statement decoration follows statement-count transitions', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        const firstStatement = 'SELECT 1;';
        const secondStatement = 'SELECT 2;';

        await queryEditor.setQuery(firstStatement);
        await queryEditor.setCursor(1, 3);

        await queryEditor.editorTextArea.evaluate(
            (_, query) => {
                const editor = window.ydbEditor;
                const model = editor?.getModel();
                if (!editor || !model) {
                    throw new Error('Expected active Monaco editor model');
                }

                const endPosition = model.getPositionAt(model.getValueLength());
                editor.executeEdits('test', [
                    {
                        range: {
                            startLineNumber: endPosition.lineNumber,
                            startColumn: endPosition.column,
                            endLineNumber: endPosition.lineNumber,
                            endColumn: endPosition.column,
                        },
                        text: `\n${query.secondStatement}`,
                    },
                ]);
            },
            {secondStatement},
        );
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe(firstStatement);

        await queryEditor.editorTextArea.evaluate(
            (_, query) => {
                const editor = window.ydbEditor;
                if (!editor) {
                    throw new Error('Expected active Monaco editor');
                }

                editor.executeEdits('test', [
                    {
                        range: {
                            startLineNumber: 1,
                            startColumn: query.firstStatement.length + 1,
                            endLineNumber: 2,
                            endColumn: query.secondStatement.length + 1,
                        },
                        text: '',
                    },
                ]);
            },
            {firstStatement, secondStatement},
        );
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBeUndefined();
    });

    test('Current-statement decoration is restored after a same-model text flush', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        const initialQuery = 'SELECT 1;\nSELECT 2;';
        const replacementQuery = 'SELECT 3;\nSELECT 4;';
        const singleStatementQuery = 'SELECT 5;';

        await queryEditor.setQuery(initialQuery);
        await queryEditor.setCursor(1, 3);
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 1;');

        await queryEditor.editorTextArea.evaluate((_, query) => {
            const editor = window.ydbEditor;
            if (!editor) {
                throw new Error('Expected active Monaco editor');
            }

            editor.setValue(query);
        }, replacementQuery);

        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 3;');

        await queryEditor.editorTextArea.evaluate((_, query) => {
            const editor = window.ydbEditor;
            if (!editor) {
                throw new Error('Expected active Monaco editor');
            }

            editor.setValue(query);
        }, singleStatementQuery);

        await expect.poll(() => queryEditor.getHighlightedStatement()).toBeUndefined();
    });

    test('Current-statement highlight remains immediately after a terminating semicolon', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1; \nSELECT 2;');
        await queryEditor.setCursor(1, 10);

        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 1;');
    });

    test('Current-statement highlight excludes whitespace after a terminating semicolon', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1; \nSELECT 2;');
        await queryEditor.setCursor(1, 11);

        await expect.poll(() => queryEditor.getHighlightedStatement()).toBeUndefined();
    });

    test('Current-statement highlight uses the subtle decoration style', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;\nSELECT 2;');
        await queryEditor.setCursor(1, 3);
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 1;');

        const style = await queryEditor.getCurrentStatementHighlightStyle();
        expect(style.backgroundColor).toBe(style.expectedBackgroundColor);
        expect(style.borderBottomWidth).toBe('0px');
        expect(style.boxShadow).toBe('none');
        expect(style.textDecorationLine).toBe('none');
    });

    test('Fragment error navigation uses the original editor position', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;\n\n    SELECT missing_column;\n\nSELECT 2;');
        await queryEditor.setCursor(3, 12);
        await executeSelectedQueryWithKeybinding(page);
        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);

        await queryEditor.setCursor(5, 1);
        await expect(queryEditor.getCursorPosition()).resolves.toEqual({lineNumber: 5, column: 1});
        await queryEditor.clickFirstIssuePosition();
        await expect
            .poll(() => queryEditor.getCursorPosition())
            .toEqual({lineNumber: 3, column: 5});
    });

    test('Query Settings pragma errors do not navigate the editor', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await toggleExperiment(page, 'off', 'Query Streaming');

        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changePragmas('PRAGMA InvalidPragma;');
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await page.route(`${backend}/viewer/json/query?*`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: {message: 'Invalid pragma'},
                    issues: [
                        {
                            message: 'Unknown pragma',
                            position: {row: 1, column: 4},
                        },
                    ],
                }),
            });
        });

        const query = 'SELECT 1;\n\nSELECT 2;';
        await queryEditor.setQuery(query);
        await queryEditor.selectText(3, 1, 3, 'SELECT 2;'.length + 1);
        await executeSelectedQueryWithKeybinding(page);
        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);

        await queryEditor.setCursor(3, 3);
        await expect(queryEditor.getCursorPosition()).resolves.toEqual({lineNumber: 3, column: 3});
        await queryEditor.clickFirstIssuePosition();
        await expect
            .poll(() => queryEditor.getCursorPosition())
            .toEqual({lineNumber: 3, column: 3});
    });

    test('Current-statement execution does not create a History entry', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;\n\nSELECT 2;');
        await queryEditor.setCursor(3, 3);
        await executeSelectedQueryWithKeybinding(page);
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();
        await expect(queryEditor.historyQueries.getQueryCount()).resolves.toBe(0);
    });

    test('Fragment executions after History navigation do not change existing entries', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        const firstQuery = 'SELECT 11;';
        const secondQuery = 'SELECT 22;';

        await queryEditor.setQuery(firstQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await queryEditor.setQuery(secondQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.selectQuery(firstQuery);
        await expect.poll(() => queryEditor.getEditorContent()).toBe(firstQuery);
        await queryEditor.setCursor(1, 3);
        await executeSelectedQueryWithKeybinding(page);
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();
        await expect(queryEditor.historyQueries.getQueryCount()).resolves.toBe(2);
        await expect(queryEditor.historyQueries.getQueryText(0)).resolves.toBe(secondQuery);
        await expect(queryEditor.historyQueries.getQueryStatus(0)).resolves.toBe('Completed');

        await queryEditor.historyQueries.selectQuery(secondQuery);
        await expect.poll(() => queryEditor.getEditorContent()).toBe(secondQuery);
        const failingFragment = 'SELECT missing_column;';
        await queryEditor.setQuery(failingFragment);
        await queryEditor.selectText(1, 1, 1, failingFragment.length + 1);
        await executeSelectedQueryWithKeybinding(page);
        await expect(queryEditor.waitForStatus('Failed')).resolves.toBe(true);

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();
        await expect(queryEditor.historyQueries.getQueryCount()).resolves.toBe(2);
        await expect(queryEditor.historyQueries.getQueryText(0)).resolves.toBe(secondQuery);
        await expect(queryEditor.historyQueries.getQueryStatus(0)).resolves.toBe('Completed');
    });

    test('Cursor movement within one statement avoids full-text reads and decoration writes', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;\nSELECT 2;');
        await queryEditor.setCursor(1, 3);
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 1;');

        await expect(
            queryEditor.getCurrentStatementUpdateMetricsAfterCursorMove(),
        ).resolves.toEqual({
            fullTextReads: 0,
            currentStatementDecorationWrites: 0,
        });
    });

    test('Current-statement indexing is deferred after text changes', async ({page}) => {
        const queryEditor = new QueryEditor(page);
        await queryEditor.setQuery('SELECT 1;\nSELECT 2;');
        await queryEditor.setCursor(1, 3);
        await expect.poll(() => queryEditor.getHighlightedStatement()).toBe('SELECT 1;');

        await expect(
            queryEditor.getCurrentStatementUpdateMetricsDuringTextChange(),
        ).resolves.toEqual({
            // react-monaco-editor and the page-leave guard each read the controlled value.
            // Current-statement indexing must not add another synchronous full-text read.
            fullTextReads: 2,
        });
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
