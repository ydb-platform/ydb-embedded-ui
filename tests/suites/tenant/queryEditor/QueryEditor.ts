import type {Locator, Page} from '@playwright/test';

export const VISIBILITY_TIMEOUT = 5000;

export enum QueryMode {
    YQLScript = 'YQL Script',
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

export class SettingsDialog {
    private dialog: Locator;
    private page: Page;

    constructor(page: Page) {
        this.page = page;
        this.dialog = page.locator('.ydb-query-settings-dialog');
    }

    async changeQueryMode(mode: QueryMode) {
        const dropdown = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_queryMode',
        );
        await dropdown.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(mode).first().click();
        await this.page.waitForTimeout(1000);
    }

    async changeIsolationLevel(level: string) {
        const dropdown = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_isolationLevel',
        );
        await dropdown.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(level).first().click();
        await this.page.waitForTimeout(1000);
    }

    async clickButton(buttonName: ButtonNames) {
        const button = this.dialog.getByRole('button', {name: buttonName});
        await button.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await button.click();
    }

    async isVisible() {
        await this.dialog.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.dialog.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }
}

export class ResultTable {
    private table: Locator;

    constructor(selector: Locator) {
        this.table = selector.locator('.ydb-query-execute-result__result');
    }

    async isVisible() {
        await this.table.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.table.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getRowCount() {
        const rows = this.table.locator('tr');
        return rows.count();
    }

    async getCellValue(row: number, col: number) {
        const cell = this.table.locator(`tr:nth-child(${row}) td:nth-child(${col})`);
        return cell.innerText();
    }
}

export class QueryEditor {
    settingsDialog: SettingsDialog;
    resultTable: ResultTable;

    private page: Page;
    private selector: Locator;
    private editorTextArea: Locator;
    private runButton: Locator;
    private explainButton: Locator;
    private stopButton: Locator;
    private gearButton: Locator;
    private indicatorIcon: Locator;
    private banner: Locator;
    private executionStatus: Locator;
    private radioButton: Locator;
    private elapsedTimeLabel: Locator;

    constructor(page: Page) {
        this.page = page;
        this.selector = page.locator('.query-editor');
        this.editorTextArea = this.selector.locator('.query-editor__monaco textarea');
        this.runButton = this.selector.getByRole('button', {name: ButtonNames.Run});
        this.stopButton = this.selector.getByRole('button', {name: ButtonNames.Stop});
        this.explainButton = this.selector.getByRole('button', {name: ButtonNames.Explain});
        this.gearButton = this.selector.locator('.ydb-query-editor-controls__gear-button');
        this.executionStatus = this.selector.locator('.kv-query-execution-status');
        this.indicatorIcon = this.selector.locator(
            '.kv-query-execution-status__query-settings-icon',
        );
        this.elapsedTimeLabel = this.selector.locator('.ydb-query-elapsed-time');
        this.radioButton = this.selector.locator('.query-editor__pane-wrapper .g-radio-button');
        this.banner = this.page.locator('.ydb-query-settings-banner');

        this.settingsDialog = new SettingsDialog(page);
        this.resultTable = new ResultTable(this.selector);
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

    async retry<T>(action: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await action();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max attempts reached');
    }
}
