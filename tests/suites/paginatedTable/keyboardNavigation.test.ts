import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';
import {backend} from '../../utils/constants';

import {generateNodeMock} from './mocks';

const focusedRow = '.ydb-keyboard-focused-row';

async function mockList(page: Page, kind: 'nodes' | 'groups') {
    const nodes = await generateNodeMock({offset: 0, limit: 120});
    const groups = nodes.map((_, index) => ({
        GroupId: String(9000 + index),
        PoolName: 'keyboard-test',
        Kind: 'ssd',
        ErasureSpecies: 'none',
    }));
    await page.route(
        kind === 'nodes' ? '**/viewer/json/nodes?*' : '**/storage/groups?*',
        async (route) => {
            const params = new URL(route.request().url()).searchParams;
            if (params.get('group')) {
                await route.fulfill({
                    json:
                        kind === 'nodes'
                            ? {
                                  TotalNodes: 4,
                                  FoundNodes: 4,
                                  NodeGroups: [
                                      {GroupName: 'first', NodeCount: 2},
                                      {GroupName: 'second', NodeCount: 2},
                                  ],
                              }
                            : {
                                  TotalGroups: 4,
                                  FoundGroups: 4,
                                  StorageGroupGroups: [
                                      {GroupName: 'first', GroupCount: 2},
                                      {GroupName: 'second', GroupCount: 2},
                                  ],
                              },
                });
                return;
            }
            const filter = params.get('filter') || '';
            let rows =
                kind === 'nodes'
                    ? nodes.filter((node) => node.SystemState.Host.includes(filter))
                    : groups.filter((group) => group.GroupId.includes(filter));
            if (params.get('filter_group')) {
                const start = params.get('filter_group') === 'first' ? 0 : 2;
                rows = rows.slice(start, start + 2);
            }
            if (params.get('sort')?.startsWith('-')) {
                rows = rows.toReversed();
            }
            const offset = Number(params.get('offset') || 0);
            const limit = Number(params.get('limit') || 20);
            await route.fulfill({
                json:
                    kind === 'nodes'
                        ? {
                              Nodes: rows.slice(offset, offset + limit),
                              TotalNodes: 120,
                              FoundNodes: rows.length,
                          }
                        : {
                              StorageGroups: rows.slice(offset, offset + limit),
                              TotalGroups: 120,
                              FoundGroups: rows.length,
                          },
            });
        },
    );
}

for (const kind of ['nodes', 'groups'] as const) {
    const path = kind === 'nodes' ? 'cluster/nodes' : 'cluster/storage';
    const rowName = (index: number) =>
        kind === 'nodes' ? `host-${index}.test` : String(9000 + index);
    const primaryLink =
        kind === 'nodes'
            ? 'a.ydb-entity-name__name[href*="/node/"]'
            : 'a.ydb-entity-name__name[href*="/storageGroup?"]';

    test(`${kind}: arrows cross virtual chunks and Enter follows the selected entity link`, async ({
        page,
    }) => {
        await mockList(page, kind);
        await page.setViewportSize({width: 1100, height: 600});
        await new PageModel(page, path).goto({clusterName: 'keyboard-test'});
        const table = page.locator('[data-keyboard-navigation]');
        await expect(table.locator(primaryLink).first()).toHaveText(rowName(0));
        const search = page.locator('input').first();
        await search.focus();
        for (let index = 1; index <= 85; index++) {
            await page.keyboard.press('ArrowDown');
            await expect(page.locator(focusedRow)).toContainText(rowName(index));
        }
        const lastRow = page.locator(focusedRow);
        await expect(lastRow.locator(primaryLink)).toHaveText(rowName(85));
        for (let index = 84; index >= 0; index--) {
            await page.keyboard.press('ArrowUp');
            const row = page.locator(focusedRow);
            await expect(row).toContainText(rowName(index));
            await expect
                .poll(() =>
                    row.evaluate((element) => {
                        const rect = element.getBoundingClientRect();
                        return [rect.top + 2, rect.bottom - 2].every((y) =>
                            element.contains(
                                document.elementFromPoint(Math.max(0, rect.left) + 20, y),
                            ),
                        );
                    }),
                )
                .toBe(true);
        }
        const href = await page.locator(focusedRow).locator(primaryLink).getAttribute('href');
        expect(href).toBeTruthy();
        await page.keyboard.press('Enter');
        const destination = new URL(href || '', page.url());
        await expect(page).toHaveURL(
            (url) =>
                url.pathname === destination.pathname &&
                Array.from(destination.searchParams).every(
                    ([key, value]) => url.searchParams.get(key) === value,
                ),
        );
        await page.goBack();
        await expect(table.locator(primaryLink).first()).toHaveText(rowName(0));
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
    });

    test(`${kind}: arrows move between expanded groups`, async ({page}) => {
        await mockList(page, kind);
        await new PageModel(page, path).goto(
            kind === 'nodes' ? {nodesGroupBy: 'DC'} : {storageGroupsGroupBy: 'PoolName'},
        );
        await page.getByRole('button', {name: /^first/}).click();
        await page.getByRole('button', {name: /^second/}).click();
        await expect(page.locator('[data-keyboard-navigation]')).toHaveCount(2);
        await expect(page.getByRole('link', {name: rowName(3), exact: true})).toBeVisible();
        await page.locator('input').first().focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toHaveCount(1);
        await expect(page.locator(focusedRow)).toContainText(rowName(2));
        await page.keyboard.press('ArrowUp');
        await expect(page.locator(focusedRow)).toHaveCount(1);
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
    });

    test(`${kind}: sorting resets selection and links keep native keys`, async ({page}) => {
        await mockList(page, kind);
        await new PageModel(page, path).goto();
        const table = page.locator('[data-keyboard-navigation]');
        await expect(table.locator(primaryLink).first()).toHaveText(rowName(0));
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
        await table.locator('thead th').first().click();
        await expect(page.locator(focusedRow)).toHaveCount(0);
        const secondLink = table.locator(primaryLink).nth(1);
        const expectedName = await secondLink.textContent();
        await page.locator('input').first().focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow).locator(primaryLink)).toHaveText(expectedName || '');
        const selectedName = await page.locator(focusedRow).textContent();
        await secondLink.focus();
        await page.keyboard.press('ArrowUp');
        await expect(page.locator(focusedRow)).toHaveText(selectedName || '');
    });

    test(`${kind}: arrows preserve horizontal scrolling`, async ({page}) => {
        await mockList(page, kind);
        await page.setViewportSize({width: 700, height: 600});
        await new PageModel(page, path).goto();
        const table = page.locator('[data-keyboard-navigation]');
        await expect(table.locator(primaryLink).first()).toHaveText(rowName(0));
        await page.locator('input').first().focus();
        const before = await table.evaluate((element) => {
            const offsets = [];
            for (let parent = element.parentElement; parent; parent = parent.parentElement) {
                if (
                    parent.scrollWidth > parent.clientWidth &&
                    /auto|scroll/.test(getComputedStyle(parent).overflowX)
                ) {
                    parent.scrollLeft = 80;
                }
                offsets.push(parent.scrollLeft);
            }
            return offsets;
        });
        expect(before).toContain(80);
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
        await page.keyboard.press('ArrowUp');
        await expect(page.locator(focusedRow)).toContainText(rowName(0));
        const after = await table.evaluate((element) => {
            const offsets = [];
            for (let parent = element.parentElement; parent; parent = parent.parentElement) {
                offsets.push(parent.scrollLeft);
            }
            return offsets;
        });
        expect(after).toEqual(before);
    });

    test(`${kind}: Enter preserves multi-cluster runtime identity`, async ({page}) => {
        await page.addInitScript(() => {
            Object.defineProperty(window, 'web_version', {get: () => 'true', set: () => {}});
            Object.defineProperty(window, 'multi_cluster_mode', {get: () => 'true', set: () => {}});
        });
        await mockList(page, kind);
        await new PageModel(page, path).goto({backend, clusterName: 'keyboard-test'});
        const table = page.locator('[data-keyboard-navigation]');
        await expect(table.locator(primaryLink).first()).toHaveText(rowName(0));
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(
            (url) =>
                url.pathname.startsWith(kind === 'nodes' ? '/node/2/' : '/storageGroup') &&
                url.searchParams.get('clusterName') === 'keyboard-test' &&
                url.searchParams.get('backend') === backend &&
                (kind === 'nodes' || url.searchParams.get('groupId') === '9001'),
        );
    });

    test(`${kind}: mouse hover hides keyboard selection until another arrow is pressed`, async ({
        page,
    }) => {
        await mockList(page, kind);
        await new PageModel(page, path).goto();
        const firstLink = page.locator('[data-keyboard-navigation]').locator(primaryLink).first();
        await expect(firstLink).toHaveText(rowName(0));
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
        await firstLink.hover();
        await expect(page.locator(focusedRow)).toHaveCount(0);
        await page.mouse.move(0, 0);
        await expect(page.locator(focusedRow)).toHaveCount(0);
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(2));
        await page.keyboard.press('ArrowUp');
        await expect(page.locator(focusedRow)).toContainText(rowName(1));
    });

    test(`${kind}: filtering resets selection and empty lists preserve the caret`, async ({
        page,
    }) => {
        await mockList(page, kind);
        await new PageModel(page, path).goto({clusterName: 'keyboard-test'});
        const table = page.locator('[data-keyboard-navigation]');
        await expect(table.locator(primaryLink).first()).toHaveText(rowName(0));
        const search = page.locator('input').first();
        await search.fill(rowName(119));
        await expect(table.locator('[data-row-index]')).toHaveCount(1);
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(focusedRow)).toContainText(rowName(119));
        await page.keyboard.press('ArrowUp');
        await expect(page.locator(focusedRow)).toContainText(rowName(119));
        await search.fill('no match');
        await expect(table.locator('[data-row-index]')).toHaveCount(0);
        await expect(page.locator(focusedRow)).toHaveCount(0);
        await search.evaluate((input: HTMLInputElement) => input.setSelectionRange(3, 3));
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowDown');
        expect(await search.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(3);
    });
}

test('storage nodes use the same keyboard navigation', async ({page}) => {
    await mockList(page, 'nodes');
    await new PageModel(page, 'cluster/storage').goto({
        type: 'nodes',
        clusterName: 'keyboard-test',
    });
    const table = page.locator('[data-keyboard-navigation]');
    await expect(table.getByRole('link', {name: 'host-0.test', exact: true})).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(focusedRow)).toContainText('host-1.test');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL((url) => url.pathname.startsWith('/node/2/'));
});
