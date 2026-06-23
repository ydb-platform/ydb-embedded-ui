import {expect, test} from '@playwright/test';

import {pressTabHotkey} from '../../../utils/queryHotkeys';
import type {TenantPage} from '../TenantPage';

import {setupMultiTabQueryEditor} from './editorTabs.helpers';
import type {QueryEditor} from './models/QueryEditor';
import {RenameQueryDialog} from './models/RenameQueryDialog';
import {SaveQueryDialog} from './models/SaveQueryDialog';

test.describe('Editor tabs menu and save actions', () => {
    let tenantPage: TenantPage;
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        ({tenantPage, queryEditor} = await setupMultiTabQueryEditor(page));
    });

    test('Save query dialog uses the current tab title as the default query name', async ({
        page,
    }) => {
        const renameQueryDialog = new RenameQueryDialog(page);
        const saveQueryDialog = new SaveQueryDialog(page);
        const nextTitle = 'Daily Metrics Query';

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.selectTab('New Query');
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Rename');

        await expect(renameQueryDialog.isVisible()).resolves.toBe(true);
        await renameQueryDialog.setTitle(nextTitle);
        await renameQueryDialog.clickApply();

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(nextTitle);

        await queryEditor.clickSaveButton();
        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        await expect(saveQueryDialog.getQueryName()).resolves.toBe(nextTitle);
        await saveQueryDialog.clickCancel();
    });

    test('Renamed tab title persists after page reload', async ({page}) => {
        const renameQueryDialog = new RenameQueryDialog(page);
        const nextTitle = 'Daily Metrics Query';

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.selectTab('New Query');
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Rename');

        await expect(renameQueryDialog.isVisible()).resolves.toBe(true);
        await renameQueryDialog.setTitle(nextTitle);
        await renameQueryDialog.clickApply();

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(nextTitle);
        await page.reload();

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(nextTitle);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe('SELECT 1;');
    });

    test('Tab menu shows the expected actions', async () => {
        const activeTabId = await queryEditor.getRequiredActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId);
        const menuActions = await queryEditor.editorTabs.getMenuActions();

        expect(menuActions.some((action) => action.includes('Rename'))).toBe(true);
        expect(menuActions.some((action) => action.includes('Duplicate'))).toBe(true);
        expect(menuActions.some((action) => action.includes('Save query as...'))).toBe(true);
        expect(menuActions.some((action) => action.includes('Close tab'))).toBe(true);
        expect(menuActions.some((action) => action.includes('Close other tabs'))).toBe(true);
        expect(menuActions.some((action) => action.includes('Close all tabs'))).toBe(true);
    });

    test('Duplicate action in tab menu creates a new active tab with copied content', async () => {
        const queryText = 'SELECT 1;';

        await queryEditor.setQuery(queryText);
        const originalTabId = await queryEditor.getRequiredActiveTabId();
        const originalTitle = await queryEditor.editorTabs.getActiveTabTitle();
        const initialTabIds = await queryEditor.editorTabs.getTabIds();

        await queryEditor.editorTabs.openTabMenuById(originalTabId);
        await queryEditor.editorTabs.clickMenuAction('Duplicate');

        await expect(queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        const nextTabIds = await queryEditor.editorTabs.getTabIds();
        const duplicatedTabId = nextTabIds.find((tabId) => !initialTabIds.includes(tabId));
        expect(duplicatedTabId).not.toBe(originalTabId);
        if (!duplicatedTabId) {
            throw new Error('Expected duplicated tab id');
        }
        await expect(queryEditor.editorTabs.getTabTitleById(duplicatedTabId)).resolves.toBe(
            `${originalTitle} copy`,
        );
        await expect
            .poll(() => queryEditor.editorTabs.getActiveTabId(), {timeout: 5000})
            .toBe(duplicatedTabId);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe(queryText);
    });

    test('Save query as action in tab menu opens save dialog with current tab title', async ({
        page,
    }) => {
        const saveQueryDialog = new SaveQueryDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        const activeTabId = await queryEditor.getRequiredActiveTabId();
        const activeTabTitle = await queryEditor.editorTabs.getActiveTabTitle();

        await queryEditor.editorTabs.openTabMenuById(activeTabId);
        await queryEditor.editorTabs.clickMenuAction('Save query as...');

        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        await expect(saveQueryDialog.getQueryName()).resolves.toBe(activeTabTitle);
        await saveQueryDialog.clickCancel();
    });

    test('Save query as action validates empty query name', async ({page}) => {
        const saveQueryDialog = new SaveQueryDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        const activeTabId = await queryEditor.getRequiredActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId);
        await queryEditor.editorTabs.clickMenuAction('Save query as...');

        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        await saveQueryDialog.setQueryName('');
        await saveQueryDialog.clickSave();

        await expect(saveQueryDialog.getValidationError()).resolves.toBe(
            'Name should not be empty',
        );
        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
    });

    test('Save query as action in tab menu saves query and updates tab state', async ({page}) => {
        const saveQueryDialog = new SaveQueryDialog(page);
        const queryText = 'SELECT 1 AS saved_from_tab_menu;';
        const queryName = `Saved From Tab Menu ${Date.now()}`;

        await queryEditor.setQuery(queryText);
        const activeTabId = await queryEditor.getRequiredActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId);
        await queryEditor.editorTabs.clickMenuAction('Save query as...');

        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        await saveQueryDialog.setQueryName(queryName);
        await saveQueryDialog.clickSave();

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(queryName);
        await expect(queryEditor.isEditButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isSaveButtonVisible(1000)).resolves.toBe(false);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe(queryText);
    });

    test('Hotkey save query as saves query and updates tab state', async ({page}) => {
        const saveQueryDialog = new SaveQueryDialog(page);
        const queryText = 'SELECT 1 AS saved_from_hotkey;';
        const queryName = `Saved From Hotkey ${Date.now()}`;

        await queryEditor.setQuery(queryText);

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'saveQueryAs');

        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        await saveQueryDialog.setQueryName(queryName);
        await saveQueryDialog.clickSave();

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(queryName);
        await expect(queryEditor.isEditButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isSaveButtonVisible(1000)).resolves.toBe(false);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe(queryText);
    });

    test('Close tab action in tab menu closes the current clean tab', async () => {
        await queryEditor.editorTabs.clickAddTab();
        const activeTabId = await queryEditor.getRequiredActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId);
        await queryEditor.editorTabs.clickMenuAction('Close tab');

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
    });

    test('Switching between saved and unsaved tabs updates the action button', async () => {
        const savedQueryName = `Saved Query ${Date.now()}`;

        await tenantPage.saveQuery('SELECT 1;', savedQueryName);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(savedQueryName);
        const savedTabId = await queryEditor.getRequiredActiveTabId();
        await expect(queryEditor.isEditButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isSaveButtonVisible(1000)).resolves.toBe(false);

        await queryEditor.editorTabs.clickAddTab();
        const newTabId = await queryEditor.getRequiredActiveTabId();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');
        await expect(queryEditor.isSaveButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isEditButtonVisible(1000)).resolves.toBe(false);

        await queryEditor.editorTabs.selectTabById(savedTabId);
        await expect(queryEditor.isEditButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isSaveButtonVisible(1000)).resolves.toBe(false);

        await queryEditor.editorTabs.selectTabById(newTabId);
        await expect(queryEditor.isSaveButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isEditButtonVisible(1000)).resolves.toBe(false);
    });
});
