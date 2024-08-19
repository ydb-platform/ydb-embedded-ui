import type {Locator, Page} from '@playwright/test';

export const VISIBILITY_TIMEOUT = 5000;

export class ObjectSummary {
    private tree: Locator;
    private treeRows: Locator;

    constructor(page: Page) {
        this.tree = page.locator('.object-summary__tree');
        this.treeRows = page.locator('.ydb-tree-view');
    }

    async isTreeVisible() {
        await this.tree.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isTreeHidden() {
        await this.tree.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
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
}
