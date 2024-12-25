import type {Locator, Page} from '@playwright/test';

import {retryAction} from '../../../utils/retryAction';
import {MemoryViewer} from '../../memoryViewer/MemoryViewer';
import {NodesPage} from '../../nodes/NodesPage';
import {StoragePage} from '../../storage/StoragePage';
import {VISIBILITY_TIMEOUT} from '../TenantPage';

export enum DiagnosticsTab {
    Info = 'Info',
    Schema = 'Schema',
    TopShards = 'Top shards',
    Queries = 'Queries',
    Nodes = 'Nodes',
    Graph = 'Graph',
    Tablets = 'Tablets',
    HotKeys = 'Hot keys',
    Describe = 'Describe',
    Storage = 'Storage',
}

export class Table {
    private table: Locator;

    constructor(selector: Locator) {
        this.table = selector.locator('.ydb-resizeable-data-table');
    }

    async isVisible() {
        await this.table.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.table.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async hasNoData() {
        const noDataCell = this.table.locator('td.data-table__no-data');
        return (
            (await noDataCell.isVisible()) &&
            (await this.getRowCount()) === 1 &&
            (await noDataCell.innerText()) === 'No data'
        );
    }

    async getRowCount() {
        const rows = this.table.locator('tr.data-table__row');
        return rows.count();
    }

    async getCellValue(row: number, col: number) {
        const cell = this.table.locator(`tr:nth-child(${row}) td:nth-child(${col})`);
        return cell.innerText();
    }

    async waitForCellValue(row: number, col: number, value: string) {
        const cell = this.table.locator(`tr:nth-child(${row}) td:nth-child(${col})`);
        await retryAction(async () => {
            const cellValue = (await cell.innerText()).trim();
            if (cellValue === value) {
                return true;
            }

            throw new Error(`Cell value ${cellValue} did not match expected ${value}`);
        });

        return true;
    }

    async getHeaders() {
        const headers = this.table.locator('th.data-table__th');
        const headerCount = await headers.count();
        const headerNames = [];
        for (let i = 0; i < headerCount; i++) {
            headerNames.push(await headers.nth(i).innerText());
        }
        return headerNames;
    }

    async getCellValueByHeader(row: number, header: string) {
        const headers = await this.getHeaders();
        const colIndex = headers.indexOf(header);
        if (colIndex === -1) {
            throw new Error(`Header "${header}" not found`);
        }
        const cell = this.table.locator(
            `tr.data-table__row:nth-child(${row}) td:nth-child(${colIndex + 1})`,
        );
        return cell.innerText();
    }

    async waitForCellValueByHeader(row: number, header: string, value: string) {
        await retryAction(async () => {
            const headers = await this.getHeaders();
            const colIndex = headers.indexOf(header);
            if (colIndex === -1) {
                throw new Error(`Header "${header}" not found`);
            }
            const cell = this.table.locator(
                `tr.data-table__row:nth-child(${row}) td:nth-child(${colIndex + 1})`,
            );
            const cellValue = (await cell.innerText()).trim();
            if (cellValue === value) {
                return true;
            }
            throw new Error(`Cell value ${cellValue} did not match expected ${value}`);
        });
        return true;
    }
}

export enum QueriesSwitch {
    Top = 'Top',
    Running = 'Running',
}

export class Diagnostics {
    table: Table;
    storage: StoragePage;
    nodes: NodesPage;
    memoryViewer: MemoryViewer;

    private tabs: Locator;
    private schemaViewer: Locator;
    private tableControls: Locator;
    private dataTable: Locator;
    private primaryKeys: Locator;
    private refreshButton: Locator;
    private autoRefreshSelect: Locator;
    private cpuCard: Locator;
    private storageCard: Locator;
    private memoryCard: Locator;
    private healthcheckCard: Locator;

    constructor(page: Page) {
        this.storage = new StoragePage(page);
        this.nodes = new NodesPage(page);
        this.memoryViewer = new MemoryViewer(page);
        this.tabs = page.locator('.kv-tenant-diagnostics__tabs');
        this.tableControls = page.locator('.ydb-table-with-controls-layout__controls');
        this.schemaViewer = page.locator('.schema-viewer');
        this.dataTable = page.locator('.data-table__table');
        this.primaryKeys = page.locator('.schema-viewer__keys_type_primary');
        this.refreshButton = page.locator('button[aria-label="Refresh"]');
        this.autoRefreshSelect = page.locator('.g-select');
        this.table = new Table(page.locator('.object-general'));

        // Info tab cards
        this.cpuCard = page.locator('.metrics-cards__tab:has-text("CPU")');
        this.storageCard = page.locator('.metrics-cards__tab:has-text("Storage")');
        this.memoryCard = page.locator('.metrics-cards__tab:has-text("Memory")');
        this.healthcheckCard = page.locator('.metrics-cards__tab:has-text("Healthcheck")');
    }

    async isSchemaViewerVisible() {
        await this.schemaViewer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isSchemaViewerHidden() {
        await this.schemaViewer.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async clickTab(tabName: DiagnosticsTab): Promise<void> {
        const tab = this.tabs.locator(`.kv-tenant-diagnostics__tab:has-text("${tabName}")`);
        await tab.click();
    }

    async clickRadioSwitch(radioName: QueriesSwitch): Promise<void> {
        const option = this.tableControls.locator(
            `.g-radio-button__option:has-text("${radioName}")`,
        );

        await option.evaluate((el) => (el as HTMLElement).click());
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

    async areInfoCardsVisible() {
        await this.cpuCard.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.storageCard.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.memoryCard.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.healthcheckCard.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getResourceUtilization() {
        const cpuSystem = await this.cpuCard
            .locator('.ydb-metrics-card__metric:has-text("System") .progress-viewer__text')
            .textContent();
        const cpuUser = await this.cpuCard
            .locator('.ydb-metrics-card__metric:has-text("User") .progress-viewer__text')
            .textContent();
        const cpuIC = await this.cpuCard
            .locator('.ydb-metrics-card__metric:has-text("IC") .progress-viewer__text')
            .textContent();
        const storage = await this.storageCard
            .locator('.ydb-metrics-card__metric:has-text("SSD") .progress-viewer__text')
            .textContent();
        const memory = await this.memoryCard
            .locator('.ydb-metrics-card__metric:has-text("Process") .progress-viewer__text')
            .textContent();

        return {
            cpu: {
                system: cpuSystem?.trim() || '',
                user: cpuUser?.trim() || '',
                ic: cpuIC?.trim() || '',
            },
            storage: storage?.trim() || '',
            memory: memory?.trim() || '',
        };
    }

    async getHealthcheckStatus() {
        const statusElement = this.healthcheckCard.locator(
            '.healthcheck__self-check-status-indicator',
        );
        return (await statusElement.textContent())?.trim() || '';
    }
}
