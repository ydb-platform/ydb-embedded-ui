import type {Locator, Page} from '@playwright/test';

/**
 * Compact warning in the sticky table controls: says that the rows on screen were loaded
 * with problems. The details are in a popover that opens on hover.
 */
/** What `getPlaceInControls()` returns for a label that is the last item of the controls row */
export const LAST_IN_CONTROLS = {isLastItem: true, isRightmostOnItsLine: true};

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

    /**
     * Where the label stands among the controls of the table, measured in the rendered page:
     * it is the last item of the controls and nothing stands to the right of it on its line.
     */
    async getPlaceInControls() {
        return this.button.evaluate((label) => {
            // In the storage controls the label stands in a zero-width slot of the row
            let rowItem: Element = label;
            while (rowItem.parentElement && rowItem.parentElement.children.length === 1) {
                rowItem = rowItem.parentElement;
            }
            const items = Array.from(rowItem.parentElement?.children ?? []).filter(
                (item) => item === rowItem || item.getBoundingClientRect().width > 0,
            );
            const labelRect = label.getBoundingClientRect();
            const itemsOnTheLine = items.filter((item) => {
                const rect = item.getBoundingClientRect();
                return rect.bottom > labelRect.top && rect.top < labelRect.bottom;
            });

            return {
                isLastItem: items[items.length - 1] === rowItem,
                isRightmostOnItsLine: itemsOnTheLine.every(
                    (item) => item.getBoundingClientRect().right <= labelRect.right + 0.5,
                ),
            };
        });
    }

    async open() {
        await this.button.hover();
        await this.popover.waitFor({state: 'visible'});
    }

    item(kind: string) {
        return this.popover.locator(`[data-issue="${kind}"]`);
    }
}
