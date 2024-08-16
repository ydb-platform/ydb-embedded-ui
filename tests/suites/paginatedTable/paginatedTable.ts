import type {Locator, Page} from '@playwright/test';

export class PaginatedTable {
    private page: Page;
    private tableSelector: Locator;
    private searchInput: Locator;
    private radioButtons: Locator;
    private countLabel: Locator;
    private tableRows: Locator;
    private refreshButton: Locator;
    private refreshIntervalSelect: Locator;
    private headCells: Locator;

    constructor(page: Page) {
        this.page = page;
        this.tableSelector = page.locator('.ydb-table-with-controls-layout');
        this.searchInput = this.tableSelector.locator('.ydb-search input');
        this.radioButtons = this.tableSelector.locator('.g-radio-button');
        this.countLabel = this.tableSelector.locator('.ydb-entities-count .g-label__content');
        this.headCells = this.tableSelector.locator('.ydb-paginated-table__head-cell');
        this.tableRows = this.tableSelector.locator('.ydb-paginated-table__row');
        this.refreshButton = page.locator('.auto-refresh-control button[aria-label="Refresh"]');
        this.refreshIntervalSelect = page.locator('.cluster__auto-refresh-select');
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
        await this.page.locator('.g-select-popup__option', {hasText: interval}).click();
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
