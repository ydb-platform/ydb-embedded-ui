import type {Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

import {VDISK_PAGE_PATH} from './vdiskPageMocks';

export class VDiskPage extends PageModel {
    readonly evict = this.page.getByTestId('vdisk-controls').getByRole('button', {
        name: 'Evict VDisk',
        exact: true,
    });
    readonly dialog = this.page.getByRole('dialog');
    readonly confirmEvict = this.dialog.getByRole('button', {name: 'Evict', exact: true});

    constructor(page: Page, path = VDISK_PAGE_PATH) {
        const url = new URL(path, 'http://localhost');
        super(page, url.pathname, Object.fromEntries(url.searchParams));
    }
}
