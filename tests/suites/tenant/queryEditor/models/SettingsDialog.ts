import type {Locator, Page} from '@playwright/test';

import type {
    QUERY_MODES,
    STATISTICS_MODES,
    TRANSACTION_MODES,
} from '../../../../../src/utils/query';
import {VISIBILITY_TIMEOUT} from '../../TenantPage';

import type {ButtonNames} from './QueryEditor';

export class SettingsDialog {
    private dialog: Locator;
    private page: Page;
    private selectPopup: Locator;
    private limitRowsInput: Locator;
    private limitRowsErrorIcon: Locator;
    private limitRowsErrorPopover: Locator;

    private queryModeSelect: Locator;
    private transactionModeSelect: Locator;
    private statisticsModeSelect: Locator;
    private statisticsModeTooltip: Locator;

    constructor(page: Page) {
        this.page = page;
        this.dialog = page.locator('.ydb-query-settings-dialog');

        this.limitRowsInput = this.dialog.locator('.ydb-query-settings-dialog__limit-rows input');
        this.limitRowsErrorIcon = this.dialog.locator(
            '.ydb-query-settings-dialog__limit-rows [data-qa="control-error-icon-qa"]',
        );
        this.limitRowsErrorPopover = this.page.locator('.g-popover__tooltip-content');
        this.selectPopup = page.locator('.ydb-query-settings-select__popup');

        // Define distinct locators for selects
        this.queryModeSelect = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_queryMode',
        );
        this.transactionModeSelect = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_transactionMode',
        );
        this.statisticsModeSelect = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_statisticsMode',
        );
        this.statisticsModeTooltip = this.page.locator(
            '.ydb-query-settings-dialog__statistics-mode-tooltip',
        );
    }

    async changeQueryMode(mode: (typeof QUERY_MODES)[keyof typeof QUERY_MODES]) {
        await this.queryModeSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.queryModeSelect.click();
        await this.selectPopup.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.page.locator(`.ydb-query-settings-select__item_type_${mode}`).click();
        await this.page.waitForTimeout(1000);
    }

    async changeTransactionMode(level: (typeof TRANSACTION_MODES)[keyof typeof TRANSACTION_MODES]) {
        await this.transactionModeSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.transactionModeSelect.click();
        await this.selectPopup.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.page.locator(`.ydb-query-settings-select__item_type_${level}`).click();
        await this.page.waitForTimeout(1000);
    }

    async changeStatsLevel(mode: (typeof STATISTICS_MODES)[keyof typeof STATISTICS_MODES]) {
        await this.statisticsModeSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.statisticsModeSelect.click();
        await this.selectPopup.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.page.locator(`.ydb-query-settings-select__item_type_${mode}`).click();
        await this.page.waitForTimeout(1000);
    }

    async getStatsLevel() {
        await this.statisticsModeSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        const selectedText = await this.statisticsModeSelect
            .locator('.g-select-control__option-text')
            .textContent();
        return selectedText;
    }

    async changeLimitRows(limitRows: number) {
        await this.limitRowsInput.fill(limitRows.toString());
        await this.page.waitForTimeout(1000);
    }

    async clearLimitRows() {
        await this.limitRowsInput.clear();
        await this.page.waitForTimeout(1000);
    }

    async getLimitRowsValue() {
        return await this.limitRowsInput.inputValue();
    }

    async isLimitRowsError() {
        return await this.limitRowsErrorIcon.isVisible();
    }

    async getLimitRowsErrorMessage() {
        await this.limitRowsErrorIcon.hover();
        await this.limitRowsErrorPopover.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return await this.limitRowsErrorPopover.textContent();
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

    async isStatsTooltipVisible() {
        await this.statisticsModeTooltip.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isHidden() {
        await this.dialog.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isStatisticsSelectDisabled() {
        await this.statisticsModeSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.statisticsModeSelect.locator('.g-select-control_disabled').isVisible();
    }

    async hoverStatisticsSelect() {
        await this.statisticsModeSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.statisticsModeSelect.hover();
    }
}
