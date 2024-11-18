import {expect, test} from '@playwright/test';

import {dsVslotsSchema, dsVslotsTableName, tenantName} from '../../../utils/constants';
import {TenantPage} from '../TenantPage';
import {ObjectSummary} from '../summary/ObjectSummary';
import {RowTableAction} from '../summary/types';

import {QueryEditor, QueryTabs} from './QueryEditor';
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
});
