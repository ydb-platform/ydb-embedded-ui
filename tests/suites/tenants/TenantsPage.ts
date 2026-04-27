import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {databasesPage} from '../../utils/constants';
import {selectContentTable} from '../../utils/selectContentTable';

export class TenantsPage extends PageModel {
    readonly table: Locator;

    constructor(page: Page) {
        super(page, databasesPage);

        this.table = selectContentTable(this.selector);
    }
}
