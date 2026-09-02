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
