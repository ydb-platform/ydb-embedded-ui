import type {Locator, Page} from '@playwright/test';

/**
 * Compact warning in the sticky table controls: says that the rows on screen were loaded
 * with problems. The details are in a popover that opens on hover.
 */
export class DataIssuesIndicator {
    /** The control in the table controls; absent when there is nothing to tell */
    readonly button: Locator;
    readonly popover: Locator;
    readonly items: Locator;
    readonly codes: Locator;

    constructor(page: Page) {
        this.button = page.getByTestId('data-issues-indicator');
        // The popover is rendered in a portal
        this.popover = page.locator('.ydb-data-issues-alert__popover');
        this.items = this.popover.getByTestId('data-issues-item');
        this.codes = this.popover.getByTestId('data-issues-codes');
    }

    async open() {
        await this.button.hover();
        await this.popover.waitFor({state: 'visible'});
    }

    item(kind: string) {
        return this.popover.locator(`[data-issue="${kind}"]`);
    }
}
