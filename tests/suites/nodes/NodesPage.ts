import {Locator, Page} from '@playwright/test';

import {nodesPage} from '../../utils/constants';
import {selectContentTable} from '../../utils/selectContentTable';
import {PageModel} from '../../models/PageModel';

export class NodesPage extends PageModel {
    readonly table: Locator;

    constructor(page: Page) {
        super(page, nodesPage);

        this.table = selectContentTable(this.selector);
    }
}
