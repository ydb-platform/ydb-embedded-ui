import type {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../../models/BaseModel';
import {selectContentTable} from '../../../utils/selectContentTable';

type QueryMode = 'YQL Script' | 'Scan';
type ExplainResultType = 'Schema' | 'JSON' | 'AST';

export const VISIBILITY_TIMEOUT = 5000;

export class QueryEditor extends BaseModel {
    editorTextArea: Locator;
    runButton: Locator;
    explainButton: Locator;
    gearButton: Locator;
    indicatorIcon: Locator;
    settingsDialog: Locator;
    banner: Locator;

    constructor(page: Page) {
        super(page, page.locator('.query-editor'));

        this.editorTextArea = this.selector.locator('.query-editor__monaco textarea');
        this.runButton = this.selector.getByRole('button', {name: /Run/});
        this.explainButton = this.selector.getByRole('button', {name: /Explain/});
        this.gearButton = this.selector.locator('.ydb-query-editor-controls__gear-button');
        this.indicatorIcon = this.selector.locator(
            '.kv-query-execution-status__query-settings-icon',
        );
        this.settingsDialog = this.page.locator('.ydb-query-settings-dialog');
        this.banner = this.page.locator('.ydb-query-settings-banner');
    }

    async run(query: string, mode: QueryMode) {
        await this.clickGearButton();
        await this.changeQueryMode(mode);
        await this.clickSaveInSettingsDialog();
        await this.setQuery(query);
        await this.clickRunButton();
    }

    async explain(query: string, mode: QueryMode) {
        await this.clickGearButton();
        await this.changeQueryMode(mode);
        await this.clickSaveInSettingsDialog();
        await this.setQuery(query);
        await this.clickExplainButton();
    }

    async gearButtonText() {
        await this.gearButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.gearButton.innerText();
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
        await this.selectExplainResultType(type);

        const resultArea = this.selector.locator('.ydb-query-explain-result__result');

        switch (type) {
            case 'Schema':
                return resultArea.locator('.canvas-container');
            case 'JSON':
                return resultArea.locator('.json-inspector');
            case 'AST':
                return resultArea.locator('.ydb-query-explain-ast');
        }
    }

    getRunResultTable() {
        const runResult = this.selector.locator('.ydb-query-execute-result__result');
        return selectContentTable(runResult);
    }

    async clickGearButton() {
        await this.gearButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.gearButton.click();
    }

    async clickCancelInSettingsDialog() {
        const cancelButton = this.settingsDialog.getByRole('button', {name: /Cancel/});
        await cancelButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await cancelButton.click();
    }

    async clickSaveInSettingsDialog() {
        const saveButton = this.settingsDialog.getByRole('button', {name: /Save/});
        await saveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await saveButton.click();
    }

    async changeQueryMode(mode: QueryMode) {
        const dropdown = this.settingsDialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_queryMode',
        );
        await dropdown.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(mode).first().click();
        await this.page.waitForTimeout(1000);
    }

    async changeIsolationLevel(level: string) {
        const dropdown = this.settingsDialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_isolationLevel',
        );
        await dropdown.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(level).first().click();
        await this.page.waitForTimeout(1000);
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

    async selectExplainResultType(type: ExplainResultType) {
        const radio = this.selector.locator('.ydb-query-explain-result__controls .g-radio-button');
        const typeButton = radio.getByLabel(type);
        await typeButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await typeButton.click();
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
