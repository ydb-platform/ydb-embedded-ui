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
    await page.route('**/viewer/json/nodelist*', (route) => route.fulfill({json: []}));
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
    await expect(page.getByRole('status').filter({hasText: 'Selected row 2 of 3:'})).toContainText(
        'Bravo',
    );
    await expect(search).toBeFocused();
    const href = await selected
        .getByRole('link', {name: 'Bravo', exact: true})
        .getAttribute('href');
    if (!href) {
        throw new Error('The selected cluster must have a navigation link');
    }
    const destination = new URL(href, page.url()).href;
    const [navigationRequest] = await Promise.all([
        page.waitForRequest(
            (request) => request.isNavigationRequest() && request.frame() === page.mainFrame(),
        ),
        search.press('Enter'),
    ]);
    expect(navigationRequest.url()).toBe(destination);
    await expect(page).toHaveURL(/clusterName=bravo/);
});

test('one Back returns to clusters and arrows work without refocusing the filter', async ({
    page,
}) => {
    await new PageModel(page).goto();
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    const listUrl = page.url();
    for (let attempt = 0; attempt < 3; attempt++) {
        await page.keyboard.press('ArrowDown');
        await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Bravo');
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/clusterName=bravo/);
        await expect(page.locator('.ydb-clusters')).toHaveCount(0);
        await expect(page.getByPlaceholder('Database name')).toBeVisible();
        await page.goBack();
        await expect(page).toHaveURL(listUrl);
        await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    }
});

test('arrows work after Back when focus returns to the document', async ({page}) => {
    await new PageModel(page).goto();
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('.ydb-clusters')).toHaveCount(0);
    await expect(page.getByPlaceholder('Database name')).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    });
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Bravo');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Alpha');
});

test('holding Enter does not navigate again on the destination list', async ({page}) => {
    await page.route('**/meta/cp_databases?*', (route) =>
        route.fulfill({
            json: {
                databases: [{Name: '/local/alpha', Type: 'Dedicated', State: 'RUNNING'}],
            },
        }),
    );
    await new PageModel(page).goto();
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    const listUrl = page.url();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.down('Enter');
    await expect(page.getByPlaceholder('Database name')).toBeVisible();
    await expect(page.getByRole('link', {name: 'alpha', exact: true})).toBeVisible();
    const clusterUrl = page.url();
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    await expect(page).toHaveURL(clusterUrl);
    await page.goBack();
    await expect(page).toHaveURL(listUrl);
});

test('mouse hover hides keyboard selection until another arrow is pressed', async ({page}) => {
    await new PageModel(page).goto();
    const firstLink = page.getByRole('link', {name: 'Alpha', exact: true});
    await expect(firstLink).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Bravo');
    await firstLink.hover();
    await expect(page.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await page.mouse.move(0, 0);
    await expect(page.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Zulu');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Bravo');
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

for (const firstKey of ['ArrowUp', 'ArrowDown']) {
    test(`${firstKey} selects the only matching row`, async ({page}) => {
        await new PageModel(page).goto();
        await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
        const search = page.locator('.ydb-clusters input').first();
        await search.fill('Bravo');
        await expect(page.locator('.ydb-clusters tbody tr')).toHaveCount(1);
        for (const key of [firstKey, 'ArrowUp', 'ArrowDown']) {
            await search.press(key);
            const selected = page.locator('.ydb-keyboard-focused-row');
            await expect(selected).toHaveCount(1);
            await expect(selected).toContainText('Bravo');
        }
        await search.press('Enter');
        await expect(page).toHaveURL(/clusterName=bravo/);
    });
}

test('arrows preserve the filter caret when no rows match', async ({page}) => {
    await new PageModel(page).goto();
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toBeVisible();
    const search = page.locator('.ydb-clusters input').first();
    await search.fill('no matching cluster');
    await expect(page.getByRole('link', {name: 'Alpha', exact: true})).toHaveCount(0);
    await search.evaluate((input: HTMLInputElement) => input.setSelectionRange(4, 4));
    for (const key of ['ArrowUp', 'ArrowDown']) {
        await search.press(key);
        expect(
            await search.evaluate((input: HTMLInputElement) => [
                input.selectionStart,
                input.selectionEnd,
            ]),
        ).toEqual([4, 4]);
        await expect(search).toHaveValue('no matching cluster');
        await expect(page.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    }
});

test('links keep their native keyboard handling', async ({page}) => {
    await new PageModel(page).goto();
    const link = page.getByRole('link', {name: 'Alpha', exact: true});
    await link.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await link.press('Enter');
    await expect(page).toHaveURL(/clusterName=alpha/);
});

for (const horizontalOffset of [0, 120]) {
    test(`first Down preserves horizontal offset ${horizontalOffset} and selects the second row`, async ({
        page,
    }) => {
        await page.setViewportSize({width: 1000, height: 700});
        await new PageModel(page).goto();
        const search = page.locator('.ydb-clusters input').first();
        const firstLink = page.getByRole('link', {name: 'Alpha', exact: true});
        await expect(firstLink).toBeVisible();
        await search.focus();
        const before = await firstLink.evaluate((link, left) => {
            const offsets = [];
            for (let element: Element | null = link; element; element = element.parentElement) {
                if (
                    element.scrollWidth > element.clientWidth &&
                    ['auto', 'scroll'].includes(getComputedStyle(element).overflowX)
                ) {
                    element.scrollLeft = left;
                }
                offsets.push(element.scrollLeft);
            }
            return {x: link.getBoundingClientRect().x, offsets};
        }, horizontalOffset);
        expect(before.offsets).toContain(horizontalOffset);
        await page.keyboard.press('ArrowDown');
        await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Bravo');
        await expect
            .poll(() =>
                firstLink.evaluate((link) => {
                    const offsets = [];
                    for (
                        let element: Element | null = link;
                        element;
                        element = element.parentElement
                    ) {
                        offsets.push(element.scrollLeft);
                    }
                    return {x: link.getBoundingClientRect().x, offsets};
                }),
            )
            .toEqual(before);
    });
}

test('vertical keyboard scrolling keeps the selected row clear of sticky headers', async ({
    page,
}) => {
    const manyClusters = Array.from({length: 40}, (_, index) => ({
        name: `cluster-${String(index).padStart(2, '0')}`,
        title: `Cluster ${String(index).padStart(2, '0')}`,
    }));
    await page.route('**/meta/**', (route) =>
        route.fulfill({
            json: new URL(route.request().url()).pathname.endsWith('/clusters')
                ? {clusters: manyClusters}
                : {},
        }),
    );
    await page.setViewportSize({width: 1000, height: 500});
    await new PageModel(page).goto();
    await expect(page.getByRole('link', {name: 'Cluster 00', exact: true})).toBeVisible();
    const target = page.getByRole('link', {name: 'Cluster 15', exact: true});
    await expect(target).not.toBeInViewport();
    const search = page.locator('.ydb-clusters input').first();
    await search.focus();
    for (let index = 0; index < 15; index++) {
        await page.keyboard.press('ArrowDown');
    }
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Cluster 15');
    await expect(target).toBeInViewport();
    for (let index = 14; index >= 0; index--) {
        await page.keyboard.press('ArrowUp');
        const selected = page.locator('.ydb-keyboard-focused-row');
        await expect(selected).toContainText(`Cluster ${String(index).padStart(2, '0')}`);
        await expect
            .poll(() =>
                selected.evaluate((row) => {
                    const rect = row.getBoundingClientRect();
                    const x = Math.max(0, rect.left) + 30;
                    return [rect.top + 2, rect.bottom - 2].every((y) =>
                        row.contains(document.elementFromPoint(x, y)),
                    );
                }),
            )
            .toBe(true);
    }
});

test('first row stays highlighted after returning with arrows under a stationary pointer', async ({
    page,
}) => {
    await new PageModel(page).goto();
    const firstRow = page
        .locator('.ydb-clusters tbody tr')
        .filter({has: page.getByRole('link', {name: 'Alpha', exact: true})});
    await expect(firstRow).toBeVisible();
    await expect(page.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await firstRow.hover();
    await page.locator('.ydb-clusters input').first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Bravo');
    const selectedBackground = await page
        .locator('.ydb-keyboard-focused-row')
        .evaluate((row) => getComputedStyle(row).backgroundColor);
    expect(selectedBackground).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.ydb-keyboard-focused-row')).toContainText('Alpha');
    await expect(firstRow).toHaveCSS('background-color', selectedBackground);
});
