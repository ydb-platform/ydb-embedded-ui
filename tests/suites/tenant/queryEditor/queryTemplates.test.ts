import {expect, test} from '@playwright/test';

import {dsVslotsSchema, dsVslotsTableName, tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
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
import {SavedQueriesTable} from './models/SavedQueriesTable';
import {UnsavedChangesModal} from './models/UnsavedChangesModal';

test.describe('Query Templates', () => {
    test.beforeEach(async ({page}) => {
        const pageQueryParams = {
            schema: dsVslotsSchema,
            database: tenantName,
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
        } catch (error) {
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
        } catch (error) {
            throw new Error(
                'Query execution neither completed successfully nor failed with expected error',
            );
        }
    });

    test('Unsaved changes modal appears when switching between templates', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);

        // First action - Add index
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Verify unsaved changes modal appears
        await expect(unsavedChangesModal.isVisible()).resolves.toBe(true);
    });

    test('Cancel button in unsaved changes modal preserves editor content', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);
        const queryEditor = new QueryEditor(page);

        // First action - Add index
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        // Store initial editor content
        const initialContent = await queryEditor.editorTextArea.inputValue();

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Click Cancel in the modal
        await unsavedChangesModal.clickCancel();

        // Verify editor content remains unchanged
        await expect(queryEditor.editorTextArea).toHaveValue(initialContent);
    });

    test('Dont save button in unsaved changes modal allows text to change', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const unsavedChangesModal = new UnsavedChangesModal(page);
        const queryEditor = new QueryEditor(page);

        // First action - Add index
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        // Store initial editor content
        const initialContent = await queryEditor.editorTextArea.inputValue();

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);
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

        // First action - Add index
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(dsVslotsTableName, RowTableAction.SelectQuery);
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
});
