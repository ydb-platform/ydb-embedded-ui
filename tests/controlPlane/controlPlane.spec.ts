import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

type MockState = {
    healthy?: boolean;
    whoamiStatus?: number;
    capabilitiesStatus?: number;
    compositeStatus?: number;
    compositeMessage?: string;
    unrelated?: boolean;
    cpFailure?: boolean;
    missingCpFields?: boolean;
    hold?: boolean;
    displayScope?: string;
    holdWhoami?: boolean;
    holdCapabilities?: boolean;
    holdCluster?: boolean;
    useMetaProxy?: boolean;
    nullViewerError?: boolean;
    canonicalPath?: string;
    calls: string[];
};

async function mockDatabase(page: Page, state: MockState, navigationV2 = true) {
    await page.addInitScript((v2) => {
        localStorage.setItem('enableTenantNavigationV2', JSON.stringify(v2));
        localStorage.setItem('saved_tenant_initial_tab', JSON.stringify('query'));
    }, navigationV2);
    await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (!/\/(?:meta|viewer|scheme|capabilities)(?:\/|$)/.test(url.pathname)) {
            await route.continue();
            return;
        }
        state.calls.push(url.pathname + url.search);
        const isHeld = () =>
            Boolean(
                (state.hold && url.pathname.endsWith('/meta/databases')) ||
                    (state.holdWhoami && url.pathname.endsWith('/whoami')) ||
                    (state.holdCapabilities &&
                        url.pathname.includes('/viewer/') &&
                        url.pathname.endsWith('/capabilities')) ||
                    (state.holdCluster && url.pathname.endsWith('/meta/db_clusters')),
            );
        if (isHeld()) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (!isHeld()) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            });
        }
        let status = 200;
        let body: unknown = {};
        const backend =
            url.searchParams.get('cluster_name') ||
            (url.pathname.includes('scope-b') ? 'scope-b' : 'scope-a');
        if (
            url.pathname.endsWith('/meta/databases') ||
            url.pathname.endsWith('/meta/cp_databases')
        ) {
            status = state.compositeStatus || 200;
            body = {
                databases: [
                    {
                        Id: state.unrelated ? 'unrelated' : 'cp-id',
                        Name: state.unrelated
                            ? '/other'
                            : state.canonicalPath || url.searchParams.get('database') || '/db',
                        Type: 'Dedicated',
                        ...(state.healthy ? {NodeIds: [1], Overall: 'Green'} : {}),
                        ...(state.cpFailure
                            ? {}
                            : {
                                  ControlPlane: {
                                      id: 'cp-id',
                                      name: `${state.displayScope || backend}-display`,
                                      ...(state.missingCpFields
                                          ? {}
                                          : {
                                                folder_id: 'folder',
                                                endpoint: 'grpcs://example.invalid:2135',
                                                status: 'RUNNING',
                                            }),
                                  },
                              }),
                    },
                ],
                ...(state.nullViewerError ? {errors: {viewer: null}} : {}),
                ...(state.healthy
                    ? state.cpFailure
                        ? {errors: {control_plane: 'unavailable'}}
                        : {}
                    : {errors: {viewer: 'Failed to resolve database nodes'}}),
            };
            if (state.compositeMessage) {
                body = {message: state.compositeMessage};
            }
        } else if (url.pathname.endsWith('/whoami')) {
            status = state.whoamiStatus || (state.healthy ? 200 : 400);
            body =
                status === 200
                    ? {UserSID: 'test', IsViewerAllowed: true, IsMonitoringAllowed: true}
                    : {message: 'Failed to resolve database nodes'};
        } else if (url.pathname.endsWith('/capabilities')) {
            status = url.pathname.includes('/viewer/')
                ? state.capabilitiesStatus || (state.healthy ? 200 : 400)
                : 200;
            body = {Capabilities: {}, Settings: {Security: {UseLoginProvider: true}}};
        } else if (url.pathname.endsWith('/meta/db_clusters')) {
            body = {
                clusters: [
                    {
                        name: url.searchParams.get('name'),
                        settings: {use_meta_proxy: state.useMetaProxy ?? true},
                        solomon: {cluster_name: 'configured-monitoring-alias'},
                    },
                ],
            };
        } else if (url.pathname.includes('/tenantinfo')) {
            body = {TenantInfo: [{Id: 'cp-id', Name: '/db', Type: 'Dedicated'}]};
        } else if (url.pathname.includes('/describe')) {
            body = {PathDescription: {Self: {PathType: 'Dir', Name: 'db'}}};
        }
        await route.fulfill({status, contentType: 'application/json', body: JSON.stringify(body)});
    });
}

function cpPage(page: Page) {
    return page.getByTestId('control-plane-unavailable');
}
function runtimeCalls(state: MockState) {
    return state.calls.filter((path) =>
        /nodes|nodelist|describe|healthcheck|selfcheck|query|settings|cp_databases|get_database/.test(
            path,
        ),
    );
}

for (const navigationV2 of [true, false]) {
    test(`CP overview and extensions without runtime loaders, navigationV2=${navigationV2}`, async ({
        page,
    }, info) => {
        const state: MockState = {calls: []};
        await mockDatabase(page, state, navigationV2);
        await page.goto('/database?database=/db&clusterName=scope-a&databasePage=query');
        await expect(cpPage(page)).toBeVisible();
        await expect(cpPage(page).getByRole('heading', {name: 'scope-a-display'})).toBeVisible();
        await expect(
            cpPage(page).getByText('Control plane status does not indicate runtime health.', {
                exact: false,
            }),
        ).toBeVisible();
        await page.screenshot({
            path: info.outputPath(`cp-${navigationV2 ? 'v2' : 'legacy'}-${info.project.name}.png`),
        });
        await cpPage(page).getByRole('tab', {name: 'Backups'}).click();
        await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
        await expect(cpPage(page).getByRole('tab', {name: 'Monitoring'})).toHaveCount(0);
        expect(state.calls.filter((path) => path.includes('/meta/db_clusters'))).toEqual([]);
        await expect(page.getByRole('menuitem', {name: /edit|delete/i})).toHaveCount(0);
        expect(runtimeCalls(state)).toEqual([]);
        expect(state.calls.filter((path) => path.includes('/meta/databases'))).toHaveLength(1);
        expect(new URL(page.url()).searchParams.get('databasePage')).toBe('query');
        expect(await page.evaluate(() => localStorage.getItem('saved_tenant_initial_tab'))).toBe(
            '"query"',
        );
    });
}

test('healthy composite plus operational whoami still shows CP; retry recovers the original runtime deep link', async ({
    page,
}) => {
    const state: MockState = {calls: [], healthy: true, whoamiStatus: 400};
    await mockDatabase(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    await expect(cpPage(page)).toBeVisible();
    expect(runtimeCalls(state)).toEqual([]);
    state.whoamiStatus = 200;
    await cpPage(page).getByRole('button', {name: 'Retry runtime connection'}).click();
    await expect(cpPage(page)).toHaveCount(0);
    await expect.poll(() => state.calls.some((path) => path.includes('/nodelist'))).toBe(true);
    expect(new URL(page.url()).searchParams.get('diagnosticsTab')).toBe('nodes');
    expect(state.calls.filter((path) => path.includes('/meta/get_database'))).toEqual([]);
});

for (const navigationV2 of [true, false]) {
    test(`runtime editor survives composite refetch failure and recovery, navigationV2=${navigationV2}`, async ({
        page,
    }) => {
        const state: MockState = {calls: [], healthy: true};
        await mockDatabase(page, state, navigationV2);
        await page.goto('/database?database=/db&clusterName=scope-a&databasePage=query');
        const editor = page.locator('.query-editor__monaco .monaco-editor');
        await editor.waitFor({state: 'visible'});
        await expect(editor).toBeVisible();
        await expect.poll(() => page.evaluate(() => Boolean(window.ydbEditor))).toBe(true);
        await page.evaluate(() => {
            window.ydbEditor?.setValue('SELECT 42; -- unsaved runtime query');
            window.ydbEditor?.setPosition({lineNumber: 1, column: 8});
        });
        const tenantNode = await page.locator('.tenant-page').elementHandle();
        const editorNode = await editor.elementHandle();
        if (!tenantNode || !editorNode) {
            throw new Error('Runtime tenant and editor must be mounted');
        }
        state.compositeStatus = 500;
        state.compositeMessage = 'Transient runtime composite failure';
        await page.evaluate(() => window.controlPlaneTest.refresh({tenant: true}));
        expect(await tenantNode.evaluate((node) => node.isConnected)).toBe(true);
        expect(await editorNode.evaluate((node) => node.isConnected)).toBe(true);
        await expect(
            page.getByText('Transient runtime composite failure', {exact: true}),
        ).toHaveCount(0);
        await expect(page.getByRole('button', {name: 'Retry runtime connection'})).toHaveCount(0);
        await expect(cpPage(page)).toHaveCount(0);
        expect(await page.evaluate(() => window.ydbEditor?.getValue())).toBe(
            'SELECT 42; -- unsaved runtime query',
        );
        expect(await page.evaluate(() => window.ydbEditor?.getPosition())).toEqual({
            lineNumber: 1,
            column: 8,
        });
        state.compositeStatus = 200;
        state.compositeMessage = undefined;
        await page.evaluate(() => window.controlPlaneTest.refresh({tenant: true}));
        expect(await tenantNode.evaluate((node) => node.isConnected)).toBe(true);
        expect(await editorNode.evaluate((node) => node.isConnected)).toBe(true);
        expect(await page.evaluate(() => window.ydbEditor?.getValue())).toBe(
            'SELECT 42; -- unsaved runtime query',
        );
        expect(await page.evaluate(() => window.ydbEditor?.getPosition())).toEqual({
            lineNumber: 1,
            column: 8,
        });
        expect(state.calls.filter((path) => path.includes('/meta/databases'))).toHaveLength(3);
    });

    test(`cold composite failure with authorized whoami opens runtime, navigationV2=${navigationV2}`, async ({
        page,
    }) => {
        const state: MockState = {
            calls: [],
            healthy: true,
            compositeStatus: 500,
            compositeMessage: 'Cold composite request failed',
        };
        await mockDatabase(page, state, navigationV2);
        await page.goto('/database?database=/db&clusterName=scope-a&databasePage=query');
        await page.locator('.query-editor__monaco .monaco-editor').waitFor({state: 'visible'});
        await expect(page.locator('.query-editor__monaco .monaco-editor')).toBeVisible();
        await expect(page.getByText('Cold composite request failed', {exact: true})).toHaveCount(0);
        await expect(page.getByRole('button', {name: 'Retry runtime connection'})).toHaveCount(0);
        await expect(cpPage(page)).toHaveCount(0);
    });
}

test('Retry shows the actual composite failure and stays usable until recovery', async ({page}) => {
    const state: MockState = {calls: []};
    await mockDatabase(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a&diagnosticsTab=backups');
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
    state.compositeStatus = 500;
    state.compositeMessage = 'Composite database request failed';
    await cpPage(page).getByRole('button', {name: 'Retry runtime connection'}).click();
    await expect(page.getByText('Composite database request failed', {exact: true})).toBeVisible();
    await expect(cpPage(page)).toHaveCount(0);
    await expect(page.getByTestId('cp-extension-backups')).toHaveCount(0);
    await expect(page.getByTestId('cp-extension-monitoring')).toHaveCount(0);
    await expect(page.getByText('Failed to resolve database nodes', {exact: false})).toHaveCount(0);
    await expect(page.getByText('503', {exact: true})).toHaveCount(0);
    await expect(page.getByText('scope-a-display', {exact: true})).toHaveCount(0);
    const retry = page.getByRole('button', {name: 'Retry runtime connection'});
    await retry.click();
    await expect
        .poll(() => state.calls.filter((path) => path.includes('/meta/databases')).length)
        .toBe(3);
    await expect(page.getByText('Composite database request failed', {exact: true})).toBeVisible();
    state.compositeStatus = 200;
    state.compositeMessage = undefined;
    await retry.click();
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
    await expect(page.getByText('Composite database request failed', {exact: true})).toHaveCount(0);
    expect(state.calls.filter((path) => path.includes('/meta/databases'))).toHaveLength(4);
    expect(runtimeCalls(state)).toEqual([]);
});

test('explicitly skipped availability is idle without tenant or capability requests', async ({
    page,
}) => {
    const state: MockState = {calls: []};
    await mockDatabase(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a&skipAvailability=1');
    await expect(page.getByTestId('availability-loading')).toHaveText('idle');
    expect(state.calls.filter((path) => /databases|capabilities/.test(path))).toEqual([]);
});

test('capabilities authorization denial wins over CP', async ({page}) => {
    const state: MockState = {calls: [], capabilitiesStatus: 403};
    await mockDatabase(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a');
    await expect(page.getByText('Access denied', {exact: false}).first()).toBeVisible();
    await expect(cpPage(page)).toHaveCount(0);
    expect(runtimeCalls(state)).toEqual([]);
});

test('unmatched CP does not authorize another database', async ({page}) => {
    const state: MockState = {calls: [], unrelated: true};
    await mockDatabase(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a');
    await expect(
        page.getByText('Failed to resolve database nodes', {exact: false}).first(),
    ).toBeVisible();
    await expect(page.getByRole('button', {name: 'Retry runtime connection'})).toHaveCount(0);
    await expect(cpPage(page)).toHaveCount(0);
    await expect(page.getByText('scope-a-display', {exact: true})).toHaveCount(0);
});

test('same-database scope navigation never displays prior CP while pending and deduplicates remounted extensions', async ({
    page,
}) => {
    const state: MockState = {calls: []};
    await mockDatabase(page, state);
    await page.goto(
        '/env-a/database?database=/db&clusterName=scope-a&backend=/scope-a&diagnosticsTab=backups',
    );
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
    state.hold = true;
    await page.evaluate(() => {
        window.history.pushState(
            {},
            '',
            '/env-b/database?database=/db&clusterName=scope-b&backend=/scope-b&diagnosticsTab=backups',
        );
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByTestId('cp-extension-backups')).toHaveCount(0);
    await expect(page.getByText('scope-a-display', {exact: true})).toHaveCount(0);
    state.hold = false;
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-b-display');
    expect(state.calls.filter((path) => path.includes('/meta/databases'))).toHaveLength(2);
});

test('missing CP extension parameters hide tabs and render missing fields honestly', async ({
    page,
}) => {
    const state: MockState = {calls: [], missingCpFields: true};
    await mockDatabase(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a');
    await expect(cpPage(page)).toBeVisible();
    await expect(cpPage(page).getByRole('tab')).toHaveCount(1);
    expect(runtimeCalls(state)).toEqual([]);
});

test('healthy CP failure and no-meta preserve runtime route behavior', async ({page}) => {
    const state: MockState = {calls: [], healthy: true, cpFailure: true};
    await mockDatabase(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    await expect.poll(() => state.calls.some((path) => path.includes('/nodelist'))).toBe(true);
    await expect(cpPage(page)).toHaveCount(0);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes&noMeta=1',
    );
    await expect.poll(() => state.calls.some((path) => path.includes('/tenantinfo'))).toBe(true);
    await expect(cpPage(page)).toHaveCount(0);
    expect(state.calls.filter((path) => path.includes('/meta/get_database'))).toEqual([]);
});

test('environment-only navigation isolates the same database and cluster', async ({page}) => {
    const state: MockState = {calls: []};
    await mockDatabase(page, state);
    await page.goto('/env-a/database?database=/db&clusterName=scope-a&diagnosticsTab=backups');
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
    state.hold = true;
    state.displayScope = 'env-b';
    await page.evaluate(() => {
        window.history.pushState(
            {},
            '',
            '/env-b/database?database=/db&clusterName=scope-a&diagnosticsTab=backups',
        );
        window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page.getByTestId('cp-extension-backups')).toHaveCount(0);
    await expect(page.getByText('scope-a-display', {exact: true})).toHaveCount(0);
    state.hold = false;
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:env-b-display');
    expect(state.calls.filter((path) => path.includes('/meta/databases'))).toHaveLength(2);
});

for (const deniedSource of ['whoamiStatus', 'capabilitiesStatus', 'compositeStatus'] as const) {
    test(`new ${deniedSource} denial hides previously displayed CP on retry`, async ({page}) => {
        const state: MockState = {calls: []};
        await mockDatabase(page, state);
        await page.goto('/database?database=/db&clusterName=scope-a&diagnosticsTab=backups');
        await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
        state[deniedSource] = 403;
        await cpPage(page).getByRole('button', {name: 'Retry runtime connection'}).click();
        await expect(page.getByText('Access denied', {exact: false}).first()).toBeVisible();
        await expect(cpPage(page)).toHaveCount(0);
        await expect(page.getByText('scope-a-display', {exact: true})).toHaveCount(0);
        expect(runtimeCalls(state)).toEqual([]);
    });
}

test('older failing composite retains the existing error path without new fallback fetches', async ({
    page,
}) => {
    const state: MockState = {calls: [], compositeStatus: 500};
    await mockDatabase(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a');
    await expect(
        page.getByText('Failed to resolve database nodes', {exact: false}).first(),
    ).toBeVisible();
    await expect(page.getByRole('button', {name: 'Retry runtime connection'})).toHaveCount(0);
    await expect(cpPage(page)).toHaveCount(0);
    expect(state.calls.filter((path) => path.includes('/meta/get_database'))).toEqual([]);
    expect(state.calls.filter((path) => path.includes('/meta/databases'))).toHaveLength(1);
});

for (const healthy of [false, true]) {
    test(`database-only navigation ignores previous database late 401, healthy=${healthy}`, async ({
        page,
    }) => {
        const state: MockState = {calls: [], healthy};
        await mockDatabase(page, state);
        let releasePrevious: () => void = () => undefined;
        const release = new Promise<void>((resolve) => {
            releasePrevious = resolve;
        });
        let previousWhoamiHeld = false;
        let previousWhoamiReleased = false;
        await page.route('**/viewer/json/whoami?*', async (route) => {
            if (new URL(route.request().url()).searchParams.get('database') !== '/db-a') {
                await route.fallback();
                return;
            }
            previousWhoamiHeld = true;
            await release;
            await route.fulfill({status: 401, contentType: 'application/json', body: '{}'});
            previousWhoamiReleased = true;
        });
        await page.goto('/database?database=/db-a&clusterName=scope-a&diagnosticsTab=backups');
        await expect.poll(() => previousWhoamiHeld).toBe(true);
        const nextWhoami = page.waitForResponse(
            (response) =>
                response.url().includes('/whoami') &&
                new URL(response.url()).searchParams.get('database') === '/db-b',
        );
        await page.evaluate(() =>
            window.controlPlaneTest.navigate(
                '/database?database=/db-b&clusterName=scope-a&diagnosticsTab=backups',
            ),
        );
        await nextWhoami;
        await expect
            .poll(() => page.evaluate(() => window.controlPlaneTest.whoamiStatus('/db-b')))
            .toBe(healthy ? 'fulfilled' : 'rejected');
        if (healthy) {
            await expect
                .poll(() =>
                    state.calls.some(
                        (path) => path.includes('/nodelist') && path.includes('database=%2Fdb-b'),
                    ),
                )
                .toBe(true);
        } else {
            await expect(page.getByTestId('cp-extension-backups')).toHaveText(
                'cp-id:scope-a-display',
            );
        }
        expect(await page.evaluate(() => window.controlPlaneTest.isAuthenticated())).toBe(true);
        releasePrevious();
        await expect.poll(() => previousWhoamiReleased).toBe(true);
        // Wait until the late response was consumed by the actual RTK query, not just sent.
        await expect
            .poll(() => page.evaluate(() => window.controlPlaneTest.whoamiStatus('/db-a')))
            .toBe('rejected');
        expect(await page.evaluate(() => window.controlPlaneTest.isAuthenticated())).toBe(true);
        if (healthy) {
            await expect(cpPage(page)).toHaveCount(0);
            await expect(page.getByRole('button', {name: 'Login', exact: true})).toHaveCount(0);
        } else {
            await expect(page.getByTestId('cp-extension-backups')).toHaveText(
                'cp-id:scope-a-display',
            );
        }
        expect(new URL(page.url()).searchParams.get('database')).toBe('/db-b');
    });
}

test('permitted Viewer waits for delayed cluster settings and selects V1 without a speculative V2 request', async ({
    page,
}) => {
    const state: MockState = {calls: [], healthy: true, useMetaProxy: false, holdCluster: true};
    await mockDatabase(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    await expect
        .poll(() => state.calls.some((path) => path.includes('/meta/db_clusters')))
        .toBe(true);
    expect(state.calls.filter((path) => /meta\/(databases|cp_databases)/.test(path))).toEqual([]);
    state.holdCluster = false;
    await expect
        .poll(() => state.calls.filter((path) => path.includes('/meta/cp_databases')).length)
        .toBe(1);
    await expect.poll(() => state.calls.some((path) => path.includes('/nodelist'))).toBe(true);
    expect(state.calls.filter((path) => path.includes('/meta/databases'))).toEqual([]);
    await expect(cpPage(page)).toHaveCount(0);
});

test('first whoami outcome is required; pending capabilities alone do not block authorized cold CP', async ({
    page,
}) => {
    const state: MockState = {
        calls: [],
        holdWhoami: true,
        holdCapabilities: true,
        capabilitiesStatus: 403,
    };
    await mockDatabase(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a&diagnosticsTab=backups');
    await expect.poll(() => state.calls.some((path) => path.includes('/whoami'))).toBe(true);
    expect(state.calls.filter((path) => path.includes('/meta/databases'))).toEqual([]);
    await expect(cpPage(page)).toHaveCount(0);
    state.holdWhoami = false;
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
    expect(state.calls.filter((path) => path.includes('/meta/db_clusters'))).toEqual([]);
    state.holdCapabilities = false;
    await expect(page.getByText('Access denied', {exact: false}).first()).toBeVisible();
    await expect(cpPage(page)).toHaveCount(0);
});

test('loaded current cluster config enables CP Monitoring with its configured alias', async ({
    page,
}) => {
    const state: MockState = {calls: [], healthy: true};
    await mockDatabase(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    await expect(
        page.locator('header').getByRole('button', {name: 'Copy path', exact: true}),
    ).toBeVisible();
    state.healthy = false;
    state.whoamiStatus = 400;
    await page.evaluate(() => window.controlPlaneTest.refresh({tenant: true, whoami: true}));
    await expect(cpPage(page)).toBeVisible();
    await cpPage(page).getByRole('tab', {name: 'Monitoring'}).click();
    await expect(page.getByTestId('cp-extension-monitoring')).toHaveText('cp-id:scope-a-display');
    await expect(page.getByTestId('cp-extension-monitoring')).toHaveAttribute(
        'data-monitoring-cluster',
        'configured-monitoring-alias',
    );
});

test('healthy retained Header info survives tenant refetch failure; failed whoami cannot authorize retained runtime callbacks', async ({
    page,
}) => {
    const state: MockState = {calls: [], healthy: true};
    await mockDatabase(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    const copy = page.locator('header').getByRole('button', {name: 'Copy path', exact: true});
    await expect(copy).toBeVisible();
    state.compositeStatus = 500;
    await page.evaluate(() => window.controlPlaneTest.refresh({tenant: true}));
    await expect(copy).toBeVisible();
    await expect(cpPage(page)).toHaveCount(0);
    state.whoamiStatus = 400;
    await page.evaluate(() => window.controlPlaneTest.refresh({whoami: true}));
    await expect(copy).toHaveCount(0);
    await expect(cpPage(page)).toHaveCount(0);
    await expect(
        page.getByText('Failed to resolve database nodes', {exact: false}).first(),
    ).toBeVisible();
    await expect(page.getByRole('button', {name: 'Retry runtime connection'})).toHaveCount(0);
});

test('standalone Header keeps original capability-first tenantinfo timing and never starts meta database queries', async ({
    page,
}) => {
    const state: MockState = {calls: [], healthy: true};
    await mockDatabase(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes&noMeta=1',
    );
    await expect.poll(() => state.calls.some((path) => path.includes('/tenantinfo'))).toBe(true);
    const capabilitiesIndex = state.calls.findIndex((path) => path.includes('/capabilities'));
    const tenantIndex = state.calls.findIndex((path) => path.includes('/tenantinfo'));
    expect(capabilitiesIndex).toBeGreaterThanOrEqual(0);
    expect(tenantIndex).toBeGreaterThan(capabilitiesIndex);
    expect(state.calls.filter((path) => /meta\/(databases|cp_databases)/.test(path))).toEqual([]);
});

test('nullable viewer metadata leaves a healthy runtime in runtime mode', async ({page}) => {
    const state: MockState = {calls: [], healthy: true, nullViewerError: true};
    await mockDatabase(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    await expect.poll(() => state.calls.some((path) => path.includes('/nodelist'))).toBe(true);
    await expect(cpPage(page)).toHaveCount(0);
});

for (const database of ['cp-id', '/folder/db']) {
    test(`Backups folder fallback uses selected database argument: ${database}`, async ({page}) => {
        const state: MockState = {calls: [], missingCpFields: true, canonicalPath: '/folder/db'};
        await mockDatabase(page, state);
        await page.goto(`/database?database=${encodeURIComponent(database)}&clusterName=scope-a`);
        await expect(cpPage(page)).toBeVisible();
        await expect(cpPage(page).getByRole('tab', {name: 'Monitoring'})).toHaveCount(0);
        const backups = cpPage(page).getByRole('tab', {name: 'Backups'});
        if (database === 'cp-id') {
            await expect(backups).toHaveCount(0);
        } else {
            await backups.click();
            await expect(page.getByTestId('cp-extension-backups')).toHaveText(
                'cp-id:scope-a-display',
            );
        }
        expect(state.calls.filter((path) => path.includes('/meta/db_clusters'))).toEqual([]);
    });
}
