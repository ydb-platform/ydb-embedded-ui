import {expect, test} from '@playwright/test';

import {QUERY_MODES} from '../../../../src/utils/query';
import {tenantName} from '../../../utils/constants';
import {TenantPage, VISIBILITY_TIMEOUT} from '../TenantPage';
import {QueryEditor, QueryTabs} from '../queryEditor/models/QueryEditor';
import {UnsavedChangesModal} from '../queryEditor/models/UnsavedChangesModal';

import executeQueryWithKeybinding from './utils';

test.describe('Query History', () => {
    let tenantPage: TenantPage;
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            general: 'query',
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

    test('Can run query from history', async ({page}) => {
        const testQuery = 'SELECT 42 AS history_run_test;';
        const unsavedChangesModal = new UnsavedChangesModal(page);

        // Execute the query first time
        await queryEditor.run(testQuery, QUERY_MODES.script);

        // Navigate to the history tab using existing navigation method
        await queryEditor.queryTabs.selectTab(QueryTabs.History);

        // Select query from history to load it into editor
        await queryEditor.historyQueries.selectQuery(testQuery);

        // Handle unsaved changes modal by clicking "Don't save"
        await unsavedChangesModal.clickDontSave();

        // Run the query using the editor
        await queryEditor.clickRunButton();

        // Verify query was executed by checking results
        await queryEditor.resultTable.isVisible();
        const value = await queryEditor.resultTable.getCellValue(1, 2);
        expect(value).toBe('42');
    });
});
