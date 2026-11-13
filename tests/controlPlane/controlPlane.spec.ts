import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

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
                        : {'/meta/list_operations': 1},
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
