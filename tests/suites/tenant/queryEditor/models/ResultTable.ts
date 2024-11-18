import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

import type {ResultTabNames} from './QueryEditor';

export class PaneWrapper {
    paneWrapper: Locator;
    private radioButton: Locator;

    constructor(page: Page) {
        this.paneWrapper = page.locator('.query-editor__pane-wrapper');
        this.radioButton = this.paneWrapper.locator('.g-radio-button');
    }

    async selectTab(tabName: ResultTabNames) {
        const tab = this.radioButton.getByLabel(tabName);
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await tab.click();
    }
}

export class ResultTable {
    private table: Locator;
    private preview: Locator;
    private resultHead: Locator;

    constructor(selector: Locator) {
        this.table = selector.locator('.ydb-query-execute-result__result');
        this.preview = selector.locator('.kv-preview__result');
        this.resultHead = selector.locator('.ydb-query-execute-result__result-head');
    }

    async isVisible() {
        await this.table.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.table.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isPreviewVisible() {
        await this.preview.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isPreviewHidden() {
        await this.preview.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
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

    async isResultHeaderHidden() {
        await this.resultHead.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getResultHeadText() {
        await this.resultHead.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.resultHead.innerText();
    }
}
