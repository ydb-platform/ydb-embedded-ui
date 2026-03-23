import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TAB_QA_PREFIX = 'query-editor-tab-';
const SAFE_TAB_CLICK_OFFSET_X = 12;

export class EditorTabsBar {
    private page: Page;
    private root: Locator;
    private tabs: Locator;
    private addTabButton: Locator;
    private menu: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root = page.locator('.editor-tabs');
        this.tabs = this.root.locator('[role="tab"]');
        this.addTabButton = this.root.getByRole('button', {name: 'New editor tab'});
        this.menu = page.locator('.g-dropdown-menu__menu');
    }

    async isVisible() {
        await this.root.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.root.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async clickAddTab() {
        await this.addTabButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.addTabButton.click();
    }

    async getTabCount() {
        await this.isVisible();
        return this.tabs.count();
    }

    async getTabTitles() {
        await this.isVisible();
        return this.root.locator('.editor-tab-item__tab-title').allInnerTexts();
    }

    async getActiveTabTitle() {
        const activeTab = this.root.locator('[role="tab"][aria-selected="true"]');
        await activeTab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return activeTab.locator('.editor-tab-item__tab-title').innerText();
    }

    async selectTab(title: string) {
        const tab = this.getTabByTitle(title);
        await this.clickTabMainArea(tab);
    }

    async isTabSelected(title: string) {
        const tab = this.getTabByTitle(title);
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return (await tab.getAttribute('aria-selected')) === 'true';
    }

    async closeTab(title: string) {
        const tab = this.getTabByTitle(title);
        await this.clickTabMainArea(tab);
        await tab.locator('.editor-tab-item__tab-action_close').click();
    }

    async openTabMenu(title: string) {
        const tab = this.getTabByTitle(title);
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await tab.hover();
        await tab.locator('.editor-tab-item__tab-menu-switcher').click();
        await this.menu.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    async clickMenuAction(actionName: string) {
        const menuItem = this.menu.getByRole('menuitem').filter({hasText: actionName});
        await menuItem.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await menuItem.click();
    }

    async getMenuActions() {
        await this.menu.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.menu.getByRole('menuitem').allInnerTexts();
    }

    async waitForTabCount(expectedCount: number) {
        const startTime = Date.now();
        while (Date.now() - startTime < VISIBILITY_TIMEOUT) {
            if ((await this.getTabCount()) === expectedCount) {
                return true;
            }
            await this.page.waitForTimeout(100);
        }

        throw new Error(`Tab count did not change to ${expectedCount}`);
    }

    // --- ID-based methods (resilient to duplicate tab titles) ---

    async getActiveTabId(): Promise<string | null> {
        const activeTab = this.root.locator('[role="tab"][aria-selected="true"]');
        await activeTab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.extractTabId(await activeTab.getAttribute('data-qa'));
    }

    async getTabIds(): Promise<string[]> {
        await this.isVisible();
        const allQa = await this.tabs.evaluateAll((elements) =>
            elements.map((el) => el.getAttribute('data-qa') ?? ''),
        );
        return allQa
            .filter((qa) => qa.startsWith('query-editor-tab-'))
            .map((qa) => qa.slice('query-editor-tab-'.length));
    }

    async selectTabById(tabId: string) {
        const tab = this.getTabById(tabId);
        await this.clickTabMainArea(tab);
    }

    async closeTabById(tabId: string) {
        const tab = this.getTabById(tabId);
        await this.clickTabMainArea(tab);
        await tab.locator('.editor-tab-item__tab-action_close').click();
    }

    async openTabMenuById(tabId: string) {
        const tab = this.getTabById(tabId);
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await tab.hover();
        await tab.locator('.editor-tab-item__tab-menu-switcher').click();
        await this.menu.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    async getTabTitleById(tabId: string): Promise<string> {
        const tab = this.getTabById(tabId);
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return tab.locator('.editor-tab-item__tab-title').innerText();
    }

    private getTabById(tabId: string): Locator {
        return this.root.locator(`[data-qa="${TAB_QA_PREFIX}${tabId}"]`);
    }

    private async clickTabMainArea(tab: Locator) {
        await tab.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        const boundingBox = await tab.boundingBox();
        const clickY = boundingBox ? Math.max(1, Math.floor(boundingBox.height / 2)) : 8;

        await tab.click({position: {x: SAFE_TAB_CLICK_OFFSET_X, y: clickY}});
    }

    private extractTabId(dataQa: string | null): string | null {
        if (!dataQa?.startsWith(TAB_QA_PREFIX)) {
            return null;
        }
        return dataQa.slice(TAB_QA_PREFIX.length);
    }

    // --- Title-based methods (kept for backward compatibility) ---

    private getTabByTitle(title: string) {
        return this.getTabTitleLocator(title).locator('xpath=ancestor::*[@role="tab"][1]');
    }

    private getTabTitleLocator(title: string) {
        return this.root
            .locator('.editor-tab-item__tab-title')
            .filter({
                hasText: new RegExp(`^${escapeRegExp(title)}$`),
            })
            .first();
    }
}
