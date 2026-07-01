import type {Locator} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../TenantPage';

import {RowTableAction} from './types';

export class ActionsMenu {
    private menu: Locator;
    private subMenu: Locator;

    constructor(menu: Locator) {
        this.menu = menu;
        this.subMenu = menu.page().locator('.g-dropdown-menu__sub-menu');
    }

    async isVisible(): Promise<boolean> {
        try {
            await this.menu.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
            return true;
        } catch {
            return false;
        }
    }

    async getItems(): Promise<string[]> {
        const items = this.menu.locator('.g-menu__item-content');
        return items.allTextContents();
    }

    async clickItem(itemText: string): Promise<void> {
        const menuItem = this.menu.locator(`.g-menu__item-content:has-text("${itemText}")`);
        await menuItem.click();
    }

    async hoverItem(itemText: string): Promise<void> {
        const menuItem = this.menu.locator(`.g-menu__item:has-text("${itemText}")`);
        await menuItem.hover();
    }

    async clickSubMenuItem(parentText: string, childText: string): Promise<void> {
        await this.hoverItem(parentText);
        const childItem = this.subMenu.locator(`.g-menu__item-content:has-text("${childText}")`);
        await childItem.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await childItem.click();
    }

    async isItemSelected(itemText: string): Promise<boolean> {
        const menuItem = this.menu.locator(`.g-menu__item:has-text("${itemText}")`);
        const className = (await menuItem.getAttribute('class')) || '';
        return className.includes('g-menu__item_selected');
    }

    async isItemLoading(itemText: string): Promise<boolean> {
        const menuItem = this.menu.locator(`.g-menu__item:has-text("${itemText}")`);
        const className = (await menuItem.getAttribute('class')) || '';
        const hasSpinner = await menuItem.locator('.g-spin').isVisible();
        return className.includes('g-menu__item_disabled') && hasSpinner;
    }

    async getTableTemplates(): Promise<RowTableAction[]> {
        const items = this.menu.locator('.g-menu__item-content');
        const contents = await items.allTextContents();
        return contents.filter((content): content is RowTableAction =>
            Object.values(RowTableAction).includes(content as RowTableAction),
        );
    }
}
