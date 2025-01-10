import {expect, test} from '@playwright/test';

import {dsVslotsSchema, tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {QueryEditor, QueryTabs} from '../queryEditor/models/QueryEditor';
import {SaveQueryDialog} from '../queryEditor/models/SaveQueryDialog';
import {UnsavedChangesModal} from '../queryEditor/models/UnsavedChangesModal';

import {SavedQueriesTable} from './models/SavedQueriesTable';

test.describe('Saved Queries', () => {
    let tenantPage: TenantPage;
    let queryEditor: QueryEditor;
    let saveQueryDialog: SaveQueryDialog;
    let savedQueriesTable: SavedQueriesTable;
    let unsavedChangesModal: UnsavedChangesModal;

    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database: tenantName,
            general: 'query',
        };

        tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
        queryEditor = new QueryEditor(page);
        saveQueryDialog = new SaveQueryDialog(page);
        savedQueriesTable = new SavedQueriesTable(page);
        unsavedChangesModal = new UnsavedChangesModal(page);
    });

    test('View list of saved queries', async () => {
        // First save a query to ensure there's something in the list
        const testQuery = 'SELECT 1 AS test_column;';
        const queryName = `Test Query ${Date.now()}`;

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickSaveButton();
        await saveQueryDialog.setQueryName(queryName);
        await saveQueryDialog.clickSave();

        // Navigate to saved queries tab
        await queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        await savedQueriesTable.isVisible();

        // Verify saved queries list is displayed and contains our query
        const names = await savedQueriesTable.getQueryNames();
        expect(names).toContain(queryName);
    });

    test('Open saved query in the Editor', async () => {
        // First save a query
        const testQuery = 'SELECT 2 AS editor_test;';
        const queryName = `Editor Test ${Date.now()}`;

        await queryEditor.setQuery(testQuery);
        await queryEditor.clickSaveButton();
        await saveQueryDialog.setQueryName(queryName);
        await saveQueryDialog.clickSave();

        // Navigate to saved queries tab
        await queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        await savedQueriesTable.isVisible();

        // Open the query in editor
        await savedQueriesTable.editQuery(queryName);

        // Handle unsaved changes dialog
        await unsavedChangesModal.clickDontSave();

        // Verify query is loaded in editor
        const editorValue = await queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(testQuery.trim());
    });

    test('Save a query from the Editor', async () => {
        const testQuery = 'SELECT 3 AS new_query;';
        const queryName = `New Query ${Date.now()}`;

        // Write query in editor and save it
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickSaveButton();
        await saveQueryDialog.setQueryName(queryName);
        await saveQueryDialog.clickSave();

        // Navigate to saved queries tab to verify
        await queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        await savedQueriesTable.isVisible();

        // Verify query was saved correctly
        const row = await savedQueriesTable.getRowByName(queryName);
        expect(row).not.toBe(null);
        expect(row?.query.trim()).toBe(testQuery.trim());
    });
});
