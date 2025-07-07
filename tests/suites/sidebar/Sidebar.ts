import type {Locator, Page} from '@playwright/test';

export class Sidebar {
    private sidebarContainer: Locator;
    private logoButton: Locator;
    private footer: Locator;
    private settingsButton: Locator;
    private informationButton: Locator;
    private accountButton: Locator;
    private collapseButton: Locator;
    private drawer: Locator;
    private drawerMenu: Locator;
    private experimentsSection: Locator;
    private popupContent: Locator;
    private hotkeysButton: Locator;
    private hotkeysPanel: Locator;

    constructor(page: Page) {
        this.sidebarContainer = page.locator('.gn-aside-header__aside-content');
        this.logoButton = this.sidebarContainer.locator('.gn-logo__btn-logo');
        this.footer = this.sidebarContainer.locator('.gn-aside-header__footer');
        this.drawer = page.locator('.gn-drawer');
        this.popupContent = page.locator('.g-popup__content');
        this.hotkeysButton = this.popupContent.locator('text=Keyboard shortcuts');
        this.hotkeysPanel = page.locator('.gn-hotkeys-panel__drawer-item');
        this.drawerMenu = page.locator('.gn-settings-menu');
        this.experimentsSection = this.drawerMenu
            .locator('.gn-settings-menu__item')
            .filter({hasText: 'Experiments'});

        // Footer buttons with specific icons
        const footerItems = this.sidebarContainer.locator('.gn-footer-item');
        this.informationButton = footerItems.filter({hasText: 'Information'});
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

    async isInformationButtonVisible() {
        return this.informationButton.isVisible();
    }

    async isAccountButtonVisible() {
        return this.accountButton.isVisible();
    }

    async clickLogoButton() {
        await this.logoButton.click();
    }

    async clickSettings() {
        await this.settingsButton.click();
        await this.drawer.waitFor({state: 'visible'});
    }

    async clickInformation() {
        await this.informationButton.click();
    }

    async isPopupVisible() {
        return this.popupContent.isVisible();
    }

    async hasHotkeysButtonInPopup() {
        return this.hotkeysButton.isVisible();
    }

    async clickHotkeysButton() {
        await this.hotkeysButton.click();
    }

    async isHotkeysPanelVisible() {
        return this.hotkeysPanel.isVisible();
    }

    async hasHotkeysPanelTitle() {
        const panelTitle = this.hotkeysPanel.locator('.kv-navigation__hotkeys-panel-title');
        return panelTitle.isVisible();
    }

    async hasDocumentationInPopup() {
        const documentationElement = this.popupContent.locator('text=View documentation');
        return documentationElement.isVisible();
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

    async closeDrawer(): Promise<void> {
        await this.drawer.page().keyboard.press('Escape');
        await this.drawer.waitFor({state: 'hidden'});
    }

    // ACL Syntax methods
    async getAclSyntaxRadioGroup(): Promise<Locator> {
        // First, find the settings item that contains the ACL syntax title
        const aclSettingsItem = this.drawer
            .locator('.gn-settings__item')
            .filter({hasText: 'ACL syntax format'});

        // Then find the radio button group within that item
        return aclSettingsItem.locator('.g-segmented-radio-group');
    }

    async getSelectedAclSyntax(): Promise<string> {
        const radioGroup = await this.getAclSyntaxRadioGroup();
        const checkedOption = radioGroup.locator('.g-radio-button__option_checked');
        const text = await checkedOption.textContent();
        return text?.trim() || '';
    }

    async selectAclSyntax(syntax: 'KiKiMr' | 'YDB Short' | 'YDB' | 'YQL'): Promise<void> {
        // Ensure drawer is visible first
        await this.drawer.waitFor({state: 'visible'});

        const radioGroup = await this.getAclSyntaxRadioGroup();
        const option = radioGroup.locator(`.g-radio-button__option:has-text("${syntax}")`);
        await option.click();
        // Small delay to ensure the setting is saved
        await this.drawer.page().waitForTimeout(100);
    }

    async getAclSyntaxOptions(): Promise<string[]> {
        const radioGroup = await this.getAclSyntaxRadioGroup();
        const options = radioGroup.locator('.g-radio-button__option');
        const count = await options.count();
        const texts: string[] = [];
        for (let i = 0; i < count; i++) {
            const text = await options.nth(i).textContent();
            if (text) {
                texts.push(text.trim());
            }
        }
        return texts;
    }

    async isAclSyntaxSettingVisible(): Promise<boolean> {
        const aclSetting = this.drawer
            .locator('.gn-settings__item')
            .filter({hasText: 'ACL syntax format'});
        return aclSetting.isVisible();
    }
}
