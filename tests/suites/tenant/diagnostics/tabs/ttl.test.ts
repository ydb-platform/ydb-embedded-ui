import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TColumnDataLifeCycle} from '../../../../../src/types/api/schema';
import {database} from '../../../../utils/constants';
import {TenantPage} from '../../TenantPage';
import {Diagnostics} from '../Diagnostics';

const TABLE_NAME = 'ttl_column_table';
const TABLE_PATH = `${database}/${TABLE_NAME}`;

async function setupTtlMocks(page: Page, ttl: TColumnDataLifeCycle) {
    const unexpectedRequests: string[] = [];
    await page.route('**/viewer/**', async (route) => {
        const url = new URL(route.request().url());
        switch (url.pathname) {
            case '/viewer/json/whoami':
                await route.fulfill({
                    json: {
                        UserSID: 'test-user',
                        IsDatabaseAllowed: true,
                        IsViewerAllowed: true,
                        IsMonitoringAllowed: true,
                    },
                });
                return;
            case '/viewer/capabilities':
                await route.fulfill({json: {Database: database, Capabilities: {}, Settings: {}}});
                return;
            case '/viewer/json/nodelist':
                await route.fulfill({json: []});
                return;
            case '/viewer/json/tenantinfo':
                await route.fulfill({
                    json: {TenantInfo: [{Name: database, Type: 'Serverless', Overall: 'Green'}]},
                });
                return;
            case '/viewer/json/describe': {
                const isTable = url.searchParams.get('path') === TABLE_PATH;
                await route.fulfill({
                    json: {
                        Status: 'StatusSuccess',
                        Path: isTable ? TABLE_PATH : database,
                        PathDescription: {
                            Self: {
                                Name: isTable ? TABLE_NAME : 'local',
                                PathType: isTable ? 'EPathTypeColumnTable' : 'EPathTypeSubDomain',
                            },
                            ...(isTable
                                ? {ColumnTableDescription: {Name: TABLE_NAME, TtlSettings: ttl}}
                                : {}),
                        },
                    },
                });
                return;
            }
            default:
                unexpectedRequests.push(`${route.request().method()} ${url.pathname}`);
                await route.abort();
        }
    });
    return unexpectedRequests;
}

test('shows tiered TTL from describe response in column table Info', async ({page}) => {
    const unexpectedRequests = await setupTtlMocks(page, {
        Enabled: {
            ColumnName: 'created_at',
            ExpireAfterSeconds: 60,
            Tiers: [
                {ApplyAfterSeconds: 3600, EvictToExternalStorage: {Storage: '/local/warm'}},
                {ApplyAfterSeconds: 86400, EvictToExternalStorage: {Storage: '/local/cold'}},
                {ApplyAfterSeconds: 604800, Delete: {}},
            ],
        },
    });

    const tenantPage = new TenantPage(page);
    await tenantPage.goto({
        schema: TABLE_PATH,
        database,
        databasePage: 'diagnostics',
        diagnosticsTab: 'overview',
    });
    await tenantPage.isDiagnosticsVisible();

    const info = new Diagnostics(page).getSchemaObjectInfo();
    await expect(info.getByText(TABLE_PATH, {exact: true})).toBeVisible();
    await expect(info.getByText('TTL for rows', {exact: true})).toBeVisible();
    const ttl = info.getByTestId('table-ttl');
    await expect(ttl).toBeVisible();
    expect((await ttl.innerText()).replace(/\u00a0/g, ' ').split('\n')).toEqual([
        "column: 'created_at'",
        "evict to: '/local/warm', after: 1 h",
        "evict to: '/local/cold', after: 1 d",
        'delete after: 7 d',
    ]);
    expect(unexpectedRequests).toEqual([]);
});
