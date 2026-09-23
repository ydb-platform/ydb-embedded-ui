import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {storagePage} from '../../utils/constants';

type EntityType = 'Groups' | 'Nodes';

const storageTypeFilterQa = 'storage-type-filter';

export class StoragePage extends PageModel {
    readonly table: Locator;
    protected readonly entityTypeSelector: Locator;

    constructor(page: Page) {
        super(page, storagePage);

        this.table = this.selector.locator('.ydb-paginated-table__table');

        this.entityTypeSelector = this.selector.getByTestId(storageTypeFilterQa);
    }

    async selectEntityType(type: EntityType) {
        await this.entityTypeSelector.getByLabel(type).click();
    }

    getGroupRow(groupId: string) {
        return this.table.getByRole('row').filter({
            has: this.page.getByRole('link', {name: groupId, exact: true}),
        });
    }

    getGroupVDiskItems(groupId: string, expertMode = false) {
        return this.getGroupRow(groupId).locator(
            expertMode ? '.ydb-storage-disks__vdisk-item' : '.ydb-storage-vdisks__item',
        );
    }

    getGroupPDiskItems(groupId: string) {
        return this.getGroupRow(groupId).locator('.ydb-storage-disks__pdisk-item');
    }
}
