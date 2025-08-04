import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

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
        await this.tabs.waitFor({state: 'visible'});
    }

    async isThreadsTabVisible() {
        try {
            await this.threadsTab.waitFor({state: 'visible', timeout: 1000});
            return true;
        } catch {
            return false;
        }
    }

    async clickThreadsTab() {
        await this.threadsTab.click();
    }

    async getAllTabNames() {
        const tabs = await this.tabs.locator('.g-tabs__item').allTextContents();
        return tabs;
    }
}
