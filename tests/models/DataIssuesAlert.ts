import type {Locator, Page} from '@playwright/test';

import {BaseModel} from './BaseModel';

/** Warning above a table that says the data is incomplete or was not processed as requested */
export class DataIssuesAlert extends BaseModel {
    readonly items: Locator;
    readonly codes: Locator;

    constructor(page: Page, container: Locator = page.locator('body')) {
        super(page, container.getByTestId('data-issues-alert'));

        this.items = this.selector.getByTestId('data-issues-item');
        this.codes = this.selector.getByTestId('data-issues-codes');
    }

    item(kind: string) {
        return this.selector.locator(`[data-issue="${kind}"]`);
    }
}
