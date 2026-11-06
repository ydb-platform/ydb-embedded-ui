import {expect, test} from '@playwright/test';

import type {ExecuteQueryResponse} from '../../../../../src/types/api/query';
import {getClipboardContent} from '../../../../utils/clipboard';
import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {longRunningStreamQuery} from '../../constants';
import {QueryEditor} from '../../queryEditor/models/QueryEditor';
import {
    Diagnostics,
    DiagnosticsTab,
    QUERY_COLUMNS_IDS,
    QueriesSwitch,
    QueryPeriod,
    QueryTopColumns,
} from '../Diagnostics';
import {setupTopQueriesMock} from '../mocks';

async function navigateToTopQueries(tenantPage: TenantPage) {
    const databaseLink = tenantPage.page
        .getByTestId('aside-navigation')
        .locator('a[href*="databasePage=database"]')
        .first();

    await databaseLink.click();
    await expect(tenantPage.page).toHaveURL(/databasePage=database/);

    const diagnostics = new Diagnostics(tenantPage.page);
    await diagnostics.clickTab(DiagnosticsTab.Queries);
    await expect(tenantPage.page).toHaveURL(/diagnosticsTab=topQueries/);

    return diagnostics;
}

test.describe('Diagnostics Queries tab', async () => {
    test('No runnning queries in Queries if no queries are running', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickTab(DiagnosticsTab.Queries);
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        await diagnostics.table.hasNoData();
    });

    test('Running query is shown if query is running', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);

        const runningQueryMarker = `e2e-running-query-${test.info().project.name}-${Date.now()}`;
        const queryText = `-- ${runningQueryMarker}\n${longRunningStreamQuery}`;
        // APIRequestContext buffers the whole response, so use the app's streaming transport.
        const runningQuery = await page.evaluateHandle(
            ({query, database: databasePath}) => {
                const controller = new AbortController();
                const state: {
                    error?: string;
                    queryId?: string;
                    stopping: boolean;
                    completed: boolean;
                } = {stopping: false, completed: false};
                const completion = window.api.streaming
                    .streamQuery(
                        {
                            database: databasePath,
                            query,
                            action: 'execute-query',
                            syntax: 'yql_v1',
                            // Keep result batches small so the running query remains cancellable.
                            limit_rows: 50_000,
                            output_chunk_max_size: 1_024,
                        },
                        {
                            signal: controller.signal,
                            // Cancellation uses the server's ID from the first chunk.
                            onSessionChunk: (chunk) => {
                                state.queryId = chunk.meta.query_id;
                            },
                            onStreamDataChunk: () => undefined,
                            onQueryResponseChunk: () => {
                                state.completed = true;
                            },
                        },
                    )
                    .catch((error: unknown) => {
                        if (!state.stopping) {
                            state.error = error instanceof Error ? error.message : String(error);
                        }
                    });
                return {
                    state,
                    async stop() {
                        state.stopping = true;
                        let cancellationError: string | undefined;
                        try {
                            if (state.queryId && !state.completed) {
                                await window.api.viewer.sendQuery({
                                    database: databasePath,
                                    action: 'cancel-query',
                                    query_id: state.queryId,
                                    internal_call: true,
                                    timeout: 5_000,
                                });
                            }
                        } catch {
                            // The query can finish while cancellation is in flight.
                            cancellationError = 'Cancellation failed; query must still disappear';
                        } finally {
                            controller.abort();
                            await completion;
                        }
                        return cancellationError;
                    },
                };
            },
            {query: queryText, database},
        );

        let deadline = Date.now() + 10_000;
        let pendingPoll: Promise<boolean> | undefined;
        const refreshRunningQueries = async () => {
            const queryState = await runningQuery.evaluate(({state}) => state);
            if (queryState.error) {
                throw new Error(queryState.error);
            }
            if (!queryState.queryId) {
                return false;
            }

            const timeout = Math.max(1, deadline - Date.now());
            const [requestResult, refreshResult] = await Promise.allSettled([
                page.waitForEvent('requestfinished', {
                    predicate: (request) => {
                        if (
                            new URL(request.url()).pathname !== '/viewer/json/query' ||
                            request.method() !== 'POST'
                        ) {
                            return false;
                        }
                        const body: {query?: string} = request.postDataJSON();
                        return Boolean(
                            body.query?.includes('`.sys/query_sessions`') &&
                                /SELECT\s+\*/i.test(body.query),
                        );
                    },
                    timeout,
                }),
                diagnostics.clickRefreshButton(timeout),
            ]);
            if (refreshResult.status === 'rejected') {
                throw refreshResult.reason;
            }
            if (requestResult.status === 'rejected') {
                throw requestResult.reason;
            }
            const response = await requestResult.value.response();
            if (!response) {
                throw new Error('Running queries request completed without a response');
            }
            expect(response.ok(), `Running queries HTTP status: ${response.status()}`).toBe(true);
            const body: ExecuteQueryResponse & {status?: string} = await response.json();
            expect(body.status, `Running queries response: ${await response.text()}`).toBe(
                'SUCCESS',
            );
            const result = body.result?.[0];
            const queryColumn = result?.columns?.findIndex(({name}) => name === 'Query') ?? -1;
            return Boolean(
                result?.rows?.some((row) => {
                    const query = row[queryColumn];
                    return typeof query === 'string' && query.includes(runningQueryMarker);
                }),
            );
        };

        let cancellationError: string | undefined;
        try {
            try {
                await expect
                    .poll(
                        () => {
                            pendingPoll = refreshRunningQueries();
                            return pendingPoll;
                        },
                        {timeout: 10_000},
                    )
                    .toBe(true);
                await expect(
                    page.locator('.ydb-fixed-height-query').filter({hasText: runningQueryMarker}),
                ).toBeVisible();
            } finally {
                await pendingPoll?.catch(() => undefined);
                cancellationError = await runningQuery.evaluate(({stop}) => stop());
            }

            deadline = Date.now() + 10_000;
            await expect
                .poll(refreshRunningQueries, {
                    timeout: 10_000,
                    message: cancellationError || 'Test query must disappear after completion',
                })
                .toBe(false);
        } finally {
            await runningQuery.dispose();
        }
    });

    test('Query tab defaults to Top mode', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify Top mode is selected by default
        const radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Top);
    });

    test('Query Top tab shows expected column headers', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify table has data
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Verify column headers exist - check at least some of the core columns
        await diagnostics.table.verifyHeaders([
            QUERY_COLUMNS_IDS.QueryHash,
            QUERY_COLUMNS_IDS.CPUTime,
            QUERY_COLUMNS_IDS.QueryText,
            QUERY_COLUMNS_IDS.Duration,
        ]);
    });

    test('Query tab first row has values for all columns in Top mode', async ({page}) => {
        // First, run some CPU-intensive queries to generate data
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const queryEditor = new QueryEditor(page);

        // Run CPU-intensive stream query
        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();

        // Wait for the query to complete
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        // Now navigate to Top queries.
        const diagnostics = await navigateToTopQueries(tenantPage);

        // Ensure we're in Top mode (should be default)
        const radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Top);

        // Per-minute system table populates much faster than per-hour in fresh Docker instances
        await diagnostics.selectQueryPeriod(QueryPeriod.PerMinute);

        // Wait for system tables to be populated — retry with refresh
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await diagnostics.table.waitForDataRows(() => diagnostics.clickRefreshButton());

        // Verify first row has non-empty values for key columns. Fresh Docker instances can expose
        // the row before all system-table values are populated, especially in Safari.
        await expect
            .poll(
                async () => {
                    const columnValues = await Promise.all(
                        QueryTopColumns.slice(0, 4).map(async (column) => {
                            const columnValue = await diagnostics.table.getCellValueByHeader(
                                1,
                                column,
                            );
                            return columnValue.trim();
                        }),
                    );

                    if (columnValues.every(Boolean)) {
                        return true;
                    }

                    await diagnostics.clickRefreshButton();
                    return false;
                },
                {timeout: 30000},
            )
            .toBe(true);
    });

    test('Query tab can switch between Top and Running modes', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Switch to Running mode
        await diagnostics.clickRadioSwitch(QueriesSwitch.Running);
        let radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Running);

        // Switch back to Top mode
        await diagnostics.clickRadioSwitch(QueriesSwitch.Top);
        radioOption = await diagnostics.getSelectedTableMode();
        expect(radioOption?.trim()).toBe(QueriesSwitch.Top);

        // Verify table still has data after switching back
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
    });

    test('Query tab allows changing between Per hour and Per minute views', async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);

        // Verify that we start with "Per hour" selected as default
        expect(await diagnostics.getSelectedQueryPeriod()).toBe(QueryPeriod.PerHour);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Switch to "Per minute" view
        await diagnostics.selectQueryPeriod(QueryPeriod.PerMinute);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Verify the view was updated - period text should change
        expect(await diagnostics.getSelectedQueryPeriod()).toBe(QueryPeriod.PerMinute);

        // The table should refresh with potentially different data
        // Wait for the table to reload and then check a value
        await page.waitForTimeout(500); // Small wait for UI update

        // Switch back to "Per hour" view
        await diagnostics.selectQueryPeriod(QueryPeriod.PerHour);

        // Verify the view was updated back
        expect(await diagnostics.getSelectedQueryPeriod()).toBe(QueryPeriod.PerHour);
    });

    test('Top Query rows components have consistent height across different query lengths', async ({
        page,
    }) => {
        // Setup mock with 100 rows for scrolling test
        await setupTopQueriesMock(page);

        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Check that FixedHeightQuery components have the expected fixed height
        const rowCount = await diagnostics.table.getRowCount();

        if (rowCount > 1) {
            // Check that all FixedHeightQuery components have the same height
            const heights = [];
            for (let i = 0; i < Math.min(rowCount, 5); i++) {
                const height = await diagnostics.getFixedHeightQueryElementHeight(i);
                heights.push(height);
            }

            // All heights should be the same (88px for 4 lines)
            const firstHeight = heights[0];

            for (const height of heights) {
                expect(height).toBe(firstHeight);
            }
        }
    });

    test('Scroll to row, get shareable link, navigate to URL and verify row is scrolled into view', async ({
        page,
        context,
    }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read']);

        // Setup mock with 100 rows for scrolling test
        await setupTopQueriesMock(page);

        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);

        const diagnostics = new Diagnostics(page);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);

        // Get the number of rows and select a row that requires scrolling.
        // Target a row further down that requires scrolling
        const targetRowIndex = 8;
        const rowCount = await diagnostics.table.getRowCount();
        expect(rowCount).toBeGreaterThanOrEqual(targetRowIndex);
        const targetRowData = await diagnostics.getRowData(targetRowIndex - 1);

        // Click on the target row to open the drawer
        await diagnostics.table.clickRow(targetRowIndex);

        // Wait for drawer to open
        await page.waitForTimeout(500);

        // Find and click the copy link button in the drawer
        await expect(diagnostics.isCopyLinkButtonVisible()).resolves.toBe(true);
        await diagnostics.clickCopyLinkButton();

        // Get the copied URL from clipboard
        const clipboardText = await getClipboardContent(page);
        expect(clipboardText).toBeTruthy();
        expect(clipboardText).toContain('/database');

        // Navigate to the copied URL
        await page.goto(clipboardText, {waitUntil: 'domcontentloaded'});
        await page.waitForTimeout(1000);

        // Verify the selected row is highlighted and visible.
        await diagnostics.waitForActiveRowData(targetRowData);
    });
});
