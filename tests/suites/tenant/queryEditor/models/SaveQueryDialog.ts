import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class SaveQueryDialog {
    private dialog: Locator;
    private dialogBody: Locator;
    private dialogFooter: Locator;

    constructor(page: Page) {
        this.dialog = page.locator('.g-dialog').filter({
            has: page.locator('.ydb-save-query__dialog-body'),
        });
        this.dialogBody = page.locator('.ydb-save-query__dialog-body');
        this.dialogFooter = page.locator('.ydb-save-query__dialog-body + .g-dialog-footer');
    }

    async getQueryName() {
        const input = this.dialogBody.locator('#queryName');
        await input.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return input.inputValue();
    }

    async setQueryName(name: string) {
        const input = this.dialogBody.locator('#queryName');
        await input.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        // Ensure input is ready for interaction
        await input.click();
        await input.clear();
        await input.fill(name);
    }

    async clickSave() {
        const saveButton = this.dialogFooter.getByRole('button', {name: 'Save', exact: true});
        await saveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await saveButton.click();
    }

    async clickCancel() {
        const cancelButton = this.dialogFooter.getByRole('button', {name: 'Cancel', exact: true});
        await cancelButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await cancelButton.click();
    }

    async getValidationError() {
        const errorMessage = this.dialog
            .getByText(
                /Name should not be empty|Name must be at least 3 characters|This name already exists/,
            )
            .first();
        await errorMessage.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return errorMessage.innerText();
    }

    async isVisible() {
        try {
            await this.dialogBody.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }
}
