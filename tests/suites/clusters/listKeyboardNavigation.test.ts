import {expect, test} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

const clusters = [
    {name: 'zulu', title: 'Zulu'},
    {name: 'alpha', title: 'Alpha'},
    {name: 'bravo', title: 'Bravo'},
];

test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'meta_backend', {get: () => '/meta', set: () => {}});
        Object.defineProperty(window, 'web_version', {get: () => 'true', set: () => {}});
    });
    await page.route('**/meta/**', (route) =>
        route.fulfill({
            json: new URL(route.request().url()).pathname.endsWith('/clusters') ? {clusters} : {},
        }),
    );
});

test('arrows and Enter activate the highlighted cluster in displayed order', async ({page}) => {
    await new PageModel(page).goto();
    const table = page.locator('.ydb-clusters .data-table');
    await expect(table.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    const search = page.locator('.ydb-clusters input').first();
    await search.focus();
    await search.press('ArrowDown');
    const selected = table.locator('.ydb-keyboard-focused-row');
    await expect(selected).toContainText('Bravo');
    await search.press('Enter');
    await expect(page).toHaveURL(/clusterName=bravo/);
});

test('Up stops at the first row and filtering resets selection', async ({page}) => {
    await new PageModel(page).goto();
    const search = page.locator('.ydb-clusters input').first();
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    await search.press('ArrowUp');
    await search.press('ArrowUp');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Alpha');
    await search.fill('Bravo');
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toHaveCount(0);
    await expect(page.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await search.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Bravo');
    await search.press('Enter');
    await expect(page).toHaveURL(/clusterName=bravo/);
});

test('links keep their native keyboard handling', async ({page}) => {
    await new PageModel(page).goto();
    const link = page.getByRole('link', {name: 'Alpha', exact: true});
    await link.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await link.press('Enter');
    await expect(page).toHaveURL(/clusterName=alpha/);
});
