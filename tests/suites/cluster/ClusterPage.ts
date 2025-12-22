import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {clusterPage} from '../../utils/constants';

export class ClusterPage extends PageModel {
    readonly clusterInfo: Locator;
    readonly bridgeSection: Locator;
    readonly pileCards: Locator;

    constructor(page: Page) {
        super(page, clusterPage);

        this.clusterInfo = this.selector.locator('.cluster-info');
        this.bridgeSection = this.clusterInfo.locator('.cluster-info__bridge-table');
        this.pileCards = this.bridgeSection.locator('.bridge-info-table__pile-card');
    }

    async isBridgeSectionVisible(): Promise<boolean> {
        try {
            await this.bridgeSection.waitFor({state: 'visible', timeout: 3000});
            return true;
        } catch {
            return false;
        }
    }

    async getPileCardsCount(): Promise<number> {
        return await this.pileCards.count();
    }

    async getFirstPileContent(): Promise<string> {
        const firstPile = this.pileCards.first();
        return (await firstPile.textContent()) || '';
    }
}
