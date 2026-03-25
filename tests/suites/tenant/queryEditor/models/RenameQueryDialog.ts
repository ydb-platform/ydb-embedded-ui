import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class RenameQueryDialog {
    private dialog: Locator;

    constructor(page: Page) {
        this.dialog = page.locator('.ydb-rename-query-dialog');
    }

    async isVisible() {
        await this.dialog.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async setTitle(title: string) {
        const input = this.dialog.getByPlaceholder('Query name');
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

    async clickCancel() {
        const cancelButton = this.dialog.getByRole('button', {name: 'Cancel'});
        await cancelButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await cancelButton.click();
    }

    async getErrorMessage() {
        const error = this.dialog.locator('.g-text-input__error');
        await error.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return error.innerText();
    }
}
