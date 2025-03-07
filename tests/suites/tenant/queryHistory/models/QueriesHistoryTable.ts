import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class QueriesHistoryTable {
    private page: Page;
    private container: Locator;
    private searchInput: Locator;
    private table: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.ydb-queries-history');
        this.searchInput = this.container.locator('.ydb-queries-history__search input');
        this.table = this.container.locator('.data-table');
    }

    async search(text: string) {
        await this.searchInput.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.searchInput.fill(text);
    }

    async getQueryRow(query: string) {
        return this.table.locator('.ydb-queries-history__table-row', {
            has: this.page.locator('.ydb-syntax-highlighter', {hasText: query}),
        });
    }

    async selectQuery(query: string) {
        const row = await this.getQueryRow(query);
        await row.click();
    }

    async getQueryText(index: number) {
        const row = this.table.locator('.ydb-queries-history__table-row').nth(index);
        return row.locator('.ydb-syntax-highlighter').innerText();
    }

    async isVisible() {
        await this.container.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }
}
