import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import type {TTenant} from '../../src/types/api/tenant';

interface MockOptions {
    hasCp?: boolean;
    hasOperationsCapability?: boolean;
    distinctCpIds?: boolean;
    cpStatus?: number;
    nextPageError?: {active: boolean};
}

async function mockApi(
    page: Page,
    {hasCp = true, hasOperationsCapability = true, distinctCpIds}: MockOptions,
) {
    await page.addInitScript(() => localStorage.setItem('enableTenantNavigationV2', 'true'));
    await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        const {pathname} = url;
        if (!/\/(?:meta|viewer|scheme|capabilities)(?:\/|$)/.test(pathname)) {
            await route.continue();
            return;
        }
        const scope =
            distinctCpIds && new URL(page.url()).pathname.startsWith('/env-b/') ? '-b' : '';
        let body: unknown = {};
        if (pathname.endsWith('/meta/databases') || pathname.endsWith('/meta/cp_databases')) {
            body = {
                databases: [
                    {
                        Id: `cp-id${scope}`,
                        Name: url.searchParams.get('database') || '/db',
                        Type: 'Dedicated',
                        NodeIds: [1],
                        Overall: 'Green',
                        ...(hasCp
                            ? {
                                  ControlPlane: {
                                      id: `cp-id${scope}`,
                                      name: 'test-database',
                                      folder_id: `folder${scope}`,
                                      endpoint: 'grpcs://example.invalid:2135',
                                      status: 'RUNNING',
                                  },
                              }
                            : {}),
                    },
                ],
            };
        } else if (pathname.endsWith('/whoami')) {
            body = {UserSID: 'test', IsViewerAllowed: true, IsMonitoringAllowed: true};
        } else if (pathname.endsWith('/capabilities')) {
            body = {
                Capabilities:
                    pathname.includes('/viewer/') || !hasOperationsCapability
                        ? {}
                        : {'/meta/list_operations': 1, '/meta/list_resource_presets': 1},
                Settings: {Security: {UseLoginProvider: true}},
            };
        } else if (pathname.endsWith('/meta/db_clusters')) {
            body = {
                clusters: [{name: url.searchParams.get('name'), settings: {use_meta_proxy: true}}],
            };
        } else if (pathname.includes('/describe')) {
            body = {PathDescription: {Self: {PathType: 'Dir', Name: 'db'}}};
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(body),
        });
    });
}

type OperationCall = {path: string; body: Record<string, unknown>};

async function mockOperations(page: Page, options: MockOptions = {}) {
    const {cpStatus = 200, nextPageError} = options;
    await mockApi(page, options);
    const calls: OperationCall[] = [];
    await page.route(/\/(?:operation\/list|meta\/list_operations)(?:\?|$)/, async (route) => {
        const path = new URL(route.request().url()).pathname;
        const body = route.request().postDataJSON() ?? {};
        calls.push({path, body});
        let data: unknown = {};
        let status = 200;
        if (path.endsWith('/operation/list')) {
            data = {
                operations: [
                    {
                        id: 'database-error',
                        ready: true,
                        status: 'GENERIC_ERROR',
                        issues: [
                            {
                                message: 'Export failed',
                                issues: [{message: 'Nested storage failure'}],
                            },
                        ],
                        create_time: {seconds: '1794477600'},
                        end_time: {seconds: '1794477660'},
                        created_by: 'db-user',
                    },
                    {id: 'database-before', ready: true, status: 'SUCCESS'},
                ],
                next_page_token: '0',
            };
        } else if (path.endsWith('/meta/list_operations')) {
            status = cpStatus;
            const scope = new URL(page.url()).pathname.startsWith('/env-b/') ? 'b' : 'a';
            data = body.page_token
                ? {
                      operations: [
                          {
                              id: `cp-success-${scope}`,
                              created_by: 'cp-user',
                              description: 'Create database',
                              done: true,
                              created_at: {seconds: '1794477600'},
                              modified_at: {seconds: '1794477660'},
                          },
                      ],
                  }
                : {
                      operations: [
                          {
                              id: `cp-error-${scope}`,
                              description: 'Update database',
                              done: true,
                              error: {code: 13, message: 'Cannot allocate database resources'},
                              created_by: 'cp-user',
                              created_at: {seconds: '1794477600'},
                              modified_at: {seconds: '1794477660'},
                          },
                          ...Array.from({length: Number(body.page_size) - 1}, (_, index) => ({
                              id: `cp-pending-${scope}-${index}`,
                              description: 'Backup database',
                              created_by: 'cp-user',
                              created_at: {seconds: String(1794477540 - index * 60)},
                          })),
                      ],
                      next_page_token: 'next-page',
                  };
        }
        if (path.endsWith('/meta/list_operations') && body.page_token && nextPageError?.active) {
            status = 503;
            data = {message: 'Temporary CP failure'};
        }
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(data),
        });
    });
    return calls;
}

test.describe('Operations', () => {
    const path =
        '/database?database=/db&clusterName=scope-a&databasePage=database&diagnosticsTab=operations';

    test('shows CP columns, scroll pagination, custom author rendering and error details', async ({
        page,
    }) => {
        const calls = await mockOperations(page);
        await page.goto(`${path}&resolveUsers=true&operationSource=database`);
        await expect(page.getByText('database-error', {exact: true})).toBeVisible({timeout: 20000});
        await page.getByRole('button', {name: 'Show details for operation database-error'}).click();
        await expect(page.getByRole('dialog').locator('pre')).toHaveText(
            'Export failed\n  Nested storage failure',
        );
        await page.getByRole('button', {name: 'Close', exact: true}).click();
        await page.getByRole('radio', {name: 'Control plane', exact: true}).click();
        const errorRow = page.getByRole('row').filter({hasText: 'cp-error-a'});
        await expect(errorRow).toBeVisible();
        await expect(errorRow).toContainText('Update database');
        await expect(errorRow).toContainText('user@example.test');
        await expect(errorRow.getByRole('link', {name: 'user@example.test'})).toHaveAttribute(
            'href',
            '/accounts/cp-user',
        );
        const idCell = errorRow.getByRole('cell').first();
        const copyId = idCell.getByRole('button', {name: 'Copy operation cp-error-a ID'});
        await expect(copyId).toHaveCSS('opacity', '0');
        await idCell.hover();
        await expect(copyId).toHaveCSS('opacity', '1');
        await errorRow.getByRole('cell').nth(1).hover();
        await expect(copyId).toHaveCSS('opacity', '0');
        await copyId.focus();
        await expect(copyId).toHaveCSS('opacity', '1');

        // A custom author renderer must keep body cells aligned with sticky headers.
        const headers = page.getByRole('table').first().getByRole('columnheader');
        const cells = errorRow.getByRole('cell');
        for (let index = 0; index < 6; index++) {
            const header = await headers.nth(index).boundingBox();
            const cell = await cells.nth(index).boundingBox();
            expect(header?.x).toBeCloseTo(cell?.x ?? 0, 0);
        }

        await expect(page.getByText('cp-success-a', {exact: true})).toHaveCount(0);
        await expect(page.getByRole('table').first().getByRole('columnheader')).toHaveText([
            'ID',
            'Status',
            'User',
            'Operation',
            'Started at',
            'Updated at',
        ]);
        await expect(errorRow.getByRole('cell').nth(5)).not.toHaveText('—');
        await page.getByRole('button', {name: 'Show details for operation cp-error-a'}).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog').locator('pre')).toHaveText(
            'Cannot allocate database resources',
        );
        await expect(
            page.getByRole('dialog').getByRole('button', {name: 'Copy', exact: true}),
        ).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('button', {name: 'Load more', exact: true})).toHaveCount(0);
        const scrollContainer = page.locator('.kv-tenant-diagnostics__page-wrapper');
        await scrollContainer.evaluate((element) => element.scrollTo({top: element.scrollHeight}));
        await expect
            .poll(() => calls.filter((call) => call.path.endsWith('/meta/list_operations')).length)
            .toBe(2);
        await scrollContainer.evaluate((element) => element.scrollTo({top: 0}));
        await expect(page.getByText('cp-success-a', {exact: true})).toBeVisible();
        await expect(page.getByText('cp-error-a', {exact: true})).toBeVisible();
        await expect(page.getByRole('row').filter({hasText: 'cp-success-a'})).toContainText(
            'user@example.test',
        );
        await expect(page.getByRole('button', {name: 'Load more', exact: true})).toHaveCount(0);
        await page.getByPlaceholder('Filter by ID').fill('cp-success');
        await expect(page.getByText('cp-error-a', {exact: true})).toHaveCount(0);
        await expect(page.getByText('cp-success-a', {exact: true})).toBeVisible();
        await page.getByRole('columnheader', {name: 'ID', exact: true}).first().click();
        await page.getByRole('combobox', {name: 'Filter operations by status'}).click();
        await page.getByRole('option', {name: 'Error', exact: true}).click();
        await expect(page.getByText('No matching operations', {exact: true})).toBeVisible();
        await page.getByPlaceholder('Filter by ID').fill('');
        await expect(page.getByText('cp-error-a', {exact: true})).toBeVisible();
        await expect(page.getByText('cp-success-a', {exact: true})).toHaveCount(0);
        await page.getByRole('radio', {name: 'Database', exact: true}).click();
        await expect(page.getByText('database-error', {exact: true})).toBeVisible();
        await expect(
            page.getByRole('columnheader', {name: 'Duration', exact: true}).first(),
        ).toBeVisible();
        await expect(
            page
                .getByRole('row')
                .filter({hasText: /database-error|database-before/})
                .first()
                .getByRole('cell')
                .first(),
        ).toHaveText('database-error');
    });

    test('legacy kind and search links keep Database mode and their filters', async ({page}) => {
        const calls = await mockOperations(page);
        for (const query of [
            'kind=export',
            'search=database-error',
            'kind=export&search=database-error',
        ]) {
            await page.goto(`${path}&${query}`);
            await expect(page.getByRole('radio', {name: 'Database', exact: true})).toBeChecked();
            await expect(page.getByText('database-error', {exact: true})).toBeVisible();
            await expect(page.getByPlaceholder('Filter by ID')).toHaveValue(
                query.includes('search=') ? 'database-error' : '',
            );
            if (query.includes('kind=')) {
                await expect(page.getByRole('combobox').last()).toHaveText('Export');
            }
            await expect(page.getByText('database-before', {exact: true})).toHaveCount(
                query.includes('search=') ? 0 : 1,
            );
        }
        expect(calls.filter((call) => call.path.endsWith('/meta/list_operations'))).toHaveLength(0);
    });

    test('explicit CP mode overrides legacy filters and preserves them when switching to Database', async ({
        page,
    }) => {
        const calls = await mockOperations(page);
        await page.goto(`${path}&kind=export&search=database-error&operationSource=control-plane`);
        await expect(page.getByRole('radio', {name: 'Control plane', exact: true})).toBeChecked();
        await expect(page.getByText('cp-error-a', {exact: true})).toBeVisible();
        await expect(page.getByPlaceholder('Filter by ID')).toHaveValue('');
        expect(calls.filter((call) => call.path.endsWith('/operation/list'))).toHaveLength(0);
        await page.getByRole('radio', {name: 'Database', exact: true}).click();
        await expect(page.getByText('database-error', {exact: true})).toBeVisible();
        await expect(page.getByPlaceholder('Filter by ID')).toHaveValue('database-error');
        await expect(page.getByRole('combobox').last()).toHaveText('Export');
        await expect(page.getByText('database-before', {exact: true})).toHaveCount(0);
    });

    test('a stale CP link falls back to Database without CP identity', async ({page}) => {
        const calls = await mockOperations(page, {hasCp: false});
        await page.goto(`${path}&operationSource=control-plane`);
        await expect(page.getByText('database-error', {exact: true})).toBeVisible({timeout: 20000});
        await expect(page.getByRole('radio', {name: 'Control plane', exact: true})).toHaveCount(0);
        expect(calls.filter((call) => call.path.endsWith('/meta/list_operations'))).toHaveLength(0);
        await expect(page).toHaveURL(/operationSource=database/);
        await page.goto(path);
        await expect(page.getByText('database-error', {exact: true})).toBeVisible();
        await expect(page.getByRole('radiogroup', {name: 'Operation source'})).toHaveCount(0);
        await expect(page.getByRole('combobox', {name: 'Filter operations by status'})).toHaveCount(
            0,
        );
        expect(calls.filter((call) => call.path.endsWith('/meta/list_operations'))).toHaveLength(0);
    });

    test('CP rows and cursors reset when environment changes with the same database id', async ({
        page,
    }) => {
        const calls = await mockOperations(page, {distinctCpIds: true});
        await page.goto(`/env-a${path}&operationSource=control-plane`);
        await expect(page.getByText('cp-error-a', {exact: true})).toBeVisible();
        await page.getByPlaceholder('Filter by ID').fill('cp-success');
        await expect(page.getByText('cp-success-a', {exact: true})).toBeVisible();
        await page.evaluate(
            (target) => window.controlPlaneTest.navigate(target),
            `/env-b${path}&operationSource=control-plane`,
        );
        await expect(page.getByText('cp-error-b', {exact: true})).toBeVisible();
        await expect(page.getByText('cp-error-a', {exact: true})).toHaveCount(0);
        const cpCalls = calls.filter((call) => call.path.endsWith('/meta/list_operations'));
        expect(cpCalls).toHaveLength(3);
        expect(cpCalls[2].body).toMatchObject({resource_id: 'cp-id-b', folder_id: 'folder-b'});
        expect(cpCalls[2].body.page_token).toBeUndefined();
    });

    test('unsupported CP list falls back to Database and canonicalizes a stale link', async ({
        page,
    }) => {
        const calls = await mockOperations(page, {hasOperationsCapability: false});
        await page.goto(`${path}&operationSource=control-plane`);
        await expect(page.getByText('database-error', {exact: true})).toBeVisible();
        await expect(page.getByRole('radiogroup', {name: 'Operation source'})).toHaveCount(0);
        await expect(page).toHaveURL(/operationSource=database/);
        expect(calls.filter((call) => call.path.endsWith('/meta/list_operations'))).toHaveLength(0);
        await page.goto(path);
        await expect(page.getByText('database-error', {exact: true})).toBeVisible();
        expect(calls.filter((call) => call.path.endsWith('/meta/list_operations'))).toHaveLength(0);
    });

    test('scroll retries a failed next page without an automatic retry loop', async ({page}) => {
        const nextPageError = {active: true};
        const calls = await mockOperations(page, {nextPageError});
        await page.goto(path);
        await expect(page.getByText('cp-error-a', {exact: true})).toBeVisible();
        const scrollContainer = page.locator('.kv-tenant-diagnostics__page-wrapper');
        await scrollContainer.evaluate((element) => element.scrollTo({top: element.scrollHeight}));
        await expect(page.getByText('Temporary CP failure', {exact: true})).toBeVisible();
        const failures = calls.filter((call) => call.body.page_token).length;
        await page.evaluate(
            () =>
                new Promise<void>((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
                ),
        );
        expect(calls.filter((call) => call.body.page_token)).toHaveLength(failures);
        nextPageError.active = false;
        await scrollContainer.evaluate((element) => element.scrollTo({top: 0}));
        await scrollContainer.evaluate((element) => element.scrollTo({top: element.scrollHeight}));
        await expect
            .poll(() => calls.filter((call) => call.body.page_token).length)
            .toBe(failures + 1);
        await scrollContainer.evaluate((element) => element.scrollTo({top: 0}));
        await expect(page.getByText('cp-success-a', {exact: true})).toBeVisible();
        await expect(page.getByText('Temporary CP failure', {exact: true})).toHaveCount(0);
        await expect(page.getByText('cp-error-a', {exact: true})).toBeVisible();
        expect(
            calls
                .filter((call) => call.body.page_token)
                .every((call) => call.body.page_token === 'next-page'),
        ).toBe(true);
    });

    test('defaults to CP when connected and keeps Database reachable after a permission failure', async ({
        page,
    }) => {
        const calls = await mockOperations(page, {cpStatus: 403});
        await page.goto(path);
        const databaseMode = page.getByRole('radio', {name: 'Database', exact: true});
        await expect(page.getByText('Access denied', {exact: true})).toBeVisible({timeout: 20000});
        await expect(databaseMode).toBeVisible();
        await expect(page.getByRole('radio', {name: 'Control plane', exact: true})).toBeChecked();
        await expect(
            page.getByRole('combobox', {name: 'Filter operations by status'}),
        ).toBeVisible();
        expect(calls.filter((call) => call.path.endsWith('/operation/list'))).toHaveLength(0);
        expect(
            calls.find((call) => call.path.endsWith('/meta/list_operations'))?.body.page_size,
        ).toBe(100);
        await expect(page.getByText('cp-error-a', {exact: true})).toHaveCount(0);
        await databaseMode.click();
        await expect(page.getByText('database-error', {exact: true})).toBeVisible();
    });
});

const databasesUrl = '/home/databases?databasesFixture';

test('My databases shows confirmed write blocks in the Database cell', async ({page}) => {
    await mockApi(page, {});
    await page.route('**/meta/databases?*', (route) =>
        route.fulfill({
            json: {
                databases: [
                    {
                        Name: '/db/quota',
                        Type: 'Dedicated',
                        Overall: 'Green',
                        DomainState: {DiskQuotaExceeded: true},
                    },
                    {
                        Name: '/db/space',
                        Type: 'Dedicated',
                        DomainState: {DiskQuotaExceeded: true, StorageSpaceExhausted: true},
                    },
                    {Name: '/db/unknown', Type: 'Dedicated'},
                    {
                        Name: '/db/available',
                        Type: 'Serverless',
                        DomainState: {DiskQuotaExceeded: false},
                    },
                ],
            },
        }),
    );
    await page.goto('/home/databases?databasesFixture');
    const badge = (name: string) =>
        page
            .getByRole('cell')
            .filter({
                has: page.getByRole('link', {name, exact: true}),
            })
            .getByText('Writes blocked', {exact: true});
    await badge('quota').hover();
    await expect(page.getByRole('tooltip')).toContainText('exceeded its storage quota');
    await badge('space').hover();
    await expect(page.getByRole('tooltip')).toContainText('running out of space');
    await expect(badge('unknown')).toHaveCount(0);
    await expect(badge('available')).toHaveCount(0);
});

test('My databases temporarily hides storage columns, including saved selections', async ({
    page,
}) => {
    await mockApi(page, {});
    await page.addInitScript(() =>
        localStorage.setItem(
            'myDatabasesTableSelectedColumns',
            JSON.stringify(['Name', 'storage', 'storageQuotaUsed', 'storageQuotaLimit']),
        ),
    );
    await page.goto(databasesUrl);
    const header = page.locator('thead').first();
    await expect(header.locator('th')).toHaveText(['Database']);
    await page.getByRole('button', {name: /^\d+\/\d+$/}).click();
    const settings = page.locator('.g-popup');
    await expect(settings.getByText('Storage groups', {exact: true})).toBeVisible();
    for (const title of ['Storage', 'Storage quota used', 'Storage quota limit']) {
        await expect(settings.getByText(title, {exact: true})).toHaveCount(0);
    }
});

test('My databases truncates narrow column titles and keeps their help accessible', async ({
    page,
}) => {
    await mockApi(page, {});
    await page.addInitScript(() =>
        localStorage.setItem('myDatabasesTableColumnsWidth', JSON.stringify({cpu: 80})),
    );
    await page.goto('/home/databases?databasesFixture');

    const header = page.locator('thead').first();
    const title = header.getByText('CPU used', {exact: true});
    await expect(title).toHaveCSS('text-overflow', 'ellipsis');
    expect(await title.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await header.getByRole('button', {name: 'CPU used'}).hover();
    await expect(page.getByText('CPU currently used by the database, in cores.')).toBeVisible();
});

async function mockDatabases(page: Page, databases: TTenant[]) {
    await mockApi(page, {});
    await page.route('**/meta/databases?*', (route) => route.fulfill({json: {databases}}));
}

const cloudDatabases: TTenant[] = [
    {Name: '/db/first', Type: 'Dedicated', Cluster: 'alpha', UserAttributes: {cloud_id: 'cloud-b'}},
    {
        Name: '/db/second',
        Type: 'Serverless',
        Cluster: 'alpha',
        UserAttributes: {cloud_id: 'cloud-a'},
    },
    {Name: '/db/third', Type: 'Dedicated', Cluster: 'beta', UserAttributes: {cloud_id: 'cloud-b'}},
];

test('My databases filters by cluster without cloud IDs or Control Plane', async ({page}) => {
    await mockDatabases(page, [
        {
            Name: '/db/first',
            Type: 'Dedicated',
            Cluster: 'alpha',
            TablesStorage: [{Type: 'SSD', Size: '90', HardQuota: '100'}],
            NodeIds: [1, 2],
            StorageGroups: '3',
        },
        {
            Name: '/db/second',
            Type: 'Serverless',
            Cluster: 'beta',
            ControlPlane: {},
            DiskSpaceQuotaUsage: {Mode: 'MODE_OVERALL', Entries: [{Usage: '20', HardQuota: '100'}]},
            NodeIds: [3],
            StorageGroups: '1',
        },
        {
            Name: '/db/shared',
            Type: 'Shared',
            Cluster: 'hidden',
            ControlPlane: {cloud_id: 'shared-cloud'},
            StorageGroups: '99',
        },
        {Name: '/db/domain', Type: 'Domain', Cluster: 'hidden', NodeIds: [4]},
        {Name: '/db/unknown-type', Type: 'UnknownTenantType', Cluster: 'hidden'},
        {Name: '/db/untyped', Cluster: 'hidden'},
    ]);
    let resolverCalls = 0;
    await page.exposeFunction('resolveTestCloudNames', () => {
        resolverCalls++;
        return [];
    });
    await page.addInitScript(() => {
        if (!localStorage.getItem('databasesTableSelectedColumns')) {
            localStorage.setItem(
                'databasesTableSelectedColumns',
                JSON.stringify(['Name', 'nodesCount']),
            );
        }
    });
    await page.goto(databasesUrl + '&resolveCloudNames&cloudId=obsolete&groupBy=allocated');
    const first = page.getByRole('link', {name: 'first', exact: true});
    const second = page.getByRole('link', {name: 'second', exact: true});
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    await expect(page.getByText('Databases: 2', {exact: true})).toBeVisible();
    await expect(
        page.getByRole('link', {name: /^(shared|domain|unknown-type|untyped)$/}),
    ).toHaveCount(0);
    await expect(page.getByText('Show shared', {exact: true})).toHaveCount(0);
    await expect(page.getByRole('combobox', {name: 'Cloud', exact: true})).toHaveCount(0);
    const header = page.locator('thead').first();
    const logical = header.getByRole('columnheader', {name: 'YDB logical resources', exact: true});
    await expect(logical).toHaveCount(0);
    await expect(header.getByText('Nodes', {exact: true})).toHaveCount(0);
    await expect(header.getByText('Storage groups', {exact: true})).toHaveCount(0);
    await page.getByRole('button', {name: /^\d+\/\d+$/}).click();
    await page.locator('.g-popup').getByText('Nodes', {exact: true}).click();
    await expect(logical).toHaveAttribute('colspan', '1');
    await page.locator('.g-popup').getByText('Storage groups', {exact: true}).click();
    await page.reload();
    await expect(
        header.getByRole('columnheader', {name: 'State', exact: true}).locator('+ th'),
    ).toHaveText('YDB logical resources');
    const groupBy = page.getByRole('combobox', {name: /Group by/});
    await expect(groupBy).toHaveCount(0);
    await expect(header.locator('tr').nth(1).locator('th')).toHaveText(['Nodes', 'Storage groups']);
    await expect(header.getByText('Storage quota used', {exact: true})).toHaveCount(0);
    const totals = page.locator('.data-table__sticky_footer').getByRole('cell');
    await expect(totals).toHaveText(['Total', '', '', '3', '4', '', '', '']);
    expect(await page.evaluate(() => localStorage.getItem('databasesTableSelectedColumns'))).toBe(
        JSON.stringify(['Name', 'nodesCount']),
    );
    await page.getByRole('combobox', {name: 'Cluster', exact: true}).click();
    await expect(page.getByRole('option')).toHaveText(['alpha', 'beta']);
    await page.getByRole('option', {name: 'beta', exact: true}).click();
    await expect(first).toHaveCount(0);
    await expect(second).toBeVisible();
    await expect(page).toHaveURL(/[?&]cluster=beta(?:&|$)/);
    await page.getByRole('combobox', {name: 'Cluster', exact: true}).press('Escape');
    await page.getByRole('button', {name: /^\d+\/\d+$/}).click();
    await page.locator('.g-popup').getByText('State', {exact: true}).click();
    await expect(header.getByRole('columnheader', {name: 'State', exact: true})).toHaveCount(0);
    await expect(
        header.getByRole('columnheader', {name: 'Type', exact: true}).locator('+ th'),
    ).toHaveText('YDB logical resources');
    expect(resolverCalls).toBe(0);
});

test('My databases filters by type, restores the selection and clears it', async ({page}) => {
    await mockDatabases(page, [
        {Name: '/db/orders-one', Type: 'Serverless', StorageGroups: '2'},
        {Name: '/db/orders-two', Type: 'Dedicated', StorageGroups: '4'},
        {Name: '/db/analytics', Type: 'Dedicated', StorageGroups: '8'},
    ]);
    await page.addInitScript(() =>
        localStorage.setItem(
            'myDatabasesTableSelectedColumns',
            JSON.stringify(['Name', 'groupsCount']),
        ),
    );
    await page.goto(databasesUrl + '&search=orders&databaseType=Shared');
    const type = page.getByRole('combobox', {name: 'Type', exact: true});
    const groupsColumn = page
        .locator('thead')
        .first()
        .getByRole('columnheader', {name: 'Storage groups', exact: true});
    await expect(groupsColumn).toBeVisible();
    const groupsIndex = Number(await groupsColumn.getAttribute('data-index'));
    const groupsTotal = page
        .locator('.data-table__sticky_footer')
        .getByRole('cell')
        .nth(groupsIndex);
    await expect(type).toContainText('All');
    await expect(groupsTotal).toHaveText('6');
    await type.click();
    await expect(page.getByRole('option')).toHaveText(['Serverless', 'Dedicated']);
    await page.getByRole('option', {name: 'Serverless', exact: true}).click();
    await expect(page).toHaveURL(/[?&]databaseType=Serverless(?:&|$)/);
    await expect(groupsTotal).toHaveText('2');
    await page.reload();
    await expect(type).toContainText('Serverless');
    await expect(page.getByRole('link', {name: 'orders-one', exact: true})).toBeVisible();
    await expect(page.getByText('Databases: 1 of 3', {exact: true})).toBeVisible();
    await type.click();
    await page.getByRole('option', {name: 'Dedicated', exact: true}).click();
    await expect(page.getByRole('link', {name: 'orders-two', exact: true})).toBeVisible();
    await expect(groupsTotal).toHaveText('4');
    await page.getByTestId('select-clear').click();
    await expect(type).toContainText('All');
    await expect(page).not.toHaveURL(/[?&]databaseType=/);
    await expect(page.getByText('Databases: 2 of 3', {exact: true})).toBeVisible();
    await expect(groupsTotal).toHaveText('6');
});

test('My databases restores cloud and cluster filters by ID and opens the matching database', async ({
    page,
}) => {
    await mockDatabases(page, cloudDatabases);
    await page.goto(databasesUrl + '&cluster=alpha');
    const cloud = page.getByRole('combobox', {name: 'Cloud', exact: true});
    await cloud.click();
    await expect(page.getByRole('option')).toHaveText(['cloud-a', 'cloud-b']);
    await page.getByRole('option', {name: 'cloud-b', exact: true}).click();
    await expect(page).toHaveURL(/[?&]cloudId=cloud-b(?:&|$)/);
    await page.reload();
    await expect(cloud).toContainText('cloud-b');
    await expect(page.getByText('Databases: 1 of 3', {exact: true})).toBeVisible();
    await expect(page.getByRole('link', {name: 'second', exact: true})).toHaveCount(0);
    await expect(page.getByRole('link', {name: 'third', exact: true})).toHaveCount(0);
    const first = page.getByRole('link', {name: 'first', exact: true});
    await expect(first).toBeVisible();
    const search = page.getByPlaceholder('Database name');
    await search.fill('first');
    await search.press('ArrowDown');
    const opened = page.waitForEvent('popup');
    await search.press('Enter');
    const database = await opened;
    await expect(database).toHaveURL(
        (url) =>
            url.searchParams.get('database') === '/db/first' &&
            url.searchParams.get('clusterName') === 'alpha',
    );
    await database.close();
    await search.fill('second');
    await expect(page.getByText('No such databases')).toBeVisible();
});

test('My databases resolves cloud names on open and searches by both name and ID', async ({
    page,
}) => {
    await mockDatabases(page, cloudDatabases);
    const calls: {ids: string[]; environment?: string}[] = [];
    let releaseNames!: () => void;
    const pending = new Promise<void>((resolve) => {
        releaseNames = resolve;
    });
    await page.exposeFunction(
        'resolveTestCloudNames',
        async (ids: string[], environment?: string) => {
            calls.push({ids, environment});
            await pending;
            return [{id: 'cloud-b', name: 'Production'}];
        },
    );
    await page.goto(databasesUrl + '&resolveCloudNames&cloudId=cloud-b');
    const cloud = page.getByRole('combobox', {name: 'Cloud', exact: true});
    await expect(cloud).toContainText('cloud-b');
    expect(calls).toHaveLength(0);
    await cloud.click();
    await expect(page.getByRole('listbox').locator('.g-loader')).toBeVisible();
    expect(calls).toEqual([{ids: ['cloud-a', 'cloud-b'], environment: 'env-a'}]);
    releaseNames();
    const production = page.getByRole('option', {name: 'Production', exact: true});
    await expect(production).toBeVisible();
    await expect(page.getByRole('option', {name: 'cloud-a', exact: true})).toBeVisible();
    const search = page.getByPlaceholder('Search by cloud name or ID');
    for (const query of ['prod', 'cloud-b']) {
        await search.fill(query);
        await expect(page.getByRole('option')).toHaveText(['Production']);
    }
});

test('My databases keeps cloud IDs selectable after name resolution fails', async ({page}) => {
    await mockDatabases(page, cloudDatabases);
    let resolverCalls = 0;
    await page.exposeFunction('resolveTestCloudNames', () => {
        resolverCalls++;
        throw new Error('Cloud names unavailable');
    });
    await page.goto(databasesUrl + '&resolveCloudNames');
    await page.getByRole('combobox', {name: 'Cloud', exact: true}).click();
    await page.getByRole('option', {name: 'cloud-a', exact: true}).click();
    await expect(page.getByRole('link', {name: 'second', exact: true})).toBeVisible();
    await expect(page.getByText('Databases: 1 of 3', {exact: true})).toBeVisible();
    expect(resolverCalls).toBe(1);
});

test('My databases displays allocations from cluster presets and groups by CPU and memory', async ({
    page,
}) => {
    await mockDatabases(page, [
        {
            Name: '/db/provisioned',
            Type: 'Dedicated',
            Cluster: 'alpha',
            CoresUsed: 3,
            ControlPlane: {resource_preset_id: 'small', scale_policy: {fixed_scale: {size: 2}}},
            MemoryUsed: String(3 * 1024 ** 3),
        },
        {Name: '/db/legacy', Type: 'Dedicated', Cluster: 'beta', StorageAllocatedSize: '500'},
    ]);
    await page.route('**/meta/list_resource_presets*', (route) =>
        route.fulfill({json: {resource_presets: [{id: 'small', cores: '4', memory: '4'}]}}),
    );
    await page.goto(databasesUrl + '&groupBy=storage-quota');
    const header = page.locator('thead').first();
    const allocated = header.getByRole('columnheader', {
        name: 'Allocated physical resources',
        exact: true,
    });
    await expect(allocated).toHaveAttribute('colspan', '2');
    await expect(
        header.getByRole('columnheader', {name: 'State', exact: true}).locator('+ th'),
    ).toHaveText('Allocated physical resources');
    await expect(header.locator('tr').nth(1).locator('th')).toHaveText(['CPU', 'Memory']);
    await expect(header.getByText('YDB logical resources', {exact: true})).toHaveCount(0);
    const provisioned = page
        .getByRole('row')
        .filter({has: page.getByRole('link', {name: 'provisioned', exact: true})});
    for (const value of ['8', '9 GB']) {
        await expect(provisioned.getByRole('cell', {name: value, exact: true})).toBeVisible();
    }
    const totals = page.locator('.data-table__sticky_footer').getByRole('row');
    await expect(totals.getByRole('cell', {name: '≥ 8', exact: true})).toBeVisible();
    await expect(totals.getByRole('cell', {name: '≥ 9 GB', exact: true})).toBeVisible();
    const groupBy = page.getByRole('combobox', {name: /Group by/});
    await groupBy.click();
    await expect(page.getByRole('option')).toHaveText([
        'CPU used / Allocated CPU',
        'Memory used / Allocated memory',
    ]);
    await page.getByRole('option', {name: 'CPU used / Allocated CPU'}).click();
    await expect(page).toHaveURL(/[?&]groupBy=allocated(?:&|$)/);
    await expect(page.getByRole('button', {name: /Insufficient data/})).toBeVisible();
    await page.getByRole('button', {name: /<50%/}).click();
    await expect(provisioned).toBeVisible();
    await expect(totals.getByRole('cell', {name: '8', exact: true})).toBeVisible();
    await page.getByRole('button', {name: /Insufficient data/}).click();
    await expect(totals).toHaveCount(2);
    await expect(totals.nth(1).getByText('—', {exact: true})).toHaveCount(2);
    await expect(allocated).toHaveAttribute('colspan', '2');
    await groupBy.click();
    await page.getByRole('option', {name: 'Memory used / Allocated memory'}).click();
    const lowMemory = page.getByRole('button', {name: /<50%/});
    await expect(lowMemory).toHaveAttribute('aria-expanded', 'false');
    await lowMemory.click();
    await expect(provisioned).toBeVisible();
    await page.getByPlaceholder('Database name').fill('legacy');
    await expect(page.getByRole('button', {name: /<50%/})).toHaveCount(0);
    await expect(groupBy).toContainText('Memory used / Allocated memory');
});

test('My databases sorts storage group counts and hides empty headers after reload', async ({
    page,
}) => {
    await mockDatabases(
        page,
        [10, 2, 100].map((used) => ({
            Name: '/db/usage-' + used,
            Type: 'Dedicated',
            ControlPlane: {id: 'id-' + used},
            StorageGroups: String(used),
        })),
    );
    await page.addInitScript(() => {
        const key = 'myDatabasesTableSelectedColumns';
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(['Name', 'groupsCount']));
        }
    });
    await page.goto(databasesUrl);
    const header = page.locator('thead').first();
    const allocated = header.getByRole('columnheader', {
        name: 'YDB logical resources',
        exact: true,
    });
    await expect(allocated).toHaveAttribute('colspan', '1');
    await expect(header.locator('tr').nth(1)).toHaveText('Storage groups');
    const values = page.locator('.data-table__box tbody tr td:nth-child(2)');
    await expect(values).toHaveCount(3);
    await header.getByText('Storage groups', {exact: true}).click();
    await expect(values).toHaveText(['100', '10', '2']);
    await header.getByText('Storage groups', {exact: true}).click();
    await expect(values).toHaveText(['2', '10', '100']);
    await page.getByRole('button', {name: /^\d+\/\d+$/}).click();
    await page.locator('.g-popup').getByText('Storage groups', {exact: true}).click();
    await page.reload();
    await expect(header.getByText('Storage groups', {exact: true})).toHaveCount(0);
    await expect(allocated).toHaveCount(0);
    await expect(page.locator('.data-table__sticky_footer')).toHaveCount(0);
    await expect(header.locator('tr')).toHaveCount(1);
});

test('My databases pins allocated totals while scrolling and recalculates them after search', async ({
    page,
}) => {
    await mockDatabases(
        page,
        Array.from({length: 80}, (_, index) => ({
            Name: '/db/item-' + index,
            Type: 'Dedicated',
            Cluster: 'alpha',
            ControlPlane: {id: 'id-' + index},
            StorageGroups: index === 0 ? '0' : '2',
            NodeIds: [index],
            DatabaseQuotas:
                index === 0
                    ? {data_size_hard_quota: '0'}
                    : {
                          data_size_hard_quota: '100',
                          storage_quotas: [{unit_kind: 'ssd', data_size_hard_quota: '80'}],
                      },
        })),
    );
    await page.addInitScript(() =>
        localStorage.setItem(
            'myDatabasesTableSelectedColumns',
            JSON.stringify([
                'Name',
                'cpu',
                'memory',
                'storageQuotaUsed',
                'storageQuotaLimit',
                'nodesCount',
                'groupsCount',
            ]),
        ),
    );
    await page.goto(databasesUrl);
    const footer = page.locator('.data-table__sticky_footer');
    const cells = footer.getByRole('cell');
    await expect(cells).toHaveText(['Total', '', '', '80', '158']);
    await expect(footer).toBeInViewport();
    const footerTop = () => footer.evaluate((node) => node.getBoundingClientRect().top);
    const top = await footerTop();
    const scroller = await footer.evaluateHandle((node) => {
        for (let el = node.parentElement; el; el = el.parentElement) {
            if (
                el.scrollHeight > el.clientHeight &&
                /auto|scroll/.test(getComputedStyle(el).overflowY)
            ) {
                return el;
            }
        }
        return document.scrollingElement ?? document.documentElement;
    });
    await scroller.evaluate((node) => {
        node.scrollTo({top: 480});
    });
    await expect.poll(() => scroller.evaluate((node) => node.scrollTop)).toBeGreaterThan(300);
    await expect.poll(async () => Math.abs((await footerTop()) - top)).toBeLessThan(2);
    await page.getByPlaceholder('Database name').fill('item-79');
    await expect(cells).toHaveText(['Total', '', '', '1', '2']);
    await page.getByPlaceholder('Database name').fill('absent');
    await expect(footer).toHaveCount(0);
});
