import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';
import type {ButtonNames, QueryMode} from '../QueryEditor';

export class SettingsDialog {
    private dialog: Locator;
    private page: Page;

    constructor(page: Page) {
        this.page = page;
        this.dialog = page.locator('.ydb-query-settings-dialog');
    }

    async changeQueryMode(mode: QueryMode) {
        const dropdown = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_queryMode',
        );
        await dropdown.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(mode).first().click();
        await this.page.waitForTimeout(1000);
    }

    async changeTransactionMode(level: string) {
        const dropdown = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_transactionMode',
        );
        await dropdown.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(level).first().click();
        await this.page.waitForTimeout(1000);
    }

    async changeStatsLevel(mode: string) {
        const dropdown = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_statisticsMode',
        );
        await dropdown.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await dropdown.click();
        const popup = this.page.locator('.ydb-query-settings-select__popup');
        await popup.getByText(mode).first().click();
        await this.page.waitForTimeout(1000);
    }

    async changeLimitRows(limitRows: number) {
        const limitRowsInput = this.dialog.locator('.ydb-query-settings-dialog__limit-rows input');
        await limitRowsInput.fill(limitRows.toString());
        await this.page.waitForTimeout(1000);
    }

    async clickButton(buttonName: ButtonNames) {
        const button = this.dialog.getByRole('button', {name: buttonName});
        await button.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await button.click();
    }

    async isVisible() {
        await this.dialog.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.dialog.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }
}
