import type {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../../models/BaseModel';
import {selectContentTable} from '../../../utils/selectContentTable';

type QueryMode = 'YQL Script' | 'Scan';
type ExplainResultType = 'Schema' | 'JSON' | 'AST';

export class QueryEditor extends BaseModel {
    protected readonly editorTextArea: Locator;
    protected runButton: Locator;
    protected explainButton: Locator;
    protected readonly gearButton: Locator;
    protected readonly indicatorIcon: Locator;
    protected readonly settingsDialog: Locator;
    protected readonly banner: Locator;

    constructor(page: Page) {
        super(page, page.locator('.query-editor'));

        this.editorTextArea = this.selector.locator('.query-editor__monaco textarea');
        this.runButton = this.selector.getByRole('button', {name: /Run/});
        this.explainButton = this.selector.getByRole('button', {name: /Explain/});
        this.gearButton = this.selector.locator('.ydb-query-editor-controls__gear-button');
        this.indicatorIcon = this.selector.locator(
            '.ydb-query-editor-controls__query-settings-icon',
        );
        this.settingsDialog = this.page.locator('.ydb-query-settings-dialog');
        this.banner = this.page.locator('.ydb-query-settings-banner');
    }

    async run(query: string, mode: QueryMode) {
        await this.clickGearButton();
        await this.changeQueryMode(mode);
        await this.clickSaveInSettingsDialog();
        await this.editorTextArea.fill(query);
        await this.runButton.click();
    }

    async explain(query: string, mode: QueryMode) {
        await this.clickGearButton();
        await this.changeQueryMode(mode);
        await this.clickSaveInSettingsDialog();
        await this.editorTextArea.fill(query);
        await this.explainButton.click();
    }

    async gearButtonContainsText(text: string) {
        return this.gearButton.locator(`text=${text}`).isVisible();
    }

    async isBannerVisible() {
        return this.banner.isVisible();
    }

    async isBannerHidden() {
        return this.banner.isHidden();
    }

    async isRunButtonEnabled() {
        return this.runButton.isEnabled();
    }

    async isRunButtonDisabled() {
        return this.runButton.isDisabled();
    }

    async isExplainButtonEnabled() {
        return this.explainButton.isEnabled();
    }

    async isExplainButtonDisabled() {
        return this.explainButton.isDisabled();
    }

    async clickRunButton() {
        await this.runButton.click();
    }

    async clickExplainButton() {
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

    async settingsDialogIsVisible() {
        return this.settingsDialog.isVisible();
    }

    async settingsDialogIsNotVisible() {
        return this.settingsDialog.isHidden();
    }

    async clickGearButton() {
        await this.gearButton.click();
    }

    async clickCancelInSettingsDialog() {
        await this.settingsDialog.getByRole('button', {name: /Cancel/}).click();
    }

    async clickSaveInSettingsDialog() {
        await this.settingsDialog.getByRole('button', {name: /Save/}).click();
    }

    async changeQueryMode(mode: QueryMode) {
        const dropdown = this.settingsDialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_queryMode',
        );
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(mode).first().click();
        await this.page.waitForTimeout(1000);
    }

    async changeIsolationLevel(level: string) {
        const dropdown = this.settingsDialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_isolationLevel',
        );
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(level).first().click();
        await this.page.waitForTimeout(1000);
    }

    async closeBanner() {
        await this.banner.locator('button').click();
    }

    async isIndicatorIconVisible() {
        return this.indicatorIcon.isVisible();
    }

    async hoverGearButton() {
        await this.gearButton.hover();
    }

    async setQuery(query: string) {
        await this.editorTextArea.fill(query);
    }

    protected async selectExplainResultType(type: ExplainResultType) {
        const radio = this.selector.locator('.ydb-query-explain-result__controls .g-radio-button');
        await radio.getByLabel(type).click();
    }
}
