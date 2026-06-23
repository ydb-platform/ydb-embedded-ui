import {expect, test} from '@playwright/test';

import {
    cleanupMockStreamingFetch,
    setupMockStreamingFetch,
} from '../../../utils/mockStreamingFetch';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {longRunningStreamQuery} from '../constants';

import {setupMultiTabQueryEditor} from './editorTabs.helpers';
import type {QueryEditor} from './models/QueryEditor';
import {RenameQueryDialog} from './models/RenameQueryDialog';
import {RunningQueryDialog} from './models/RunningQueryDialog';
import {SaveChangesDialog} from './models/SaveChangesDialog';

test.describe('Editor tabs close confirmations', () => {
    let queryEditor: QueryEditor;

    test.beforeEach(async ({page}) => {
        ({queryEditor} = await setupMultiTabQueryEditor(page));
    });

    test.afterEach(async ({page}) => {
        await cleanupMockStreamingFetch(page);
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

        await expect
            .poll(() => queryEditor.editorTabs.getActiveTabTitle(), {timeout: 5000})
            .toBe('New Query');
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

        await expect
            .poll(() => queryEditor.editorTabs.getActiveTabTitle(), {timeout: 5000})
            .toBe('New Query');
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

    test('Closing the last dirty tab can end in zero-tabs state', async ({page}) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.setQuery('SELECT 1 AS zero_tabs_dirty_last;');

        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickDontSave();

        await expect(queryEditor.editorTabs.isHidden()).resolves.toBe(true);
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);
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

        await expect
            .poll(() => queryEditor.editorTabs.getActiveTabTitle(), {timeout: 5000})
            .toBe('New Query');
        await expect(runningQueryDialog.isVisible()).resolves.toBe(true);
        await runningQueryDialog.clickCancel();

        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.isTabSelected('New Query')).resolves.toBe(true);
    });

    test('Closing the last running tab can end in zero-tabs state', async ({page}) => {
        const runningQueryDialog = new RunningQueryDialog(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page, {chunkIntervalMs: 1000});

        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.editorTabs.openTabMenu('New Query');
        await queryEditor.editorTabs.clickMenuAction('Close tab');
        await expect(runningQueryDialog.isVisible()).resolves.toBe(true);
        await runningQueryDialog.clickStopAndClose();

        await expect(queryEditor.editorTabs.isHidden()).resolves.toBe(true);
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);
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

    test('Close all tabs shows zero-tabs state after dont save confirmation', async ({page}) => {
        const saveChangesDialog = new SaveChangesDialog(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.editorTabs.clickAddTab();

        await queryEditor.editorTabs.openTabMenu('New Query 1');
        await queryEditor.editorTabs.clickMenuAction('Close all tabs');

        await expect(saveChangesDialog.isVisible()).resolves.toBe(true);
        await saveChangesDialog.clickDontSave();

        await expect(queryEditor.editorTabs.isHidden()).resolves.toBe(true);
        await expect(queryEditor.isZeroTabsStateVisible()).resolves.toBe(true);
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
