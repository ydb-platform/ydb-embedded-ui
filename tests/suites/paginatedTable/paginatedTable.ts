import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../tenant/TenantPage';

export class PaginatedTable {
    private page: Page;
    private tableSelector: Locator;
    private searchInput: Locator;
    private radioButtons: Locator;
    private countLabel: Locator;
    private tableRows: Locator;
    private emptyTableRows: Locator;
    private refreshButton: Locator;
    private refreshIntervalSelect: Locator;
    private headCells: Locator;
    private columnSetupButton: Locator;
    private columnSetupPopup: Locator;

    constructor(page: Page) {
        this.page = page;
        this.tableSelector = page.locator('.ydb-table-with-controls-layout');
        this.searchInput = this.tableSelector.locator('.ydb-search input');
        this.radioButtons = this.tableSelector.locator('.g-radio-button');
        this.countLabel = this.tableSelector.locator('.ydb-entities-count .g-label__content');
        this.headCells = this.tableSelector.locator('.ydb-paginated-table__head-cell');
        this.tableRows = this.tableSelector.locator('.ydb-paginated-table__row');
        this.emptyTableRows = this.tableSelector.locator('.ydb-paginated-table__row_empty');
        this.refreshButton = page.locator('.auto-refresh-control button[aria-label="Refresh"]');
        this.refreshIntervalSelect = page.getByTestId('ydb-autorefresh-select');
        this.columnSetupButton = this.tableSelector.locator(
            '.g-tree-select.g-table-column-setup button',
        );
        this.columnSetupPopup = page.locator('.g-popup .g-select-popup.g-tree-select__popup');
    }

    async waitForTableVisible() {
        await this.tableSelector.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    async search(searchTerm: string) {
        await this.searchInput.fill(searchTerm);
    }

    async selectRadioOption(groupIndex: number, optionText: string) {
        const radioGroup = this.radioButtons.nth(groupIndex);
        const option = radioGroup.locator(`.g-radio-button__option:has-text("${optionText}")`);

        await option.evaluate((el) => (el as HTMLElement).click());
    }

    async getCount(): Promise<number> {
        const countText = await this.countLabel.innerText();
        const match = countText.match(/: (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    async getColumnValues(columnName: string): Promise<string[]> {
        const columnIndex = await this.getColumnIndex(columnName);
        return this.tableRows.evaluateAll(
            (rows, index) =>
                rows.map(
                    (row) =>
                        row.querySelector(`td:nth-child(${index + 1})`)?.textContent?.trim() || '',
                ),
            columnIndex,
        );
    }

    async getRowData(rowIndex: number): Promise<Record<string, string>> {
        const rowCells = this.tableRows.nth(rowIndex).locator('td');
        const headerCount = await this.headCells.count();
        const rowData: Record<string, string> = {};

        for (let i = 0; i < headerCount; i++) {
            const headerText = (await this.headCells.nth(i).innerText()).trim().replace(/\n/g, ' ');
            const cellText = (await rowCells.nth(i).innerText()).trim().replace(/\n/g, ' ');
            rowData[headerText] = cellText;
        }

        return rowData;
    }

    async getRowCount(): Promise<number> {
        return this.tableRows.count();
    }

    async getEmptyDataMessageLocator() {
        return this.emptyTableRows.nth(0);
    }

    async waitForTableToLoad() {
        await this.tableSelector.waitFor({state: 'visible'});
    }

    async waitForTableData(timeout = 2000) {
        await this.page.waitForFunction(
            () => {
                const rows = document.querySelectorAll('.ydb-paginated-table__row');
                const loadingRows = document.querySelectorAll('.ydb-paginated-table__row_loading');
                return (
                    rows.length > 0 &&
                    rows[0].querySelectorAll('td').length > 0 &&
                    loadingRows.length === 0
                );
            },
            {timeout},
        );

        await this.page.waitForTimeout(1000);
    }

    async clickRefreshButton() {
        await this.refreshButton.click();
    }

    async setRefreshInterval(interval: string) {
        await this.refreshIntervalSelect.click();
        await this.page.locator('.g-select-list__option', {hasText: interval}).click();
    }

    async getRefreshInterval(): Promise<string> {
        return this.refreshIntervalSelect.locator('.g-select-control__option-text').innerText();
    }

    async sortByColumn(columnName: string) {
        const columnHeader = this.tableSelector.locator(
            `.ydb-paginated-table__head-cell:has-text("${columnName}")`,
        );
        await columnHeader.click();
        await this.page.waitForTimeout(1000);
        await this.waitForTableData();
    }

    async openColumnSetup() {
        await this.columnSetupButton.click();
        await this.columnSetupPopup.waitFor({state: 'visible'});
    }

    async setColumnChecked(columnName: string) {
        const columnOption = this.columnSetupPopup.locator(`[data-list-item="${columnName}"]`);
        const checkIcon = columnOption.locator('.g-icon.g-color-text_color_info');
        const isVisible = await checkIcon.isVisible();
        if (!isVisible) {
            await columnOption.click();
        }
    }

    async setColumnUnchecked(columnName: string) {
        const columnOption = this.columnSetupPopup.locator(`[data-list-item="${columnName}"]`);
        const checkIcon = columnOption.locator('.g-icon.g-color-text_color_info');
        const isVisible = await checkIcon.isVisible();
        if (isVisible) {
            await columnOption.click();
        }
    }

    async applyColumnVisibility() {
        const applyButton = this.columnSetupPopup.locator('button:has-text("Apply")');
        await applyButton.click();
        await this.columnSetupPopup.waitFor({state: 'hidden'});
    }

    async getVisibleColumnsCount(): Promise<string> {
        const statusText = await this.columnSetupButton
            .locator('.g-table-column-setup__status')
            .innerText();
        return statusText;
    }

    async isColumnVisible(columnName: string): Promise<boolean> {
        const columnOption = this.columnSetupPopup.locator(`[data-list-item="${columnName}"]`);
        const checkIcon = columnOption.locator('.g-icon.g-color-text_color_info');
        return await checkIcon.isVisible();
    }

    private async getColumnIndex(columnName: string): Promise<number> {
        const count = await this.headCells.count();
        for (let i = 0; i < count; i++) {
            const cellText = (await this.headCells.nth(i).innerText()).trim().replace(/\n/g, ' ');
            if (cellText === columnName) {
                return i;
            }
        }
        throw new Error(`Column "${columnName}" not found`);
    }
}
