import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class UnsavedChangesModal {
    private modal: Locator;

    constructor(page: Page) {
        this.modal = page.locator('.confirmation-dialog');
    }

    async clickSaveQuery() {
        const saveButton = this.modal.getByRole('button', {name: 'Save query'});
        await saveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await saveButton.click();
    }

    async clickDontSave() {
        const dontSaveButton = this.modal.getByRole('button', {name: "Don't save"});
        await dontSaveButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dontSaveButton.click();
    }

    async clickCancel() {
        const cancelButton = this.modal.getByRole('button', {name: 'Cancel'});
        await cancelButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await cancelButton.click();
    }

    async clickClose() {
        const closeButton = this.modal.locator('.g-dialog-btn-close__btn');
        await closeButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await closeButton.click();
    }

    async isVisible() {
        await this.modal.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.modal.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }
}
