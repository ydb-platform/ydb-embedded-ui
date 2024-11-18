import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class SaveQueryDialog {
    private dialogBody: Locator;
    private dialogFooter: Locator;

    constructor(page: Page) {
        this.dialogBody = page.locator('.ydb-save-query__dialog-body');
        this.dialogFooter = page.locator('.ydb-save-query__dialog-body + .g-dialog-footer');
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

    async isVisible() {
        try {
            await this.dialogBody.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }
}
