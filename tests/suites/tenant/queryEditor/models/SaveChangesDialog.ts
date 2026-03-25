import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class SaveChangesDialog {
    private body: Locator;
    private dialog: Locator;
    private dialogFooter: Locator;

    constructor(page: Page) {
        this.body = page.locator('.ydb-save-changes-dialog__body');
        this.dialog = page.locator('.g-dialog');
        this.dialogFooter = page.locator('.ydb-save-changes-dialog__body + .g-dialog-footer');
    }

    async isVisible() {
        await this.body.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async clickDontSave() {
        const dontSaveButton = this.dialog.getByRole('button', {name: "Don't Save"});
        await dontSaveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dontSaveButton.click();
    }

    async clickCancel() {
        const cancelButton = this.dialog.getByRole('button', {name: 'Cancel'});
        await cancelButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await cancelButton.click();
    }

    async clickSave() {
        const saveButton = this.dialogFooter.getByRole('button', {name: 'Save', exact: true});
        await saveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await saveButton.click();
    }

    async setQueryName(value: string) {
        const input = this.dialog.getByRole('textbox');
        await input.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await input.fill(value);
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
}
