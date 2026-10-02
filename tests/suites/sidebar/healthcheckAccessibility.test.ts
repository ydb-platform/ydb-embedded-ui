import type {Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

type Panel = 'Healthcheck' | 'companion';

async function openFixture(page: Page, mode: Window['e2eHealthcheckDrawerMode'] = 'non-modal') {
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
        });

        for (const closing of ['Healthcheck', 'companion'] as const) {
            for (const method of ['Close', 'Escape'] as const) {
                test(`${first} first: ${method} ${closing}, reopen and reload`, async ({page}) => {
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
                    await page.reload();
                    await expect(page.getByTestId('healthcheck-drawer-fixture')).toBeVisible();
                    await openBoth(page, first);
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

    test('Escape dismisses the nested dialog before Healthcheck', async ({page}) => {
        await openFixture(page);
        await openBoth(page, 'Healthcheck');
        await panel(page, 'Healthcheck').getByRole('button', {name: 'Open confirmation'}).focus();
        await page.keyboard.press('Enter');
        const nested = page.getByRole('dialog', {name: 'Nested confirmation', exact: true});
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
