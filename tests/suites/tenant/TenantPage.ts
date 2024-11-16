import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {tenantPage} from '../../utils/constants';

export const VISIBILITY_TIMEOUT = 10000;

export enum NavigationTabs {
    Query = 'Query',
    Diagnostics = 'Diagnostics',
}

export class TenantPage extends PageModel {
    private navigation: Locator;
    private radioGroup: Locator;

    constructor(page: Page) {
        super(page, tenantPage);

        this.navigation = page.locator('.ydb-tenant-navigation');
        this.radioGroup = this.navigation.locator('.g-radio-button');
    }

    async selectNavigationTab(tabName: NavigationTabs) {
        const tabInput = this.radioGroup.locator(`input[value="${tabName.toLowerCase()}"]`);
        await tabInput.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await tabInput.click();
    }
}
