import {expect, test} from '@playwright/test';

import {QUERY_MODES} from '../../../../src/utils/query';
import {
    cleanupMockStreamingFetch,
    setupMockStreamingFetch,
} from '../../../utils/mockStreamingFetch';
import {executeQueryWithKeybinding} from '../../../utils/queryHotkeys';
import {toggleExperiment} from '../../../utils/toggleExperiment';
import {longRunningQuery} from '../constants';

import {ButtonNames, QueryTabs} from './models/QueryEditor';
import {setupQueryEditor} from './queryEditor.helpers';

test.describe('Query editor stop controls', () => {
    test.afterEach(async ({page}) => {
        await cleanupMockStreamingFetch(page);
    });

    test('Stop button and elapsed time label appear when query is running', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isElapsedTimeVisible()).resolves.toBe(true);
    });

    test('Query execution is terminated when stop button is clicked', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();

        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });

    test('Streaming query shows some results and banner when stop button is clicked', async ({
        page,
    }) => {
        const queryEditor = await setupQueryEditor(page);
        await toggleExperiment(page, 'on', 'Query Streaming');
        await setupMockStreamingFetch(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.waitForStatus('Fetching');

        await queryEditor.clickStopButton();

        await expect(queryEditor.isStopBannerVisible()).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        const stoppedResultCount = Number(await queryEditor.resultTable.getResultTitleCount());
        expect(stoppedResultCount).toBeGreaterThan(0);
        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });

    test('Stop button is not visible for quick queries', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        const quickQuery = 'SELECT 1;';
        await queryEditor.setQuery(quickQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000);

        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });

    test('Stop button works for Execute mode', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });

    test('Stop button works for Explain mode', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeQueryMode(QUERY_MODES.data);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

        await queryEditor.clickExplainButton();

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.isStopButtonHidden()).resolves.toBe(true);
    });

    test('Stop button appears when query is started via hotkey', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.focusEditor();
        await executeQueryWithKeybinding(page);

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await expect(queryEditor.isElapsedTimeVisible()).resolves.toBe(true);
    });

    test('Query started via hotkey is terminated when stop button is clicked', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.focusEditor();
        await executeQueryWithKeybinding(page);

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });

    test('Stop button stays available after switching away and back during running query', async ({
        page,
    }) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery(longRunningQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);

        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await queryEditor.queryTabs.selectTab(QueryTabs.Editor);

        await expect(queryEditor.isStopButtonVisible()).resolves.toBe(true);
        await queryEditor.clickStopButton();
        await expect(queryEditor.waitForStatus('Stopped')).resolves.toBe(true);
    });
});
