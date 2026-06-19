import type {Locator, Page} from '@playwright/test';

const defaultFooterItemsSelector =
    '[data-qa="aside-information"], [data-qa="aside-settings"], [data-qa="aside-user"]';
const settingsMenuItemSelector = '[data-id]';
const hotkeysPanelSelector =
    '.kv-navigation__hotkeys-drawer, [data-qa="hotkeys-panel"] .g-drawer__item';
const drawerSelector = '.gn-drawer, .g-drawer[data-floating-ui-status="open"], .g-drawer';
const experimentsPageId = '/experimentsPage';

export class Sidebar {
    private page: Page;
    private sidebarContainer: Locator;
    private logoButton: Locator;
    private footer: Locator;
    private settingsButton: Locator;
    private informationButton: Locator;
    private accountButton: Locator;
    private collapseButton: Locator;
    private drawer: Locator;
    private drawerMenu: Locator;
    private popupContent: Locator;
    private hotkeysButton: Locator;
    private hotkeysPanel: Locator;

    constructor(page: Page) {
        this.page = page;
        this.sidebarContainer = page.getByTestId('aside-navigation');
        this.logoButton = page.getByTestId('aside-logo');
        this.footer = page.locator(defaultFooterItemsSelector);
        this.drawer = page.locator(drawerSelector).first();
        this.popupContent = page.getByTestId('information-popup');
        this.hotkeysButton = page.getByTestId('information-popup-hotkeys');
        this.hotkeysPanel = page.locator(hotkeysPanelSelector).first();
        this.drawerMenu = page.getByTestId('user-settings');

        this.informationButton = this.getFooterButton('aside-information', 'Information');
        this.settingsButton = this.getFooterButton('aside-settings', 'Settings');
        this.accountButton = this.getFooterButton('aside-user', 'Account');

        this.collapseButton = this.sidebarContainer.getByRole('button', {
            name: /^(Collapse|Expand)$/,
        });
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
        await this.getSettingsRoot().waitFor({state: 'visible'});
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
        await this.hotkeysButton.waitFor({state: 'visible'});
        const box = await this.hotkeysButton.boundingBox();

        if (!box) {
            throw new Error('Keyboard shortcuts button is not visible');
        }

        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
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
        return this.footer.count();
    }

    async isFooterItemVisible(index: number) {
        return this.footer.nth(index).isVisible();
    }

    async clickFooterItem(index: number) {
        await this.footer.nth(index).click();
    }

    async getFooterItemText(index: number): Promise<string> {
        const item = this.footer.nth(index);
        const title = await item.getAttribute('title');

        return title ?? (await item.textContent())?.trim() ?? '';
    }

    async isDrawerVisible() {
        return (await this.getSettingsRoot().isVisible()) || (await this.drawer.isVisible());
    }

    async getDrawerMenuItems(): Promise<string[]> {
        const items = this.drawerMenu.locator(settingsMenuItemSelector);
        const texts = await items.allTextContents();

        return texts.map((text) => text.trim()).filter(Boolean);
    }

    async clickExperimentsSection() {
        await this.getSettingsMenuItem(experimentsPageId).click();
    }

    async toggleExperimentByTitle(title: string) {
        const switchControl = this.getSettingsSwitch(title);

        await switchControl.click();
    }

    async getFirstExperimentTitle(): Promise<string> {
        const label = await this.getSettingsRoot()
            .getByRole('switch')
            .first()
            .getAttribute('aria-label');

        if (!label) {
            throw new Error('First experiment switch has no aria-label');
        }

        return label;
    }

    async isExperimentEnabled(title: string): Promise<boolean> {
        return this.getSettingsSwitch(title).isChecked();
    }

    async closeDrawer(): Promise<void> {
        await this.drawer.page().keyboard.press('Escape');
        await this.getSettingsRoot().waitFor({state: 'hidden'});
    }

    // ACL Syntax methods
    async getAclSyntaxRadioGroup(): Promise<Locator> {
        return this.getSettingsRoot().getByRole('radiogroup', {name: 'ACL syntax format'});
    }

    async getSelectedAclSyntax(): Promise<string> {
        const radioGroup = await this.getAclSyntaxRadioGroup();
        const checkedOption = radioGroup.getByRole('radio', {checked: true});
        const text = await checkedOption.textContent();
        return text?.trim() || '';
    }

    async selectAclSyntax(syntax: 'KiKiMr' | 'YDB Short' | 'YDB' | 'YQL'): Promise<void> {
        // Ensure drawer is visible first
        await this.getSettingsRoot().waitFor({state: 'visible'});

        const radioGroup = await this.getAclSyntaxRadioGroup();
        await radioGroup.getByText(syntax, {exact: true}).click();
        // Small delay to ensure the setting is saved
        await this.drawer.page().waitForTimeout(100);
    }

    async getAclSyntaxOptions(): Promise<string[]> {
        const radioGroup = await this.getAclSyntaxRadioGroup();
        const options = radioGroup.getByRole('radio');
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
        const radioGroup = await this.getAclSyntaxRadioGroup();

        return radioGroup.isVisible();
    }

    getSettingsRoot(): Locator {
        return this.page.getByTestId('user-settings');
    }

    getHotkeysPanelRoot(): Locator {
        return this.hotkeysPanel;
    }

    getInformationPopup(): Locator {
        return this.popupContent;
    }

    getAccountPopup(): Locator {
        return this.page.getByTestId('aside-user-popup');
    }

    private getFooterButton(qa: string, title: string): Locator {
        return this.page
            .getByTestId(qa)
            .or(this.page.getByRole('button', {name: title}))
            .first();
    }

    private getSettingsSwitch(title: string): Locator {
        return this.getSettingsRoot().getByRole('switch', {name: title});
    }

    private getSettingsMenuItem(id: string): Locator {
        return this.getSettingsRoot().locator(`[data-id="${id}"]`);
    }
}
