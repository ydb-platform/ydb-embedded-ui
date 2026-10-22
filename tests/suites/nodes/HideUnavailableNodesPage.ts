import type {Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

export class HideUnavailableNodesPage extends PageModel {
    readonly toggleControl = this.selector.getByTestId('hide-unavailable-nodes');
    readonly toggle = this.toggleControl.getByRole('switch');
    readonly count = this.selector.locator('.ydb-entities-count');

    constructor(page: Page, storage = false) {
        super(
            page,
            storage ? 'cluster/storage' : 'database',
            storage
                ? {type: 'nodes'}
                : {
                      database: '/local',
                      schema: '/local',
                      databasePage: 'diagnostics',
                      diagnosticsTab: 'nodes',
                  },
        );
    }

    node(host: string) {
        return this.selector.locator('table').getByText(host, {exact: true});
    }

    group() {
        return this.selector.getByRole('button', {name: /test-dc/});
    }
}
