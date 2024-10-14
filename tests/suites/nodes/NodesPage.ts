import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {nodesPage} from '../../utils/constants';

export class NodesPage extends PageModel {
    readonly table: Locator;

    constructor(page: Page) {
        super(page, nodesPage);

        this.table = this.selector.locator('.ydb-paginated-table__table');
    }
}
