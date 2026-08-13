import type {Page} from '@playwright/test';

import type {THiveInfoResponse} from '../../../src/types/api/tablet';

export const TABLET_ID = '101';
export const HIVE_ID = '55';
export const DATABASE = '/Root/test';
export const OBJECT_PATH = '/Root/test/folder/my-object';
export const RELATIVE_OBJECT_PATH = 'folder/my-object';

type SupportedTabletType = 'DataShard' | 'PersQueue' | 'PersQueueReadBalancer';

interface TabletObjectLinkMockOptions {
    tabletType: SupportedTabletType;
    isMonitoringAllowed?: boolean;
    hiveInfo?: THiveInfoResponse;
}

const JSON_CONTENT_TYPE = 'application/json';

export async function setupTabletObjectLinkMocks(page: Page, options: TabletObjectLinkMockOptions) {
    const tablet = {
        TabletId: TABLET_ID,
        Type: options.tabletType,
        State: 'Active',
        Overall: 'Green',
        Leader: true,
        NodeId: 1,
        HiveId: HIVE_ID,
        TenantId: {SchemeShard: '1', PathId: '2'},
    };

    await page.route('**/viewer/capabilities*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: JSON_CONTENT_TYPE,
            body: JSON.stringify({Capabilities: {}, Settings: {}}),
        });
    });
    await page.route('**/viewer/json/whoami*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: JSON_CONTENT_TYPE,
            body: JSON.stringify({
                UserSID: 'test-user',
                IsDatabaseAllowed: true,
                IsViewerAllowed: true,
                IsMonitoringAllowed: options.isMonitoringAllowed,
                IsAdministrationAllowed: false,
            }),
        });
    });
    await page.route('**/viewer/json/tabletinfo*', async (route) => {
        const url = new URL(route.request().url());
        const body =
            url.searchParams.get('merge') === 'false'
                ? {'1': {TabletStateInfo: [tablet]}}
                : {TabletStateInfo: [tablet]};

        await route.fulfill({
            status: 200,
            contentType: JSON_CONTENT_TYPE,
            body: JSON.stringify(body),
        });
    });
    await page.route('**/viewer/json/nodelist*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: JSON_CONTENT_TYPE,
            body: JSON.stringify([{Id: 1, Host: 'node-1'}]),
        });
    });

    let hiveRequestCount = 0;
    await page.route('**/viewer/json/hiveinfo*', async (route) => {
        hiveRequestCount += 1;
        await route.fulfill({
            status: 200,
            contentType: JSON_CONTENT_TYPE,
            body: JSON.stringify(
                options.hiveInfo ?? {
                    Tablets: [
                        {
                            TabletID: TABLET_ID,
                            TabletOwner: {Owner: '42'},
                            ObjectId: '99',
                        },
                    ],
                },
            ),
        });
    });
    await page.route('**/viewer/json/describe*', async (route) => {
        const pathId = new URL(route.request().url()).searchParams.get('path_id');
        await route.fulfill({
            status: 200,
            contentType: JSON_CONTENT_TYPE,
            body: JSON.stringify({Path: pathId === '99' ? OBJECT_PATH : DATABASE}),
        });
    });

    return {
        getHiveRequestCount: () => hiveRequestCount,
    };
}
