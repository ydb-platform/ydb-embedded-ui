import type {Page, Route} from '@playwright/test';

import {HIVE_ID, TABLET_ID} from './tabletObjectLinkMocks';

interface Options {
    flag?: boolean;
    capabilityError?: number | 'network';
    tabletType?: string;
    admin?: boolean;
    monitoring?: boolean;
    diskApi?: boolean;
}

export async function setupTabletDevUiMocks(
    page: Page,
    options: Options,
    baseURL = 'http://localhost:3000',
) {
    const requests: {method: string; url: string; body: unknown; accept?: string}[] = [];
    let state = 'Active';
    const tabletType = options.tabletType ?? 'DataShard';
    const json = (route: Route, body: object, status = 200) =>
        route.fulfill({status, contentType: 'application/json', body: JSON.stringify(body)});
    const appOrigin = new URL(baseURL).origin;

    // Mock every non-UI origin, including popups; never forward requests to a real backend.
    await page.context().route('**/*', (route) => {
        if (new URL(route.request().url()).origin === appOrigin) {
            return route.continue();
        }
        return json(route, {});
    });
    await page.route('**/viewer/json/nodelist*', (route) => json(route, [{Id: 1, Host: 'node-1'}]));

    await page.route('**/viewer/capabilities*', (route) => {
        if (options.capabilityError === 'network') {
            return route.abort('connectionfailed');
        }
        return json(
            route,
            {
                Capabilities: {'/pdisk/info': options.diskApi ? 1 : 0},
                Settings: {Features: {EnableTabletDevUiSecurePath: options.flag}},
            },
            options.capabilityError ?? 200,
        );
    });
    await page.route('**/viewer/json/whoami*', (route) =>
        json(route, {
            IsDatabaseAllowed: true,
            IsViewerAllowed: true,
            IsMonitoringAllowed: options.monitoring ?? true,
            IsAdministrationAllowed: options.admin ?? true,
        }),
    );
    await page.route('**/viewer/json/tabletinfo*', (route) => {
        const tablet = {
            TabletId: TABLET_ID,
            Type: tabletType,
            State: state,
            Overall: 'Green',
            Leader: true,
            NodeId: 1,
            HiveId: HIVE_ID,
            TenantId: {SchemeShard: '1', PathId: '2'},
        };
        return json(
            route,
            new URL(route.request().url()).searchParams.get('merge') === 'false'
                ? {'1': {TabletStateInfo: [tablet]}}
                : {TabletStateInfo: [tablet]},
        );
    });
    await page.context().route(/\/(?:tablets\/app|vdisk\/evict)/, async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        requests.push({
            method: request.method(),
            url: request.url(),
            body: request.postDataJSON(),
            accept: request.headers().accept,
        });
        if (options.admin === false && url.pathname.endsWith('/secure')) {
            return json(route, {error: 'Forbidden'}, 403);
        }
        if (url.pathname.endsWith('/vdisk/evict') || url.searchParams.get('exec') === '1') {
            return json(route, {result: true});
        }
        const action = url.searchParams.get('page');
        if (action === 'StopTablet' || action === 'ResumeTablet') {
            state = action === 'StopTablet' ? 'Stopped' : 'Active';
            return json(route, {});
        }
        if (action === 'TabletInfo') {
            return json(route, {
                Id: TABLET_ID,
                BoundChannels: [{}, {StoragePoolName: 'tablet-devui-test-pool'}],
                TabletStorageInfo: {
                    Channels: [{Channel: 1, History: [{FromGeneration: 1, GroupID: 12345}]}],
                },
            });
        }
        return route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: `<h1>App for ${tabletType} ${TABLET_ID}</h1>`,
        });
    });

    return {requests};
}
