import type {Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

import {DATABASE, TABLET_ID} from './tabletObjectLinkMocks';

export class TabletPage extends PageModel {
    readonly controls = this.page.getByTestId('tablet-controls');
    readonly info = this.page.getByTestId('tablet-info');
    readonly tabs = this.page.getByTestId('tablet-tabs');
    readonly dialog = this.page.getByRole('dialog');
    readonly stop = this.controls.getByRole('button', {name: 'Stop', exact: true});
    readonly resume = this.controls.getByRole('button', {name: 'Resume', exact: true});
    readonly storage = this.tabs.getByRole('link', {name: 'Storage', exact: true});
    readonly storagePool = this.tabs.getByRole('cell', {
        name: 'tablet-devui-test-pool',
        exact: true,
    });
    readonly app = this.info.getByRole('link', {name: 'App', exact: true});

    readonly denied = this.dialog.getByText(
        "You don't have enough rights to complete the operation",
        {
            exact: true,
        },
    );

    constructor(page: Page) {
        super(page, `tablet/${TABLET_ID}`, {database: DATABASE});
    }

    state(value: 'Active' | 'Stopped') {
        return this.info.getByText(value, {exact: true});
    }

    link(name: string) {
        return this.info.getByRole('link', {name, exact: true});
    }

    async confirm(action: 'Stop' | 'Resume') {
        await this.dialog.getByRole('button', {name: `${action} tablet`, exact: true}).click();
    }

    authError(status: number) {
        return this.page.getByText(status === 401 ? 'Authentication required' : 'Access denied', {
            exact: true,
        });
    }
}
