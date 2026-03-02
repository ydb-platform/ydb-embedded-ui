import type {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../models/BaseModel';

const VISIBILITY_TIMEOUT = 10 * 1000;

export class ErrorDisplayModel extends BaseModel {
    private responseError: Locator;
    private fieldsDefinitionList: Locator;
    private issuesTrigger: Locator;
    private accessDeniedState: Locator;
    private accessDeniedTitle: Locator;

    constructor(page: Page) {
        super(page, page.locator('body'));

        this.responseError = page.locator('.response-error');
        this.fieldsDefinitionList = this.responseError.locator('.response-error__fields');
        this.issuesTrigger = this.responseError.locator(
            '.response-error__issues .response-error__details-trigger',
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
            await this.responseError.waitFor({state: 'visible', timeout: 3000});
            return true;
        } catch {
            return false;
        }
    }
}
