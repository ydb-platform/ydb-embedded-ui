import {Page, Locator} from '@playwright/test';

export class BaseModel {
    readonly page: Page;
    readonly selector: Locator;

    constructor(page: Page, selector: Locator) {
        this.page = page;
        this.selector = selector;
    }
}
