import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {database} from '../../../utils/constants';
import {
    cleanupMockStreamingFetch,
    setupMockStreamingFetch,
} from '../../../utils/mockStreamingFetch';
import {waitForBeforeUnloadDialog} from '../../../utils/queryHotkeys';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {QueryEditorMode, TenantPage} from '../TenantPage';
import {longRunningStreamQuery} from '../constants';

const QUERIES_HISTORY_SETTING_KEY = 'queries_history';

async function openMultiTabQueryEditor(page: Page) {
    const tenantPage = new TenantPage(page);
    await tenantPage.gotoQueryEditor({
        schema: database,
        database,
        mode: QueryEditorMode.MultiTab,
    });

    return tenantPage;
}

async function openSingleTabQueryEditor(page: Page) {
    const tenantPage = new TenantPage(page);
    await tenantPage.gotoQueryEditor({
        schema: database,
        database,
        mode: QueryEditorMode.SingleTab,
    });

    return tenantPage;
}

async function seedQueriesHistory(
    page: Page,
    queries: Array<{queryId: string; queryText: string}>,
) {
    await page.addInitScript(
        ({key, value}) => {
            localStorage.setItem(key, JSON.stringify(value));
        },
        {key: QUERIES_HISTORY_SETTING_KEY, value: queries},
    );
}

async function prepareInactiveRunningTab(tenantPage: TenantPage) {
    const {queryEditor} = tenantPage;
    await toggleExperiment(tenantPage.page, 'on', 'Query Streaming');
    await setupMockStreamingFetch(tenantPage.page, {chunkIntervalMs: 1000});

    const runningTabId = await queryEditor.editorTabs.getActiveTabId();

    await queryEditor.editorTabs.clickAddTab();
    const cleanTabId = await queryEditor.editorTabs.getActiveTabId();

    await queryEditor.editorTabs.selectTabById(runningTabId!);
    await queryEditor.setQuery(longRunningStreamQuery);
    await queryEditor.clickRunButton();
    await expect(queryEditor.waitForAnyStatus(['Running', 'Fetching'])).resolves.toBeTruthy();

    await queryEditor.editorTabs.selectTabById(cleanTabId!);
    await expect(queryEditor.editorTabs.getActiveTabId()).resolves.toBe(cleanTabId);

    return {runningTabId: runningTabId!, cleanTabId: cleanTabId!};
}

async function prepareInactiveDirtyTab(tenantPage: TenantPage) {
    const {queryEditor} = tenantPage;
    const dirtyTabId = await queryEditor.editorTabs.getActiveTabId();

    await queryEditor.editorTabs.clickAddTab();
    const cleanTabId = await queryEditor.editorTabs.getActiveTabId();

    await queryEditor.editorTabs.selectTabById(dirtyTabId!);
    await queryEditor.setQuery('SELECT 1 AS beforeunload_dirty_tab;');
    await queryEditor.editorTabs.selectTabById(cleanTabId!);
    await expect(queryEditor.editorTabs.getActiveTabId()).resolves.toBe(cleanTabId);

    return {dirtyTabId: dirtyTabId!, cleanTabId: cleanTabId!};
}

test.describe('Query page leave', () => {
    test.afterEach(async ({page}) => {
        if (page.isClosed()) {
            return;
        }
        await cleanupMockStreamingFetch(page);
    });

    test('Reload shows beforeunload in single-tab when current text differs from last history query', async ({
        page,
    }) => {
        const tenantPage = await openSingleTabQueryEditor(page);
        const {queryEditor} = tenantPage;

        await queryEditor.setQuery('SELECT 42 AS single_tab_beforeunload;');

        const {dialog, triggerPromise} = await waitForBeforeUnloadDialog(page, () =>
            page.reload({timeout: 5000}),
        );

        await dialog.dismiss();
        await triggerPromise;

        expect(page.isClosed()).toBe(false);
        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toBe('SELECT 42 AS single_tab_beforeunload;');
    });

    test('Reload does not show beforeunload in single-tab when current text matches last history query', async ({
        page,
    }) => {
        await seedQueriesHistory(page, [
            {queryId: 'history-query-1', queryText: 'SELECT 1 AS single_tab_history_match;'},
        ]);
        const tenantPage = await openSingleTabQueryEditor(page);
        const {queryEditor} = tenantPage;

        await queryEditor.setQuery('SELECT 1 AS single_tab_history_match;');

        const dialogPromise = page
            .waitForEvent('dialog', {timeout: 1000})
            .then(async (dialog) => {
                await dialog.dismiss();
                return dialog.type();
            })
            .catch(() => undefined);

        await page.reload({timeout: 5000});

        await expect(dialogPromise).resolves.toBeUndefined();
        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toBe('SELECT 1 AS single_tab_history_match;');
    });

    test('Reload shows beforeunload when a non-active tab is running', async ({page}) => {
        const tenantPage = await openMultiTabQueryEditor(page);
        const {queryEditor} = tenantPage;
        const {runningTabId, cleanTabId} = await prepareInactiveRunningTab(tenantPage);

        const {dialog, triggerPromise} = await waitForBeforeUnloadDialog(page, () =>
            page.reload({timeout: 5000}),
        );

        await dialog.dismiss();
        await triggerPromise;

        expect(page.isClosed()).toBe(false);
        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.getActiveTabId()).resolves.toBe(cleanTabId);

        await queryEditor.editorTabs.selectTabById(runningTabId);
        await expect(queryEditor.waitForAnyStatus(['Running', 'Fetching'])).resolves.toBeTruthy();
    });

    test('Reload shows beforeunload when a non-active tab is dirty', async ({page}) => {
        const tenantPage = await openMultiTabQueryEditor(page);
        const {queryEditor} = tenantPage;
        const {dirtyTabId, cleanTabId} = await prepareInactiveDirtyTab(tenantPage);

        const {dialog, triggerPromise} = await waitForBeforeUnloadDialog(page, () =>
            page.reload({timeout: 5000}),
        );

        await dialog.dismiss();
        await triggerPromise;

        expect(page.isClosed()).toBe(false);
        await expect(queryEditor.editorTabs.getTabCount()).resolves.toBe(2);
        await expect(queryEditor.editorTabs.getActiveTabId()).resolves.toBe(cleanTabId);

        await queryEditor.editorTabs.selectTabById(dirtyTabId);
        await expect
            .poll(() => queryEditor.getEditorContent(), {timeout: 5000})
            .toBe('SELECT 1 AS beforeunload_dirty_tab;');
    });

    test('Page close with runBeforeUnload shows beforeunload for running tab and dismiss keeps page open', async ({
        page,
    }) => {
        const tenantPage = await openMultiTabQueryEditor(page);
        const {queryEditor} = tenantPage;
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page, {chunkIntervalMs: 1000});

        await queryEditor.setQuery(longRunningStreamQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForAnyStatus(['Running', 'Fetching'])).resolves.toBeTruthy();

        const {dialog, triggerPromise} = await waitForBeforeUnloadDialog(page, () =>
            page.close({runBeforeUnload: true}),
        );

        await dialog.dismiss();
        await triggerPromise;

        expect(page.isClosed()).toBe(false);
        await expect(queryEditor.waitForAnyStatus(['Running', 'Fetching'])).resolves.toBeTruthy();
    });

    test('Page close with runBeforeUnload closes page after accept', async ({page}) => {
        const tenantPage = await openMultiTabQueryEditor(page);
        const {queryEditor} = tenantPage;

        await queryEditor.setQuery('SELECT 1 AS close_after_accept;');

        const pageClosePromise = page.waitForEvent('close');
        const {dialog, triggerPromise} = await waitForBeforeUnloadDialog(page, () =>
            page.close({runBeforeUnload: true}),
        );

        await dialog.accept();
        await triggerPromise;
        await pageClosePromise;

        expect(page.isClosed()).toBe(true);
    });
});
