import type {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../../models/BaseModel';
import {selectContentTable} from '../../../utils/selectContentTable';

type QueryMode = 'YQL Script' | 'Scan';
type ExplainResultType = 'Schema' | 'JSON' | 'AST';

const queryModeSelectorQa = 'query-mode-selector';
const queryModeSelectorPopupQa = 'query-mode-selector-popup';

export class QueryEditor extends BaseModel {
    protected readonly editorTextArea: Locator;
    protected readonly runButton: Locator;
    protected readonly explainButton: Locator;

    constructor(page: Page) {
        super(page, page.locator('.query-editor'));

        this.editorTextArea = this.selector.locator('.query-editor__monaco textarea');

        this.runButton = this.selector.getByRole('button', {name: /Run/});
        this.explainButton = this.selector.getByRole('button', {name: /Explain/});
    }
    async run(query: string, mode: QueryMode) {
        await this.selectQueryMode(mode);
        await this.editorTextArea.fill(query);
        await this.runButton.click();
    }

    async explain(query: string, mode: QueryMode) {
        await this.selectQueryMode(mode);
        await this.editorTextArea.fill(query);
        await this.explainButton.click();
    }

    // eslint-disable-next-line consistent-return
    async getExplainResult(type: ExplainResultType) {
        await this.selectExplainResultType(type);

        const resultArea = this.selector.locator('.ydb-query-explain-result__result');

        switch (type) {
            case 'Schema': {
                return resultArea.locator('.canvas-container');
            }
            case 'JSON': {
                return resultArea.locator('.json-inspector');
            }
            case 'AST': {
                return resultArea.locator('.ydb-query-explain-result__ast');
            }
        }
    }

    getRunResultTable() {
        const runResult = this.selector.locator('.ydb-query-execute-result__result');

        // Result table is present only on successful not empty results
        const resultTable = selectContentTable(runResult);

        return resultTable;
    }

    protected async selectExplainResultType(type: ExplainResultType) {
        const radio = this.selector.locator('.ydb-query-explain-result__controls .g-radio-button');
        await radio.getByLabel(type).click();
    }

    protected async selectQueryMode(type: QueryMode) {
        const queryModeSelector = this.selector.getByTestId(queryModeSelectorQa);

        await queryModeSelector.click();

        const queryModeSelectorPopup = this.page.getByTestId(queryModeSelectorPopupQa);

        await queryModeSelectorPopup.waitFor({state: 'visible'});
        await queryModeSelectorPopup.getByText(type).click();
    }
}
