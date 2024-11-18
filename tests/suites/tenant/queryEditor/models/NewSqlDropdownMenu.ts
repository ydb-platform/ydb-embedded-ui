import type {Locator, Page} from '@playwright/test';

import {VISIBILITY_TIMEOUT} from '../../TenantPage';

export enum TemplateCategory {
    Tables = 'Tables',
    Topics = 'Topics',
    AsyncReplication = 'Async replication',
    CDC = 'Change data capture',
    Users = 'Users',
}

export enum AsyncReplicationTemplates {
    Create = 'Create async replication',
    Alter = 'Alter async replication',
    Drop = 'Drop async replication',
}

export class NewSqlDropdownMenu {
    private dropdownButton: Locator;
    private menu: Locator;
    private subMenu: Locator;

    constructor(page: Page) {
        this.dropdownButton = page.locator(
            '.ydb-query-editor-controls .g-dropdown-menu__switcher-wrapper button',
        );
        this.menu = page.locator('.g-dropdown-menu__menu');
        this.subMenu = page.locator('.g-dropdown-menu__sub-menu');
    }

    async clickNewSqlButton() {
        await this.dropdownButton.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await this.dropdownButton.click();
    }

    async hoverCategory(category: TemplateCategory) {
        const categoryItem = this.menu.getByRole('menuitem').filter({hasText: category});
        await categoryItem.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await categoryItem.hover();
    }

    async selectTemplate(template: AsyncReplicationTemplates) {
        const templateItem = this.subMenu.getByRole('menuitem').filter({hasText: template});
        await templateItem.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        await templateItem.click();
    }

    async isMenuVisible() {
        await this.menu.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }

    async isSubMenuVisible() {
        await this.subMenu.waitFor({state: 'visible', timeout: VISIBILITY_TIMEOUT});
        return true;
    }
}
