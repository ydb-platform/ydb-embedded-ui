import {expect, test} from '@playwright/test';

import {database} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {SavedQueriesTable} from '../savedQueries/models/SavedQueriesTable';
import {ObjectSummary} from '../summary/ObjectSummary';
import {RowTableAction} from '../summary/types';

import {
    AsyncReplicationTemplates,
    NewSqlDropdownMenu,
    TablesTemplates,
    TemplateCategory,
} from './models/NewSqlDropdownMenu';
import {QueryEditor, QueryTabs} from './models/QueryEditor';
import {SaveQueryDialog} from './models/SaveQueryDialog';
import {UnsavedChangesModal} from './models/UnsavedChangesModal';

test.describe('Query Templates', () => {
    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: database,
            database,
            general: 'query',
        };
        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
    });

    test('Update table template should not run successfully', async ({page}) => {
        const newSqlDropdown = new NewSqlDropdownMenu(page);
        const queryEditor = new QueryEditor(page);

        // Open dropdown and select Update table template
        await newSqlDropdown.clickNewSqlButton();
        await newSqlDropdown.hoverCategory(TemplateCategory.Tables);
        await newSqlDropdown.selectTemplate(TablesTemplates.UpdateTable);

        // Try to run the query
        await queryEditor.clickRunButton();

        // Verify that execution fails
        try {
            await queryEditor.waitForStatus('Failed');
            // If we reach here, the test passed because execution failed as expected
        } catch {
            throw new Error('Update table template should not have executed successfully');
        }
    });

    test('Create row table template should handle both success and failure cases', async ({
        page,
    }) => {
        const newSqlDropdown = new NewSqlDropdownMenu(page);
        const queryEditor = new QueryEditor(page);

        // Open dropdown and select Create row table template
        await newSqlDropdown.clickNewSqlButton();
        await newSqlDropdown.hoverCategory(TemplateCategory.Tables);
        await newSqlDropdown.selectTemplate(TablesTemplates.CreateRowTable);

        // Try to run the query
        await queryEditor.clickRunButton();
        await page.waitForTimeout(500);

        try {
            // Wait for either Completed or Failed status
            const status = await queryEditor.getExecutionStatus();

            if (status === 'Failed') {
                // If failed, verify it's the expected "path exists" error
                const errorMessage = await queryEditor.getErrorMessage();
                expect(errorMessage).toContain('path exist, request accepts it');
            } else {
                // If not failed, verify it completed successfully
                expect(status).toBe('Completed');
            }
        } catch {
            throw new Error(
                'Query execution neither completed successfully nor failed with expected error',
            );
        }
    });

    test('Unsaved changes modal appears when switching between templates if query was edited', async ({
        page,
    }) => {
        const objectSummary = new ObjectSummary(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First action - Add index
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        // First set some content
        await queryEditor.setQuery('SELECT 1;');

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Verify unsaved changes modal appears
        await expect(unsavedChangesModal.isVisible()).resolves.toBe(true);
    });

    test('Cancel button in unsaved changes modal preserves editor content', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First action - Add index
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        await queryEditor.setQuery('SELECT 1;');

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Click Cancel in the modal
        await unsavedChangesModal.clickCancel();

        // Verify editor content remains unchanged
        await expect(queryEditor.editorTextArea).toHaveValue('SELECT 1;');
    });

    test('Dont save button in unsaved changes modal allows to change text', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First action - Add index
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        await queryEditor.setQuery('SELECT 1;');
        // Store initial editor content
        const initialContent = await queryEditor.editorTextArea.inputValue();

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Click Don't save in the modal
        await unsavedChangesModal.clickDontSave();

        // Verify editor content has changed
        const newContent = await queryEditor.editorTextArea.inputValue();
        expect(newContent).not.toBe(initialContent);
        expect(newContent).not.toBe('');
    });

    test('Save query flow saves query and shows it in Saved tab', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);
        const queryEditor = new QueryEditor(page);
        const saveQueryDialog = new SaveQueryDialog(page);
        const savedQueriesTable = new SavedQueriesTable(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First action - Add index
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        await queryEditor.setQuery('SELECT 1;');

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Click Save query in the modal
        await unsavedChangesModal.clickSaveQuery();

        // Verify save query dialog appears and fill the name
        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        const queryName = `Test Query ${Date.now()}`;
        await saveQueryDialog.setQueryName(queryName);
        await saveQueryDialog.clickSave();

        // Switch to Saved tab and verify query exists
        await queryEditor.queryTabs.selectTab(QueryTabs.Saved);
        await page.waitForTimeout(500);
        await savedQueriesTable.isVisible();
        const row = await savedQueriesTable.waitForRow(queryName);
        expect(row).not.toBe(null);
    });

    test('New SQL dropdown menu works correctly', async ({page}) => {
        const newSqlDropdown = new NewSqlDropdownMenu(page);
        const queryEditor = new QueryEditor(page);

        // Open dropdown menu
        await newSqlDropdown.clickNewSqlButton();
        await expect(newSqlDropdown.isMenuVisible()).resolves.toBe(true);

        // Hover over Async replication category
        await newSqlDropdown.hoverCategory(TemplateCategory.AsyncReplication);
        await expect(newSqlDropdown.isSubMenuVisible()).resolves.toBe(true);

        // Select Create template
        await newSqlDropdown.selectTemplate(AsyncReplicationTemplates.Create);

        expect(queryEditor.editorTextArea).not.toBeEmpty();
    });

    test('Template selection shows unsaved changes warning when editor has content', async ({
        page,
    }) => {
        const newSqlDropdown = new NewSqlDropdownMenu(page);
        const queryEditor = new QueryEditor(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);

        // First set some content
        await queryEditor.setQuery('SELECT 1;');

        // Try to select a template
        await newSqlDropdown.clickNewSqlButton();
        await newSqlDropdown.hoverCategory(TemplateCategory.AsyncReplication);
        await newSqlDropdown.selectTemplate(AsyncReplicationTemplates.Create);

        // Verify unsaved changes modal appears
        await expect(unsavedChangesModal.isVisible()).resolves.toBe(true);
    });
    test('Switching between templates does not trigger unsaved changes modal', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const tenantPage = new TenantPage(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First select a template (Add Index)
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        // Without editing the template, switch to another template (Select Query)
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Verify unsaved changes modal does not appear
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);
    });

    test('Selecting a template and then opening history query does not trigger unsaved changes modal', async ({
        page,
    }) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);
        const tenantPage = new TenantPage(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First, run a query to ensure we have history to select from
        const testQuery = 'SELECT 1 AS test_column;';
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000); // Wait for the query to complete

        // Next, select a template
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        // Navigate to history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Select the query from history
        await queryEditor.historyQueries.selectQuery(testQuery);
        await page.waitForTimeout(500);

        // Verify no unsaved changes modal appeared
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);

        // Verify the query was loaded into the editor
        const editorValue = await queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(testQuery.trim());
    });
});
