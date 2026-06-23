import {expect, test} from '@playwright/test';

import {STATISTICS_MODES} from '../../../../src/utils/query';
import {getClipboardContent} from '../../../utils/clipboard';
import {executeSelectedQueryWithKeybinding} from '../../../utils/queryHotkeys';
import {NavigationTabs, TenantPage} from '../TenantPage';
import {createTableQuery, longTableSelect, simpleQuery} from '../constants';

import {ButtonNames, QueryTabs, ResultTabNames} from './models/QueryEditor';
import {setupQueryEditor, testQuery} from './queryEditor.helpers';

test.describe('Query editor results', () => {
    test('Changing tab inside results pane doesnt change results view', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await queryEditor.paneWrapper.selectTab(ResultTabNames.Schema);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);
        await queryEditor.paneWrapper.selectTab(ResultTabNames.Result);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Changing tab inside editor doesnt change results view', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await queryEditor.queryTabs.selectTab(QueryTabs.History);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);
        await queryEditor.queryTabs.selectTab(QueryTabs.Editor);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Changing tab to diagnostics doesnt change results view', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        const tenantPage = new TenantPage(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.profile);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
        await tenantPage.selectNavigationTab(NavigationTabs.Diagnostics);
        await expect(queryEditor.resultTable.isHidden()).resolves.toBe(true);
        await tenantPage.selectNavigationTab(NavigationTabs.Query);
        await expect(queryEditor.resultTable.isVisible()).resolves.toBe(true);
    });

    test('Result head value is 1 for 1 row result', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.setQuery(testQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
    });

    test('No result head value for no result', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.setQuery(createTableQuery);
        await queryEditor.clickRunButton();
        await page.waitForTimeout(1000);
        await expect(queryEditor.resultTable.isResultHeaderHidden()).resolves.toBe(true);
    });

    test('Truncated head value is 1 for 1 row truncated result', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.setQuery(longTableSelect());
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(1);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Truncated');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
    });

    test('Truncated results for multiple tabs', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        await queryEditor.setQuery(`${longTableSelect(2)}${longTableSelect(2)}`);
        await queryEditor.clickGearButton();
        await queryEditor.settingsDialog.changeLimitRows(3);
        await queryEditor.settingsDialog.clickButton(ButtonNames.Save);
        await queryEditor.clickRunButton();
        await expect(queryEditor.resultTable.getResultTabsCount()).resolves.toBe(2);
        await expect(queryEditor.resultTable.getResultTabTitleText(1)).resolves.toBe(
            'Result #2(T)',
        );
        await expect(queryEditor.resultTable.getResultTabTitleCount(1)).resolves.toBe('1');
    });

    test('Running selected query via keyboard shortcut executes only selected part', async ({
        page,
    }) => {
        const queryEditor = await setupQueryEditor(page);
        const multiQuery = 'SELECT 1;\nSELECT 2;';

        await queryEditor.setQuery(multiQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        await expect(queryEditor.resultTable.getResultTabsCount()).resolves.toBe(2);
        await expect(queryEditor.resultTable.getResultTabTitleText(0)).resolves.toBe('Result #1');
        await expect(queryEditor.resultTable.getResultTabTitleText(1)).resolves.toBe('Result #2');

        await queryEditor.focusEditor();
        await queryEditor.selectText(1, 1, 1, 9);

        await executeSelectedQueryWithKeybinding(page);

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
    });

    test('Running selected query via context menu executes only selected part', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        const multiQuery = 'SELECT 1;\nSELECT 2;';

        await queryEditor.setQuery(multiQuery);
        await queryEditor.clickRunButton();
        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

        await expect(queryEditor.resultTable.getResultTabsCount()).resolves.toBe(2);
        await expect(queryEditor.resultTable.getResultTabTitleText(0)).resolves.toBe('Result #1');
        await expect(queryEditor.resultTable.getResultTabTitleText(1)).resolves.toBe('Result #2');

        await queryEditor.focusEditor();
        await queryEditor.selectText(1, 1, 1, 9);

        await queryEditor.runSelectedQueryViaContextMenu();

        await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);
        await expect(queryEditor.resultTable.getResultTitleText()).resolves.toBe('Result');
        await expect(queryEditor.resultTable.getResultTitleCount()).resolves.toBe('1');
    });

    test('Results controls collapse and expand functionality', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);

        await queryEditor.setQuery('SELECT 1;');
        await queryEditor.clickRunButton();
        await queryEditor.waitForStatus('Completed');

        await expect(queryEditor.isResultsControlsVisible()).resolves.toBe(true);
        await expect(queryEditor.isResultsControlsCollapsed()).resolves.toBe(false);

        await queryEditor.collapseResultsControls();
        await expect(queryEditor.isResultsControlsCollapsed()).resolves.toBe(true);

        await queryEditor.expandResultsControls();
        await expect(queryEditor.isResultsControlsCollapsed()).resolves.toBe(false);
    });

    test('Copy result button copies to clipboard', async ({page}) => {
        const queryEditor = await setupQueryEditor(page);
        const query = 'SELECT 42 as answer;';

        await queryEditor.setQuery(query);
        await queryEditor.clickRunButton();
        await queryEditor.waitForStatus('Completed');

        await queryEditor.clickCopyResultButton();

        await page.waitForTimeout(2000);

        let clipboardContent = '';
        for (let i = 0; i < 3; i++) {
            clipboardContent = await getClipboardContent(page);
            if (clipboardContent) {
                break;
            }
            await page.waitForTimeout(500);
        }

        expect(clipboardContent).toContain('42');
    });

    test.describe('Statistics Modes Tests', () => {
        test('Stats tab shows no stats message when STATISTICS_MODES.none', async ({page}) => {
            const queryEditor = await setupQueryEditor(page);

            await queryEditor.setQuery(simpleQuery);
            await queryEditor.clickGearButton();
            await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.none);
            await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

            await queryEditor.clickRunButton();
            await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

            const statsContent = await queryEditor.getStatsTabContent();
            expect(statsContent).toContain('There is no Stats for the request');
        });

        test('Stats tab shows JSON viewer when STATISTICS_MODES.basic', async ({page}) => {
            const queryEditor = await setupQueryEditor(page);

            await queryEditor.setQuery(simpleQuery);
            await queryEditor.clickGearButton();
            await queryEditor.settingsDialog.changeStatsLevel(STATISTICS_MODES.basic);
            await queryEditor.settingsDialog.clickButton(ButtonNames.Save);

            await queryEditor.clickRunButton();
            await expect(queryEditor.waitForStatus('Completed')).resolves.toBe(true);

            const hasJsonViewer = await queryEditor.hasStatsJsonViewer();
            expect(hasJsonViewer).toBe(true);
        });
    });
});
