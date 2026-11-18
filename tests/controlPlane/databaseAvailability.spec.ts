import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

type MockState = {
    /** The composite response contains runtime data */
    healthy?: boolean;
    whoamiStatus?: number;
    capabilitiesStatus?: number;
    compositeStatus?: number;
    compositeMessage?: string;
    /** The composite response describes another database */
    unrelated?: boolean;
    /** The composite response names the database only in the control plane data */
    unnamed?: boolean;
    /** Hold composite and cluster settings responses until the flag is reset */
    holdCluster?: boolean;
    useMetaProxy?: boolean;
    calls: string[];
};

function getCompositeResponse(url: URL, state: MockState) {
    if (state.compositeMessage) {
        return {status: state.compositeStatus || 200, body: {message: state.compositeMessage}};
    }
    const database = url.searchParams.get('database') || '/db';
    const clusterName = url.searchParams.get('cluster_name') || '';
    return {
        status: state.compositeStatus || 200,
        body: {
            databases: [
                {
                    Id: state.unrelated ? 'unrelated' : 'cp-id',
                    ...(state.unnamed ? {} : {Name: state.unrelated ? '/other' : database}),
                    Type: 'Dedicated',
                    ...(state.healthy ? {NodeIds: [1], Overall: 'Green'} : {}),
                    ControlPlane: {
                        id: 'cp-id',
                        name: `${clusterName}-display`,
                        folder_id: 'folder',
                        ...(state.unnamed ? {labels: {database_path: database}} : {}),
                        endpoint: 'grpcs://example.invalid:2135',
                        status: 'RUNNING',
                    },
                },
            ],
            ...(state.healthy ? {} : {errors: {viewer: 'Failed to resolve database nodes'}}),
        },
    };
}

function getMockResponse(url: URL, state: MockState): {status: number; body: unknown} {
    const {pathname} = url;
    if (pathname.endsWith('/meta/databases') || pathname.endsWith('/meta/cp_databases')) {
        return getCompositeResponse(url, state);
    }
    if (pathname.endsWith('/whoami')) {
        const status = state.whoamiStatus || (state.healthy ? 200 : 400);
        return {
            status,
            body:
                status === 200
                    ? {UserSID: 'test', IsViewerAllowed: true, IsMonitoringAllowed: true}
                    : {message: 'Failed to resolve database nodes'},
        };
    }
    if (pathname.endsWith('/capabilities')) {
        const runtimeStatus = state.capabilitiesStatus || (state.healthy ? 200 : 400);
        return {
            status: pathname.includes('/viewer/') ? runtimeStatus : 200,
            body: {Capabilities: {}, Settings: {Security: {UseLoginProvider: true}}},
        };
    }
    if (pathname.endsWith('/meta/db_clusters')) {
        return {
            status: 200,
            body: {
                clusters: [
                    {
                        name: url.searchParams.get('name'),
                        settings: {use_meta_proxy: state.useMetaProxy ?? true},
                    },
                ],
            },
        };
    }
    if (pathname.includes('/describe')) {
        return {status: 200, body: {PathDescription: {Self: {PathType: 'Dir', Name: 'db'}}}};
    }
    return {status: 200, body: {}};
}

async function mockApi(page: Page, state: MockState) {
    await page.addInitScript(() => {
        localStorage.setItem('enableTenantNavigationV2', 'true');
        localStorage.setItem('saved_tenant_initial_tab', JSON.stringify('query'));
    });
    await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (!/\/(?:meta|viewer|scheme|capabilities)(?:\/|$)/.test(url.pathname)) {
            await route.continue();
            return;
        }
        state.calls.push(url.pathname + url.search);

        const isHeld = () =>
            Boolean(state.holdCluster && url.pathname.endsWith('/meta/db_clusters'));
        while (isHeld()) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        const {status, body} = getMockResponse(url, state);
        await route.fulfill({status, contentType: 'application/json', body: JSON.stringify(body)});
    });
}

/** The database overview built from control plane data */
function cpInfo(page: Page) {
    return page.getByTestId('control-plane-info');
}

function runtimeLabel(page: Page) {
    return page.getByTestId('runtime-unavailable-label');
}

async function retry(page: Page) {
    const button = page.getByRole('button', {name: 'Retry runtime connection'});
    // The button is on the error page, or in the popover of the header label
    if (!(await button.isVisible())) {
        await runtimeLabel(page).click();
    }
    await button.click();
}

function countCalls(state: MockState, pattern: RegExp) {
    return state.calls.filter((path) => pattern.test(path)).length;
}

const RUNTIME_REQUESTS = /nodes|nodelist|describe|healthcheck|selfcheck|query/;

test('cold runtime outage shows control plane data in the regular page without runtime requests', async ({
    page,
}) => {
    const state: MockState = {calls: []};
    await mockApi(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a&databasePage=query');

    // The database section is shown instead of the requested one, which cannot work
    await expect(cpInfo(page)).toBeVisible();
    await expect(cpInfo(page).getByText('scope-a-display', {exact: true})).toBeVisible();
    await expect(runtimeLabel(page)).toBeVisible();
    await expect(page.locator('.ydb-navigation-wrapper__button-wrapper_disabled')).toHaveCount(2);

    // Only the tabs served by the control plane are offered
    await expect(page.getByRole('tab', {name: 'Nodes'})).toHaveCount(0);
    await page.getByRole('tab', {name: 'Backups'}).click();
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
    await page.getByRole('tab', {name: 'Monitoring'}).click();
    await expect(page.getByTestId('cp-extension-monitoring')).toHaveText('cp-id:scope-a-display');

    expect(countCalls(state, RUNTIME_REQUESTS)).toBe(0);
    // Extensions reuse the cached composite response
    expect(countCalls(state, /\/meta\/databases/)).toBe(1);
    // The saved default section is not overwritten
    expect(await page.evaluate(() => localStorage.getItem('saved_tenant_initial_tab'))).toBe(
        '"query"',
    );
});

test('a cold start without a runtime name takes the database name from the control plane', async ({
    page,
}) => {
    const state: MockState = {unnamed: true, calls: []};
    await mockApi(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a');

    await expect(cpInfo(page)).toBeVisible();
    await expect(page.getByTestId('database-header')).toContainText('/db');
    await expect(page.locator('.g-breadcrumbs')).toContainText('db');
    expect(countCalls(state, RUNTIME_REQUESTS)).toBe(0);
});

test('a hidden tab from the link falls back to the overview, a control plane tab is kept', async ({
    page,
}) => {
    const state: MockState = {calls: []};
    await mockApi(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a&diagnosticsTab=nodes');
    await expect(cpInfo(page)).toBeVisible();
    // The requested tab stays in the URL and opens once the runtime responds
    expect(new URL(page.url()).searchParams.get('diagnosticsTab')).toBe('nodes');

    await page.goto('/database?database=/db&clusterName=scope-a&diagnosticsTab=backups');
    await expect(page.getByTestId('cp-extension-backups')).toBeVisible();
    await expect(cpInfo(page)).toHaveCount(0);
});

test('retry restores the runtime page with its original deep link', async ({page}) => {
    const state: MockState = {calls: [], healthy: true, whoamiStatus: 400};
    await mockApi(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    await expect(cpInfo(page)).toBeVisible();
    expect(countCalls(state, RUNTIME_REQUESTS)).toBe(0);

    state.whoamiStatus = 200;
    await retry(page);

    await expect(cpInfo(page)).toHaveCount(0);
    await expect.poll(() => countCalls(state, /\/nodelist/)).toBeGreaterThan(0);
    expect(new URL(page.url()).searchParams.get('diagnosticsTab')).toBe('nodes');
});

test('runtime page stays mounted when a refetch fails or returns control plane data only', async ({
    page,
}) => {
    const state: MockState = {calls: [], healthy: true};
    await mockApi(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a&databasePage=query');

    const editor = page.locator('.query-editor__monaco .monaco-editor');
    // The editor chunk may still be compiling on a cold dev server
    await expect(editor).toBeVisible({timeout: 20000});
    await expect.poll(() => page.evaluate(() => Boolean(window.ydbEditor))).toBe(true);
    await page.evaluate(() => window.ydbEditor?.setValue('SELECT 42; -- unsaved'));
    const editorNode = await editor.elementHandle();
    const isEditorMounted = () => editorNode?.evaluate((node) => node.isConnected);

    // A failed refetch keeps the retained runtime data
    state.compositeStatus = 500;
    state.compositeMessage = 'Transient composite failure';
    await page.evaluate(() => window.controlPlaneTest.refreshTenant());
    expect(await isEditorMounted()).toBe(true);
    await expect(runtimeLabel(page)).toHaveCount(0);

    // A control plane only refetch warns instead of replacing the page
    state.compositeStatus = undefined;
    state.compositeMessage = undefined;
    state.healthy = false;
    state.whoamiStatus = 200;
    await page.evaluate(() => window.controlPlaneTest.refreshTenant());
    await expect(runtimeLabel(page)).toBeVisible();
    await expect(cpInfo(page)).toHaveCount(0);
    expect(await isEditorMounted()).toBe(true);
    expect(await page.evaluate(() => window.ydbEditor?.getValue())).toBe('SELECT 42; -- unsaved');
    // Runtime actions are not offered without runtime data
    await expect(
        page.locator('header').getByRole('button', {name: 'Copy path', exact: true}),
    ).toHaveCount(0);

    state.healthy = true;
    await retry(page);
    await expect(runtimeLabel(page)).toHaveCount(0);
    expect(await isEditorMounted()).toBe(true);
    await expect(
        page.locator('header').getByRole('button', {name: 'Copy path', exact: true}),
    ).toBeVisible();
});

test('retry shows the actual composite failure until the runtime recovers', async ({page}) => {
    const state: MockState = {calls: []};
    await mockApi(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a&diagnosticsTab=backups');
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');

    state.compositeStatus = 500;
    state.compositeMessage = 'Composite database request failed';
    await retry(page);
    await expect(page.getByText('Composite database request failed', {exact: true})).toBeVisible();
    // Control plane data of a failed request is not shown
    await expect(cpInfo(page)).toHaveCount(0);
    await expect(page.getByTestId('cp-extension-backups')).toHaveCount(0);

    state.compositeStatus = undefined;
    state.compositeMessage = undefined;
    await retry(page);
    await expect(page.getByTestId('cp-extension-backups')).toHaveText('cp-id:scope-a-display');
});

for (const deniedSource of ['whoamiStatus', 'capabilitiesStatus', 'compositeStatus'] as const) {
    test(`${deniedSource} 403 hides control plane data and keeps the custom access error`, async ({
        page,
    }) => {
        const state: MockState = {calls: []};
        await mockApi(page, state);
        await page.goto('/database?database=/db&clusterName=scope-a');
        await expect(cpInfo(page)).toBeVisible();

        state[deniedSource] = 403;
        await retry(page);
        await expect(page.getByText('Request access to the database')).toBeVisible();
        await expect(cpInfo(page)).toHaveCount(0);
        await expect(page.getByText('scope-a-display', {exact: true})).toHaveCount(0);
        expect(countCalls(state, RUNTIME_REQUESTS)).toBe(0);
    });
}

test('control plane data of another database is not shown', async ({page}) => {
    const state: MockState = {calls: [], unrelated: true};
    await mockApi(page, state);
    await page.goto('/database?database=/db&clusterName=scope-a');
    // The regular page reports its own runtime errors
    await expect(page.getByText('400 Bad Request')).toBeVisible();
    await expect(cpInfo(page)).toHaveCount(0);
    await expect(page.getByText('scope-a-display', {exact: true})).toHaveCount(0);
});

test('a late 401 for the previous database does not log the user out', async ({page}) => {
    const state: MockState = {calls: [], healthy: true};
    await mockApi(page, state);
    let releasePrevious: () => void = () => undefined;
    const release = new Promise<void>((resolve) => {
        releasePrevious = resolve;
    });
    let previousHeld = false;
    await page.route('**/viewer/json/whoami?*', async (route) => {
        if (new URL(route.request().url()).searchParams.get('database') !== '/db-a') {
            await route.fallback();
            return;
        }
        previousHeld = true;
        await release;
        await route.fulfill({status: 401, contentType: 'application/json', body: '{}'});
    });

    await page.goto('/database?database=/db-a&clusterName=scope-a');
    await expect.poll(() => previousHeld).toBe(true);
    await page.evaluate(() =>
        window.controlPlaneTest.navigate('/database?database=/db-b&clusterName=scope-a'),
    );
    await expect
        .poll(() => page.evaluate(() => window.controlPlaneTest.whoamiStatus('/db-b')))
        .toBe('fulfilled');

    releasePrevious();
    await expect
        .poll(() => page.evaluate(() => window.controlPlaneTest.whoamiStatus('/db-a')))
        .toBe('rejected');
    expect(await page.evaluate(() => window.controlPlaneTest.isAuthenticated())).toBe(true);
    expect(new URL(page.url()).searchParams.get('database')).toBe('/db-b');
});

test('a Viewer waits for cluster settings instead of a speculative composite request', async ({
    page,
}) => {
    const state: MockState = {calls: [], healthy: true, useMetaProxy: false, holdCluster: true};
    await mockApi(page, state);
    await page.goto(
        '/database?database=/db&clusterName=scope-a&databasePage=diagnostics&diagnosticsTab=nodes',
    );
    await expect.poll(() => countCalls(state, /\/meta\/db_clusters/)).toBeGreaterThan(0);
    expect(countCalls(state, /\/meta\/(databases|cp_databases)/)).toBe(0);

    state.holdCluster = false;
    await expect.poll(() => countCalls(state, /\/meta\/cp_databases/)).toBe(1);
    await expect.poll(() => countCalls(state, /\/nodelist/)).toBeGreaterThan(0);
    expect(countCalls(state, /\/meta\/databases/)).toBe(0);
    await expect(cpInfo(page)).toHaveCount(0);
});
