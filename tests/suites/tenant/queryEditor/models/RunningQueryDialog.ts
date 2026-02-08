import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export class RunningQueryDialog {
    private dialog: Locator;

    constructor(page: Page) {
        this.dialog = page.locator('.g-dialog').filter({hasText: 'Query is running'});
    }

    async isVisible() {
        const stopAndCloseButton = this.dialog.getByRole('button', {
            name: /Stop\s*&\s*Close/i,
        });
        await stopAndCloseButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async clickStopAndClose() {
        const stopAndCloseButton = this.dialog.getByRole('button', {
            name: /Stop\s*&\s*Close/i,
        });
        await stopAndCloseButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await stopAndCloseButton.click();
    }

    async clickCancel() {
        const cancelButton = this.dialog.getByRole('button', {name: 'Cancel'});
        await cancelButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await cancelButton.click();
    }
}
