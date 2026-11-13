import type {Locator, Page} from '@playwright/test';

import {BaseModel} from './BaseModel';

/**
 * Block warning that says the data is incomplete or was not processed as requested.
 * Tables with sticky controls use the compact `DataIssuesIndicator` instead.
 */
export class DataIssuesAlert extends BaseModel {
    constructor(page: Page, container: Locator = page.locator('body')) {
        super(page, container.getByTestId('data-issues-alert'));
    }

    item(kind: string) {
        return this.selector.locator(`[data-issue="${kind}"]`);
    }
}
