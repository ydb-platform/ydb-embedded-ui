import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class SavedQueriesTable {
    private page: Page;
    private container: Locator;
    private searchInput: Locator;
    private table: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.ydb-saved-queries');
        this.searchInput = this.container.locator('.ydb-saved-queries__search input');
        this.table = this.container.locator('.data-table');
    }

    async search(text: string) {
        await this.searchInput.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.searchInput.fill(text);
    }

    async getQueryRow(name: string) {
        return this.table.locator('.ydb-saved-queries__row', {
            has: this.page.locator(`.ydb-saved-queries__query-name:has-text("${name}")`),
        });
    }

    async editQuery(name: string) {
        const row = await this.waitForRow(name);
        await row.hover();
        const editButton = row.locator('button:has(svg)').first();
        await editButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await editButton.click();
    }

    async deleteQuery(name: string) {
        const row = await this.waitForRow(name);
        await row.hover();
        const deleteButton = row.locator('button:has(svg)').nth(1);
        await deleteButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await deleteButton.click();
    }

    async getQueryText(name: string) {
        const row = await this.getQueryRow(name);
        return row.locator('.ydb-saved-queries__query-body').innerText();
    }

    async getQueryNames(): Promise<string[]> {
        const names = await this.table.locator('.ydb-saved-queries__query-name').allInnerTexts();
        return names;
    }

    async getRow(index: number) {
        const row = this.table.locator('.ydb-saved-queries__row').nth(index);
        const name = await row.locator('.ydb-saved-queries__query-name').innerText();
        const query = await row.locator('.ydb-saved-queries__query-body').innerText();
        return {
            name,
            query,
            element: row,
        };
    }

    async getRowByName(name: string) {
        const rows = this.table.locator('.ydb-saved-queries__row');
        const count = await rows.count();

        for (let i = 0; i < count; i++) {
            const row = await this.getRow(i);
            if (row.name === name) {
                return row;
            }
        }
        return null;
    }

    async waitForRow(name: string) {
        const row = this.table.locator('.ydb-saved-queries__row', {
            has: this.page.locator(`.ydb-saved-queries__query-name:has-text("${name}")`),
        });
        await row.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return row;
    }

    async isVisible() {
        await this.container.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }
}
