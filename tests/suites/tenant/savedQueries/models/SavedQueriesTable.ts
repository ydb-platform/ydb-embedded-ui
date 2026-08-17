import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class SavedQueriesTable {
    private page: Page;
    private container: Locator;
    private searchInput: Locator;
    private table: Locator;
    private previewDrawer: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.ydb-saved-queries');
        this.searchInput = this.container.locator('.ydb-saved-queries__search input');
        this.table = this.container.locator('.data-table');
        this.previewDrawer = page.locator('[data-qa="saved-query-preview"]');
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

    async clickEdit(name: string) {
        const row = await this.waitForRow(name);
        await row.hover();
        await row.locator('[data-qa="edit-saved-query-button"]').click();
    }

    async clickRename(name: string) {
        const row = await this.waitForRow(name);
        await row.hover();
        await row.locator('[data-qa="rename-saved-query-button"]').click();
    }

    async selectQuery(name: string) {
        await this.clickEdit(name);
    }

    async clickRow(name: string) {
        await (await this.waitForRow(name)).click();
    }

    async getPreviewTitle() {
        await this.previewDrawer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.previewDrawer.locator('.ydb-drawer__header-wrapper .g-text').innerText();
    }

    async getPreviewEdited() {
        await this.previewDrawer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        const editedItem = this.previewDrawer
            .locator('.g-definition-list__item')
            .filter({has: this.previewDrawer.getByText('Edited', {exact: true})});

        return editedItem.locator('.g-definition-list__definition').innerText();
    }

    async clickPreviewRename() {
        await this.previewDrawer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        const renameButton = this.previewDrawer.locator(
            'button[data-qa="rename-saved-query-button"]',
        );
        await renameButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await renameButton.click();
    }

    getPreviewDrawer() {
        return this.previewDrawer;
    }

    async getEdited(name: string) {
        return (await this.waitForRow(name)).locator('.ydb-saved-queries__edited').innerText();
    }

    async isRowActive(name: string) {
        return (await this.waitForRow(name)).evaluate((row) =>
            row.classList.contains('ydb-saved-queries__row_active'),
        );
    }

    async getQueryText(name: string) {
        const row = await this.getQueryRow(name);
        return row.locator('.ydb-saved-queries__query').innerText();
    }

    async getQueryNames(): Promise<string[]> {
        const names = await this.table.locator('.ydb-saved-queries__query-name').allInnerTexts();
        return names;
    }

    async getRow(index: number) {
        const row = this.table.locator('.ydb-saved-queries__row').nth(index);
        const name = await row.locator('.ydb-saved-queries__query-name').innerText();
        const query = await row.locator('.ydb-saved-queries__query').innerText();
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
