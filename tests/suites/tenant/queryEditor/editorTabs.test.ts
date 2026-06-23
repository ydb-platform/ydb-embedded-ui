import {expect, test} from '@playwright/test';

import {pressTabHotkey} from '../../../utils/queryHotkeys';

import {setupMultiTabQueryEditor} from './editorTabs.helpers';
import type {QueryEditor} from './models/QueryEditor';
import {RenameQueryDialog} from './models/RenameQueryDialog';
import {SaveChangesDialog} from './models/SaveChangesDialog';
import {SaveQueryDialog} from './models/SaveQueryDialog';

test.describe('Editor tabs', () => {
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        ({queryEditor} = await setupMultiTabQueryEditor(page));
    });

    test('Creates a new editor tab from the add button', async () => {
        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(1);

        await queryEditor.editorTabs.clickAddTab();

        await expect(queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');
        await expect(queryEditor.editorTabs.getTabTitles()).resolves.toEqual([
            'New Query',
            'New Query 1',
        ]);
    });

    test('Hotkey creates a new editor tab', async ({page}) => {
        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(1);

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'newTab');

        await expect(queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');
    });

    test('Close icon is hidden by default', async () => {
        await expect(queryEditor.editorTabs.getTabCloseIcon('New Query')).toBeHidden();
    });

    test('Hotkey closes a clean active tab', async ({page}) => {
        await queryEditor.editorTabs.clickAddTab();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'closeTab');

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
    });

    test('Close tab action on the last clean tab shows zero-tabs state', async () => {
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');

        await expect(queryEditor.editorTabs.isHidden()).resolves.toBe(true);
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);
        await expect(queryEditor.isResultsControlsHidden()).resolves.toBe(true);
    });

    test('Clicking zero-tabs state creates a new editor tab', async () => {
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);

        await queryEditor.clickZeroTabsState();

        await expect(queryEditor.editorTabs.isVisible()).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(1);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
        await expect(queryEditor.isZeroTabsStateHidden()).resolves.toBe(true);
    });

    test('Hotkey creates a new tab from zero-tabs state', async ({page}) => {
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'newTab');

        await expect(queryEditor.editorTabs.isVisible()).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(1);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
    });

    test('Reload restores zero-tabs state', async ({page}) => {
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);

        await page.reload();

        await expect(queryEditor.editorTabs.isHidden()).resolves.toBe(true);
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);
    });

    test('Zero-tabs state matches the default view', async () => {
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);

        await expect(queryEditor.getZeroTabsStateLocator()).toHaveScreenshot(
            'query-editor-zero-tabs-state.png',
        );
    });

    test('Zero-tabs state matches the hover view', async () => {
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);

        await queryEditor.hoverZeroTabsState();

        await expect(queryEditor.getZeroTabsStateLocator()).toHaveScreenshot(
            'query-editor-zero-tabs-state-hover.png',
        );
    });

    test('Hotkey shows save changes dialog when closing a dirty active tab', async ({page}) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 1;');

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'closeTab');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.isTabSelected('New Query 1')).resolves.toBe(true);

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'closeTab');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickDontSave();

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.isTabSelected('New Query')).resolves.toBe(true);
    });

    test('Hotkey opens rename dialog for the active tab', async ({page}) => {
        const renameQueryDialog = new RenameQueryDialog(page);

        await queryEditor.focusEditor();
        await pressTabHotkey(page, 'renameTab');

        await expect(renameQueryDialog.isVisible()).resolves.toBe(true);
        await renameQueryDialog.clickCancel();
    });

    test('Switches between tabs while keeping editor content isolated', async () => {
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 2;');

        await queryEditor.editorTabs.selectTab('New Query');
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe('SELECT 1;');

        await queryEditor.editorTabs.selectTab('New Query 1');
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe('SELECT 2;');
    });

    test('Hotkeys switch between tabs while keeping editor content isolated', async ({page}) => {
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 2;');

        const [firstTabId, secondTabId] = await queryEditor.editorTabs.getTabIds();

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'previousTab');
        await expect(queryEditor.editorTabs.getActiveTabId()).resolves.toBe(firstTabId);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe('SELECT 1;');

        await queryEditor.focusHotkeysTarget();
        await pressTabHotkey(page, 'nextTab');
        await expect(queryEditor.editorTabs.getActiveTabId()).resolves.toBe(secondTabId);
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe('SELECT 2;');
    });

    test('Opening tab menu on an inactive tab does not activate it', async () => {
        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 2;');
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.editorTabs.openTabMenu('New Query');

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');
    });

    test('Rename from tab menu activates the selected tab before opening the dialog', async ({
        page,
    }) => {
        const renameQueryDialog = new RenameQueryDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 2;');
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Rename');

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
        await expect(renameQueryDialog.isVisible()).resolves.toBe(true);
        await renameQueryDialog.clickCancel();
    });

    test('Save query as from tab menu activates the selected tab before opening the dialog', async ({
        page,
    }) => {
        const saveQueryDialog = new SaveQueryDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 2;');
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Save query as...');

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        await saveQueryDialog.clickCancel();
    });

    test('Closes a clean active tab and activates the adjacent one', async () => {
        await queryEditor.editorTabs.clickAddTab();

        await queryEditor.editorTabs.hoverTab('New Query 1');
        await queryEditor.editorTabs.closeTab('New Query 1');

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
    });

    test('Closing a clean inactive tab by cross keeps the current tab active', async () => {
        await queryEditor.editorTabs.clickAddTab();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.editorTabs.hoverTab('New Query');
        await queryEditor.editorTabs.closeTab('New Query');

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');
    });
});
