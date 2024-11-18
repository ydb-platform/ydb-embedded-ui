import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';
import type {QueryTabs} from '../QueryEditor';

export class QueryTabsNavigation {
    private tabsContainer: Locator;

    constructor(page: Page) {
        this.tabsContainer = page.locator('.ydb-query__tabs');
    }

    async selectTab(tabName: QueryTabs) {
        const tab = this.tabsContainer.locator(`role=tab[name="${tabName}"]`);
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await tab.click();
    }

    async isTabSelected(tabName: QueryTabs): Promise<boolean> {
        const tab = this.tabsContainer.locator(`role=tab[name="${tabName}"]`);
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        const isSelected = await tab.getAttribute('aria-selected');
        return isSelected === 'true';
    }

    async getTabHref(tabName: QueryTabs): Promise<string | null> {
        const link = this.tabsContainer.locator(`a:has(div[role="tab"][title="${tabName}"])`);
        await link.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return link.getAttribute('href');
    }
}
