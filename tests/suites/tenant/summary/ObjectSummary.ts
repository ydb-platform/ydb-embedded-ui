import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../TenantPage';

import {ActionsMenu} from './ActionsMenu';
import type {RowTableAction} from './types';

export enum ObjectSummaryTab {
    Overview = 'Overview',
    ACL = 'ACL',
    Schema = 'Schema',
}

export class ObjectSummary {
    private tabs: Locator;
    private schemaViewer: Locator;
    private tree: Locator;
    private treeRows: Locator;
    private primaryKeys: Locator;
    private actionsMenu: ActionsMenu;

    constructor(page: Page) {
        this.tree = page.locator('.ydb-object-summary__tree');
        this.treeRows = page.locator('.ydb-tree-view');
        this.tabs = page.locator('.ydb-object-summary__tabs');
        this.schemaViewer = page.locator('.schema-viewer');
        this.primaryKeys = page.locator('.schema-viewer__keys_type_primary');
        this.actionsMenu = new ActionsMenu(page.locator('.g-popup.g-popup_open'));
    }

    async isTreeVisible() {
        await this.tree.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isTreeHidden() {
        await this.tree.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isSchemaViewerVisible() {
        await this.schemaViewer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isSchemaViewerHidden() {
        await this.schemaViewer.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isOpenPreviewIconVisibleOnHover(text: string): Promise<boolean> {
        const treeItem = this.treeRows.filter({hasText: text}).first();
        await treeItem.hover();

        const openPreviewIcon = treeItem.locator('button[title="Open preview"]');

        try {
            await openPreviewIcon.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch (error) {
            return false;
        }
    }

    async clickPreviewButton(text: string): Promise<void> {
        const treeItem = this.treeRows.filter({hasText: text}).first();
        await treeItem.hover();

        const openPreviewIcon = treeItem.locator('button[title="Open preview"]');
        await openPreviewIcon.click();
    }

    async clickActionsButton(text: string): Promise<void> {
        const treeItem = this.treeRows.filter({hasText: text}).first();
        await treeItem.hover();

        const actionsIcon = treeItem.locator('.g-dropdown-menu__switcher-button');
        await actionsIcon.click();
    }

    async isActionsMenuVisible(): Promise<boolean> {
        return this.actionsMenu.isVisible();
    }

    async getActionsMenuItems(): Promise<string[]> {
        return this.actionsMenu.getItems();
    }

    async clickActionsMenuItem(itemText: string): Promise<void> {
        await this.actionsMenu.clickItem(itemText);
    }

    async clickTab(tabName: ObjectSummaryTab): Promise<void> {
        const tab = this.tabs.locator(`.ydb-object-summary__tab:has-text("${tabName}")`);
        await tab.click();
    }

    async getPrimaryKeys(): Promise<string[]> {
        const keysElement = this.primaryKeys.locator('.schema-viewer__keys-values');
        const keysText = (await keysElement.textContent()) || '';
        return keysText.split(', ').map((key) => key.trim());
    }

    async getTableTemplates(): Promise<RowTableAction[]> {
        return this.actionsMenu.getTableTemplates();
    }

    async clickActionMenuItem(treeItemText: string, menuItemText: string): Promise<void> {
        await this.clickActionsButton(treeItemText);
        await this.actionsMenu.clickItem(menuItemText);
    }
}
