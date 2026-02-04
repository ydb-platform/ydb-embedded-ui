import {expect, test} from '@playwright/test';
import {v4 as uuidv4} from 'uuid';

import {database, dsVslotsSchema} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {QueryTabs} from '../queryEditor/models/QueryEditor';

test.describe('Saved Queries', () => {
    let tenantPage: TenantPage;

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database,
            tenantPage: 'query',
        };

        tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('View list of saved queries', async () => {
        // First save a query to ensure there's something in the list
        const testQuery = 'SELECT 1 AS test_column;';
        const queryName = await tenantPage.saveQuery(testQuery, `Test Query ${uuidv4()}`);

        // Navigate to saved queries tab
        await tenantPage.queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        await tenantPage.savedQueriesTable.isVisible();

        // Verify saved queries list is displayed and contains our query
        const names = await tenantPage.savedQueriesTable.getQueryNames();
        expect(names).toContain(queryName);
    });

    test('Open saved query in the Editor', async () => {
        // First save a query
        const testQuery = 'SELECT 2 AS editor_test;';
        const queryName = await tenantPage.saveQuery(testQuery, `Editor Test ${uuidv4()}`);

        // Open the saved query
        await tenantPage.openSavedQuery(queryName);

        // Verify query is loaded in editor
        const editorValue = await tenantPage.queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(testQuery.trim());
    });

    test('Save a query from the Editor', async () => {
        const testQuery = 'SELECT 3 AS new_query;';
        const queryName = await tenantPage.saveQuery(testQuery, `New Query ${uuidv4()}`);

        // Navigate to saved queries tab to verify
        await tenantPage.queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        await tenantPage.savedQueriesTable.isVisible();

        // Verify query was saved correctly
        const row = await tenantPage.savedQueriesTable.getRowByName(queryName);
        expect(row).not.toBe(null);
        expect(row?.query.trim()).toBe(testQuery.trim());
    });

    test('No unsaved changes modal when opening another query after saving', async () => {
        // Save first query
        const firstQuery = 'SELECT 4 AS first_query;';
        const firstQueryName = await tenantPage.saveQuery(firstQuery, `First Query ${uuidv4()}`);

        // Save second query to have one to open
        const secondQuery = 'SELECT 5 AS second_query;';
        const secondQueryName = await tenantPage.saveQuery(secondQuery, `Second Query ${uuidv4()}`);

        // Open the first query from saved queries list
        await tenantPage.openSavedQuery(firstQueryName);

        // Verify query is loaded in editor
        const editorValue = await tenantPage.queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(firstQuery.trim());

        // Open the second query
        await tenantPage.openSavedQuery(secondQueryName);

        // Verify second query is loaded and no unsaved changes modal appeared
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);

        const secondEditorValue = await tenantPage.queryEditor.editorTextArea.inputValue();
        expect(secondEditorValue.trim()).toBe(secondQuery.trim());
    });

    test('Unsaved changes modal appears when selecting a saved query after modifications', async () => {
        // Save a query
        const originalQuery = 'SELECT 6 AS original_query;';
        const queryName = await tenantPage.saveQuery(originalQuery, `Modified Query ${uuidv4()}`);

        // Save another query to have one to select
        const anotherQuery = 'SELECT 7 AS another_saved_query;';
        await tenantPage.saveQuery(anotherQuery, `Another Saved Query ${uuidv4()}`);

        // Replace the current query
        const newQuery = 'SELECT 8 AS modified_query;';
        await tenantPage.queryEditor.setQuery(newQuery);

        // Open the saved query
        await tenantPage.openSavedQuery(queryName);

        // Verify unsaved changes modal appears when selecting a row
        const isModalVisible = await tenantPage.isUnsavedChangesModalVisible();
        expect(isModalVisible).toBe(true);

        // Dismiss the modal
        await tenantPage.unsavedChangesModal.clickCancel();
    });

    test('No unsaved changes modal when switching from saved query to another query', async () => {
        // Save a query
        const query = 'SELECT 8 AS saved_query;';
        const queryName = await tenantPage.saveQuery(query, `Saved Query ${uuidv4()}`);

        // Open the saved query
        await tenantPage.openSavedQuery(queryName);

        // Verify it's properly loaded
        const editorValue = await tenantPage.queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(query.trim());

        // Save another query to have one to open
        const anotherQuery = 'SELECT 9 AS another_query;';
        const anotherQueryName = await tenantPage.editAsNewQuery(
            anotherQuery,
            `Another Query ${uuidv4()}`,
        );

        // Open the previously saved query again
        await tenantPage.openSavedQuery(queryName);

        // Then open another query - no modal should appear
        await tenantPage.openSavedQuery(anotherQueryName);

        // Verify no unsaved changes modal appeared
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);

        // Verify the query was loaded correctly
        const currentQuery = await tenantPage.queryEditor.editorTextArea.inputValue();
        expect(currentQuery.trim()).toBe(anotherQuery.trim());
    });
});
