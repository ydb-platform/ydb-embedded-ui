import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../tenant/TenantPage';

export class TableControls {
    protected page: Page;
    protected tableSelector: Locator;
    protected searchInput: Locator;
    protected radioButtons: Locator;
    protected countLabel: Locator;
    protected refreshButton: Locator;
    protected refreshIntervalSelect: Locator;
    protected columnSetupButton: Locator;
    protected columnSetupPopup: Locator;

    constructor(page: Page, tableSelector: Locator) {
        this.page = page;
        this.tableSelector = tableSelector;
        this.searchInput = this.tableSelector.locator('.ydb-search input');
        this.radioButtons = this.tableSelector.locator('.g-segmented-radio-group');
        this.countLabel = this.tableSelector.locator('.ydb-entities-count .g-label__content');
        this.refreshButton = page.locator('.auto-refresh-control button[aria-label="Refresh"]');
        this.refreshIntervalSelect = page.getByTestId('ydb-autorefresh-select');
        this.columnSetupButton = this.tableSelector.locator(
            '.g-tree-select.g-table-column-setup button',
        );
        this.columnSetupPopup = page.locator('.g-popup.g-tree-select__popup');
    }

    async search(searchTerm: string) {
        await this.searchInput.fill(searchTerm);
    }

    async selectRadioOption(groupIndex: number, optionText: string) {
        const radioGroup = this.radioButtons.nth(groupIndex);
        const option = radioGroup.locator(
            `.g-segmented-radio-group__option:has-text("${optionText}")`,
        );
        await option.evaluate((el) => (el as HTMLElement).click());
    }

    async getCount(): Promise<number> {
        const countText = await this.countLabel.innerText();
        const match = countText.match(/: (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    async clickRefreshButton() {
        await this.refreshButton.click();
    }

    async setRefreshInterval(interval: string) {
        await this.refreshIntervalSelect.click();
        await this.page.locator('.g-select-list__option', {hasText: interval}).click();
    }

    async getRefreshInterval(): Promise<string> {
        const text = await this.refreshIntervalSelect
            .locator('.g-select-control__option-text')
            .innerText();
        return text;
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
}

export class PaginatedTable {
    protected controls: TableControls;
    protected page: Page;
    private tableSelector: Locator;
    private tableRows: Locator;
    private emptyTableRows: Locator;
    private headCells: Locator;
    private scrollContainer: string;

    constructor(page: Page, scrollContainer = '.ydb-cluster') {
        this.page = page;
        this.tableSelector = page.locator('.ydb-table-with-controls-layout');
        this.headCells = this.tableSelector.locator('.ydb-paginated-table__head-cell');
        this.tableRows = this.tableSelector.locator('.ydb-paginated-table__row');
        this.emptyTableRows = this.tableSelector.locator('.ydb-paginated-table__row_empty');
        this.scrollContainer = scrollContainer;
        this.controls = new TableControls(page, this.tableSelector);
    }

    getControls(): TableControls {
        return this.controls;
    }

    async waitForTableVisible() {
        await this.tableSelector.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    async getCount(): Promise<number> {
        return this.controls.getCount();
    }

    async search(searchTerm: string) {
        await this.controls.search(searchTerm);
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

    async sortByColumn(columnName: string) {
        const columnHeader = this.tableSelector.locator(
            `.ydb-paginated-table__head-cell:has-text("${columnName}")`,
        );
        await columnHeader.click();
        await this.page.waitForTimeout(1000);
        await this.waitForTableData();
    }

    async scrollToBottom() {
        await this.page.evaluate((selector) => {
            const container = document.querySelector(selector);
            if (container) {
                container.scrollTo({top: container.scrollHeight, behavior: 'instant'});
            }
        }, this.scrollContainer);
    }

    async scrollToMiddle() {
        await this.page.evaluate((selector) => {
            const container = document.querySelector(selector);
            if (container) {
                container.scrollTo({
                    top: Math.floor(container.scrollHeight / 2),
                    behavior: 'instant',
                });
            }
        }, this.scrollContainer);
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

export class ClusterNodesTable extends PaginatedTable {
    constructor(page: Page) {
        super(page, '.ydb-cluster');
    }
}

export class ClusterStorageTable extends PaginatedTable {
    constructor(page: Page) {
        super(page, '.ydb-cluster');
    }
}

export class DiagnosticsNodesTable extends PaginatedTable {
    constructor(page: Page) {
        super(page, '.kv-tenant-diagnostics__page-wrapper');
    }
}
