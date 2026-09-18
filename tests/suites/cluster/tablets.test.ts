import type {Page} from '@playwright/test';
import {expect, test} from '@playwright/test';

async function setupTabletsMocks(page: Page) {
    await page.route('**/viewer/json/whoami**', async (route) => {
        await route.fulfill({
            json: {
                UserSID: 'test-user',
                IsViewerAllowed: true,
                IsMonitoringAllowed: true,
                IsAdministrationAllowed: true,
            },
        });
    });
    await page.route('**/viewer/capabilities**', async (route) => {
        await route.fulfill({
            json: {
                Database: '/local',
                Settings: {Cluster: {BridgeModeEnabled: false}},
                Capabilities: {'/viewer/cluster': 5},
            },
        });
    });
    await page.route('**/viewer/json/nodelist**', async (route) => {
        await route.fulfill({json: []});
    });
    await page.route('**/viewer/json/cluster**', async (route) => {
        await route.fulfill({
            json: {
                Version: 6,
                Domain: '/local',
                Overall: 'Green',
                SystemTablets: [
                    {TabletId: '101', Type: 'DataShard', State: 'Active'},
                    {TabletId: '102', Type: 'Hive', State: 'Active'},
                    {TabletId: '210', Type: 'ColumnShard', State: 'Active'},
                ],
            },
        });
    });
}

async function setupDatabaseTabletsMocks(page: Page) {
    await page.route('**/viewer/json/whoami**', async (route) => {
        await route.fulfill({
            json: {
                UserSID: 'test-user',
                IsDatabaseAllowed: true,
                IsViewerAllowed: true,
                IsMonitoringAllowed: true,
                IsAdministrationAllowed: true,
            },
        });
    });
    await page.route('**/viewer/capabilities**', async (route) => {
        await route.fulfill({json: {Database: '/local', Capabilities: {}, Settings: {}}});
    });
    await page.route('**/viewer/json/nodelist**', async (route) => {
        await route.fulfill({json: []});
    });
    await page.route('**/viewer/json/tenantinfo**', async (route) => {
        await route.fulfill({
            json: {TenantInfo: [{Name: '/local', Type: 'Domain', Overall: 'Green'}]},
        });
    });
    await page.route('**/viewer/json/describe**', async (route) => {
        await route.fulfill({
            json: {
                Path: '/local',
                PathDescription: {Self: {Name: 'local', PathType: 'EPathTypeSubDomain'}},
            },
        });
    });

    const tabletInfoRequestUrls: string[] = [];
    await page.route('**/viewer/json/tabletinfo**', async (route) => {
        tabletInfoRequestUrls.push(route.request().url());
        await route.fulfill({
            json: {
                TabletStateInfo: [{TabletId: '101', Type: 'DataShard', State: 'Active'}],
            },
        });
    });

    return tabletInfoRequestUrls;
}

test('filters tablets by multiple types and tablet ID', async ({page}) => {
    await setupTabletsMocks(page);
    await page.goto('cluster/tablets');

    const table = page.locator('.ydb-resizeable-data-table');
    const rows = table.locator('tr.data-table__row');
    await expect(rows).toHaveCount(3);

    const typeFilter = page.getByTestId('tablets-type-filter');
    await expect(typeFilter).toHaveRole('combobox');
    await expect(typeFilter).toHaveAccessibleName('Type');
    await typeFilter.click();
    await page.locator('.g-select-list__option').getByText('DataShard', {exact: true}).click();
    await expect(rows).toHaveCount(1);
    await expect(table.getByText('101', {exact: true})).toBeVisible();

    await page.locator('.g-select-list__option').getByText('Hive', {exact: true}).click();
    await expect(rows).toHaveCount(2);
    await expect(page).toHaveURL((url) => url.searchParams.get('tabletTypes') === 'DataShard,Hive');

    await page.getByPlaceholder('Tablet ID').fill('102');
    await expect(rows).toHaveCount(1);
    await expect(table.getByText('102', {exact: true})).toBeVisible();
    await expect(table.getByText('101', {exact: true})).toHaveCount(0);
});

test('keeps the type filter local during database-wide tablet ID search', async ({page}) => {
    const tabletInfoRequestUrls = await setupDatabaseTabletsMocks(page);
    await page.goto(
        'database?schema=/local&database=/local&databasePage=database&diagnosticsTab=tablets&tabletsSearch=101&tabletTypes=Hive',
    );

    await expect
        .poll(() => {
            return tabletInfoRequestUrls.find((requestUrl) => {
                return new URL(requestUrl).searchParams.get('filter') === '(TabletId=101)';
            });
        })
        .toBeTruthy();

    const tabletInfoRequest = new URL(
        tabletInfoRequestUrls.find((requestUrl) => {
            return new URL(requestUrl).searchParams.get('filter') === '(TabletId=101)';
        }) ?? '',
    );
    expect(tabletInfoRequest.searchParams.get('path')).toBeNull();
    expect(tabletInfoRequest.searchParams.get('filter')).not.toContain('Type');

    const table = page.locator('.ydb-resizeable-data-table');
    await expect(table.getByText('No tablets match the selected filters')).toBeVisible();
    await expect(table.getByText('101', {exact: true})).toHaveCount(0);
});

test('arrows select tablets and Enter preserves the selected tablet link', async ({page}) => {
    await page.addInitScript(() => {
        Object.defineProperty(window, 'web_version', {get: () => 'true', set: () => {}});
        Object.defineProperty(window, 'multi_cluster_mode', {get: () => 'true', set: () => {}});
    });
    await setupTabletsMocks(page);
    await page.goto('cluster/tablets?clusterName=keyboard-test');
    const table = page.locator('.ydb-resizeable-data-table');
    await expect(table.getByRole('link', {name: '101', exact: true})).toBeVisible();
    await expect(table.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await page.getByPlaceholder('Tablet ID').press('ArrowDown');
    const selected = table.locator('.ydb-keyboard-focused-row');
    await expect(selected.getByRole('link', {name: '102', exact: true})).toBeVisible();
    const href = await selected.getByRole('link', {name: '102', exact: true}).getAttribute('href');
    expect(href).toBeTruthy();
    const destination = new URL(href || '', page.url());
    await page.getByPlaceholder('Tablet ID').press('Enter');
    await expect(page).toHaveURL(
        (url) =>
            url.pathname === destination.pathname &&
            Array.from(destination.searchParams).every(
                ([key, value]) => url.searchParams.get(key) === value,
            ),
    );
    expect(new URL(page.url()).searchParams.get('clusterName')).toBe('keyboard-test');
});

test('tablet sorting and filtering reset keyboard selection', async ({page}) => {
    await setupTabletsMocks(page);
    await page.goto('cluster/tablets');
    const table = page.locator('.ydb-resizeable-data-table');
    const search = page.getByPlaceholder('Tablet ID');
    await expect(table.getByRole('link', {name: '101', exact: true})).toBeVisible();
    await search.press('ArrowDown');
    await expect(table.locator('.ydb-keyboard-focused-row')).toContainText('102');
    await table
        .locator('thead th')
        .filter({hasText: /^Tablet$/})
        .first()
        .click();
    await expect(table.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await search.press('ArrowUp');
    await expect(table.locator('tbody tr').first()).toHaveClass(/ydb-keyboard-focused-row/);
    await search.fill('210');
    await expect(table.locator('tbody tr')).toHaveCount(1);
    await expect(table.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await search.press('ArrowDown');
    await expect(table.locator('.ydb-keyboard-focused-row')).toContainText('210');
    await search.fill('999999');
    await expect(table.locator('.ydb-keyboard-focused-row')).toHaveCount(0);
    await search.press('Enter');
    await expect(page).toHaveURL(/cluster\/tablets/);
});

test('keyboard tablet navigation keeps follower identity', async ({page}) => {
    await setupTabletsMocks(page);
    await page.route('**/viewer/json/cluster**', (route) =>
        route.fulfill({
            json: {
                Version: 6,
                Domain: '/local',
                Overall: 'Green',
                SystemTablets: [
                    {
                        TabletId: '101',
                        Type: 'DataShard',
                        State: 'Active',
                        Leader: false,
                        FollowerId: 3,
                    },
                ],
            },
        }),
    );
    await page.goto('cluster/tablets?clusterName=keyboard-test');
    await expect(page.getByRole('link', {name: '101.3', exact: true})).toBeVisible();
    await page.getByPlaceholder('Tablet ID').press('Enter');
    await expect(page).toHaveURL(
        (url) => url.pathname.endsWith('/tablet/101') && url.searchParams.get('followerId') === '3',
    );
});

test('tablet arrows preserve uptime and reach rows beyond the initial viewport', async ({page}) => {
    const now = new Date();
    await page.clock.setFixedTime(now);
    await setupTabletsMocks(page);
    await page.route('**/viewer/json/cluster**', (route) =>
        route.fulfill({
            json: {
                Version: 6,
                Domain: '/local',
                Overall: 'Green',
                SystemTablets: Array.from({length: 100}, (_, index) => ({
                    TabletId: String(10000 + index),
                    Type: 'DataShard',
                    State: 'Active',
                    ChangeTime: String(now.getTime() - 14_400_000),
                })),
            },
        }),
    );
    await page.goto('cluster/tablets');
    const table = page.locator('.ydb-resizeable-data-table');
    const rows = table.locator('tbody tr.data-table__row');
    await expect(table.getByRole('link', {name: '10000', exact: true})).toBeVisible();
    const headers = await table.locator('thead').first().locator('th').allTextContents();
    const uptimeIndex = headers.findIndex((header) => header.includes('Uptime'));
    expect(uptimeIndex).toBeGreaterThanOrEqual(0);
    const uptime = rows.first().locator('td').nth(uptimeIndex);
    const initialUptime = await uptime.innerText();
    await page.clock.setFixedTime(new Date(now.getTime() + 120_000));
    const search = page.getByPlaceholder('Tablet ID');
    await search.press('ArrowDown');
    await expect(table.locator('.ydb-keyboard-focused-row')).toContainText('10001');
    await search.press('ArrowUp');
    await expect(table.locator('.ydb-keyboard-focused-row')).toContainText('10000');
    await expect(uptime).toHaveText(initialUptime);
    for (let index = 1; index <= 60; index++) {
        await search.press('ArrowDown');
        await expect(table.locator('.ydb-keyboard-focused-row')).toContainText(
            String(10000 + index),
        );
    }
    await expect(table.getByRole('link', {name: '10060', exact: true})).toBeInViewport();
});
