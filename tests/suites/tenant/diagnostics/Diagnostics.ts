import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../TenantPage';

export enum DiagnosticsTab {
    Info = 'Info',
    Schema = 'Schema',
    TopShards = 'Top shards',
    Nodes = 'Nodes',
    Graph = 'Graph',
    Tablets = 'Tablets',
    HotKeys = 'Hot keys',
    Describe = 'Describe',
}

export class Diagnostics {
    private tabs: Locator;
    private schemaViewerTable: Locator;
    private dataTable: Locator;
    private primaryKeys: Locator;
    private refreshButton: Locator;
    private autoRefreshSelect: Locator;

    constructor(page: Page) {
        this.tabs = page.locator('.kv-tenant-diagnostics__tabs');
        this.schemaViewerTable = page.locator('.schema-viewer__table');
        this.dataTable = page.locator('.data-table__table');
        this.primaryKeys = page.locator('.schema-viewer__keys_type_primary');
        this.refreshButton = page.locator('button[aria-label="Refresh"]');
        this.autoRefreshSelect = page.locator('.g-select');
    }

    async isSchemaViewerVisible() {
        await this.schemaViewerTable.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isSchemaViewerHidden() {
        await this.schemaViewerTable.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async clickTab(tabName: DiagnosticsTab): Promise<void> {
        const tab = this.tabs.locator(`.kv-tenant-diagnostics__tab:has-text("${tabName}")`);
        await tab.click();
    }

    async getPrimaryKeys(): Promise<string[]> {
        const keysElement = this.primaryKeys.locator('.schema-viewer__keys-values');
        const keysText = (await keysElement.textContent()) || '';
        return keysText.split(', ').map((key) => key.trim());
    }

    async getColumnNames(): Promise<string[]> {
        const headerCells = this.dataTable.locator('th.data-table__th');
        const columnNames = await headerCells.allTextContents();
        return columnNames.map((name) => name.trim());
    }

    async getRowData(rowIndex: number): Promise<string[]> {
        const row = this.dataTable.locator(`tbody tr:nth-child(${rowIndex + 1})`);
        const cells = row.locator('td');
        return await cells.allTextContents();
    }

    async clickRefreshButton(): Promise<void> {
        await this.refreshButton.click();
    }

    async setAutoRefresh(option: string): Promise<void> {
        await this.autoRefreshSelect.click();
        const optionLocator = this.autoRefreshSelect.locator(`text=${option}`);
        await optionLocator.click();
    }
}
