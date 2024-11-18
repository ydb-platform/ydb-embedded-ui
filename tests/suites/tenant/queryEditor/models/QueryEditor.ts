import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

import {QueryTabsNavigation} from './QueryTabsNavigation';
import {PaneWrapper, ResultTable} from './ResultTable';
import {SavedQueriesTable} from './SavedQueriesTable';
import {SettingsDialog} from './SettingsDialog';

export enum QueryMode {
    YQLScript = 'YQL Script',
    Data = 'DML',
    Scan = 'Scan',
}

export enum ExplainResultType {
    Schema = 'Schema',
    JSON = 'JSON',
    AST = 'AST',
}

export enum ButtonNames {
    Run = 'Run',
    Explain = 'Explain',
    Cancel = 'Cancel',
    Save = 'Save',
    Stop = 'Stop',
}

export enum ResultTabNames {
    Result = 'Result',
    Stats = 'Stats',
    Schema = 'Schema',
    ExplainPlan = 'Explain Plan',
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
    editorTextArea: Locator;

    private page: Page;
    private selector: Locator;
    private runButton: Locator;
    private explainButton: Locator;
    private stopButton: Locator;
    private gearButton: Locator;
    private indicatorIcon: Locator;
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
        this.explainButton = this.selector.getByRole('button', {name: ButtonNames.Explain});
        this.gearButton = this.selector.locator('.ydb-query-editor-controls__gear-button');
        this.executionStatus = this.selector.locator('.kv-query-execution-status');
        this.resultsControls = this.selector.locator('.ydb-query-execute-result__controls');
        this.indicatorIcon = this.selector.locator(
            '.kv-query-execution-status__query-settings-icon',
        );
        this.elapsedTimeLabel = this.selector.locator('.ydb-query-elapsed-time');
        this.radioButton = this.selector.locator('.query-editor__pane-wrapper .g-radio-button');
        this.banner = this.page.locator('.ydb-query-settings-banner');

        this.settingsDialog = new SettingsDialog(page);
        this.resultTable = new ResultTable(this.selector);
        this.paneWrapper = new PaneWrapper(page);
        this.queryTabs = new QueryTabsNavigation(page);
        this.savedQueries = new SavedQueriesTable(page);
    }

    async run(query: string, mode: QueryMode) {
        await this.clickGearButton();
        await this.settingsDialog.changeQueryMode(mode);
        await this.settingsDialog.clickButton(ButtonNames.Save);
        await this.setQuery(query);
        await this.clickRunButton();
    }

    async explain(query: string, mode: QueryMode) {
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

    async getExplainResult(type: ExplainResultType) {
        await this.selectResultTypeRadio(type);
        const resultArea = this.selector.locator('.ydb-query-explain-result__result');
        switch (type) {
            case ExplainResultType.Schema:
                return resultArea.locator('.canvas-container');
            case ExplainResultType.JSON:
                return resultArea.locator('.json-inspector');
            case ExplainResultType.AST:
                return resultArea.locator('.ydb-query-explain-ast');
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

    async setQuery(query: string) {
        await this.editorTextArea.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
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

    async isResultsControlsVisible() {
        await this.resultsControls.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isResultsControlsHidden() {
        await this.resultsControls.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
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

    async isIndicatorIconVisible() {
        await this.indicatorIcon.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isIndicatorIconHidden() {
        await this.indicatorIcon.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
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
}
