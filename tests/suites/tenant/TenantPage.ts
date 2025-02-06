import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {tenantPage} from '../../utils/constants';

export const VISIBILITY_TIMEOUT = 10 * 1000;

export enum NavigationTabs {
    Query = 'Query',
    Diagnostics = 'Diagnostics',
}

export class TenantPage extends PageModel {
    private navigation: Locator;
    private radioGroup: Locator;
    private diagnosticsContainer: Locator;
    private emptyState: Locator;
    private emptyStateTitle: Locator;

    constructor(page: Page) {
        super(page, tenantPage);

        this.navigation = page.locator('.ydb-tenant-navigation');
        this.radioGroup = this.navigation.locator('.g-radio-button');
        this.diagnosticsContainer = page.locator('.kv-tenant-diagnostics');
        this.emptyState = page.locator('.empty-state');
        this.emptyStateTitle = this.emptyState.locator('.empty-state__title');
    }

    async waitForDiagnosticsToLoad() {
        await this.diagnosticsContainer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isDiagnosticsVisible() {
        await this.diagnosticsContainer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isEmptyStateVisible() {
        await this.emptyState.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getEmptyStateTitle(): Promise<string> {
        return this.emptyStateTitle.innerText();
    }

    async selectNavigationTab(tabName: NavigationTabs) {
        const tabInput = this.radioGroup.locator(`input[value="${tabName.toLowerCase()}"]`);
        await tabInput.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await tabInput.click();
    }
}
