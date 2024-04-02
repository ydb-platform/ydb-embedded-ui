import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {tenantsPage} from '../../utils/constants';
import {selectContentTable} from '../../utils/selectContentTable';

export class TenantsPage extends PageModel {
    readonly table: Locator;

    constructor(page: Page) {
        super(page, tenantsPage);

        this.table = selectContentTable(this.selector);
    }
}
