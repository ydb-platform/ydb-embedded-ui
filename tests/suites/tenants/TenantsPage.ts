import {Locator, Page} from '@playwright/test';

import {tenantsPage} from '../../utils/constants';
import {selectContentTable} from '../../utils/selectContentTable';
import {PageModel} from '../../models/PageModel';

export class TenantsPage extends PageModel {
    readonly table: Locator;

    constructor(page: Page) {
        super(page, tenantsPage);

        this.table = selectContentTable(this.selector);
    }
}
