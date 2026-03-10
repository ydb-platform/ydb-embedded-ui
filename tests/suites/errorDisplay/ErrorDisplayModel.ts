import type {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../models/BaseModel';

const VISIBILITY_TIMEOUT = 10 * 1000;

export class ErrorDisplayModel extends BaseModel {
    // Inline error (ResponseError on cluster page)
    private responseError: Locator;
    private fieldsDefinitionList: Locator;
    private issuesTrigger: Locator;
    private detailsToggleButton: Locator;
    private responseBodyContent: Locator;

    // Full-page error (PageError — blocks entire page, wraps ResponseError inside EmptyState)
    private pageError: Locator;
    private pageErrorPageTitle: Locator;
    private pageErrorTitle: Locator;
    private pageErrorDescription: Locator;
    private pageErrorFields: Locator;
    private pageErrorDetailsToggleButton: Locator;
    private pageErrorResponseBodyContent: Locator;

    // Access denied
    private accessDeniedState: Locator;
    private accessDeniedTitle: Locator;

    constructor(page: Page) {
        super(page, page.locator('body'));

        this.responseError = page.locator('.ydb-response-error').first();
        this.fieldsDefinitionList = this.responseError.locator('.ydb-error-details__fields');
        this.issuesTrigger = this.responseError.locator(
            '.ydb-error-details__issues .ydb-error-details__details-trigger',
        );
        this.detailsToggleButton = this.responseError.locator(
            '.ydb-error-details button.g-button_view_outlined',
        );
        this.responseBodyContent = this.responseError.locator(
            '.ydb-response-body-section__content',
        );

        this.pageError = page.locator('.ydb-page-error');
        this.pageErrorPageTitle = this.pageError.locator('.g-text_variant_header-1').first();
        this.pageErrorTitle = this.pageError.locator('.empty-state__title');
        this.pageErrorDescription = this.pageError.locator('.empty-state__description');
        this.pageErrorFields = this.pageError.locator('.ydb-error-details__fields');
        this.pageErrorDetailsToggleButton = this.pageError.locator(
            '.ydb-error-details button.g-button_view_outlined',
        );
        this.pageErrorResponseBodyContent = this.pageError.locator(
            '.ydb-response-body-section__content',
        );

        this.accessDeniedState = page.locator('.empty-state');
        this.accessDeniedTitle = this.accessDeniedState.locator('.empty-state__title');
    }

    async waitForResponseError(): Promise<void> {
        await this.responseError.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    getResponseErrorLocator(): Locator {
        return this.responseError;
    }

    async getResponseErrorText(): Promise<string> {
        return this.responseError.innerText();
    }

    async getDetailValue(label: string): Promise<string | null> {
        const items = this.fieldsDefinitionList.locator('.g-definition-list__item');
        const count = await items.count();

        for (let i = 0; i < count; i++) {
            const name = await items.nth(i).locator('dt').textContent();
            if (name?.trim() === label) {
                return (await items.nth(i).locator('dd').textContent())?.trim() ?? null;
            }
        }
        return null;
    }

    async isFieldsVisible(): Promise<boolean> {
        return this.fieldsDefinitionList.isVisible();
    }

    async isIssuesTriggerVisible(): Promise<boolean> {
        return this.issuesTrigger.isVisible();
    }

    async expandIssues(): Promise<void> {
        await this.issuesTrigger.click();
    }

    async getIssuesText(): Promise<string> {
        const issuesContainer = this.responseError.locator('.kv-issues');
        await issuesContainer.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return issuesContainer.innerText();
    }

    async isResponseBodyTriggerVisible(): Promise<boolean> {
        return this.detailsToggleButton.isVisible();
    }

    async getToggleButtonText(): Promise<string> {
        return this.detailsToggleButton.innerText();
    }

    async clickToggleButton(): Promise<void> {
        await this.detailsToggleButton.click();
    }

    async expandResponseBody(): Promise<void> {
        await this.detailsToggleButton.click();
    }

    async isResponseBodyContentVisible(): Promise<boolean> {
        return this.responseBodyContent.isVisible();
    }

    async waitForResponseBodyContentHidden(): Promise<void> {
        await this.responseBodyContent.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
    }

    async getResponseBodyText(): Promise<string> {
        await this.responseBodyContent.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return this.responseBodyContent.innerText();
    }

    async isIssuesContentVisible(): Promise<boolean> {
        const issuesContainer = this.responseError.locator('.kv-issues');
        return issuesContainer.isVisible();
    }

    async waitForIssuesContentHidden(): Promise<void> {
        const issuesContainer = this.responseError.locator('.kv-issues');
        await issuesContainer.waitFor({state: 'hidden', timeout: VISIBILITY_TIMEOUT});
    }

    async waitForAccessDenied(): Promise<void> {
        await this.accessDeniedState.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    getAccessDeniedLocator(): Locator {
        return this.accessDeniedState;
    }

    async getAccessDeniedTitle(): Promise<string> {
        return this.accessDeniedTitle.innerText();
    }

    async isResponseErrorVisible(): Promise<boolean> {
        try {
            await this.responseError.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }

    // --- Full-page PageError methods ---

    async waitForPageError(): Promise<void> {
        await this.pageError.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    getPageErrorLocator(): Locator {
        return this.pageError;
    }

    async getPageErrorPageTitle(): Promise<string> {
        return this.pageErrorPageTitle.innerText();
    }

    async isPageErrorPageTitleVisible(): Promise<boolean> {
        return this.pageErrorPageTitle.isVisible();
    }

    async getPageErrorTitle(): Promise<string> {
        return this.pageErrorTitle.innerText();
    }

    async getPageErrorBodyText(): Promise<string> {
        return this.pageErrorDescription.innerText();
    }

    async isPageErrorFieldsVisible(): Promise<boolean> {
        return this.pageErrorFields.isVisible();
    }

    async getPageErrorDetailValue(label: string): Promise<string | null> {
        const items = this.pageErrorFields.locator('.g-definition-list__item');
        const count = await items.count();

        for (let i = 0; i < count; i++) {
            const name = await items.nth(i).locator('dt').textContent();
            if (name?.trim() === label) {
                return (await items.nth(i).locator('dd').textContent())?.trim() ?? null;
            }
        }
        return null;
    }

    async isPageErrorResponseBodyTriggerVisible(): Promise<boolean> {
        return this.pageErrorDetailsToggleButton.isVisible();
    }

    async expandPageErrorResponseBody(): Promise<void> {
        await this.pageErrorDetailsToggleButton.click();
    }

    async getPageErrorResponseBodyText(): Promise<string> {
        await this.pageErrorResponseBodyContent.waitFor({
            state: 'visible',
            timeout: VISIBILITY_TIMEOUT,
        });
        return this.pageErrorResponseBodyContent.innerText();
    }
}
