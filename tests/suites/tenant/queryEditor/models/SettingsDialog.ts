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
    private timeoutInput: Locator;
    private timeoutSwitch: Locator;
    private timeoutSwitchHint: Locator;
    private timeoutHintPopover: Locator;
    private timeoutLabel: Locator;

    private queryModeSelect: Locator;
    private resourcePoolSelect: Locator;
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
        this.limitRowsErrorPopover = this.page.locator('.g-popover-legacy__tooltip-content');
        this.selectPopup = page.locator('.ydb-query-settings-select__popup');
        this.timeoutInput = this.dialog.locator('.ydb-query-settings-timeout__input');
        this.timeoutSwitch = this.dialog.locator('.ydb-timeout-label__switch');
        this.timeoutSwitchHint = this.dialog.locator('.ydb-timeout-label__question-icon');
        this.timeoutHintPopover = this.page.locator('.g-help-mark__popover');
        this.timeoutLabel = this.dialog.locator('.ydb-timeout-label__label-title');

        // Define distinct locators for selects
        this.queryModeSelect = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_queryMode',
        );
        this.resourcePoolSelect = this.dialog.locator(
            '.ydb-query-settings-dialog__control-wrapper_resourcePool',
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

    async getResourcePoolOptions() {
        await this.resourcePoolSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.resourcePoolSelect.click();
        await this.selectPopup.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});

        const items = this.selectPopup.locator('.ydb-query-settings-select__item-title');
        const count = await items.count();
        const options: string[] = [];

        for (let index = 0; index < count; index += 1) {
            const text = await items.nth(index).textContent();
            if (text) {
                options.push(text.trim());
            }
        }

        return options;
    }

    async changeResourcePool(label: string) {
        await this.resourcePoolSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.resourcePoolSelect.click();
        await this.selectPopup.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        const optionTitle = this.selectPopup.locator('.ydb-query-settings-select__item-title', {
            hasText: label,
        });
        await optionTitle.first().click();
        await this.page.waitForTimeout(1000);
    }

    async getResourcePoolValue() {
        await this.resourcePoolSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        const selectedText = await this.resourcePoolSelect
            .locator('.g-select-control__option-text')
            .textContent();
        return selectedText?.trim() || '';
    }

    async isResourcePoolDisabled() {
        await this.resourcePoolSelect.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.resourcePoolSelect.locator('.g-select-control_disabled').isVisible();
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

    async isTimeoutInputVisible() {
        return await this.timeoutInput.isVisible();
    }

    async clickTimeoutSwitch() {
        await this.timeoutSwitch.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.timeoutSwitch.click();
        await this.page.waitForTimeout(500);
    }

    async isTimeoutSwitchChecked() {
        return await this.timeoutSwitch.locator('input[type="checkbox"]').isChecked();
    }

    async isTimeoutSwitchDisabled() {
        return await this.timeoutSwitch.locator('input[type="checkbox"][disabled]').isVisible();
    }

    async isTimeoutHintVisible() {
        return await this.timeoutSwitchHint.isVisible();
    }

    async getTimeoutHintText() {
        await this.timeoutSwitchHint.hover();
        await this.timeoutHintPopover.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return await this.timeoutHintPopover.textContent();
    }

    async isTimeoutLabelVisible() {
        return await this.timeoutLabel.isVisible();
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
