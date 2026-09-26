import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {backend, database} from '../../../utils/constants';
import {QueryEditorMode, TenantPage} from '../TenantPage';
import {SavedQueriesTable} from '../savedQueries/models/SavedQueriesTable';
import {ObjectSummary} from '../summary/ObjectSummary';
import {RowTableAction, SecretAction, TopicAction} from '../summary/types';

import {
    AsyncReplicationTemplates,
    NewSqlDropdownMenu,
    SecretTemplates,
    TablesTemplates,
    TemplateCategory,
    TopicTemplates,
} from './models/NewSqlDropdownMenu';
import {QueryEditor, QueryTabs} from './models/QueryEditor';
import {SaveQueryDialog} from './models/SaveQueryDialog';

type QueryEditorFeatureFlag = 'EnableSchemaSecrets' | 'EnableTopicsSqlIoOperations';

async function reopenQueryEditorWithFeatureFlag(
    page: Page,
    featureFlag: QueryEditorFeatureFlag,
    enabled: boolean,
) {
    await page.route(`${backend}/viewer/feature_flags*`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Databases: [
                    {
                        Name: database,
                        FeatureFlags: [
                            {
                                Name: featureFlag,
                                Current: enabled,
                                Default: false,
                            },
                        ],
                    },
                ],
            }),
        });
    });

    const tenantPage = new TenantPage(page);
    const [featureFlagsResponse] = await Promise.all([
        page.waitForResponse(
            (response) =>
                response.url().startsWith(`${backend}/viewer/feature_flags`) && response.ok(),
        ),
        tenantPage.gotoQueryEditor({
            schema: database,
            database,
            mode: QueryEditorMode.MultiTab,
        }),
    ]);
    await featureFlagsResponse.finished();
}

test.describe('Query Templates', () => {
    test.beforeEach(async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.gotoQueryEditor({
            schema: database,
            database,
            mode: QueryEditorMode.MultiTab,
        });
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

    test('Switching between schema templates after manual edit opens a new tab', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const tenantPage = new TenantPage(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First action - Add index
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        await queryEditor.setQuery('SELECT 1;');
        const initialTabId = await queryEditor.editorTabs.getActiveTabId();
        if (!initialTabId) {
            throw new Error('Expected an active editor tab');
        }

        const initialTabCount = await queryEditor.editorTabs.getTabCount();

        // Try to switch to Select query
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);
        await expect(queryEditor.editorTabs.waitForTabCount(initialTabCount + 1)).resolves.toBe(
            true,
        );

        const nextTabId = await queryEditor.editorTabs.getActiveTabId();
        expect(nextTabId).not.toBe(initialTabId);

        await queryEditor.editorTabs.selectTabById(initialTabId);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe('SELECT 1;');
    });

    test('Save query flow saves query and shows it in Saved tab', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);
        const saveQueryDialog = new SaveQueryDialog(page);
        const savedQueriesTable = new SavedQueriesTable(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First action - Add index
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickSaveButton();

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

    test('New SQL secrets menu inserts create secret template', async ({page}) => {
        await reopenQueryEditorWithFeatureFlag(page, 'EnableSchemaSecrets', true);

        const newSqlDropdown = new NewSqlDropdownMenu(page);
        const queryEditor = new QueryEditor(page);

        await newSqlDropdown.clickNewSqlButton();
        await newSqlDropdown.hoverCategory(TemplateCategory.Secrets);
        await newSqlDropdown.selectTemplate(SecretTemplates.Create);

        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toContain('CREATE SECRET my_secret');

        const editorContent = await queryEditor.getEditorContent();
        expect(editorContent).toContain("VALUE = 'secret_value'");
    });

    test('New SQL secrets menu is hidden when schema secrets feature is disabled', async ({
        page,
    }) => {
        await reopenQueryEditorWithFeatureFlag(page, 'EnableSchemaSecrets', false);

        const newSqlDropdown = new NewSqlDropdownMenu(page);

        await newSqlDropdown.clickNewSqlButton();

        await expect
            .poll(() => newSqlDropdown.isCategoryVisible(TemplateCategory.Secrets), {timeout: 5000})
            .toBe(false);
    });

    test('Secret context menu inserts alter secret template for selected secret', async ({
        page,
    }) => {
        await reopenQueryEditorWithFeatureFlag(page, 'EnableSchemaSecrets', true);

        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        const secretName = await queryEditor.createNewFakeSecret();
        await objectSummary.clickRefreshButton();

        await objectSummary.clickActionMenuItem(secretName, SecretAction.Alter);

        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toContain(`ALTER SECRET \`${secretName}\``);

        const editorContent = await queryEditor.getEditorContent();
        expect(editorContent).toContain("VALUE = 'secret_value'");
    });

    test('Secret context menu hides alter and drop actions when feature is disabled', async ({
        page,
    }) => {
        const queryEditor = new QueryEditor(page);
        const secretName = await queryEditor.createNewFakeSecret();

        await reopenQueryEditorWithFeatureFlag(page, 'EnableSchemaSecrets', false);

        const objectSummary = new ObjectSummary(page);
        await objectSummary.clickRefreshButton();

        await objectSummary.clickActionsButton(secretName);

        await expect
            .poll(() => objectSummary.getActionsMenuItems(), {timeout: 5000})
            .toContain(RowTableAction.CopyPath);

        const menuItems = await objectSummary.getActionsMenuItems();
        expect(menuItems).not.toContain(SecretAction.Alter);
        expect(menuItems).not.toContain(SecretAction.Drop);
    });

    test('New SQL topics menu inserts topic select template', async ({page}) => {
        await reopenQueryEditorWithFeatureFlag(page, 'EnableTopicsSqlIoOperations', true);

        const newSqlDropdown = new NewSqlDropdownMenu(page);
        const queryEditor = new QueryEditor(page);

        await newSqlDropdown.clickNewSqlButton();
        await newSqlDropdown.hoverCategory(TemplateCategory.Topics);
        await newSqlDropdown.selectTemplate(TopicTemplates.Select);

        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toContain('__ydb_write_time');

        const editorContent = await queryEditor.getEditorContent();
        expect(editorContent).toContain('FROM <my_topic>');
        expect(editorContent).toContain('LIMIT 10;');
    });

    test('New SQL topics menu hides topic select template when SQL I/O feature is disabled', async ({
        page,
    }) => {
        await reopenQueryEditorWithFeatureFlag(page, 'EnableTopicsSqlIoOperations', false);

        const newSqlDropdown = new NewSqlDropdownMenu(page);

        await newSqlDropdown.clickNewSqlButton();
        await newSqlDropdown.hoverCategory(TemplateCategory.Topics);

        await expect
            .poll(() => newSqlDropdown.isTemplateVisible(TopicTemplates.Select), {timeout: 5000})
            .toBe(false);
    });

    test('Topic context menu inserts topic select template for selected topic', async ({page}) => {
        await reopenQueryEditorWithFeatureFlag(page, 'EnableTopicsSqlIoOperations', true);

        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        const topicName = await queryEditor.createNewFakeTopic();
        await objectSummary.clickRefreshButton();

        await objectSummary.clickActionMenuItem(topicName, TopicAction.SelectQuery);

        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toContain(`FROM \`${topicName}\``);

        const editorContent = await queryEditor.getEditorContent();
        expect(editorContent).toContain('__ydb_offset');
    });

    test('Topic context menu hides select query when SQL I/O feature is disabled', async ({
        page,
    }) => {
        await reopenQueryEditorWithFeatureFlag(page, 'EnableTopicsSqlIoOperations', false);

        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        const topicName = await queryEditor.createNewFakeTopic();
        await objectSummary.clickRefreshButton();

        await objectSummary.clickActionsButton(topicName);

        await expect
            .poll(() => objectSummary.getActionsMenuItems(), {timeout: 5000})
            .toContain(RowTableAction.CopyPath);

        const menuItems = await objectSummary.getActionsMenuItems();
        expect(menuItems).not.toContain(TopicAction.SelectQuery);
    });

    test('Switching between untouched schema templates reuses the current template tab', async ({
        page,
    }) => {
        const objectSummary = new ObjectSummary(page);
        const tenantPage = new TenantPage(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        // First select a template (Add Index)
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);
        const initialTabId = await queryEditor.editorTabs.getActiveTabId();
        const initialTabCount = await queryEditor.editorTabs.getTabCount();

        // Without editing the template, switch to another template (Select Query)
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.SelectQuery);
        await page.waitForTimeout(500);

        // Verify unsaved changes modal does not appear and the untouched tab is reused
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);
        await expect(queryEditor.editorTabs.waitForTabCount(initialTabCount)).resolves.toBe(true);
        const nextTabId = await queryEditor.editorTabs.getActiveTabId();
        expect(nextTabId).toBe(initialTabId);
    });

    test('Selecting a template and then opening history query reuses the untouched tab', async ({
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
        await page.waitForTimeout(1000);

        // Next, select a template
        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddIndex);
        await page.waitForTimeout(500);
        await expect(queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        const templateTabId = await queryEditor.editorTabs.getActiveTabId();

        // Navigate to history tab
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.historyQueries.isVisible();

        // Select the query from history
        await queryEditor.historyQueries.selectQuery(testQuery);
        await page.waitForTimeout(500);

        // Verify no unsaved changes modal appeared and tab was reused
        const isModalHidden = await tenantPage.isUnsavedChangesModalHidden();
        expect(isModalHidden).toBe(true);
        await expect(queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        const afterTabId = await queryEditor.editorTabs.getActiveTabId();
        expect(afterTabId).toBe(templateTabId);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(testQuery);

        // Verify the query was loaded into the editor
        const editorValue = await queryEditor.editorTextArea.inputValue();
        expect(editorValue.trim()).toBe(testQuery.trim());
    });

    test('Add vector index template only contains distance setting', async ({page}) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddVectorIndex);

        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toContain('vector_kmeans_tree');

        const editorContent = await queryEditor.getEditorContent();
        expect(editorContent).toContain('distance=cosine');
    });

    test('Add fulltext index template contains fulltext_relevance and use_filter_snowball', async ({
        page,
    }) => {
        const objectSummary = new ObjectSummary(page);
        const queryEditor = new QueryEditor(page);

        const tableName = await queryEditor.createNewFakeTable();
        await objectSummary.clickRefreshButton();

        await objectSummary.clickActionMenuItem(tableName, RowTableAction.AddFulltextIndex);

        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toContain('fulltext_relevance');

        const editorContent = await queryEditor.getEditorContent();
        expect(editorContent).toContain('use_filter_snowball');
        expect(editorContent).toContain('tokenizer');
        expect(editorContent).toContain('use_filter_lowercase');
    });
});
