import type {Locator, Page} from '@playwright/test';

import {retryAction} from '../../../utils/retryAction';
import {MemoryViewer} from '../../memoryViewer/MemoryViewer';
import {NodesPage} from '../../nodes/NodesPage';
import type {Sidebar} from '../../sidebar/Sidebar';
import {StoragePage} from '../../storage/StoragePage';
import {VISIBILITY_TIMEOUT} from '../TenantPage';

import {OperationsTable} from './tabs/OperationsModel';

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
    Operations = 'Operations',
    Access = 'Access',
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

    async verifyHeaders(expectedHeaders: string[]) {
        const actualHeaders = await this.getHeaders();
        for (const header of expectedHeaders) {
            if (!actualHeaders.includes(header)) {
                throw new Error(
                    `Expected header "${header}" not found in actual headers: ${actualHeaders.join(', ')}`,
                );
            }
        }
        return true;
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

    async clickRow(row: number) {
        const rowElement = this.table.locator(`tr.data-table__row:nth-child(${row})`);
        await rowElement.click();
    }

    async getRowPosition(row: number) {
        const rowElement = this.table.locator(`tr.data-table__row:nth-child(${row})`);
        return await rowElement.boundingBox();
    }

    async isRowVisible(row: number) {
        const rowElement = this.table.locator(`tr.data-table__row:nth-child(${row})`);
        const boundingBox = await rowElement.boundingBox();
        if (!boundingBox) {
            return false;
        }

        const viewportHeight = await rowElement.page().evaluate(() => window.innerHeight);
        return boundingBox.y >= 0 && boundingBox.y + boundingBox.height <= viewportHeight;
    }
}

export enum QueriesSwitch {
    Top = 'Top',
    Running = 'Running',
}

export enum QueryPeriod {
    PerHour = 'Per hour',
    PerMinute = 'Per minute',
}

export enum TopShardsMode {
    Immediate = 'Immediate',
    Historical = 'Historical',
}

// Column names as they appear in the UI (based on QUERIES_COLUMNS_TITLES)
export const QUERY_COLUMNS_IDS = {
    QueryHash: 'Query Hash',
    CPUTime: 'CPU Time',
    Duration: 'Duration',
    QueryText: 'Query text',
    EndTime: 'End time',
    StartTime: 'Start time',
    ReadRows: 'Read Rows',
    ReadBytes: 'Read Bytes',
    RequestUnits: 'Request Units',
    User: 'User',
    Application: 'Application',
} as const;

// Default columns for the Top Queries mode (based on DEFAULT_TOP_QUERIES_COLUMNS)
export const QueryTopColumns = [
    QUERY_COLUMNS_IDS.QueryHash,
    QUERY_COLUMNS_IDS.CPUTime,
    QUERY_COLUMNS_IDS.Duration,
    QUERY_COLUMNS_IDS.QueryText,
    QUERY_COLUMNS_IDS.EndTime,
    QUERY_COLUMNS_IDS.ReadRows,
    QUERY_COLUMNS_IDS.ReadBytes,
    QUERY_COLUMNS_IDS.RequestUnits,
    QUERY_COLUMNS_IDS.User,
];

// Default columns for the Running Queries mode (based on DEFAULT_RUNNING_QUERIES_COLUMNS)
export const QueryRunningColumns = [
    QUERY_COLUMNS_IDS.User,
    QUERY_COLUMNS_IDS.StartTime,
    QUERY_COLUMNS_IDS.QueryText,
    QUERY_COLUMNS_IDS.Application,
];

const TOP_SHARDS_COLUMNS_IDS = {
    TabletId: 'TabletId',
    CPUCores: 'CPUCores',
    DataSize: 'DataSize (B)',
    Path: 'Path',
    NodeId: 'NodeId',
    PeakTime: 'PeakTime',
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: 'IntervalEnd',
} as const;

export const TopShardsImmediateColumns = [
    TOP_SHARDS_COLUMNS_IDS.Path,
    TOP_SHARDS_COLUMNS_IDS.CPUCores,
    TOP_SHARDS_COLUMNS_IDS.DataSize,
    TOP_SHARDS_COLUMNS_IDS.TabletId,
    TOP_SHARDS_COLUMNS_IDS.NodeId,
    TOP_SHARDS_COLUMNS_IDS.InFlightTxCount,
];

export const TopShardsHistoricalColumns = [
    TOP_SHARDS_COLUMNS_IDS.Path,
    TOP_SHARDS_COLUMNS_IDS.CPUCores,
    TOP_SHARDS_COLUMNS_IDS.DataSize,
    TOP_SHARDS_COLUMNS_IDS.TabletId,
    TOP_SHARDS_COLUMNS_IDS.NodeId,
    TOP_SHARDS_COLUMNS_IDS.PeakTime,
    TOP_SHARDS_COLUMNS_IDS.InFlightTxCount,
    TOP_SHARDS_COLUMNS_IDS.IntervalEnd,
];

export const ACL_SYNTAX_TEST_CONFIGS = [
    {
        syntax: 'YQL' as const,
        patterns: {
            USERS: 'CONNECT',
            'METADATA-READERS': 'LIST',
            'DATA-READERS': 'SELECT ROW',
        },
    },
    {
        syntax: 'KiKiMr' as const,
        patterns: {
            USERS: 'ConnectDatabase',
            'METADATA-READERS': 'List',
            'DATA-READERS': 'SelectRow',
        },
    },
    {
        syntax: 'YDB Short' as const,
        patterns: {
            USERS: 'connect',
            'METADATA-READERS': 'list',
            'DATA-READERS': 'select_row',
        },
    },
];

export class Diagnostics {
    table: Table;
    storage: StoragePage;
    nodes: NodesPage;
    memoryViewer: MemoryViewer;
    operations: OperationsTable;
    private page: Page;

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
    private tableRadioButton: Locator;
    private fixedHeightQueryElements: Locator;
    private copyLinkButton: Locator;
    private ownerCard: Locator;
    private changeOwnerButton: Locator;
    private grantAccessButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.storage = new StoragePage(page);
        this.nodes = new NodesPage(page);
        this.memoryViewer = new MemoryViewer(page);
        this.operations = new OperationsTable(page);
        this.tabs = page.locator('.kv-tenant-diagnostics__tabs');
        this.tableControls = page.locator('.ydb-table-with-controls-layout__controls');
        this.schemaViewer = page.locator('.schema-viewer');
        this.dataTable = page.locator('.data-table__table');
        this.primaryKeys = page.locator('.schema-viewer__keys_type_primary');
        this.refreshButton = page.locator('button[aria-label="Refresh"]');
        this.autoRefreshSelect = page.locator('.g-select');
        this.table = new Table(page.locator('.object-general'));
        this.tableRadioButton = page.locator(
            '.ydb-table-with-controls-layout__controls .g-segmented-radio-group',
        );
        this.fixedHeightQueryElements = page.locator('.ydb-fixed-height-query');
        this.copyLinkButton = page.locator('.ydb-copy-link-button__icon');

        // Info tab cards
        this.cpuCard = page.locator('.tenant-metrics-tabs__link-container:has-text("CPU")');
        this.storageCard = page.locator('.tenant-metrics-tabs__link-container:has-text("Storage")');
        this.memoryCard = page.locator('.tenant-metrics-tabs__link-container:has-text("Memory")');
        this.healthcheckCard = page.locator('.ydb-healthcheck-preview');
        this.ownerCard = page.locator('.ydb-access-rights__owner-card');
        this.changeOwnerButton = page.locator('.ydb-access-rights__owner-card button');
        this.grantAccessButton = page.locator('button:has-text("Grant Access")');
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
        const tab = this.tabs.locator(`.g-tab:has-text("${tabName}")`);
        await tab.click();
    }

    async clickRadioSwitch(radioName: QueriesSwitch): Promise<void> {
        const option = this.tableControls.locator(
            `.g-segmented-radio-group__option:has-text("${radioName}")`,
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
        return true;
    }

    async getResourceUtilization() {
        // Get aggregated metrics from the new TabCard structure
        const cpuPercentage = await this.cpuCard
            .locator('.ydb-doughnut-metrics__value')
            .textContent();
        const cpuUsage = await this.cpuCard.locator('.g-text_variant_subheader-2').textContent();

        const storagePercentage = await this.storageCard
            .locator('.ydb-doughnut-metrics__value')
            .textContent();
        const storageUsage = await this.storageCard
            .locator('.g-text_variant_subheader-2')
            .textContent();

        const memoryPercentage = await this.memoryCard
            .locator('.ydb-doughnut-metrics__value')
            .textContent();
        const memoryUsage = await this.memoryCard
            .locator('.g-text_variant_subheader-2')
            .textContent();

        return {
            cpu: {
                percentage: cpuPercentage?.trim() || '',
                usage: cpuUsage?.trim() || '',
            },
            storage: {
                percentage: storagePercentage?.trim() || '',
                usage: storageUsage?.trim() || '',
            },
            memory: {
                percentage: memoryPercentage?.trim() || '',
                usage: memoryUsage?.trim() || '',
            },
        };
    }

    async getHealthcheckStatus() {
        const statusElement = this.healthcheckCard.locator('.ydb-healthcheck-preview__icon');
        return await statusElement.isVisible();
    }

    async hasHealthcheckStatusClass(className: string) {
        const statusElement = this.healthcheckCard.locator('.ydb-healthcheck-preview__icon');
        const classList = await statusElement.evaluate((el) => Array.from(el.classList));
        return classList.includes(className);
    }

    async selectTopShardsMode(mode: TopShardsMode): Promise<void> {
        const option = this.tableRadioButton.locator(
            `.g-segmented-radio-group__option:has-text("${mode}")`,
        );
        await option.evaluate((el) => (el as HTMLElement).click());
    }

    async getSelectedTableMode(): Promise<string> {
        const checkedOption = this.tableRadioButton.locator(
            '.g-segmented-radio-group__option_checked',
        );
        return (await checkedOption.textContent())?.trim() || '';
    }

    async selectQueryPeriod(period: QueryPeriod): Promise<void> {
        // Click on the dropdown to open it
        const periodSelect = this.tableControls.locator('.g-select');
        await periodSelect.click();

        // Select the specified period option
        const optionLocator = periodSelect
            .page()
            .locator(`.g-select-list__option-default-label:has-text("${period}")`);
        await optionLocator.click();
    }

    async getSelectedQueryPeriod(): Promise<string> {
        const periodSelect = this.tableControls.locator('.g-select');
        const selectedText = await periodSelect
            .locator('.g-select-control__option-text')
            .textContent();
        return selectedText?.trim() || '';
    }

    async getFixedHeightQueryElementsCount(): Promise<number> {
        return await this.fixedHeightQueryElements.count();
    }

    async getFixedHeightQueryElementHeight(index: number): Promise<string> {
        const element = this.fixedHeightQueryElements.nth(index);
        return await element.evaluate((el) => {
            return window.getComputedStyle(el).height;
        });
    }

    async clickCopyLinkButton(): Promise<void> {
        await this.copyLinkButton.first().click();
    }

    async isCopyLinkButtonVisible(): Promise<boolean> {
        return await this.copyLinkButton.first().isVisible();
    }

    async isRowActive(rowIndex: number): Promise<boolean> {
        const rowElement = this.dataTable.locator(`tr.data-table__row:nth-child(${rowIndex})`);
        const rowElementClass = await rowElement.getAttribute('class');
        return rowElementClass?.includes('kv-top-queries__row_active') || false;
    }

    async isOwnerCardVisible(): Promise<boolean> {
        await this.ownerCard.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getOwnerName(): Promise<string> {
        const ownerNameElement = this.ownerCard.locator('.ydb-subject-with-avatar__subject');

        return await ownerNameElement.innerText();
    }

    async clickChangeOwnerButton(): Promise<void> {
        await this.changeOwnerButton.click();
    }

    async changeOwner(newOwnerName: string): Promise<void> {
        await this.clickChangeOwnerButton();

        // Wait for the dialog to appear
        const dialog = this.page.locator('.g-dialog');
        await dialog.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        // Wait for the owner input field to appear
        const ownerInput = dialog.locator('input[placeholder="Enter subject"]');
        await ownerInput.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        // Clear the input and type the new owner name
        await ownerInput.clear();
        await ownerInput.fill(newOwnerName);

        // Click the Apply button
        const applyButton = dialog.locator('button:has-text("Apply")');

        // Wait for the button to be enabled
        await this.page.waitForTimeout(500);
        // Wait for the button to become enabled
        await this.page.waitForSelector('.g-dialog button:has-text("Apply"):not([disabled])', {
            timeout: VISIBILITY_TIMEOUT,
        });
        await applyButton.click();

        // Wait for the dialog to close and changes to be applied
        await dialog.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        await this.page.waitForTimeout(500);
    }

    async clickGrantAccessButton(): Promise<void> {
        await this.grantAccessButton.click();
    }

    async isGrantAccessDrawerVisible(): Promise<boolean> {
        const grantAccessDialog = this.page.locator('.ydb-grant-access');
        await grantAccessDialog.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async enterSubjectInGrantAccessDialog(subject: string): Promise<void> {
        const subjectInput = this.page.locator('.ydb-grant-access input[name="subjectInput"]');
        await subjectInput.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await subjectInput.fill(subject);
        await subjectInput.press('Enter');
    }

    async isRightsWrapperVisible(): Promise<boolean> {
        const rightsWrapper = this.page.locator('.ydb-grant-access__rights-wrapper');
        return rightsWrapper.isVisible();
    }

    async isApplyButtonDisabled(): Promise<boolean> {
        const applyButton = this.page.locator('.ydb-grant-access__footer-button:has-text("Apply")');
        await applyButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return await applyButton.isDisabled();
    }

    async clickFullAccessSwitch(): Promise<void> {
        const fullAccessCard = this.page.locator('.ydb-grant-access__single-right').first();
        await fullAccessCard.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        const switchElement = fullAccessCard.locator('.g-switch__indicator');
        await switchElement.click();
    }

    async clickApplyButton(): Promise<void> {
        const applyButton = this.page.locator('button:has-text("Apply")');
        await applyButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await applyButton.click();
    }

    async isSubjectInRightsTable(subject: string): Promise<boolean> {
        const rightsTable = this.page.locator('.ydb-access-rights__rights-table');
        await rightsTable.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        const rows = rightsTable.locator('.data-table__row');

        await rows
            .filter({hasText: subject})
            .waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getEffectiveRightsFromTable(): Promise<Record<string, string>> {
        const rightsTable = this.page.locator('.ydb-access-rights__rights-table');
        await rightsTable.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        const rows = await rightsTable.locator('tbody tr').all();
        const rights: Record<string, string> = {};

        for (const row of rows) {
            const cells = await row.locator('td').all();
            if (cells.length >= 3) {
                // Get the subject name from the avatar component
                const subjectElement = cells[0].locator('.ydb-subject-with-avatar__subject');
                const subject = await subjectElement.textContent();
                const effectiveRights = await cells[2].textContent();
                if (subject && effectiveRights) {
                    rights[subject.trim()] = effectiveRights.trim();
                }
            }
        }

        return rights;
    }

    async waitForTableDataToLoad(): Promise<void> {
        // Wait for the table to be visible and have at least one row of data
        const rightsTable = this.page.locator('.ydb-access-rights__rights-table');
        await rightsTable.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await rightsTable
            .locator('tbody tr')
            .first()
            .waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        // Additional small delay to ensure data is fully loaded
        await this.page.waitForTimeout(500);
    }

    async getPermissionLabelsInGrantDialog(): Promise<string[]> {
        const labels = await this.page
            .locator('.ydb-grant-access__rights-wrapper .g-switch__text')
            .all();
        const texts: string[] = [];
        for (const label of labels) {
            const text = await label.textContent();
            if (text) {
                texts.push(text.trim());
            }
        }
        return texts;
    }

    async switchAclSyntaxAndGetRights(
        sidebar: Sidebar,
        syntax: 'KiKiMr' | 'YDB Short' | 'YDB' | 'YQL',
    ): Promise<Record<string, string>> {
        // Switch syntax
        await sidebar.clickSettings();
        await sidebar.selectAclSyntax(syntax);
        await sidebar.closeDrawer();

        // Refresh the page data by navigating away and back
        await this.clickTab(DiagnosticsTab.Info);
        await this.clickTab(DiagnosticsTab.Access);
        await this.waitForTableDataToLoad();

        // Get and return the rights
        return await this.getEffectiveRightsFromTable();
    }
}
