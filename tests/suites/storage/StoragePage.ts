import {Locator, Page} from '@playwright/test';

import {storagePage} from '../../utils/constants';
import {selectContentTable} from '../../utils/selectContentTable';
import {PageModel} from '../../models/PageModel';

type EntityType = 'Groups' | 'Nodes';
type VisibleEntityType = 'Degraded' | 'Out of space' | 'All';

export class StoragePage extends PageModel {
    readonly table: Locator;
    protected readonly entityTypeSelector: Locator;
    protected readonly visibleEntityTypeSelector: Locator;

    constructor(page: Page) {
        super(page, storagePage);

        this.table = selectContentTable(this.selector);

        this.entityTypeSelector = this.selector
            .locator('.global-storage__controls .yc-radio-button')
            .locator('nth=0');
        this.visibleEntityTypeSelector = this.selector
            .locator('.global-storage__controls .yc-radio-button')
            .locator('nth=1');
    }

    async selectEntityType(type: EntityType) {
        await this.entityTypeSelector.getByLabel(type).click();
    }
    async selectVisibleEntityType(type: VisibleEntityType) {
        await this.visibleEntityTypeSelector.getByLabel(type).click();
    }
}
