import type {Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {tenantPage} from '../../utils/constants';

export class TenantPage extends PageModel {
    constructor(page: Page) {
        super(page, tenantPage);
    }
}
