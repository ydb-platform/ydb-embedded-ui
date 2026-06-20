import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {backend, databasesPage} from '../../utils/constants';
import {TenantPage} from '../tenant/TenantPage';
import {Diagnostics} from '../tenant/diagnostics/Diagnostics';
import {setupTopQueriesMock} from '../tenant/diagnostics/mocks';

import {Sidebar} from './Sidebar';

const VISUAL_DATABASE = '/dev02/home/shared';
const SETTINGS_DRAWER_X = 56;
const SETTINGS_DRAWER_WIDTH = 834;
const GEOMETRY_TOLERANCE = 2;
const QUERY_DETAILS_DRAWER_SELECTOR = '.ydb-query-details';

function expectApproximately(actual: number, expected: number, tolerance = GEOMETRY_TOLERANCE) {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

async function expectSettingsGeometry(settingsRoot: Locator) {
    await expect
        .poll(
            async () => {
                const box = await settingsRoot.boundingBox();

                if (!box) {
                    return Number.POSITIVE_INFINITY;
                }

                return Math.max(
                    Math.abs(box.x - SETTINGS_DRAWER_X),
                    Math.abs(box.width - SETTINGS_DRAWER_WIDTH),
                );
            },
            {
                message: 'Settings drawer should finish opening at the expected position and width',
            },
        )
        .toBeLessThanOrEqual(GEOMETRY_TOLERANCE);

    const box = await settingsRoot.boundingBox();
    expectApproximately(box?.x ?? 0, SETTINGS_DRAWER_X);
    expectApproximately(box?.width ?? 0, SETTINGS_DRAWER_WIDTH);
}

async function gotoClusterDatabases(page: Page) {
    const clusterPage = new PageModel(page, databasesPage);
    const response = await clusterPage.goto({backend, databasePage: 'query'});

    expect(response?.ok()).toBe(true);
}

async function openHotkeysWithShortcut(page: Page, hotkeysPanel: Locator) {
    await page.keyboard.press('Control+k');

    try {
        await hotkeysPanel.waitFor({state: 'visible', timeout: 1000});
        return;
    } catch {
        await page.keyboard.press('Meta+k');
    }

    await hotkeysPanel.waitFor({state: 'visible'});
}

test.describe('Drawer visual snapshots', () => {
    test.skip(
        ({browserName}) => browserName !== 'chromium' || process.platform !== 'darwin',
        'Drawer visual baselines in this PR are maintained for Chromium on macOS only',
    );

    test('settings drawer matches baseline', async ({page}) => {
        await gotoClusterDatabases(page);

        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await sidebar.clickSettings();

        const settingsRoot = sidebar.getSettingsRoot();
        await expect(settingsRoot).toBeVisible();
        await expectSettingsGeometry(settingsRoot);
        await expect(settingsRoot).toHaveScreenshot('drawer-settings-general.png');

        await sidebar.clickExperimentsSection();
        await expectSettingsGeometry(settingsRoot);
        await expect(settingsRoot).toHaveScreenshot('drawer-settings-experiments.png');
    });

    test('hotkeys drawer from information popup matches baseline', async ({page}) => {
        await gotoClusterDatabases(page);

        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await sidebar.clickInformation();

        await expect(sidebar.getInformationPopup()).toBeVisible();
        await sidebar.clickHotkeysButton();

        const hotkeysPanel = sidebar.getHotkeysPanelRoot();
        await expect(hotkeysPanel).toBeVisible();
        await expect(hotkeysPanel).toHaveScreenshot('drawer-hotkeys-from-information.png');
    });

    test('account popup matches baseline', async ({page}) => {
        await gotoClusterDatabases(page);

        const sidebar = new Sidebar(page);
        await sidebar.waitForSidebarToLoad();
        await sidebar.clickAccount();

        const accountPopup = sidebar.getAccountPopup();
        await expect(accountPopup).toBeVisible();
        await expect(accountPopup).toHaveScreenshot('drawer-account-popup.png');
    });

    test('hotkeys drawer from shortcut on query page matches baseline', async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: VISUAL_DATABASE,
            database: VISUAL_DATABASE,
            backend,
            tenantPage: 'query',
            databasePage: 'query',
        });

        const sidebar = new Sidebar(page);
        const hotkeysPanel = sidebar.getHotkeysPanelRoot();

        await openHotkeysWithShortcut(page, hotkeysPanel);
        await expect(hotkeysPanel).toHaveScreenshot('drawer-hotkeys-from-shortcut.png');
    });

    test('grant access drawer matches baseline', async ({page}) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: VISUAL_DATABASE,
            database: VISUAL_DATABASE,
            backend,
            tenantPage: 'diagnostics',
            databasePage: 'diagnostics',
            diagnosticsTab: 'access',
        });

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickGrantAccessButton();

        const grantAccessDrawer = page.locator('.ydb-grant-access').first();
        await expect(grantAccessDrawer).toBeVisible();
        await expect(grantAccessDrawer).toHaveScreenshot('drawer-grant-access.png');
    });

    test('top query details drawer matches baseline', async ({page}) => {
        await setupTopQueriesMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: VISUAL_DATABASE,
            database: VISUAL_DATABASE,
            backend,
            tenantPage: 'diagnostics',
            databasePage: 'diagnostics',
            diagnosticsTab: 'topQueries',
        });

        const diagnostics = new Diagnostics(page);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await diagnostics.table.clickRow(1);

        const queryDetailsDrawer = page.locator(QUERY_DETAILS_DRAWER_SELECTOR).first();
        await expect(queryDetailsDrawer).toBeVisible();
        await expect(queryDetailsDrawer).toHaveScreenshot('drawer-top-query-details.png');
    });
});
