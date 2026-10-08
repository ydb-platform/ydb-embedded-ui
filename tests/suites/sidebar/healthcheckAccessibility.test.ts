import type {Locator, Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

import {clickDrawerVeil} from '../../utils/clickDrawerVeil';
import {backend, database} from '../../utils/constants';
import {mockHealthcheckMeta, mockHealthcheckWithIssue} from '../../utils/healthcheck';
import {mockBridgeHealthcheck, mockCapabilities, mockClusterWithBridgePiles} from '../bridge/mocks';
import {TenantPage} from '../tenant/TenantPage';

type Panel = 'Healthcheck' | 'companion';

async function openFixture(page: Page, mode: 'default' | 'modal' | 'non-modal' = 'non-modal') {
    await page.addInitScript((value) => {
        window.e2eHealthcheckDrawerMode = value;
    }, mode);
    await page.goto('/');
    await expect(page.getByTestId('healthcheck-drawer-fixture')).toBeVisible();
}

function panel(page: Page, name: Panel) {
    return page.getByRole('dialog', {
        name: name === 'Healthcheck' ? name : 'Companion',
        exact: true,
    });
}

async function openPanel(page: Page, name: Panel) {
    await page.getByRole('button', {name: `Open ${name}`, exact: true}).focus();
    await page.keyboard.press('Enter');
    await expect(
        name === 'Healthcheck' ? page.getByTestId('fixture-healthcheck') : panel(page, name),
    ).toBeVisible();
    const dialog =
        name === 'Healthcheck'
            ? page.getByTestId('fixture-healthcheck').getByRole('dialog')
            : panel(page, name);
    await expect(dialog).toBeFocused();
}

async function openBoth(page: Page, first: Panel) {
    await openPanel(page, first);
    await openPanel(page, first === 'Healthcheck' ? 'companion' : 'Healthcheck');
    await expect(page.getByRole('dialog')).toHaveCount(2);
    await expect
        .poll(() =>
            page.evaluate(() =>
                document
                    .getAnimations()
                    .filter(
                        (animation) =>
                            animation.effect?.getComputedTiming().iterations !== Infinity,
                    )
                    .every((animation) => animation.playState === 'finished'),
            ),
        )
        .toBe(true);
}

test.describe('Non-modal Healthcheck accessibility', () => {
    test.afterEach(async ({page}, info) => {
        await info.attach('panel-accessibility', {
            body: JSON.stringify({
                rendered: await page.locator('[role="dialog"]').count(),
                accessible: await page.getByRole('dialog').count(),
                tree: await page.locator('body').ariaSnapshot(),
            }),
            contentType: 'application/json',
        });
    });
    for (const first of ['Healthcheck', 'companion'] as const) {
        test(`both opening orders: ${first} first`, async ({page}, info) => {
            await openFixture(page);
            await openBoth(page, first);
            await expect(
                page.getByRole('button', {name: 'Open Healthcheck', exact: true}),
            ).toBeVisible();
            await expect(
                page.getByRole('button', {name: 'Open companion', exact: true}),
            ).toBeVisible();
            await expect(panel(page, 'Healthcheck').getByRole('textbox')).toBeInViewport({
                ratio: 1,
            });
            await expect(panel(page, 'companion').getByRole('textbox')).toBeInViewport({ratio: 1});
            await info.attach('accessibility-tree', {
                body: await page.locator('body').ariaSnapshot(),
                contentType: 'text/plain',
            });
            await info.attach('two-panels', {
                body: await page.screenshot(),
                contentType: 'image/png',
            });

            await clickDrawerVeil(page, page.getByTestId('fixture-healthcheck'));
            await expect(panel(page, 'Healthcheck')).toHaveCount(0);
            await expect(panel(page, 'companion')).toBeVisible();
            await openPanel(page, 'Healthcheck');
            await expect(page.getByRole('dialog')).toHaveCount(2);
            await page.reload();
            await expect(page.getByTestId('healthcheck-drawer-fixture')).toBeVisible();
            await openBoth(page, first);
        });

        for (const closing of ['Healthcheck', 'companion'] as const) {
            for (const method of ['Close', 'Escape'] as const) {
                test(`${first} first: ${method} ${closing} and reopen`, async ({page}) => {
                    await openFixture(page);
                    await openBoth(page, first);
                    const closingPanel = panel(page, closing);
                    const survivor = panel(
                        page,
                        closing === 'Healthcheck' ? 'companion' : 'Healthcheck',
                    );
                    if (method === 'Escape') {
                        await closingPanel.getByRole('textbox').focus();
                        await page.keyboard.press('Escape');
                    } else {
                        const name = closing === 'Healthcheck' ? 'Close' : 'Close companion';
                        await closingPanel.getByRole('button', {name, exact: true}).focus();
                        await page.keyboard.press('Enter');
                    }
                    await expect(closingPanel).toHaveCount(0);
                    await expect(survivor).toBeVisible();
                    await expect(
                        page.getByRole('button', {name: `Open ${closing}`, exact: true}),
                    ).toBeFocused();
                    await openPanel(page, closing);
                    await expect(page.getByRole('dialog')).toHaveCount(2);
                });
            }
        }
    }

    test('Tab and Shift+Tab reach both panels and the page without dismissing them', async ({
        page,
    }) => {
        await openFixture(page);
        await openBoth(page, 'Healthcheck');
        for (const key of ['Tab', 'Shift+Tab']) {
            await panel(page, 'Healthcheck').getByRole('textbox').focus();
            const visited = new Set<string>();
            for (let i = 0; i < 40 && visited.size < 3; i++) {
                await page.keyboard.press(key);
                visited.add(
                    await page.evaluate(() => {
                        const dialog = document.activeElement?.closest('[role="dialog"]');
                        if (!dialog) {
                            return 'page';
                        }
                        return dialog.getAttribute('aria-label') === 'Companion'
                            ? 'companion'
                            : 'Healthcheck';
                    }),
                );
            }
            expect([...visited].sort()).toEqual(['Healthcheck', 'companion', 'page']);
            await expect(page.getByRole('dialog')).toHaveCount(2);
        }
        await page.getByRole('textbox', {name: 'Page input', exact: true}).focus();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(2);
    });

    test('Cancel and Escape dismiss the nested dialog before Healthcheck', async ({page}) => {
        await openFixture(page);
        await openBoth(page, 'Healthcheck');
        await panel(page, 'Healthcheck').getByRole('button', {name: 'Open confirmation'}).focus();
        await page.keyboard.press('Enter');
        const nested = page.getByRole('dialog', {name: 'Nested confirmation', exact: true});
        await expect(nested).toBeVisible();
        await expect
            .poll(() => nested.evaluate((element) => element.contains(document.activeElement)))
            .toBe(true);
        await nested.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(nested).toHaveCount(0);
        await expect(page.getByRole('dialog')).toHaveCount(2);

        await panel(page, 'Healthcheck').getByRole('button', {name: 'Open confirmation'}).focus();
        await page.keyboard.press('Enter');
        await expect(nested).toBeVisible();
        await expect
            .poll(() => nested.evaluate((element) => element.contains(document.activeElement)))
            .toBe(true);
        await nested.getByRole('button', {name: 'Cancel', exact: true}).focus();
        await page.keyboard.press('Escape');
        await expect(nested).toHaveCount(0);
        await expect(page.getByRole('dialog')).toHaveCount(2);
        await expect(
            panel(page, 'Healthcheck').getByRole('button', {name: 'Open confirmation'}),
        ).toBeFocused();
    });

    for (const mode of ['default', 'modal'] as const) {
        test(`${mode} configuration preserves modal behavior`, async ({page}) => {
            await openFixture(page, mode);
            await openPanel(page, 'Healthcheck');
            await expect(
                page.getByRole('button', {name: 'Open companion', exact: true}),
            ).toHaveCount(0);
            await panel(page, 'Healthcheck').getByRole('textbox').focus();
            await page.keyboard.press('Escape');
            await expect(panel(page, 'Healthcheck')).toHaveCount(0);
            await expect(
                page.getByRole('button', {name: 'Open Healthcheck', exact: true}),
            ).toBeFocused();
        });
    }
});

test.describe('Real Healthcheck opener', () => {
    for (const compact of [true, false]) {
        for (const input of ['pointer', 'keyboard'] as const) {
            for (const close of ['Close', 'Escape'] as const) {
                test(`${compact ? 'compact' : 'Review issues'} ${input} returns focus after ${close}`, async ({
                    page,
                }) => {
                    await page.addInitScript((useCompact) => {
                        window.e2eHealthcheckDrawerMode = 'non-modal-page';
                        localStorage.setItem(
                            'enableTenantNavigationV2',
                            JSON.stringify(useCompact),
                        );
                    }, compact);
                    await mockHealthcheckWithIssue(page);

                    const tenantPage = new TenantPage(page);
                    await tenantPage.goto(
                        {schema: database, database, backend, databasePage: 'diagnostics'},
                        {waitUntil: 'commit'},
                    );
                    await page
                        .locator('.kv-tenant-diagnostics')
                        .waitFor({state: 'visible', timeout: 30000});

                    const opener = page.getByRole('button', {
                        name: compact ? 'Degraded: 1 issue' : 'Review issues',
                        exact: true,
                    });
                    await expect(opener).toBeVisible();
                    if (input === 'pointer') {
                        const previousFocus = compact
                            ? page.getByTestId('aside-navigation').locator('a[href]').first()
                            : page.getByRole('link').first();
                        await previousFocus.focus();
                        await expect(previousFocus).toBeFocused();
                        await opener.click();
                    } else {
                        await opener.focus();
                        await opener.press('Enter');
                    }

                    const drawer = page
                        .getByTestId('tenant-healthcheck-details')
                        .getByRole('dialog');
                    await expect(drawer).toBeVisible();
                    await expect(page).toHaveURL(
                        (url) => url.searchParams.get('showHealthcheck') === '1',
                    );
                    if (close === 'Escape') {
                        const filter = drawer.getByRole('textbox').first();
                        await filter.focus();
                        await filter.press('Escape');
                    } else {
                        const closeButton = drawer.getByRole('button', {
                            name: 'Close',
                            exact: true,
                        });
                        await closeButton.focus();
                        await closeButton.press('Enter');
                    }
                    await expect(drawer).toHaveCount(0);
                    await expect(page).toHaveURL((url) => !url.searchParams.has('showHealthcheck'));
                    await expect(opener).toBeVisible();
                    await expect(opener).toBeFocused();
                });
            }
        }
    }
});

test.describe('Additional Healthcheck openers', () => {
    for (const surface of ['cluster', 'databases', 'clusters', 'bridge'] as const) {
        for (const input of ['pointer', 'keyboard'] as const) {
            for (const close of ['Close', 'Escape'] as const) {
                test(`${surface} ${input} returns focus after ${close}`, async ({page}) => {
                    const meta = surface === 'databases' || surface === 'clusters';
                    await page.addInitScript((withMeta) => {
                        window.e2eHealthcheckDrawerMode = withMeta
                            ? 'non-modal-meta-page'
                            : 'non-modal-page';
                    }, meta);
                    await mockHealthcheckWithIssue(page);
                    if (meta) {
                        await mockHealthcheckMeta(page);
                    } else {
                        await page.route('**/viewer/json/cluster?*', (route) =>
                            route.fulfill({json: {Domain: database, Overall: 'Yellow'}}),
                        );
                    }
                    if (surface === 'bridge') {
                        await mockCapabilities(page, true);
                        await mockClusterWithBridgePiles(page);
                        await mockBridgeHealthcheck(page);
                    }

                    const pathname = surface === 'clusters' ? '/' : '/cluster/databases';
                    const params = surface === 'databases' ? '?clusterName=healthcheck-test' : '';
                    await page.goto(pathname + params, {waitUntil: 'commit'});
                    await page
                        .locator(surface === 'clusters' ? '.ydb-clusters' : '.ydb-cluster')
                        .waitFor({state: 'visible', timeout: 30000});

                    let opener: Locator;
                    if (surface === 'bridge') {
                        opener = page.getByRole('button', {
                            name: 'Health status for pile all-group-statuses-pile: Caution',
                            exact: true,
                        });
                    } else if (surface === 'cluster') {
                        opener = page
                            .locator('.ydb-cluster__title')
                            .getByRole('button', {name: 'Warning', exact: true});
                    } else {
                        const rowName =
                            surface === 'databases' ? 'local' : 'Healthcheck test cluster';
                        opener = page
                            .getByRole('row')
                            .filter({has: page.getByRole('link', {name: rowName, exact: true})})
                            .getByRole('button', {name: 'Warning', exact: true});
                    }
                    await expect(opener).toBeVisible();
                    if (input === 'pointer') {
                        const previousFocus = page.getByRole('textbox').first();
                        await previousFocus.focus();
                        await expect(previousFocus).toBeFocused();
                        await opener.click();
                    } else {
                        await opener.focus();
                        await opener.press('Enter');
                    }

                    const drawerId =
                        surface === 'databases'
                            ? 'database-list-healthcheck-details'
                            : 'cluster-healthcheck-details';
                    const drawer = page.getByTestId(drawerId).getByRole('dialog');
                    await expect(drawer).toBeVisible();
                    if (surface === 'cluster' || surface === 'bridge') {
                        await expect(page).toHaveURL(
                            (url) => url.searchParams.get('showHealthcheck') === '1',
                        );
                    }
                    if (surface === 'bridge') {
                        await expect(page).toHaveURL(
                            (url) =>
                                url.searchParams.get('healthcheckLeaf') === 'failing-pile-leaf',
                        );
                    }
                    if (close === 'Escape') {
                        const filter = drawer.getByRole('textbox').first();
                        await filter.focus();
                        await filter.press('Escape');
                    } else {
                        const closeButton = drawer.getByRole('button', {
                            name: 'Close',
                            exact: true,
                        });
                        await closeButton.focus();
                        await closeButton.press('Enter');
                    }
                    await expect(drawer).toHaveCount(0);
                    await expect(page).toHaveURL((url) =>
                        [
                            'showHealthcheck',
                            'healthcheckIssue',
                            'healthcheckLeaf',
                            'issuesFilter',
                            'view',
                        ].every((key) => !url.searchParams.has(key)),
                    );
                    await expect(opener).toBeVisible();
                    await expect(opener).toBeFocused();
                });
            }
        }
    }
});
