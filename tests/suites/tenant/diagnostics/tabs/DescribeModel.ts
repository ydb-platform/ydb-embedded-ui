import type {Page} from '@playwright/test';

import {BaseModel} from '../../../../models/BaseModel';

export class Describe extends BaseModel {
    constructor(page: Page) {
        super(page, page.getByTestId('describe'));
    }

    getFieldRow(name: string) {
        return this.selector.getByRole('row').filter({
            has: this.page.getByText(name, {exact: true}),
        });
    }

    getValue(value: string) {
        return this.selector.getByText(value, {exact: true});
    }

    getFullValueDialog() {
        return this.page.getByRole('dialog').filter({hasText: 'Full value'});
    }

    async toggleField(name: string) {
        await this.getFieldRow(name).getByRole('button').click();
    }

    async openFullValue(name: string) {
        await this.getFieldRow(name).getByRole('button').click();
    }
}
