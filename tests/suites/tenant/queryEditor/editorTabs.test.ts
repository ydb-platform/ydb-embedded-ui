import {expect, test} from '@playwright/test';

import {database} from '../../../utils/constants';
import {
    cleanupMockStreamingFetch,
    setupMockStreamingFetch,
} from '../../../utils/mockStreamingFetch';
import {pressTabHotkey} from '../../../utils/queryHotkeys';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {QueryEditorMode, TenantPage} from '../TenantPage';
import {longRunningStreamQuery} from '../constants';

import type {QueryEditor} from './models/QueryEditor';
import {RenameQueryDialog} from './models/RenameQueryDialog';
import {RunningQueryDialog} from './models/RunningQueryDialog';
import {SaveChangesDialog} from './models/SaveChangesDialog';
import {SaveQueryDialog} from './models/SaveQueryDialog';

test.describe('Editor tabs', () => {
    let tenantPage: TenantPage;
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        tenantPage = new TenantPage(page);
        await tenantPage.gotoQueryEditor({
            schema: database,
            database,
            mode: QueryEditorMode.MultiTab,
        });
        queryEditor = tenantPage.queryEditor;
    });

    test.afterEach(async ({page}) => {
        await cleanupMockStreamingFetch(page);
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

        await queryEditor.focusHotkeysTarget();
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
        const activeTabId = await queryEditor.editorTabs.getActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId!);
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
        const originalTabId = await queryEditor.editorTabs.getActiveTabId();
        const originalTitle = await queryEditor.editorTabs.getActiveTabTitle();
        const initialTabIds = await queryEditor.editorTabs.getTabIds();

        await queryEditor.editorTabs.openTabMenuById(originalTabId!);
        await queryEditor.editorTabs.clickMenuAction('Duplicate');

        await expect(queryEditor.editorTabs.waitForTabCount(2)).resolves.toBe(true);
        const nextTabIds = await queryEditor.editorTabs.getTabIds();
        const duplicatedTabId = nextTabIds.find((tabId) => !initialTabIds.includes(tabId));
        expect(duplicatedTabId).not.toBe(originalTabId);
        await expect(queryEditor.editorTabs.getTabTitleById(duplicatedTabId!)).resolves.toBe(
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
        const activeTabId = await queryEditor.editorTabs.getActiveTabId();
        const activeTabTitle = await queryEditor.editorTabs.getActiveTabTitle();

        await queryEditor.editorTabs.openTabMenuById(activeTabId!);
        await queryEditor.editorTabs.clickMenuAction('Save query as...');

        await expect(saveQueryDialog.isVisible()).resolves.toBe(true);
        await expect(saveQueryDialog.getQueryName()).resolves.toBe(activeTabTitle);
        await saveQueryDialog.clickCancel();
    });

    test('Save query as action validates empty query name', async ({page}) => {
        const saveQueryDialog = new SaveQueryDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        const activeTabId = await queryEditor.editorTabs.getActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId!);
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
        const activeTabId = await queryEditor.editorTabs.getActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId!);
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
        const activeTabId = await queryEditor.editorTabs.getActiveTabId();

        await queryEditor.editorTabs.openTabMenuById(activeTabId!);
        await queryEditor.editorTabs.clickMenuAction('Close tab');

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
    });

    test('Switching between saved and unsaved tabs updates the action button', async () => {
        const savedQueryName = `Saved Query ${Date.now()}`;

        await tenantPage.saveQuery('SELECT 1;', savedQueryName);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(savedQueryName);
        const savedTabId = await queryEditor.editorTabs.getActiveTabId();
        await expect(queryEditor.isEditButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isSaveButtonVisible(1000)).resolves.toBe(false);

        await queryEditor.editorTabs.clickAddTab();
        const newTabId = await queryEditor.editorTabs.getActiveTabId();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');
        await expect(queryEditor.isSaveButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isEditButtonVisible(1000)).resolves.toBe(false);

        await queryEditor.editorTabs.selectTabById(savedTabId!);
        await expect(queryEditor.isEditButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isSaveButtonVisible(1000)).resolves.toBe(false);

        await queryEditor.editorTabs.selectTabById(newTabId!);
        await expect(queryEditor.isSaveButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isEditButtonVisible(1000)).resolves.toBe(false);
    });

    test('Shows save changes dialog when closing a dirty newly created unnamed tab', async ({
        page,
    }) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 1;');

        await queryEditor.editorTabs.hoverTab('New Query 1');
        await queryEditor.editorTabs.closeTab('New Query 1');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.isTabSelected('New Query 1')).resolves.toBe(true);

        await queryEditor.editorTabs.hoverTab('New Query 1');
        await queryEditor.editorTabs.closeTab('New Query 1');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickDontSave();

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.isTabSelected('New Query')).resolves.toBe(true);
    });

    test('Shows save changes dialog when closing a dirty unnamed tab', async ({page}) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.editorTabs.selectTab('New Query');

        await queryEditor.editorTabs.hoverTab('New Query');
        await queryEditor.editorTabs.closeTab('New Query');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.isTabSelected('New Query')).resolves.toBe(true);

        await queryEditor.editorTabs.hoverTab('New Query');
        await queryEditor.editorTabs.closeTab('New Query');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickDontSave();

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.isTabSelected('New Query 1')).resolves.toBe(true);
    });

    test('Closing a dirty inactive tab by cross activates it before save dialog', async ({
        page,
    }) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.editorTabs.hoverTab('New Query');
        await queryEditor.editorTabs.closeTab('New Query');

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.isTabSelected('New Query')).resolves.toBe(true);
    });

    test('Close tab from menu activates a dirty inactive tab before save dialog', async ({
        page,
    }) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.isTabSelected('New Query')).resolves.toBe(true);
    });

    test('Shows save changes dialog when closing a dirty user-renamed tab', async ({page}) => {
        const renameQueryDialog = new RenameQueryDialog(page);
        const saveChangesDialog = new SaveChangesDialog(page);
        const nextTitle = 'Daily report';

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.selectTab('New Query');
        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Rename');

        await expect(renameQueryDialog.isVisible()).resolves.toBe(true);
        await renameQueryDialog.setTitle(nextTitle);
        await renameQueryDialog.clickApply();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe(nextTitle);

        await queryEditor.editorTabs.hoverTab(nextTitle);
        await queryEditor.editorTabs.closeTab(nextTitle);
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(1);
        await expect(queryEditor.editorTabs.isTabSelected(nextTitle)).resolves.toBe(true);
    });

    test('Shows confirmation when closing a running tab and stops it after confirmation', async ({
        page,
    }) => {
        const runningQueryDialog = new RunningQueryDialog(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page, {chunkIntervalMs: 1000});

        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.editorTabs.selectTab('New Query');
        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.editorTabs.hoverTab('New Query');
        await queryEditor.editorTabs.closeTab('New Query');
        await expect(runningQueryDialog.isVisible()).resolves.toBe(true);
        await runningQueryDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);

        await queryEditor.editorTabs.hoverTab('New Query');
        await queryEditor.editorTabs.closeTab('New Query');
        await expect(runningQueryDialog.isVisible()).resolves.toBe(true);
        await runningQueryDialog.clickStopAndClose();

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.isTabSelected('New Query 1')).resolves.toBe(true);
    });

    test('Close tab from menu activates a running inactive tab before confirmation', async ({
        page,
    }) => {
        const runningQueryDialog = new RunningQueryDialog(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page, {chunkIntervalMs: 1000});

        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.editorTabs.clickAddTab();
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query 1');

        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');

        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
        await expect(runningQueryDialog.isVisible()).resolves.toBe(true);
        await runningQueryDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.isTabSelected('New Query')).resolves.toBe(true);
    });

    test('Close other tabs closes clean tabs immediately and stops on save changes cancel', async ({
        page,
    }) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.editorTabs.selectTab('New Query 2');

        await queryEditor.editorTabs.openTabMenu('New Query 2');
        await queryEditor.editorTabs.clickMenuAction('Close other tabs');

        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabTitles()).resolves.toEqual([
            'New Query',
            'New Query 2',
        ]);
    });

    test('Close all tabs leaves a single cleared tab after dont save confirmation', async ({
        page,
    }) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();

        await queryEditor.editorTabs.openTabMenu('New Query 1');
        await queryEditor.editorTabs.clickMenuAction('Close all tabs');

        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickDontSave();

        await expect(queryEditor.editorTabs.waitForTabCount(1)).resolves.toBe(true);
        await expect(queryEditor.editorTabs.getActiveTabTitle()).resolves.toBe('New Query');
        await expect.poll(() => queryEditor.getEditorContent(), {timeout: 5000}).toBe('');
    });

    test('Close all tabs validates duplicate saved query names across consecutive save dialogs', async ({
        page,
    }) => {
        const saveChangesDialog = new SaveChangesDialog(page);
        const duplicateQueryName = `Duplicate Save ${Date.now()}`;

        await queryEditor.setQuery('SELECT 1 AS first_dirty_tab;');
        await queryEditor.editorTabs.clickAddTab();
        await queryEditor.setQuery('SELECT 2 AS second_dirty_tab;');

        await queryEditor.editorTabs.openTabMenu('New Query 1');
        await queryEditor.editorTabs.clickMenuAction('Close all tabs');

        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.setQueryName(duplicateQueryName);
        await saveChangesDialog.clickSave();

        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.setQueryName(duplicateQueryName);
        await saveChangesDialog.clickSave();

        await expect(saveChangesDialog.getValidationError()).resolves.toBe(
            'This name already exists',
        );
    });
});
