import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {database} from '../../../utils/constants';
import {QueryEditorMode, TenantPage} from '../TenantPage';

import {
    AsyncReplicationTemplates,
    NewSqlDropdownMenu,
    TemplateCategory,
} from './models/NewSqlDropdownMenu';

async function openQueryEditorMode(page: Page, mode: QueryEditorMode) {
    const tenantPage = new TenantPage(page);
    await tenantPage.gotoQueryEditor({
        schema: database,
        database,
        mode,
    });

    return tenantPage;
}

async function selectAsyncReplicationTemplate(
    dropdown: NewSqlDropdownMenu,
    template: AsyncReplicationTemplates,
) {
    await dropdown.clickNewSqlButton();
    await dropdown.hoverCategory(TemplateCategory.AsyncReplication);
    await dropdown.selectTemplate(template);
}

test.describe('Query Editor modes', () => {
    test('Single-tab mode renders editor without internal tabs', async ({page}) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.SingleTab);

        await expect(tenantPage.queryEditor.editorTabs.isHidden()).resolves.toBe(true);
    });

    test('Multi-tab mode renders editor with internal tabs', async ({page}) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.MultiTab);

        await expect(tenantPage.queryEditor.editorTabs.isVisible()).resolves.toBe(true);
        await expect(tenantPage.queryEditor.editorTabs.getTabCount()).resolves.toBe(1);
    });

    test('Single-tab mode recreates the editor after restoring zero-tabs state', async ({page}) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.MultiTab);

        await tenantPage.queryEditor.editorTabs.openTabMenu('New Query');
        await tenantPage.queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(tenantPage.queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);

        await tenantPage.gotoQueryEditor({
            schema: database,
            database,
            mode: QueryEditorMode.SingleTab,
        });

        await expect(tenantPage.queryEditor.editorTabs.isHidden()).resolves.toBe(true);
        await expect
            .poll(() => tenantPage.queryEditor.getEditorContent(), {timeout: 5000})
            .toBe('');

        const newSqlDropdown = new NewSqlDropdownMenu(page);
        await selectAsyncReplicationTemplate(newSqlDropdown, AsyncReplicationTemplates.Create);

        await expect
            .poll(() => tenantPage.queryEditor.getEditorContent(), {timeout: 5000})
            .not.toBe('');
    });

    test('Single-tab mode asks for confirmation before replacing dirty editor content with template', async ({
        page,
    }) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.SingleTab);
        const newSqlDropdown = new NewSqlDropdownMenu(page);

        await tenantPage.queryEditor.setQuery('SELECT 1;');

        await newSqlDropdown.clickNewSqlButton();
        await newSqlDropdown.hoverCategory(TemplateCategory.AsyncReplication);
        await newSqlDropdown.selectTemplate(AsyncReplicationTemplates.Create);

        await expect(tenantPage.unsavedChangesModal.isVisible()).resolves.toBe(true);

        await tenantPage.unsavedChangesModal.clickCancel();
        await expect
            .poll(() => tenantPage.queryEditor.getEditorContent(), {timeout: 5000})
            .toBe('SELECT 1;');
    });

    test('Multi-tab mode opens template in a separate tab without confirmation', async ({page}) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.MultiTab);
        const newSqlDropdown = new NewSqlDropdownMenu(page);

        await tenantPage.queryEditor.setQuery('SELECT 1;');
        const beforeTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();

        await selectAsyncReplicationTemplate(newSqlDropdown, AsyncReplicationTemplates.Create);

        await expect(tenantPage.isUnsavedChangesModalHidden()).resolves.toBe(true);
        await expect(tenantPage.queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        const afterTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();
        expect(afterTabId).not.toBe(beforeTabId);
        await expect(
            tenantPage.queryEditor.editorTabs.isTabSelected(AsyncReplicationTemplates.Create),
        ).resolves.toBe(true);
        await expect
            .poll(() => tenantPage.queryEditor.getEditorContent(), {timeout: 5000})
            .not.toBe('SELECT 1;');
    });

    test('Multi-tab mode reuses the current untouched template tab', async ({page}) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.MultiTab);
        const newSqlDropdown = new NewSqlDropdownMenu(page);

        await selectAsyncReplicationTemplate(newSqlDropdown, AsyncReplicationTemplates.Create);
        await expect
            .poll(() => tenantPage.queryEditor.getEditorContent(), {timeout: 5000})
            .not.toBe('');
        const beforeTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();

        await selectAsyncReplicationTemplate(newSqlDropdown, AsyncReplicationTemplates.Alter);

        await expect(tenantPage.isUnsavedChangesModalHidden()).resolves.toBe(true);
        await expect(tenantPage.queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        const afterTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();
        expect(afterTabId).toBe(beforeTabId);
        await expect(tenantPage.queryEditor.editorTabs.getTabTitles()).resolves.toEqual([
            AsyncReplicationTemplates.Alter,
        ]);
    });

    test('Multi-tab mode opens a new tab for the next template after manual edit', async ({
        page,
    }) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.MultiTab);
        const newSqlDropdown = new NewSqlDropdownMenu(page);

        await selectAsyncReplicationTemplate(newSqlDropdown, AsyncReplicationTemplates.Create);
        await expect
            .poll(() => tenantPage.queryEditor.getEditorContent(), {timeout: 5000})
            .not.toBe('');
        const beforeTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();

        await tenantPage.queryEditor.setQuery('SELECT 42;');
        await selectAsyncReplicationTemplate(newSqlDropdown, AsyncReplicationTemplates.Alter);

        await expect(tenantPage.isUnsavedChangesModalHidden()).resolves.toBe(true);
        await expect(tenantPage.queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        const afterTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();
        expect(afterTabId).not.toBe(beforeTabId);
        await expect(tenantPage.queryEditor.editorTabs.getTabTitles()).resolves.toEqual([
            AsyncReplicationTemplates.Create,
            AsyncReplicationTemplates.Alter,
        ]);
    });

    test('Multi-tab mode opens a new tab for the next template after run', async ({page}) => {
        const tenantPage = await openQueryEditorMode(page, QueryEditorMode.MultiTab);
        const newSqlDropdown = new NewSqlDropdownMenu(page);

        await tenantPage.queryEditor.setQuery('SELECT 1;');
        await tenantPage.queryEditor.clickRunButton();
        await expect(tenantPage.queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        const beforeTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();

        await selectAsyncReplicationTemplate(newSqlDropdown, AsyncReplicationTemplates.Create);

        await expect(tenantPage.isUnsavedChangesModalHidden()).resolves.toBe(true);
        await expect(tenantPage.queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        const afterTabId = await tenantPage.queryEditor.editorTabs.getActiveTabId();
        expect(afterTabId).not.toBe(beforeTabId);
        await expect(
            tenantPage.queryEditor.editorTabs.isTabSelected(AsyncReplicationTemplates.Create),
        ).resolves.toBe(true);
    });
});
