import type {Locator, Page} from '@playwright/test';

import {BaseModel} from '../../models/BaseModel';

const VISIBILITY_TIMEOUT = 10 * 1000;

export class ErrorDisplayModel extends BaseModel {
    private responseError: Locator;
    private detailsTrigger: Locator;
    private detailsContent: Locator;
    private issuesSection: Locator;
    private issuesTrigger: Locator;
    private accessDeniedState: Locator;
    private accessDeniedTitle: Locator;

    constructor(page: Page) {
        super(page, page.locator('body'));

        this.responseError = page.locator('.response-error');
        this.detailsTrigger = this.responseError
            .locator('.response-error__details > .response-error__details-trigger')
            .first();
        this.detailsContent = this.responseError.locator('.response-error__details-content');
        this.issuesSection = this.responseError.locator('.response-error__issues');
        this.issuesTrigger = this.issuesSection.locator('.response-error__details-trigger');
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

    async isDetailsButtonVisible(): Promise<boolean> {
        return this.detailsTrigger.isVisible();
    }

    async expandDetails(): Promise<void> {
        await this.detailsTrigger.click();
        await this.detailsContent.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
    }

    async getDetailsText(): Promise<string> {
        return this.detailsContent.innerText();
    }

    async getDetailValue(label: string): Promise<string | null> {
        const definitionList = this.detailsContent.locator('.g-definition-list');
        const items = definitionList.locator('.g-definition-list__item');
        const count = await items.count();

        for (let i = 0; i < count; i++) {
            const name = await items.nth(i).locator('dt').textContent();
            if (name?.trim() === label) {
                return (await items.nth(i).locator('dd').textContent())?.trim() ?? null;
            }
        }
        return null;
    }

    async isIssuesSectionVisible(): Promise<boolean> {
        return this.issuesSection.isVisible();
    }

    async expandIssues(): Promise<void> {
        await this.issuesTrigger.click();
    }

    async getIssuesText(): Promise<string> {
        return this.issuesSection.innerText();
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
