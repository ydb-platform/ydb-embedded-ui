import type {Locator, Page} from '@playwright/test';

import {isInViewport} from '../../../utils/dom';
import {VISIBILITY_TIMEOUT} from '../TenantPage';

import {ActionsMenu} from './ActionsMenu';
import type {RowTableAction} from './types';

export enum ObjectSummaryTab {
    Overview = 'Overview',
    ACL = 'ACL',
    Schema = 'Schema',
}
export class ObjectSummary {
    private page: Page;
    private tabs: Locator;
    private schemaViewer: Locator;
    private tree: Locator;
    private treeRows: Locator;
    private treeLoaders: Locator;
    private primaryKeys: Locator;
    private actionsMenu: ActionsMenu;
    private createDirectoryModal: Locator;
    private createDirectoryInput: Locator;
    private createDirectoryButton: Locator;
    private refreshButton: Locator;
    private infoCollapseButton: Locator;
    private infoExpandButton: Locator;
    private summaryCollapseButton: Locator;
    private summaryExpandButton: Locator;
    private overviewWrapper: Locator;

    constructor(page: Page) {
        this.page = page;
        this.tree = page.locator('.ydb-object-summary__tree');
        this.treeRows = page.locator('.ydb-tree-view');
        this.treeLoaders = page.locator('.ydb-navigation-tree-view-loader');
        this.tabs = page.locator('.ydb-object-summary__tabs');
        this.schemaViewer = page.locator('.schema-viewer');
        this.primaryKeys = page.locator('.schema-viewer__keys_type_primary');
        this.actionsMenu = new ActionsMenu(page.locator('.g-popup.g-popup_open'));
        this.createDirectoryModal = page.locator('.g-modal.g-modal_open');
        this.createDirectoryInput = page.locator(
            '.g-text-input__control[placeholder="Relative path"]',
        );
        this.createDirectoryButton = page.locator('button.g-button_view_action:has-text("Create")');
        this.refreshButton = page.locator('.ydb-object-summary__refresh-button');

        // Info panel collapse/expand buttons
        this.infoCollapseButton = page.locator(
            '.ydb-object-summary__info-controls .kv-pane-visibility-button_type_collapse',
        );
        this.infoExpandButton = page.locator(
            '.ydb-object-summary__info-controls .kv-pane-visibility-button_type_expand',
        );
        this.summaryCollapseButton = page.locator(
            '.ydb-object-summary__actions .kv-pane-visibility-button_type_collapse',
        );
        this.summaryExpandButton = page.locator(
            '.ydb-object-summary__actions .kv-pane-visibility-button_type_expand',
        );
        this.overviewWrapper = page.locator('.ydb-object-summary__overview-wrapper');
    }

    async collapseInfoPanel(): Promise<void> {
        await this.infoCollapseButton.click();
    }

    async expandInfoPanel(): Promise<void> {
        await this.infoExpandButton.click();
    }

    async isInfoPanelCollapsed(): Promise<boolean> {
        const expandButtonVisible = await this.infoExpandButton.isVisible();
        if (!expandButtonVisible) {
            return false;
        }

        const isVisible = await this.overviewWrapper.isVisible();
        if (!isVisible) {
            return true;
        }

        // Check if it's actually in the viewport
        const elementInViewport = await isInViewport(this.overviewWrapper);
        return !elementInViewport;
    }

    async isCreateDirectoryModalVisible(): Promise<boolean> {
        try {
            await this.createDirectoryModal.waitFor({
                state: 'visible',
                timeout: VISIBILITY_TIMEOUT,
            });
            return true;
        } catch {
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
        // In the new UI, the ACL tab shows a redirect message instead of the actual ACL content
        const redirectMessage = this.page.locator('text=Section was moved to Diagnostics');
        await redirectMessage.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async getRedirectMessage(): Promise<string | null> {
        const redirectMessage = this.page.locator('text=Section was moved to Diagnostics');
        if (await redirectMessage.isVisible()) {
            return redirectMessage.textContent();
        }
        return null;
    }

    async hasOpenInDiagnosticsButton(): Promise<boolean> {
        try {
            const diagnosticsButton = this.page.getByRole('button', {name: 'Open in Diagnostics'});
            await diagnosticsButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch (error) {
            console.error('Open in Diagnostics button not visible:', error);
            return false;
        }
    }

    async clickOpenInDiagnosticsButton(): Promise<void> {
        const diagnosticsButton = this.page.getByRole('button', {name: 'Open in Diagnostics'});
        await diagnosticsButton.click();
    }

    async isTreeVisible() {
        await this.tree.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isTreeLoaded() {
        const loaders = await this.treeLoaders.all();

        for (const loader of loaders) {
            await loader.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        }

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

    async getTreeItem(text: string) {
        // Ensure tree is ready for the search
        await this.isTreeVisible();
        await this.isTreeLoaded();

        const itemLocator = this.treeRows.filter({hasText: text}).first();

        // Default timeout is too big for such case
        const timeout = 500;

        if (await itemLocator.isVisible({timeout})) {
            return itemLocator;
        }

        // Element could be in not rendered (virtualized) part of the tree
        // Such element cannot be found by playwright
        // Scroll 200px * 10 from top to bottom to find element
        // Firstly scroll to top in case tree was already scrolled down
        await this.tree.evaluate((e) => {
            e.scrollTo({top: 0, behavior: 'instant'});
        });

        // Wait after scroll for elements to become stable
        await this.page.waitForTimeout(50);

        if (await itemLocator.isVisible({timeout})) {
            return itemLocator;
        }

        // Hover element so page.mouse.wheel work for it
        await this.tree.hover();

        // Start scrolling from top to bottom untill desired element is found
        let i = 0;
        while (i < 10) {
            i++;

            await this.page.mouse.wheel(0, 200);

            // Wait after scroll for elements to become stable
            await this.page.waitForTimeout(50);

            // Some nested nodes could be loading
            await this.isTreeLoaded();

            if (await itemLocator.isVisible({timeout})) {
                return itemLocator;
            }
        }

        throw new Error(`Tree item ${text} was not found`);
    }

    async isOpenPreviewIconVisibleOnHover(text: string): Promise<boolean> {
        const treeItem = await this.getTreeItem(text);
        await treeItem.hover();

        const openPreviewIcon = treeItem.locator('button[title="Open preview"]');

        try {
            await openPreviewIcon.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }

    async clickPreviewButton(text: string): Promise<void> {
        const treeItem = await this.getTreeItem(text);
        await treeItem.hover();

        const openPreviewIcon = treeItem.locator('button[title="Open preview"]');
        await openPreviewIcon.click();
    }

    async clickActionsButton(text: string): Promise<void> {
        const treeItem = await this.getTreeItem(text);
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
        const dataTab = tabName.toLowerCase();
        const tab = this.tabs.locator(`button[data-tab="${dataTab}"]`);
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

    async collapseSummary(): Promise<void> {
        await this.summaryCollapseButton.click();
    }

    async expandSummary(): Promise<void> {
        await this.summaryExpandButton.click();
    }

    async isSummaryCollapsed(): Promise<boolean> {
        const expandButtonVisible = await this.summaryExpandButton.isVisible();
        if (!expandButtonVisible) {
            return false;
        }

        const isVisible = await this.tree.isVisible();
        if (!isVisible) {
            return true;
        }

        // Check if it's actually in the viewport
        const elementInViewport = await isInViewport(this.tree);
        return !elementInViewport;
    }
}
