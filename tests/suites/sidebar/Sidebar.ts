import type {Locator, Page} from '@playwright/test';

export class Sidebar {
    private sidebarContainer: Locator;
    private logoButton: Locator;
    private footer: Locator;
    private settingsButton: Locator;
    private documentationButton: Locator;
    private accountButton: Locator;
    private collapseButton: Locator;
    private drawer: Locator;
    private drawerMenu: Locator;
    private experimentsSection: Locator;

    constructor(page: Page) {
        this.sidebarContainer = page.locator('.gn-aside-header__aside-content');
        this.logoButton = this.sidebarContainer.locator('.gn-logo__btn-logo');
        this.footer = this.sidebarContainer.locator('.gn-aside-header__footer');
        this.drawer = page.locator('.gn-drawer');
        this.drawerMenu = page.locator('.gn-settings-menu');
        this.experimentsSection = this.drawerMenu
            .locator('.gn-settings-menu__item')
            .filter({hasText: 'Experiments'});

        // Footer buttons with specific icons
        const footerItems = this.sidebarContainer.locator('.gn-footer-item');
        this.documentationButton = footerItems.filter({hasText: 'Documentation'});
        this.settingsButton = footerItems
            .filter({hasText: 'Settings'})
            .locator('.gn-composite-bar-item__btn-icon');
        this.accountButton = footerItems.filter({hasText: 'Account'});

        this.collapseButton = this.sidebarContainer.locator('.gn-collapse-button');
    }

    async waitForSidebarToLoad() {
        await this.sidebarContainer.waitFor({state: 'visible'});
    }

    async isSidebarVisible() {
        return this.sidebarContainer.isVisible();
    }

    async isLogoButtonVisible() {
        return this.logoButton.isVisible();
    }

    async isSettingsButtonVisible() {
        return this.settingsButton.isVisible();
    }

    async isDocumentationButtonVisible() {
        return this.documentationButton.isVisible();
    }

    async isAccountButtonVisible() {
        return this.accountButton.isVisible();
    }

    async clickLogoButton() {
        await this.logoButton.click();
    }

    async clickSettings() {
        await this.settingsButton.click();
    }

    async clickDocumentation() {
        await this.documentationButton.click();
    }

    async clickAccount() {
        await this.accountButton.click();
    }

    async toggleCollapse() {
        await this.collapseButton.click();
    }

    async isCollapsed() {
        const button = await this.collapseButton;
        const title = await button.getAttribute('title');
        return title === 'Expand';
    }

    async getFooterItemsCount(): Promise<number> {
        return this.footer.locator('.gn-composite-bar-item').count();
    }

    async isFooterItemVisible(index: number) {
        const items = this.footer.locator('.gn-composite-bar-item');
        return items.nth(index).isVisible();
    }

    async clickFooterItem(index: number) {
        const items = this.footer.locator('.gn-composite-bar-item');
        await items.nth(index).click();
    }

    async getFooterItemText(index: number): Promise<string> {
        const items = this.footer.locator('.gn-composite-bar-item');
        const item = items.nth(index);
        return item.locator('.gn-composite-bar-item__title-text').innerText();
    }

    async isDrawerVisible() {
        return this.drawer.isVisible();
    }

    async getDrawerMenuItems(): Promise<string[]> {
        const items = this.drawerMenu.locator('.gn-settings-menu__item >> span');
        const count = await items.count();
        const texts: string[] = [];
        for (let i = 0; i < count; i++) {
            texts.push(await items.nth(i).innerText());
        }
        return texts;
    }

    async clickExperimentsSection() {
        await this.experimentsSection.click();
    }

    async toggleExperimentByTitle(title: string) {
        const experimentItem = this.drawer
            .locator('.gn-settings__item-title')
            .filter({hasText: title});
        // Click the label element which wraps the switch, avoiding the slider that intercepts events
        const switchLabel = experimentItem.locator(
            'xpath=../../..//label[contains(@class, "g-control-label")]',
        );
        await switchLabel.click();
    }

    async getFirstExperimentTitle(): Promise<string> {
        const experimentItem = this.drawer.locator('.gn-settings__item-title').first();
        return experimentItem.innerText();
    }

    async isExperimentEnabled(title: string): Promise<boolean> {
        const experimentItem = this.drawer
            .locator('.gn-settings__item-title')
            .filter({hasText: title});
        const switchControl = experimentItem.locator('xpath=../../..//input[@type="checkbox"]');
        return switchControl.isChecked();
    }
}
