import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {getClipboardContent} from '../../utils/clipboard';
import {backend, database} from '../../utils/constants';
import {TenantPage} from '../tenant/TenantPage';
import {Diagnostics} from '../tenant/diagnostics/Diagnostics';
import {setupTopQueriesMock} from '../tenant/diagnostics/mocks';
import {QueryTabs} from '../tenant/queryEditor/models/QueryEditor';

const TEST_DATABASE = database;
const GRANT_ACCESS_DRAWER_SELECTOR = '.ydb-grant-access';
const QUERY_DETAILS_DRAWER_SELECTOR = '.ydb-query-details';
const HISTORY_QUERY_TEXT = 'SELECT 123 AS drawer_history_preview;';

async function clickOutsideDrawerInContent(page: Page) {
    await page.mouse.click(100, 100);
}

async function clickOutsideDrawerInAside(page: Page) {
    await page.getByTestId('aside-navigation').click({position: {x: 20, y: 100}});
}

async function openCompactHealthcheckDrawer(page: Page) {
    const healthcheckStatus = page.getByRole('button', {name: 'Degraded: 1 issue'}).first();

    await dispatchClick(healthcheckStatus);
}

async function dispatchClick(locator: Locator) {
    await locator.waitFor({state: 'visible'});
    await locator.evaluate((element) => {
        element.dispatchEvent(
            new MouseEvent('click', {bubbles: true, cancelable: true, view: window}),
        );
    });
}

async function clickDiagnosticsTableRowAtStart(page: Page, row: number) {
    const rowElement = page
        .locator(
            '.object-general .ydb-resizeable-data-table tr.data-table__row, .kv-tenant-diagnostics .ydb-resizeable-data-table tr.data-table__row',
        )
        .nth(row - 1);

    await dispatchClick(rowElement);
}

async function expectRightDrawerAlignedToAppContent(page: Page, drawerRoot: Locator) {
    const asideBox = await page.getByTestId('aside-navigation').boundingBox();
    const asideRight = asideBox ? asideBox.x + asideBox.width : 56;
    const viewport = page.viewportSize();

    await expect
        .poll(
            async () => {
                const drawerBox = await drawerRoot.boundingBox();

                if (!drawerBox) {
                    return Number.POSITIVE_INFINITY;
                }

                const leftGap = Math.max(asideRight - drawerBox.x, 0);
                const rightGap = viewport
                    ? Math.abs(viewport.width - (drawerBox.x + drawerBox.width))
                    : 0;

                return Math.max(leftGap, rightGap);
            },
            {
                message: 'Drawer should finish opening inside the app content viewport',
            },
        )
        .toBeLessThanOrEqual(1);
}

async function expectDrawerInsideContextBounds(drawerRoot: Locator) {
    await expect
        .poll(
            async () => {
                return drawerRoot.evaluate((element) => {
                    const context = element.closest('.ydb-drawer__drawer-container');

                    if (!context) {
                        return Number.POSITIVE_INFINITY;
                    }

                    const drawerRect = element.getBoundingClientRect();
                    const contextRect = context.getBoundingClientRect();

                    return Math.max(
                        contextRect.left - drawerRect.left,
                        drawerRect.right - contextRect.right,
                        contextRect.top - drawerRect.top,
                        drawerRect.bottom - contextRect.bottom,
                        0,
                    );
                });
            },
            {
                message: 'Drawer should stay inside DrawerContextProvider bounds',
            },
        )
        .toBeLessThanOrEqual(1);
}

async function expectDrawerContextInsideViewport(drawerRoot: Locator) {
    await expect
        .poll(
            async () => {
                return drawerRoot.evaluate((element) => {
                    const context = element.closest('.ydb-drawer__drawer-container');

                    if (!context) {
                        return Number.POSITIVE_INFINITY;
                    }

                    const contextRect = context.getBoundingClientRect();

                    return Math.max(
                        -contextRect.left,
                        contextRect.right - window.innerWidth,
                        -contextRect.top,
                        contextRect.bottom - window.innerHeight,
                        0,
                    );
                });
            },
            {
                message: 'DrawerContextProvider should stay inside the viewport',
            },
        )
        .toBeLessThanOrEqual(1);
}

async function expectDrawerOverlayOverflowHidden(drawerOverlay: Locator) {
    await expect(drawerOverlay).toBeVisible();
    await expect
        .poll(
            () =>
                drawerOverlay.evaluate((element) => {
                    const styles = window.getComputedStyle(element);

                    return `${styles.overflowX}/${styles.overflowY}`;
                }),
            {
                message: 'Drawer overlay should clip animated panel overflow',
            },
        )
        .toBe('hidden/hidden');
}

async function expectRightDrawerResizable(page: Page, drawerRoot: Locator) {
    const beforeBox = await drawerRoot.boundingBox();
    if (!beforeBox) {
        throw new Error('Drawer panel should have a bounding box before resize');
    }

    const resizer = drawerRoot.locator('.g-drawer__resizer').first();
    await expect(resizer).toBeVisible();

    const resizerBox = await resizer.boundingBox();
    if (!resizerBox) {
        throw new Error('Drawer resizer should have a bounding box');
    }

    const startX = resizerBox.x + resizerBox.width / 2;
    const startY = resizerBox.y + resizerBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 120, startY, {steps: 6});
    await page.mouse.up();

    await expect
        .poll(async () => {
            const afterBox = await drawerRoot.boundingBox();

            return afterBox ? afterBox.width - beforeBox.width : 0;
        })
        .toBeGreaterThan(80);
}

async function addQueryHistoryEntry(page: Page) {
    await page.addInitScript(
        ({queryText}) => {
            localStorage.setItem(
                'queries_history',
                JSON.stringify([
                    {
                        queryId: 'drawer-history-preview',
                        queryText,
                        startTime: Date.parse('2026-06-18T12:00:00Z'),
                        durationUs: 1500,
                        status: 'completed',
                    },
                ]),
            );
        },
        {queryText: HISTORY_QUERY_TEXT},
    );
}

async function mockHealthcheckWithIssue(page: Page) {
    await page.route('**/viewer/json/healthcheck**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                self_check_result: 'DEGRADED',
                issue_log: [
                    {
                        id: 'drawer-healthcheck-issue',
                        status: 'YELLOW',
                        message: 'Drawer healthcheck issue',
                        location: {
                            database: {
                                name: TEST_DATABASE,
                            },
                        },
                    },
                ],
            }),
        });
    });
}

test.describe('Drawer behavior', () => {
    test('grant access drawer stays open on opening and inside clicks, closes on outside click', async ({
        page,
    }) => {
        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: TEST_DATABASE,
            database: TEST_DATABASE,
            backend,
            databasePage: 'diagnostics',
            diagnosticsTab: 'access',
        });

        const diagnostics = new Diagnostics(page);
        await diagnostics.clickGrantAccessButton();

        const grantAccessDrawer = page.locator(GRANT_ACCESS_DRAWER_SELECTOR).first();
        await expect(grantAccessDrawer).toBeVisible();

        await grantAccessDrawer.locator('input[name="subjectInput"]').click();
        await expect(grantAccessDrawer).toBeVisible();

        await clickOutsideDrawerInAside(page);
        await expect(grantAccessDrawer).toBeHidden();
    });

    test('healthcheck drawer close button and outside click close without layout overlap', async ({
        page,
    }) => {
        await mockHealthcheckWithIssue(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: TEST_DATABASE,
            database: TEST_DATABASE,
            backend,
            databasePage: 'diagnostics',
        });

        await page.locator('.kv-tenant-diagnostics').waitFor({state: 'visible', timeout: 30000});
        await openCompactHealthcheckDrawer(page);

        const healthcheckDrawer = page.getByTestId('tenant-healthcheck-details');
        await expect(healthcheckDrawer).toBeVisible();
        const healthcheckDrawerPanel = page
            .getByTestId('tenant-healthcheck-details')
            .locator('.g-drawer__item, .ydb-drawer__item')
            .first();
        await expectRightDrawerAlignedToAppContent(page, healthcheckDrawerPanel);
        await expectDrawerInsideContextBounds(healthcheckDrawerPanel);
        await expectDrawerContextInsideViewport(healthcheckDrawerPanel);
        await expectRightDrawerResizable(page, healthcheckDrawerPanel);

        await healthcheckDrawer.click();
        await expect(healthcheckDrawer).toBeVisible();

        await page
            .getByTestId('tenant-healthcheck-details')
            .locator('.ydb-drawer__controls button')
            .last()
            .click();
        await expect(healthcheckDrawer).toBeHidden();
        await expect(page).not.toHaveURL(/showHealthcheck=true/);

        await openCompactHealthcheckDrawer(page);
        await expect(healthcheckDrawer).toBeVisible();
        await clickOutsideDrawerInAside(page);
        await expect(healthcheckDrawer).toBeHidden();
        await expect(page).not.toHaveURL(/showHealthcheck=true/);
    });

    test('query history preview drawer keeps inside clicks and clears row state on close', async ({
        page,
    }) => {
        await addQueryHistoryEntry(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: TEST_DATABASE,
            database: TEST_DATABASE,
            backend,
            databasePage: 'query',
        });

        await tenantPage.queryEditor.queryTabs.selectTab(QueryTabs.History);
        await tenantPage.queryEditor.historyQueries.isVisible();
        await tenantPage.queryEditor.historyQueries.clickRow(HISTORY_QUERY_TEXT);

        const queryHistoryDrawer = page
            .getByTestId('query-history-preview')
            .locator(QUERY_DETAILS_DRAWER_SELECTOR)
            .first();
        const queryHistoryDrawerPanel = page
            .getByTestId('query-history-preview')
            .locator('.g-drawer__item, .ydb-drawer__item')
            .first();
        await expect(queryHistoryDrawer).toBeVisible();
        await expectDrawerInsideContextBounds(queryHistoryDrawerPanel);
        await expectDrawerContextInsideViewport(queryHistoryDrawerPanel);
        await expect
            .poll(() => tenantPage.queryEditor.historyQueries.isRowActive(HISTORY_QUERY_TEXT))
            .toBe(true);

        await queryHistoryDrawer.click();
        await expect(queryHistoryDrawer).toBeVisible();

        await clickOutsideDrawerInContent(page);
        await expect(queryHistoryDrawer).toBeHidden();
        await expect
            .poll(() => tenantPage.queryEditor.historyQueries.isRowActive(HISTORY_QUERY_TEXT))
            .toBe(false);

        await tenantPage.queryEditor.historyQueries.clickRow(HISTORY_QUERY_TEXT);
        await expect(queryHistoryDrawer).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(queryHistoryDrawer).toBeHidden();
        await expect
            .poll(() => tenantPage.queryEditor.historyQueries.isRowActive(HISTORY_QUERY_TEXT))
            .toBe(false);
    });

    test('top query details drawer controls copy link, close, and clean selected-row state', async ({
        page,
        context,
    }) => {
        await context.grantPermissions(['clipboard-read']);
        await setupTopQueriesMock(page);

        const tenantPage = new TenantPage(page);
        await tenantPage.goto({
            schema: TEST_DATABASE,
            database: TEST_DATABASE,
            backend,
            databasePage: 'database',
            diagnosticsTab: 'topQueries',
        });

        const diagnostics = new Diagnostics(page);
        await expect(diagnostics.table.isVisible()).resolves.toBe(true);
        await clickDiagnosticsTableRowAtStart(page, 1);

        const queryDetailsDrawerOverlay = page.getByTestId('query-details');
        const queryDetailsDrawer = page
            .getByTestId('query-details')
            .locator(QUERY_DETAILS_DRAWER_SELECTOR)
            .first();
        const queryDetailsDrawerPanel = page
            .getByTestId('query-details')
            .locator('.g-drawer__item, .ydb-drawer__item')
            .first();
        await expect(queryDetailsDrawer).toBeVisible();
        await expectDrawerOverlayOverflowHidden(queryDetailsDrawerOverlay);
        await expectRightDrawerAlignedToAppContent(page, queryDetailsDrawerPanel);
        await expectDrawerInsideContextBounds(queryDetailsDrawerPanel);
        await expectDrawerContextInsideViewport(queryDetailsDrawerPanel);
        await expect.poll(() => diagnostics.isRowActive(1)).toBe(true);

        await queryDetailsDrawer.click();
        await expect(queryDetailsDrawer).toBeVisible();

        await clickDiagnosticsTableRowAtStart(page, 2);
        await expect(queryDetailsDrawer).toBeVisible();
        await expect.poll(() => diagnostics.isRowActive(1)).toBe(false);
        await expect.poll(() => diagnostics.isRowActive(2)).toBe(true);

        await expect(diagnostics.isCopyLinkButtonVisible()).resolves.toBe(true);
        await diagnostics.clickCopyLinkButton();
        const copiedUrl = await getClipboardContent(page);
        expect(copiedUrl).toContain('selectedRow=');

        await page.goto(copiedUrl);
        await expect(queryDetailsDrawer).toBeVisible();
        await expect(page).not.toHaveURL(/selectedRow=/);

        await page
            .getByTestId('query-details')
            .locator('.ydb-drawer__controls button')
            .last()
            .click();
        await expect(queryDetailsDrawer).toBeHidden();
        await expect.poll(() => diagnostics.isRowActive(1)).toBe(false);

        await clickDiagnosticsTableRowAtStart(page, 1);
        await expect(queryDetailsDrawer).toBeVisible();
        await clickOutsideDrawerInContent(page);
        await expect(queryDetailsDrawer).toBeHidden();
        await expect.poll(() => diagnostics.isRowActive(1)).toBe(false);
    });
});
