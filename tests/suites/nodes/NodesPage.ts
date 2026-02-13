import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {nodesPage} from '../../utils/constants';
import {VISIBILITY_TIMEOUT} from '../tenant/TenantPage';

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
        await this.groupBySelect.click({timeout: VISIBILITY_TIMEOUT});
        await this.groupByPopup.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        const optionItem = this.groupByPopup.locator('.g-select-list__option').getByText(option);
        await optionItem.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await optionItem.click({timeout: VISIBILITY_TIMEOUT});
    }
    async waitForTableGroupsLoaded() {
        await this.page
            .locator('.table-skeleton')
            .waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        await this.tableGroupsWrapper.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.getTableGroups()
            .first()
            .waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }
    selectTableGroup(name: string) {
        return this.tableGroupsWrapper.locator('.ydb-table-group').filter({hasText: name}).first();
    }
    async expandTableGroup(name: string) {
        const group = this.selectTableGroup(name);
        const toggleButton = group.locator('.ydb-table-group__button');
        await toggleButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await toggleButton.click({timeout: VISIBILITY_TIMEOUT});
    }
    selectTableGroupContent(name: string) {
        return this.selectTableGroup(name)
            .locator('.ydb-table-group__content')
            .locator('.ydb-paginated-table');
    }

    getTableGroups() {
        return this.tableGroupsWrapper.locator('.ydb-table-group');
    }

    getFirstTableGroup() {
        return this.getTableGroups().first();
    }

    async expandFirstTableGroup() {
        const firstGroup = this.getFirstTableGroup();
        const toggleButton = firstGroup.locator('.ydb-table-group__button');

        await toggleButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await toggleButton.click({timeout: VISIBILITY_TIMEOUT});
    }

    getFirstTableGroupContent() {
        return this.getFirstTableGroup()
            .locator('.ydb-table-group__content')
            .locator('.ydb-paginated-table');
    }
}
