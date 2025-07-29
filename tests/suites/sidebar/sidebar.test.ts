import {expect, test} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {tenantName} from '../../utils/constants';
import {toggleExperiment} from '../../utils/toggleExperiment';
import {TenantPage} from '../tenant/TenantPage';

import {Sidebar} from './Sidebar';

test.describe('Test Sidebar', async () => {
    test.beforeEach(async ({page}) => {
        const basePage = new PageModel(page);
        const response = await basePage.goto();
        expect(response?.ok()).toBe(true);
    });

    test('Sidebar is visible and loads correctly', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await expect(sidebar.isSidebarVisible()).resolves.toBe(true);
    });

    test('Logo button is visible and clickable', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await expect(sidebar.isLogoButtonVisible()).resolves.toBe(true);
        await sidebar.clickLogoButton();
    });

    test('Settings button is visible and clickable', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await expect(sidebar.isSettingsButtonVisible()).resolves.toBe(true);
        await sidebar.clickSettings();
    });

    test('Settings button click opens drawer with correct sections', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();

        // Initially drawer should not be visible
        await expect(sidebar.isDrawerVisible()).resolves.toBe(false);

        // Click settings button
        await sidebar.clickSettings();
        await page.waitForTimeout(500); // Wait for animation

        // Drawer should become visible
        await expect(sidebar.isDrawerVisible()).resolves.toBe(true);

        // Verify drawer menu items
        const menuItems = await sidebar.getDrawerMenuItems();
        expect(menuItems).toEqual(['General', 'Editor', 'Experiments', 'About']);
    });

    test('Information button is visible and clickable', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await expect(sidebar.isInformationButtonVisible()).resolves.toBe(true);
        await sidebar.clickInformation();
    });

    test('Information popup contains documentation and keyboard shortcuts', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();

        // Click the Information button to open the popup
        await sidebar.clickInformation();
        await page.waitForTimeout(700); // Wait for animation

        // Check if the popup is visible
        await expect(sidebar.isPopupVisible()).resolves.toBe(true);

        // Check if the popup contains Documentation
        await expect(sidebar.hasDocumentationInPopup()).resolves.toBe(true);

        // Check if the popup contains Keyboard shortcuts button
        await expect(sidebar.hasHotkeysButtonInPopup()).resolves.toBe(true);
    });

    test('Clicking hotkeys button in information popup opens hotkeys panel with title', async ({
        page,
    }) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();

        // Click the Information button to open the popup
        await sidebar.clickInformation();
        await page.waitForTimeout(700); // Wait for animation

        // Check if the popup is visible
        await expect(sidebar.isPopupVisible()).resolves.toBe(true);

        // Check if hotkeys button is visible and click it
        await expect(sidebar.hasHotkeysButtonInPopup()).resolves.toBe(true);
        await sidebar.clickHotkeysButton();
        await page.waitForTimeout(500); // Wait for animation

        // Check if hotkeys panel is visible and has the title
        await expect(sidebar.isHotkeysPanelVisible()).resolves.toBe(true);
        await expect(sidebar.hasHotkeysPanelTitle()).resolves.toBe(true);
    });

    test('Account button is visible and clickable', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await expect(sidebar.isAccountButtonVisible()).resolves.toBe(true);
        await sidebar.clickAccount();
    });

    test('Pressing Ctrl+K in editor page opens hotkeys panel', async ({page}) => {
        // Open editor page
        const pageQueryParams = {
            schema: tenantName,
            database: tenantName,
            general: 'query',
        };

        const tenantPage = new TenantPage(page);
        await tenantPage.goto(pageQueryParams);
        await page.waitForTimeout(1000); // Wait for page to load fully

        // Create sidebar instance to check for hotkeys panel
        const sidebar = new Sidebar(page);

        // Initially hotkeys panel should not be visible
        await expect(sidebar.isHotkeysPanelVisible()).resolves.toBe(false);

        // Press Ctrl+K to open hotkeys panel
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(500); // Wait for animation

        // Check if hotkeys panel is visible and has the title
        await expect(sidebar.isHotkeysPanelVisible()).resolves.toBe(true);
        await expect(sidebar.hasHotkeysPanelTitle()).resolves.toBe(true);
    });

    test('Sidebar can be collapsed and expanded', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();

        // Initially collapsed
        await expect(sidebar.isCollapsed()).resolves.toBe(true);

        // Expand
        await sidebar.toggleCollapse();
        await page.waitForTimeout(500); // Wait for animation
        await expect(sidebar.isCollapsed()).resolves.toBe(false);

        // Collapse
        await sidebar.toggleCollapse();
        await page.waitForTimeout(500); // Wait for animation
        await expect(sidebar.isCollapsed()).resolves.toBe(true);
    });

    test('Footer items are visible', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();

        const itemsCount = await sidebar.getFooterItemsCount();
        expect(itemsCount).toBeGreaterThan(0);
    });

    test('Can toggle experiments in settings', async ({page}) => {
        const sidebar = new Sidebar(page);
        await sidebar.clickSettings();
        await page.waitForTimeout(500); // Wait for animation
        await sidebar.clickExperimentsSection();
        const experimentTitle = await sidebar.getFirstExperimentTitle();

        await toggleExperiment(page, 'on', experimentTitle);
        await sidebar.clickSettings();
        await page.waitForTimeout(500); // Wait for animation
        await sidebar.clickExperimentsSection();
        const newState = await sidebar.isExperimentEnabled(experimentTitle);
        expect(newState).toBe(true);

        await toggleExperiment(page, 'off', experimentTitle);
        await sidebar.clickSettings();
        await page.waitForTimeout(500); // Wait for animation
        await sidebar.clickExperimentsSection();
        const finalState = await sidebar.isExperimentEnabled(experimentTitle);
        expect(finalState).toBe(false);
    });
});
