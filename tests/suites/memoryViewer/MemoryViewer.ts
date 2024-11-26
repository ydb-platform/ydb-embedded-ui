import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../tenant/TenantPage';

export class MemoryViewer {
    readonly container: Locator;
    readonly progressContainer: Locator;
    readonly allocatorSegment: Locator;
    readonly otherSegment: Locator;
    readonly text: Locator;
    readonly popup: Locator;
    readonly definitionList: Locator;

    constructor(page: Page) {
        const paginatedTable = page.locator('.ydb-paginated-table__table');
        this.container = paginatedTable.locator('tbody tr').nth(0).locator('.memory-viewer');
        this.progressContainer = this.container.locator('.memory-viewer__progress-container');
        this.allocatorSegment = this.progressContainer.locator(
            '.memory-viewer__segment_type_AllocatorCachesMemory',
        );
        this.otherSegment = this.progressContainer.locator('.memory-viewer__segment_type_Other');
        this.text = this.progressContainer.locator('.memory-viewer__text');

        // Popup elements
        this.popup = page.locator('.g-popup.g-popup_open');
        this.definitionList = this.popup.locator('.g-definition-list');
    }

    async isVisible() {
        return this.container.isVisible();
    }

    async waitForVisible() {
        await this.container.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    async getStatus() {
        const classList = await this.container.getAttribute('class');
        if (classList?.includes('memory-viewer_status_good')) {
            return 'good';
        }
        return 'unknown';
    }

    async getTheme() {
        const classList = await this.container.getAttribute('class');
        if (classList?.includes('memory-viewer_theme_system')) {
            return 'system';
        }
        return 'unknown';
    }

    async getAllocatorSegmentWidth() {
        return this.allocatorSegment.evaluate((el) => el.style.width);
    }

    async getOtherSegmentWidth() {
        return this.otherSegment.evaluate((el) => el.style.width);
    }

    async getOtherSegmentOffset() {
        return this.otherSegment.evaluate((el) => el.style.left);
    }

    async getText() {
        return this.text.innerText();
    }

    async getItemValue(name: string) {
        const item = this.getDefinitionItem(name);
        return item.locator('.g-definition-list__definition').innerText();
    }

    async getProgressValue(name: string) {
        const item = this.getDefinitionItem(name);
        const progressViewer = item.locator('.progress-viewer');
        const line = progressViewer.locator('.progress-viewer__line');
        const text = progressViewer.locator('.progress-viewer__text');

        return {
            width: await line.evaluate((el) => el.style.width),
            text: await text.innerText(),
            status: await this.getProgressStatus(progressViewer),
        };
    }

    async getSharedCacheInfo() {
        return this.getProgressValue('Shared Cache');
    }

    async getQueryExecutionInfo() {
        return this.getProgressValue('Query Execution');
    }

    async getMemTableInfo() {
        return this.getProgressValue('MemTable');
    }

    async getAllocatorCachesInfo() {
        return this.getItemValue('Allocator Caches');
    }

    async getOtherInfo() {
        return this.getItemValue('Other');
    }

    async getUsageInfo() {
        return this.getItemValue('Usage');
    }

    async getSoftLimitInfo() {
        return this.getItemValue('Soft Limit');
    }

    async getHardLimitInfo() {
        return this.getItemValue('Hard Limit');
    }

    async hover() {
        await this.container.hover();
    }

    // Private methods
    private getDefinitionItem(name: string) {
        return this.definitionList.locator('.g-definition-list__item').filter({hasText: name});
    }

    private async getProgressStatus(progressViewer: Locator) {
        const classList = await progressViewer.getAttribute('class');
        if (classList?.includes('progress-viewer_status_good')) {
            return 'good';
        }
        return 'unknown';
    }
}
