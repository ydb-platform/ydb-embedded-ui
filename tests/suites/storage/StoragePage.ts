import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {storagePage} from '../../utils/constants';
import {selectContentTable} from '../../utils/selectContentTable';

type EntityType = 'Groups' | 'Nodes';

const storageTypeFilterQa = 'storage-type-filter';

export class StoragePage extends PageModel {
    readonly table: Locator;
    protected readonly entityTypeSelector: Locator;

    constructor(page: Page) {
        super(page, storagePage);

        this.table = selectContentTable(this.selector);

        this.entityTypeSelector = this.selector.getByTestId(storageTypeFilterQa);
    }

    async selectEntityType(type: EntityType) {
        await this.entityTypeSelector.getByLabel(type).click();
    }
}
