import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {nodesPage} from '../../utils/constants';

type NodesGroupByOptions =
    | 'Host'
    | 'DC'
    | 'Rack'
    | 'Database'
    | 'Version'
    | 'Uptime'
    | 'Missing'
    | 'DiskSpaceUsage';

export class NodesPage extends PageModel {
    readonly table: Locator;

    private groupBySelect: Locator;
    private groupByPopup: Locator;

    private tableGroupsWrapper: Locator;

    constructor(page: Page) {
        super(page, nodesPage);

        this.table = this.selector.locator('.ydb-paginated-table__table');

        this.groupBySelect = this.page.locator('.ydb-nodes__group-by-select');
        this.groupByPopup = this.page.locator('.ydb-nodes__group-by-popup');

        this.tableGroupsWrapper = this.page.locator('.ydb-nodes__groups-wrapper');
    }

    async selectGroupByOption(option: NodesGroupByOptions) {
        await this.groupBySelect.click();
        await this.groupByPopup.isVisible();
        await this.groupByPopup.locator('.g-select-list__option').getByText(option).click();
    }
    async waitForTableGroupsLoaded() {
        await this.page.locator('.table-skeleton').isHidden();
        await this.tableGroupsWrapper.isVisible();
    }
    selectTableGroup(name: string) {
        return this.tableGroupsWrapper.locator('.ydb-table-group').filter({hasText: name}).first();
    }
    async expandTableGroup(name: string) {
        await this.selectTableGroup(name).getByRole('button').click();
    }
    selectTableGroupContent(name: string) {
        return this.selectTableGroup(name)
            .locator('.ydb-table-group__content')
            .locator('.ydb-paginated-table');
    }
}
