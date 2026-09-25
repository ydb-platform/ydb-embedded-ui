import type {Page} from '@playwright/test';

import {BaseModel} from './BaseModel';

export class Authentication extends BaseModel {
    constructor(page: Page) {
        super(page, page.locator('.authentication'));
    }

    async signIn(password = 'test-password') {
        await this.selector.getByPlaceholder('Username', {exact: true}).fill('test-user');
        await this.selector.getByPlaceholder('Password', {exact: true}).fill(password);
        await this.selector.getByRole('button', {name: 'Sign in', exact: true}).click();
    }
}
