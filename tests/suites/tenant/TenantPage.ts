import {Locator, Page} from '@playwright/test';

import {tenantPage} from '../../utils/constants';
import {PageModel} from '../../models/PageModel';

export class TenantPage extends PageModel {
    readonly table: Locator;

    constructor(page: Page) {
        super(page, tenantPage);
    }
}
