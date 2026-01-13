import {expect, test} from '@playwright/test';

import {QUERY_MODES} from '../../../../src/utils/query';
import {database} from '../../../utils/constants';
import {TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {QueryEditor, QueryTabs} from '../queryEditor/models/QueryEditor';

import executeQueryWithKeybinding from './utils';

test.describe('Query History', () => {
    let tenantPage: TenantPage;
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            tenantPage: 'query',
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

    test('Query executed with keybinding is saved in history', async ({page, browserName}) => {
        const testQuery = 'SELECT 1 AS keybinding_test;';

        // Focus on the query editor
        await queryEditor.focusEditor();

        // Type the query
        await page.keyboard.type(testQuery);

        // Use the keybinding to execute the query
        await executeQueryWithKeybinding(page, browserName);

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

    test('Unsaved changes modal appears when modifying a query and selecting from history', async () => {
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
});
