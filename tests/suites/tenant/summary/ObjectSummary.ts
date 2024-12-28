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
    private aclWrapper: Locator;
    private aclList: Locator;
    private effectiveAclList: Locator;
    private createDirectoryModal: Locator;
    private createDirectoryInput: Locator;
    private createDirectoryButton: Locator;
    private refreshButton: Locator;

    constructor(page: Page) {
        this.tree = page.locator('.ydb-object-summary__tree');
        this.treeRows = page.locator('.ydb-tree-view');
        this.tabs = page.locator('.ydb-object-summary__tabs');
        this.schemaViewer = page.locator('.schema-viewer');
        this.primaryKeys = page.locator('.schema-viewer__keys_type_primary');
        this.actionsMenu = new ActionsMenu(page.locator('.g-popup.g-popup_open'));
        this.aclWrapper = page.locator('.ydb-acl');
        this.aclList = this.aclWrapper.locator('dl.gc-definition-list').first();
        this.effectiveAclList = this.aclWrapper.locator('dl.gc-definition-list').last();
        this.createDirectoryModal = page.locator('.g-modal.g-modal_open');
        this.createDirectoryInput = page.locator(
            '.g-text-input__control[placeholder="Relative path"]',
        );
        this.createDirectoryButton = page.locator('button.g-button_view_action:has-text("Create")');
        this.refreshButton = page.locator('.ydb-object-summary__refresh-button');
    }

    async isCreateDirectoryModalVisible(): Promise<boolean> {
        try {
            await this.createDirectoryModal.waitFor({
                state: 'visible',
                timeout: VISIBILITY_TIMEOUT,
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async enterDirectoryName(name: string): Promise<void> {
        await this.createDirectoryInput.fill(name);
    }

    async clickCreateDirectoryButton(): Promise<void> {
        await this.createDirectoryButton.click();
    }

    async createDirectory(name: string): Promise<void> {
        await this.enterDirectoryName(name);
        await this.clickCreateDirectoryButton();
        // Wait for modal to close
        await this.createDirectoryModal.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
    }

    async waitForAclVisible() {
        await this.aclWrapper.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getAccessRights(): Promise<{user: string; rights: string}[]> {
        await this.waitForAclVisible();
        const items = await this.aclList.locator('.gc-definition-list__item').all();
        const result = [];

        for (const item of items) {
            const user =
                (await item.locator('.gc-definition-list__term-wrapper span').textContent()) || '';
            const definitionContent = await item.locator('.gc-definition-list__definition').first();
            const rights = (await definitionContent.textContent()) || '';
            result.push({user: user.trim(), rights: rights.trim()});
        }

        return result;
    }

    async getEffectiveAccessRights(): Promise<{group: string; permissions: string[]}[]> {
        await this.waitForAclVisible();
        const items = await this.effectiveAclList.locator('.gc-definition-list__item').all();
        const result = [];

        for (const item of items) {
            const group =
                (await item.locator('.gc-definition-list__term-wrapper span').textContent()) || '';
            const definitionContent = await item.locator('.gc-definition-list__definition').first();
            const permissionElements = await definitionContent.locator('span').all();
            const permissions = await Promise.all(
                permissionElements.map(async (el) => ((await el.textContent()) || '').trim()),
            );
            result.push({group: group.trim(), permissions});
        }

        return result;
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

    async isActionItemLoading(itemText: string): Promise<boolean> {
        return this.actionsMenu.isItemLoading(itemText);
    }

    async getActionsMenuItems(): Promise<string[]> {
        return this.actionsMenu.getItems();
    }

    async clickActionsMenuItem(itemText: string): Promise<void> {
        if (await this.isActionItemLoading(itemText)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
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
        await this.clickActionsMenuItem(menuItemText);
    }

    async clickRefreshButton(): Promise<void> {
        await this.refreshButton.click();
    }
}
