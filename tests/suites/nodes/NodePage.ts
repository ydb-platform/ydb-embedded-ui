import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {VISIBILITY_TIMEOUT} from '../tenant/TenantPage';

export class NodePage extends PageModel {
    readonly tabs: Locator;
    readonly threadsTab: Locator;
    readonly tabletsTab: Locator;
    readonly storageTab: Locator;

    constructor(page: Page, nodeId: string) {
        super(page, `node/${nodeId}`);

        this.tabs = this.selector.locator('.node__tab-list');
        this.threadsTab = this.tabs.locator('[value="threads"]');
        this.tabletsTab = this.tabs.locator('[value="tablets"]');
        this.storageTab = this.tabs.locator('[value="storage"]');
    }

    async waitForNodePageLoad() {
        // Wait for the page to load and tabs to be visible
        try {
            await this.tabs.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        } catch (error) {
            console.error('Failed to load node page tabs:', error);
            throw error;
        }
    }

    async isThreadsTabVisible() {
        const threadsTab = this.tabs.locator('.g-tab:has-text("Threads")');
        try {
            await threadsTab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            console.error('Threads tab is not visible');
            return false;
        }
    }

    async clickThreadsTab() {
        const threadsTab = this.tabs.locator('.g-tab:has-text("Threads")');
        await threadsTab.click();
    }

    async getAllTabNames() {
        const tabs = await this.tabs.locator('.g-tab').allTextContents();
        return tabs;
    }
}
