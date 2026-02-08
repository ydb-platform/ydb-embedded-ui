import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class SaveChangesDialog {
    private body: Locator;
    private dialog: Locator;

    constructor(page: Page) {
        this.body = page.locator('.ydb-save-changes-dialog__body');
        this.dialog = page.locator('.g-dialog');
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
        const saveButton = this.dialog.getByRole('button', {name: 'Save'});
        await saveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await saveButton.click();
    }
}
