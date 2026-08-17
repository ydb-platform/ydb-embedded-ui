import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class RenameSavedQueryDialog {
    private dialog: Locator;

    constructor(page: Page) {
        this.dialog = page.locator('.ydb-rename-saved-query-dialog');
    }

    async setTitle(title: string) {
        const input = this.dialog.getByRole('textbox');
        await input.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await input.click();
        await input.clear();
        await input.fill(title);
    }

    async clickApply() {
        const applyButton = this.dialog.getByRole('button', {name: 'Apply'});
        await applyButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await applyButton.click();
    }

    async pressEnter() {
        const input = this.dialog.getByRole('textbox');
        await input.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await input.press('Enter');
    }

    async getErrorMessage() {
        const error = this.dialog.locator('.g-text-input__error');
        await error.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return error.innerText();
    }

    async waitForHidden() {
        await this.dialog.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
    }
}
