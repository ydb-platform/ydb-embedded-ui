import type {Locator, Page} from '@playwright/test';

import type {QUERY_MODES} from '../../../../../src/utils/query';
import {VISIBILITY_TIMEOUT} from '../../TenantPage';
import {QueriesHistoryTable} from '../../queryHistory/models/QueriesHistoryTable';
import {SavedQueriesTable} from '../../savedQueries/models/SavedQueriesTable';

import {QueryTabsNavigation} from './QueryTabsNavigation';
import {PaneWrapper, ResultTable} from './ResultTable';
import {SettingsDialog} from './SettingsDialog';

export enum ExplainResultType {
    Schema = 'Computation Graph',
    JSON = 'JSON',
    AST = 'AST',
}

export enum ButtonNames {
    Run = 'Run',
    Explain = 'Explain',
    Cancel = 'Cancel',
    Save = 'Save',
    Edit = 'Edit',
    Stop = 'Stop',
}

export enum EditSavedSubMenuNames {
    SaveAsNew = 'Save as new',
}

export enum ResultTabNames {
    Result = 'Result',
    Stats = 'Stats',
    Schema = 'Computation Graph',
    ExplainPlan = 'Explain',
}

export enum QueryTabs {
    Editor = 'Editor',
    History = 'History',
    Saved = 'Saved',
}

export class QueryEditor {
    settingsDialog: SettingsDialog;
    paneWrapper: PaneWrapper;
    queryTabs: QueryTabsNavigation;
    resultTable: ResultTable;
    savedQueries: SavedQueriesTable;
    historyQueries: QueriesHistoryTable;
    editorTextArea: Locator;

    private page: Page;
    private selector: Locator;
    private runButton: Locator;
    private explainButton: Locator;
    private stopButton: Locator;
    private stopBanner: Locator;
    private saveButton: Locator;
    private editButton: Locator;
    private dropdownMenu: Locator;
    private gearButton: Locator;
    private banner: Locator;
    private executionStatus: Locator;
    private radioButton: Locator;
    private elapsedTimeLabel: Locator;
    private resultsControls: Locator;

    constructor(page: Page) {
        this.page = page;
        this.selector = page.locator('.query-editor');
        this.editorTextArea = this.selector.locator('.query-editor__monaco textarea');
        this.runButton = this.selector.getByRole('button', {name: ButtonNames.Run});
        this.stopButton = this.selector.getByRole('button', {name: ButtonNames.Stop});
        this.stopBanner = this.selector.locator('.ydb-query-stopped-banner');
        this.explainButton = this.selector.getByRole('button', {name: ButtonNames.Explain});
        this.saveButton = this.selector.getByRole('button', {name: ButtonNames.Save});
        this.editButton = this.selector.getByRole('button', {name: ButtonNames.Edit});
        this.dropdownMenu = page.locator('.g-dropdown-menu__menu');
        this.gearButton = this.selector.locator('.ydb-query-editor-button__gear-button');
        this.executionStatus = this.selector.locator('.kv-query-execution-status .g-text');
        this.resultsControls = this.selector.locator('.ydb-query-result__controls');
        this.elapsedTimeLabel = this.selector.locator('.kv-query-execution-status .g-label__value');
        this.radioButton = this.selector.locator(
            '.query-editor__pane-wrapper .g-segmented-radio-group',
        );
        this.banner = this.page.locator('.ydb-query-settings-banner');

        this.settingsDialog = new SettingsDialog(page);
        this.resultTable = new ResultTable(this.selector);
        this.paneWrapper = new PaneWrapper(page);
        this.queryTabs = new QueryTabsNavigation(page);
        this.savedQueries = new SavedQueriesTable(page);
        this.historyQueries = new QueriesHistoryTable(page);
    }

    async run(query: string, mode: keyof typeof QUERY_MODES) {
        await this.clickGearButton();
        await this.settingsDialog.changeQueryMode(mode);
        await this.settingsDialog.clickButton(ButtonNames.Save);
        await this.setQuery(query);
        await this.clickRunButton();
    }

    async explain(query: string, mode: keyof typeof QUERY_MODES) {
        await this.clickGearButton();
        await this.settingsDialog.changeQueryMode(mode);
        await this.settingsDialog.clickButton(ButtonNames.Save);
        await this.setQuery(query);
        await this.clickExplainButton();
    }

    async gearButtonText() {
        await this.gearButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.gearButton.innerText();
    }

    async clickStopButton() {
        await this.stopButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.stopButton.click();
    }

    async clickRunButton() {
        await this.runButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.runButton.click();
    }

    async clickExplainButton() {
        await this.explainButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.explainButton.click();
    }

    async clickSaveButton() {
        await this.saveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.saveButton.click();
    }

    async clickEditButton() {
        await this.editButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.editButton.click();
    }

    async clickSaveAsNewEditButton() {
        const menuItem = this.dropdownMenu
            .getByRole('menuitem')
            .filter({hasText: EditSavedSubMenuNames.SaveAsNew});

        await menuItem.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await menuItem.click();
    }

    async getExplainResult(type: ExplainResultType) {
        await this.selectResultTypeRadio(type);
        const resultArea = this.selector.locator('.ydb-query-result__result');
        switch (type) {
            case ExplainResultType.Schema:
                return resultArea.locator('.ydb-query-explain-graph__canvas-container');
            case ExplainResultType.JSON:
                return resultArea.locator('.ydb-query-json-viewer__tree');
            case ExplainResultType.AST:
                return resultArea.locator('.ydb-query-ast');
        }
    }

    async getErrorMessage() {
        const errorMessage = this.selector.locator('.kv-result-issues__error-message-text');
        await errorMessage.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return errorMessage.innerText();
    }

    async getExecutionStatus() {
        await this.executionStatus.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.executionStatus.innerText();
    }

    async focusEditor() {
        await this.editorTextArea.focus();
    }

    async selectText(startLine: number, startColumn: number, endLine: number, endColumn: number) {
        await this.editorTextArea.evaluate(
            (_, coords) => {
                const editor = window.ydbEditor;
                if (editor) {
                    editor.setSelection({
                        startLineNumber: coords.startLine,
                        startColumn: coords.startColumn,
                        endLineNumber: coords.endLine,
                        endColumn: coords.endColumn,
                    });
                }
            },
            {startLine, startColumn, endLine, endColumn},
        );
    }

    async pressKeys(key: string) {
        await this.editorTextArea.press(key);
    }

    async runSelectedQueryViaContextMenu() {
        await this.editorTextArea.evaluate(() => {
            const editor = window.ydbEditor;
            if (editor) {
                // Trigger the sendSelectedQuery action directly
                editor.trigger('contextMenu', 'sendSelectedQuery', null);
            }
        });
    }

    async closeSettingsDialog() {
        await this.settingsDialog.clickButton(ButtonNames.Cancel);
    }

    async clickGearButton() {
        await this.gearButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.gearButton.click();
    }

    async closeBanner() {
        const closeButton = this.banner.locator('button');
        await closeButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await closeButton.click();
    }

    async hoverGearButton() {
        await this.gearButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.gearButton.hover();
    }

    async setQuery(query: string, timeout = VISIBILITY_TIMEOUT) {
        await this.editorTextArea.waitFor({state: 'visible', timeout});

        await this.editorTextArea.evaluate(() => {
            const editor = window.ydbEditor;
            if (editor) {
                editor.setValue('');
            }
            return false;
        });

        const currentValue = await this.editorTextArea.inputValue();
        if (currentValue !== '') {
            throw new Error('Failed to clear editor text area');
        }

        await this.editorTextArea.fill(query);
    }

    async selectResultTypeRadio(type: ExplainResultType) {
        const typeButton = this.radioButton.getByLabel(type);
        await typeButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await typeButton.click();
    }

    async isElapsedTimeVisible() {
        await this.elapsedTimeLabel.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isElapsedTimeHidden() {
        await this.elapsedTimeLabel.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isStopButtonVisible() {
        await this.stopButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isStopButtonHidden() {
        await this.stopButton.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isStopBannerVisible() {
        await this.stopBanner.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isResultsControlsVisible() {
        await this.resultsControls.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isResultsControlsHidden() {
        await this.resultsControls.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async collapseResultsControls() {
        const collapseButton = this.resultsControls.locator(
            '.kv-pane-visibility-button_type_collapse',
        );
        await collapseButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await collapseButton.click();
    }

    async expandResultsControls() {
        const expandButton = this.resultsControls.locator('.kv-pane-visibility-button_type_expand');
        await expandButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await expandButton.click();
    }

    async isResultsControlsCollapsed() {
        const expandButton = this.resultsControls.locator('.kv-pane-visibility-button_type_expand');
        try {
            await expandButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }

    async clickCopyResultButton() {
        const copyButton = this.resultsControls.locator('button[title="Copy result"]');
        await copyButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await copyButton.click();
    }

    async isRunButtonEnabled() {
        return this.runButton.isEnabled({timeout: VISIBILITY_TIMEOUT});
    }

    async isExplainButtonEnabled() {
        return this.explainButton.isEnabled({timeout: VISIBILITY_TIMEOUT});
    }

    async isBannerVisible() {
        await this.banner.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isBannerHidden() {
        await this.banner.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async waitForStatus(expectedStatus: string, timeout = VISIBILITY_TIMEOUT) {
        await this.executionStatus.waitFor({state: 'visible', timeout});

        // Keep checking status until it matches or times out
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const status = await this.executionStatus.innerText();
            if (status === expectedStatus) {
                return true;
            }
            await this.page.waitForTimeout(100); // Small delay between checks
        }

        throw new Error(`Status did not change to ${expectedStatus} within ${timeout}ms`);
    }

    async getStatsTabContent() {
        // First navigate to Stats tab
        await this.paneWrapper.selectTab(ResultTabNames.Stats);

        // Get the stats content area
        const statsContent = this.selector.locator('.ydb-query-result__result');
        await statsContent.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        return statsContent.innerText();
    }

    async hasStatsJsonViewer() {
        // First navigate to Stats tab
        await this.paneWrapper.selectTab(ResultTabNames.Stats);

        // Check for JSON viewer element
        const jsonViewer = this.selector.locator('.ydb-json-viewer');
        try {
            await jsonViewer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }
}
