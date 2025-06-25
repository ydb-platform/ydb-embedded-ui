import type {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../../../models/BaseModel';
import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export enum OperationTab {
    Operations = 'Operations',
}

export class OperationsTable extends BaseModel {
    private tableContainer: Locator;
    private tableRows: Locator;
    private emptyState: Locator;
    private loadingMore: Locator;
    private scrollContainer: Locator;
    private accessDeniedState: Locator;
    private accessDeniedTitle: Locator;

    constructor(page: Page) {
        super(page, page.locator('.kv-tenant-diagnostics'));

        this.tableContainer = page.locator('.ydb-table-with-controls-layout');
        this.tableRows = page.locator('.data-table__row:not(.data-table__row_header)');
        this.emptyState = page.locator('.operations__table:has-text("No operations data")');
        this.loadingMore = page.locator('.operations__loading-more');
        this.scrollContainer = page.locator('.kv-tenant-diagnostics__page-wrapper');
        // AccessDenied component is rendered at the root level of Operations component
        this.accessDeniedState = page.locator('.kv-tenant-diagnostics .empty-state');
        this.accessDeniedTitle = this.accessDeniedState.locator('.empty-state__title');
    }

    async waitForTableVisible() {
        await this.tableContainer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    async waitForDataLoad() {
        // Wait for either data rows or empty state
        await this.page.waitForFunction(
            () => {
                const rows = document.querySelectorAll(
                    '.data-table__row:not(.data-table__row_header)',
                );
                const tableContainer = document.querySelector('.operations__table');
                const hasEmptyText = tableContainer?.textContent?.includes('No operations data');
                return rows.length > 0 || hasEmptyText === true;
            },
            {timeout: VISIBILITY_TIMEOUT},
        );
        // Additional wait for stability
        await this.page.waitForTimeout(500);
    }

    async getRowCount(): Promise<number> {
        return await this.tableRows.count();
    }

    async isEmptyStateVisible(): Promise<boolean> {
        return await this.emptyState.isVisible();
    }

    async scrollToBottom() {
        await this.scrollContainer.evaluate((element) => {
            element.scrollTo({top: element.scrollHeight, behavior: 'instant'});
        });
    }

    async isLoadingMoreVisible(): Promise<boolean> {
        return await this.loadingMore.isVisible();
    }

    async waitForLoadingMoreToDisappear() {
        await this.loadingMore.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
    }

    async getRowData(rowIndex: number): Promise<Record<string, string>> {
        const row = this.tableRows.nth(rowIndex);
        const cells = row.locator('td');
        const allHeaders = await this.page.locator('.data-table__th').allTextContents();

        // Take first occurrence of headers (they might be duplicated due to virtual scrolling)
        const uniqueHeaders: string[] = [];
        const seen = new Set<string>();
        let emptyCount = 0;

        for (const header of allHeaders) {
            const trimmed = header.trim();
            if (trimmed === '') {
                // Handle multiple empty headers (e.g., for action columns)
                uniqueHeaders.push(`_empty_${emptyCount++}`);
            } else if (!seen.has(trimmed)) {
                seen.add(trimmed);
                uniqueHeaders.push(trimmed);
            }
            // Stop when we have enough headers for the cells
            if (uniqueHeaders.length >= (await cells.count())) {
                break;
            }
        }

        const rowData: Record<string, string> = {};
        const cellCount = await cells.count();

        for (let i = 0; i < cellCount && i < uniqueHeaders.length; i++) {
            const headerText = uniqueHeaders[i];
            const cellText = await cells.nth(i).textContent();
            // Don't include empty headers in the result
            if (!headerText.startsWith('_empty_')) {
                rowData[headerText] = cellText?.trim() || '';
            }
        }

        return rowData;
    }

    async hasActiveInfiniteScroll(): Promise<boolean> {
        // Check if scrolling triggers loading more
        const initialCount = await this.getRowCount();
        await this.scrollToBottom();

        // Wait a bit to see if loading more appears
        await this.page.waitForTimeout(1000);

        const hasLoadingMore = await this.isLoadingMoreVisible();
        if (hasLoadingMore) {
            await this.waitForLoadingMoreToDisappear();
            const newCount = await this.getRowCount();
            return newCount > initialCount;
        }

        return false;
    }

    async isAccessDeniedVisible(): Promise<boolean> {
        try {
            await this.accessDeniedState.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }

    async getAccessDeniedTitle(): Promise<string> {
        return await this.accessDeniedTitle.innerText();
    }

    async getOperationsCount(): Promise<number> {
        // The EntitiesCount component renders a Label with the count
        const countLabel = await this.page
            .locator('.ydb-entities-count .g-label__content')
            .textContent();
        if (!countLabel) {
            return 0;
        }
        const match = countLabel.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }

    async waitForOperationsCount(expectedCount: number, timeout = 5000): Promise<void> {
        await this.page.waitForFunction(
            (expected) => {
                const countElement = document.querySelector(
                    '.ydb-entities-count .g-label__content',
                );
                if (!countElement) {
                    return false;
                }
                const text = countElement.textContent || '';
                const match = text.match(/(\d+)/);
                const currentCount = match ? parseInt(match[1], 10) : 0;
                return currentCount === expected;
            },
            expectedCount,
            {timeout},
        );
    }

    async waitForOperationsCountToChange(previousCount: number, timeout = 5000): Promise<number> {
        await this.page.waitForFunction(
            (prev) => {
                const countElement = document.querySelector(
                    '.ydb-entities-count .g-label__content',
                );
                if (!countElement) {
                    return false;
                }
                const text = countElement.textContent || '';
                const match = text.match(/(\d+)/);
                const currentCount = match ? parseInt(match[1], 10) : 0;
                return currentCount !== prev;
            },
            previousCount,
            {timeout},
        );
        // Now get the actual new count
        return await this.getOperationsCount();
    }
}
