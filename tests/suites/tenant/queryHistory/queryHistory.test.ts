import {expect, test} from '@playwright/test';

import {QUERY_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {executeQueryWithKeybinding} from '../../../utils/queryHotkeys';
import {QueryEditorMode, TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {QueryEditor, QueryTabs} from '../queryEditor/models/QueryEditor';
import {SaveChangesDialog} from '../queryEditor/models/SaveChangesDialog';
import {SaveQueryDialog} from '../queryEditor/models/SaveQueryDialog';
import {SavedQueriesTable} from '../savedQueries/models/SavedQueriesTable';

async function openQueryEditorInMode(tenantPage: TenantPage, mode: QueryEditorMode) {
    await tenantPage.gotoQueryEditor({
        schema: database,
        database,
        mode,
    });
}
test.describe('Query History', () => {
    let tenantPage: TenantPage;
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            databasePage: 'query',
        };

        tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
        queryEditor = new QueryEditor(page);
    });

    test('New query appears in history after execution', async () => {
        const testQuery = 'SELECT 1 AS test_column;';

        // Execute the query
        await queryEditor.run(testQuery, QUERY_MODES.script);

        // Navigate to the history tab using existing navigation method
        await queryEditor.queryTabs.selectTab(QueryTabs.History);

        // Check if the query appears in the history
        await queryEditor.historyQueries.isVisible();
        const queryRow = await queryEditor.historyQueries.getQueryRow(testQuery);
        await expect(queryRow).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });

    test('Keeps a new query in full history after the clock moves back', async ({page}) => {
        const initialTime = await page.evaluate(() => {
            const now = Date.now();
            const history = Array.from({length: 20}, (_, index) => ({
                queryId: `before-clock-change-${index}`,
                queryText: `SELECT ${index} AS before_clock_change_${index};`,
                startTime: now - 20 + index,
            }));
            localStorage.setItem('queries_history', JSON.stringify(history));
            return now;
        });
        await openQueryEditorInMode(tenantPage, QueryEditorMode.MultiTab);

        const {editorTabs} = queryEditor;
        await editorTabs.clickAddTab();
        const sql = 'SELECT 77 AS after_clock_change;';
        await queryEditor.setQuery(sql);
        await page.clock.setFixedTime(initialTime - 120_000);
        await queryEditor.clickRunButton();
        await queryEditor.waitForStatus('Completed');
        expect(await queryEditor.resultTable.getCellValue(1, 2)).toBe('77');

        const tabTitle = await editorTabs.getActiveTabTitle();
        await editorTabs.hoverTab(tabTitle);
        await editorTabs.closeTab(tabTitle);
        await expect(editorTabs.waitForTabCount(1)).resolves.toBe(true);

        await page.reload();
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.search('after_clock_change');
        await expect(await queryEditor.historyQueries.getQueryRow(sql)).toBeVisible();

        const history = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('queries_history') ?? '[]').map(
                ({queryId}: {queryId: string}) => queryId,
            ),
        );
        expect(history).toHaveLength(20);
        expect(history).not.toContain('before-clock-change-0');
    });

    test('Keeps an oversized query unsaved after execution', async ({page}) => {
        await openQueryEditorInMode(tenantPage, QueryEditorMode.MultiTab);
        await page.evaluate(() => {
            const setItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function (key, value) {
                if (this === localStorage && key === 'queries_history') {
                    throw new DOMException('Storage is full', 'QuotaExceededError');
                }
                setItem.call(this, key, value);
            };
        });

        const previousQuery = 'SELECT 11 AS kept_in_history;';
        await queryEditor.run(previousQuery, QUERY_MODES.script);
        await queryEditor.waitForStatus('Completed');
        const localSaveWarning = page.getByText('Could not save settings in this browser.');
        await expect(localSaveWarning).toBeVisible();

        const largeQuery = `/* ${'\\'.repeat(215_000)} */ SELECT 72 AS oversized_for_history;`;
        await page.evaluate((text) => window.ydbEditor?.setValue(text), largeQuery);
        await queryEditor.clickRunButton();

        await expect(
            page.getByText('The query is too large to be added to query history automatically.'),
        ).toBeVisible();
        await expect(localSaveWarning).toBeHidden();
        await queryEditor.waitForStatus('Completed');
        expect(await queryEditor.resultTable.getCellValue(1, 2)).toBe('72');

        const activeTabTitle = await queryEditor.editorTabs.getActiveTabTitle();
        await queryEditor.editorTabs.hoverTab(activeTabTitle);
        await queryEditor.editorTabs.closeTab(activeTabTitle);
        const saveChangesDialog = new SaveChangesDialog(page);
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();
        await expect(queryEditor.getEditorContent()).resolves.toBe(largeQuery);

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await expect(await queryEditor.historyQueries.getQueryRow(previousQuery)).toBeVisible();
        expect(await queryEditor.historyQueries.getQueryCount()).toBe(1);
    });

    test('Reports a server history error while keeping the SQL result and local history', async ({
        page,
    }) => {
        await page.evaluate(() => {
            Object.assign(window.api, {
                metaSettings: {
                    getSingleSetting: async () => undefined,
                    setSingleSetting: async ({name}: {name: string}) => {
                        if (name === 'queries_history') {
                            throw new Error('HTTP 413');
                        }
                        return {status: 'SUCCESS'};
                    },
                },
            });
        });
        // Re-render Query with the remote settings client enabled.
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.queryTabs.selectTab(QueryTabs.Editor);

        const sql = 'SELECT 73 AS history_save_failure;';
        await queryEditor.run(sql, QUERY_MODES.script);

        await expect(page.getByText('Could not save query history to the server.')).toBeVisible();
        await queryEditor.waitForStatus('Completed');
        expect(await queryEditor.resultTable.getCellValue(1, 2)).toBe('73');

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await expect(await queryEditor.historyQueries.getQueryRow(sql)).toBeVisible();
    });

    test('Multiple queries appear in correct order in history', async () => {
        const queries = [
            'SELECT 1 AS first_query;',
            'SELECT 2 AS second_query;',
            'SELECT 3 AS third_query;',
        ];

        // Execute multiple queries
        for (const query of queries) {
            await queryEditor.run(query, QUERY_MODES.script);
        }

        // Navigate to the history tab using existing navigation method
        await queryEditor.queryTabs.selectTab(QueryTabs.History);

        // Check if queries appear in reverse order (most recent first)
        await queryEditor.historyQueries.isVisible();

        for (let i = 0; i < queries.length; i++) {
            const queryRow = await queryEditor.historyQueries.getQueryRow(
                queries[queries.length - 1 - i],
            );
            await expect(queryRow).toBeVisible();
            const queryText = await queryEditor.historyQueries.getQueryText(i);
            expect(queryText).toContain(queries[queries.length - 1 - i]);
        }
    });

    test('Query executed with keybinding is saved in history', async ({page}) => {
        const testQuery = 'SELECT 1 AS keybinding_test;';

        await queryEditor.setQuery(testQuery);
        await queryEditor.focusEditor();

        // Use the keybinding to execute the query
        await executeQueryWithKeybinding(page);

        // Wait for query results
        await queryEditor.resultTable.isVisible();

        // Navigate to the history tab using existing navigation method
        await queryEditor.queryTabs.selectTab(QueryTabs.History);

        // Check if the query appears in the history
        await queryEditor.historyQueries.isVisible();
        const queryRow = await queryEditor.historyQueries.getQueryRow(testQuery);
        await expect(queryRow).toBeVisible();
    });

    test('Can run query from history', async () => {
        const testQuery = 'SELECT 42 AS history_run_test;';

        // Execute the query first time
        await queryEditor.run(testQuery, QUERY_MODES.script);

        // Navigate to the history tab using existing navigation method
        await queryEditor.queryTabs.selectTab(QueryTabs.History);

        // Select query from history to load it into editor
        await queryEditor.historyQueries.selectQuery(testQuery);

        // Run the query using the editor
        await queryEditor.clickRunButton();

        // Verify query was executed by checking results
        await queryEditor.resultTable.isVisible();
        const value = await queryEditor.resultTable.getCellValue(1, 2);
        expect(value).toBe('42');
    });

    test('Clicking a row opens query preview drawer', async ({page}) => {
        const testQuery = 'SELECT 99 AS preview_test;';

        // Execute the query
        await queryEditor.run(testQuery, QUERY_MODES.script);

        // Navigate to the history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Click the row to open the preview drawer
        await queryEditor.historyQueries.clickRow(testQuery);

        // Verify the query preview drawer is visible
        const drawer = page.locator('.ydb-query-details');
        await expect(drawer).toBeVisible({timeout: VISIBILITY_TIMEOUT});

        // Verify the query text is displayed in the preview
        const queryText = drawer.locator('.ydb-syntax-highlighter');
        await expect(queryText).toContainText(testQuery);
    });

    test('Can search in query history', async () => {
        const queries = [
            'SELECT 1 AS first_test;',
            'SELECT 2 AS second_test;',
            'SELECT 3 AS another_query;',
        ];

        // Execute multiple queries
        for (const query of queries) {
            await queryEditor.run(query, QUERY_MODES.script);
        }

        // Navigate to the history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Search for "test" queries
        await queryEditor.historyQueries.search('test');

        // Verify only queries with "test" are visible
        const firstQueryRow = await queryEditor.historyQueries.getQueryRow(queries[0]);
        const secondQueryRow = await queryEditor.historyQueries.getQueryRow(queries[1]);
        const otherQueryRow = await queryEditor.historyQueries.getQueryRow(queries[2]);

        await expect(firstQueryRow).toBeVisible();
        await expect(secondQueryRow).toBeVisible();
        await expect(otherQueryRow).not.toBeVisible();
    });

    test('No unsaved changes modal when running a query and selecting from history', async () => {
        // Run first query
        const firstQuery = 'SELECT 10 AS first_history_query;';
        await queryEditor.run(firstQuery, QUERY_MODES.script);

        // Run second query
        const secondQuery = 'SELECT 20 AS second_history_query;';
        await queryEditor.run(secondQuery, QUERY_MODES.script);

        // Navigate to history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Select the first query from history
        await queryEditor.historyQueries.selectQuery(firstQuery);

        // Verify no unsaved changes modal appeared
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);
        // Verify query is loaded in editor
        const editorValue = await queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(firstQuery.trim());
    });

    test('No unsaved changes modal when running a query that is identical to last in history', async () => {
        // Run first query
        const firstQuery = 'SELECT 10 AS first_history_query;';
        await queryEditor.run(firstQuery, QUERY_MODES.script);

        // Set some other query
        const secondQuery = 'SELECT 20 AS second_history_query;';
        await queryEditor.setQuery(secondQuery);

        // Run the first query again
        await queryEditor.run(firstQuery, QUERY_MODES.script);

        // Navigate to history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Select the first query from history
        await queryEditor.historyQueries.selectQuery(firstQuery);

        // Verify no unsaved changes modal appeared
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);
        // Verify query is loaded in editor
        const editorValue = await queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(firstQuery.trim());
    });

    test('Single-tab asks for confirmation when modifying a query and selecting from history', async () => {
        await openQueryEditorInMode(tenantPage, QueryEditorMode.SingleTab);

        // Run a query
        const originalQuery = 'SELECT 30 AS original_history_query;';
        await queryEditor.run(originalQuery, QUERY_MODES.script);

        // Run another query to have something in history
        const historyQuery = 'SELECT 40 AS history_query_for_selection;';
        await queryEditor.run(historyQuery, QUERY_MODES.script);

        // Modify the current query without running it
        const modifiedQuery = 'SELECT 50 AS modified_unsaved_query;';
        await queryEditor.setQuery(modifiedQuery);

        // Navigate to history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Try to select a query from history - should trigger unsaved changes modal
        await queryEditor.historyQueries.selectQuery(historyQuery);

        // Verify unsaved changes modal appears
        const isModalVisible = await tenantPage.isUnsavedChangesModalVisible();
        expect(isModalVisible).toBe(true);

        // Dismiss the modal
        await tenantPage.unsavedChangesModal.clickCancel();
    });

    test('Multi-tab opens a new tab when modifying a query and selecting from history', async () => {
        await openQueryEditorInMode(tenantPage, QueryEditorMode.MultiTab);

        // Run a query
        const originalQuery = 'SELECT 30 AS original_history_query;';
        await queryEditor.run(originalQuery, QUERY_MODES.script);

        // Run another query to have something in history
        const historyQuery = 'SELECT 40 AS history_query_for_selection;';
        await queryEditor.run(historyQuery, QUERY_MODES.script);

        // Modify the current query without running it
        const modifiedQuery = 'SELECT 50 AS modified_unsaved_query;';
        await queryEditor.setQuery(modifiedQuery);
        const initialTabCount = await queryEditor.editorTabs.getTabCount();
        const modifiedTabId = await queryEditor.editorTabs.getActiveTabId();

        // Navigate to history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Select a query from history - should open in a new tab without confirmation
        await queryEditor.historyQueries.selectQuery(historyQuery);

        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);
        await expect(queryEditor.editorTabs.waitForTabCount(initialTabCount + 1)).resolves.toBe(
            true,
        );

        const nextTabId = await queryEditor.editorTabs.getActiveTabId();
        expect(nextTabId).not.toBe(modifiedTabId);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe(historyQuery);

        if (!modifiedTabId) {
            throw new Error('Modified tab id should be available before selecting history query');
        }

        await queryEditor.editorTabs.selectTabById(modifiedTabId);
        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toBe(modifiedQuery);
    });

    test('No unsaved changes modal when selecting from history after saving a query', async () => {
        // Run a query and save it
        const query = 'SELECT 60 AS query_to_save;';
        await queryEditor.run(query, QUERY_MODES.script);
        await tenantPage.saveQuery(query, `Saved History Query ${Date.now()}`);

        // Run another query to have something in history
        const historyQuery = 'SELECT 70 AS another_history_query;';
        await queryEditor.run(historyQuery, QUERY_MODES.script);

        // Navigate to history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Select the first query from history
        await queryEditor.historyQueries.selectQuery(query);

        // Verify no unsaved changes modal appeared
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);

        // Verify query is loaded in editor
        const editorValue = await queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(query.trim());
    });

    test('Can save query from history using save button', async ({page}) => {
        const testQuery = 'SELECT 100 AS save_from_history_test;';
        const queryName = `Saved From History ${Date.now()}`;

        // Execute the query
        await queryEditor.run(testQuery, QUERY_MODES.script);

        // Navigate to the history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Click the save button on the query row
        await queryEditor.historyQueries.clickSaveButton(testQuery);

        // Verify save query dialog appears
        const saveQueryDialog = new SaveQueryDialog(page);
        const isDialogVisible = await saveQueryDialog.isVisible();
        expect(isDialogVisible).toBe(true);

        // Fill in the query name and save
        await saveQueryDialog.setQueryName(queryName);
        await saveQueryDialog.clickSave();

        // Navigate to the saved queries tab to verify the query was saved
        await queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        const savedQueriesTable = new SavedQueriesTable(page);
        await savedQueriesTable.isVisible();

        // Verify the saved query exists
        const savedRow = await savedQueriesTable.getQueryRow(queryName);
        await expect(savedRow).toBeVisible({timeout: VISIBILITY_TIMEOUT});
    });
});
