import {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../../models/BaseModel';
import {selectContentTable} from '../../../utils/selectContentTable';

type ButtonType = 'Run Script' | 'Run Scan';
type ExplainResultType = 'Schema' | 'JSON' | 'AST';

export class QueryEditor extends BaseModel {
    protected readonly editorTextArea: Locator;
    protected readonly runButton: Locator;
    protected readonly scanButton: Locator;

    constructor(page: Page) {
        super(page, page.locator('.query-editor'));

        this.editorTextArea = this.selector.locator('.query-editor__monaco textarea');

        this.runButton = this.selector.locator('.query-editor__control-run > button');

        this.scanButton = this.selector
            .locator('.query-editor__controls > button')
            .locator('nth=0');
    }

    async runScript(query: string) {
        await this.editorTextArea.fill(query);
        await this.selectRunButtonType('Run Script');
        await this.runButton.click();
    }
    async runScan(query: string) {
        await this.editorTextArea.fill(query);
        await this.selectRunButtonType('Run Scan');
        await this.runButton.click();
    }
    async explain(query: string) {
        await this.editorTextArea.fill(query);
        await this.scanButton.click();
    }

    // eslint-disable-next-line consistent-return
    async getExplainResult(type: ExplainResultType) {
        await this.selectExplainResultType(type);

        const resultArea = this.selector.locator('.kv-query-explain__result');

        switch (type) {
            case 'Schema': {
                return resultArea.locator('.canvas-container');
            }
            case 'JSON': {
                return resultArea.locator('.json-inspector');
            }
            case 'AST': {
                return resultArea.locator('.kv-query-explain__ast');
            }
        }
    }

    getRunResultTable() {
        const runResult = this.selector.locator('.kv-query-result__result');

        // Result table is present only on successful not empty results
        const resultTable = selectContentTable(runResult);

        return resultTable;
    }

    protected async selectExplainResultType(type: ExplainResultType) {
        const radio = this.selector.locator('.kv-query-explain__controls .yc-radio-button');
        await radio.getByLabel(type).click();
    }

    protected async selectRunButtonType(type: ButtonType) {
        const selectRunModeButton = this.selector.locator('.query-editor__select-query-action');
        await selectRunModeButton.click();

        const runModeSelect = this.page.locator('.query-editor__select-query-action-popup');
        await runModeSelect.waitFor({state: 'visible'});
        await runModeSelect.getByText(type).click();
    }
}
