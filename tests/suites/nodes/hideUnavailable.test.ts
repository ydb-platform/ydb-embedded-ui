import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {HideUnavailableNodesPage} from './HideUnavailableNodesPage';

async function mockNodes(page: Page, capability: number | 'missing' | 'error' = 1) {
    const requests: URL[] = [];
    await page.addInitScript(() => {
        localStorage.setItem('enableStorageExpertMode', 'true');
        for (const key of ['nodesTableSelectedColumns', 'storageNodesSelectedColumns']) {
            localStorage.setItem(key, JSON.stringify(['NodeId', 'Host']));
        }
    });
    await page.route('**/viewer/**', async (route) => {
        const url = new URL(route.request().url());
        let json: unknown = {};
        if (url.pathname.endsWith('/whoami')) {
            json = {UserSID: 'nodes-test', IsMonitoringAllowed: true, IsViewerAllowed: true};
        } else if (url.pathname.endsWith('/capabilities')) {
            if (capability === 'error') {
                await route.fulfill({status: 404, json: {}});
                return;
            }
            json = {
                Capabilities: {
                    '/viewer/nodes': 20,
                    '/storage/groups': 10,
                    ...(capability === 'missing' ? {} : {'/viewer/nodes/alive': capability}),
                },
            };
        } else if (url.pathname.endsWith('/nodelist')) {
            json = [
                {Id: 1, Host: 'connected-yellow'},
                {Id: 2, Host: 'connected-red'},
                {Id: 3, Host: 'disconnected'},
            ];
        } else if (url.pathname.endsWith('/tenantinfo')) {
            json = {TenantInfo: [{Name: '/local', Type: 'Dedicated', Overall: 'Green'}]};
        } else if (url.pathname.endsWith('/describe')) {
            json = {
                Path: '/local',
                PathDescription: {Self: {Name: 'local', PathType: 'EPathTypeSubDomain'}},
            };
        } else if (url.pathname.endsWith('/nodes')) {
            requests.push(url);
            const alive = url.searchParams.get('alive') === 'true';
            const nodes = [
                {NodeId: 1, SystemState: {Host: 'connected-yellow', SystemState: 'Yellow'}},
                {NodeId: 2, SystemState: {Host: 'connected-red', SystemState: 'Red'}},
                ...(alive
                    ? []
                    : [{NodeId: 3, Disconnected: true, SystemState: {Host: 'disconnected'}}]),
            ];
            json = {
                TotalNodes: '3',
                FoundNodes: String(nodes.length),
                ...(url.searchParams.has('group')
                    ? {
                          NodeGroups: [{GroupName: 'test-dc', NodeCount: nodes.length}],
                      }
                    : {Nodes: nodes}),
            };
        }
        await route.fulfill({json});
    });
    return requests;
}

for (const storage of [false, true]) {
    test.describe(
        storage ? 'Storage Nodes hide unavailable' : 'Database Nodes hide unavailable',
        () => {
            for (const grouped of [false, true]) {
                test(`filters ${grouped ? 'groups and their rows' : 'the list'} and preserves other filters`, async ({
                    page,
                }, testInfo) => {
                    const requests = await mockNodes(page);
                    const view = new HideUnavailableNodesPage(page, storage);
                    await view.goto({
                        [storage ? 'nodesSearch' : 'search']: 'connected',
                        ...(grouped
                            ? {[storage ? 'storageNodesGroupBy' : 'nodesGroupBy']: 'DC'}
                            : {}),
                    });
                    await expect(view.toggle).not.toBeChecked();
                    if (grouped) {
                        await expect(view.group()).toContainText('3');
                        await view.group().click();
                    }
                    await expect(view.node('disconnected')).toBeVisible();
                    await expect(view.count).toHaveText('Nodes: 3');
                    await view.toggle.focus();
                    await page.keyboard.press('Space');
                    await expect(view.toggle).toBeChecked();
                    await expect(view.node('disconnected')).toHaveCount(0);
                    await expect(view.node('connected-yellow')).toBeVisible();
                    await expect(view.node('connected-red')).toBeVisible();
                    await expect(view.count).toHaveText('Nodes: 2 of 3');
                    if (grouped) {
                        await expect(view.group()).toContainText('2');
                        expect(
                            requests.some(
                                (url) =>
                                    url.searchParams.has('group') &&
                                    url.searchParams.get('alive') === 'true',
                            ),
                        ).toBe(true);
                        expect(
                            requests.some(
                                (url) =>
                                    url.searchParams.has('filter_group') &&
                                    url.searchParams.get('alive') === 'true',
                            ),
                        ).toBe(true);
                    }
                    expect(requests.at(-1)?.searchParams.get('filter')).toBe('connected');
                    if (!storage) {
                        expect(requests.at(-1)?.searchParams.get('database')).toBe('/local');
                    }
                    await page.screenshot({path: testInfo.outputPath('hide-unavailable-on.png')});
                    await page.reload();
                    await expect(view.toggle).toBeChecked();
                    if (grouped) {
                        await view.group().click();
                    }
                    await expect(view.node('disconnected')).toHaveCount(0);
                    await view.toggleControl.click();
                    await expect(view.node('disconnected')).toBeVisible();
                    await expect(view.count).toHaveText('Nodes: 3');
                    expect(
                        new URL(page.url()).searchParams.get(storage ? 'nodesSearch' : 'search'),
                    ).toBe('connected');
                    expect(new URL(page.url()).searchParams.has('hideUnavailable')).toBe(false);
                    expect(requests.at(-1)?.searchParams.has('alive')).toBe(false);
                });
            }

            for (const capability of ['missing', 0, 'error'] as const) {
                test(`hides the switch for capability ${capability} and ignores a saved selection`, async ({
                    page,
                }) => {
                    const requests = await mockNodes(page, capability);
                    const view = new HideUnavailableNodesPage(page, storage);
                    await view.goto({hideUnavailable: 1});
                    await expect(view.node('disconnected')).toBeVisible();
                    await expect(view.toggle).toHaveCount(0);
                    expect(requests.every((url) => !url.searchParams.has('alive'))).toBe(true);
                    await expect
                        .poll(() => new URL(page.url()).searchParams.has('hideUnavailable'))
                        .toBe(false);
                });
            }
        },
    );
}

for (const storage of [false, true]) {
    for (const theme of ['light', 'dark']) {
        test(`switch layout in ${storage ? 'Storage' : 'database Nodes'} in ${theme} theme`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
            await mockNodes(page);
            const view = new HideUnavailableNodesPage(page, storage);
            await view.goto();
            await expect(view.node('disconnected')).toBeVisible();
            if (storage) {
                await expect(
                    page.getByRole('button', {name: 'Expert mode', exact: true}),
                ).toBeVisible();
            }
            for (const width of [1440, 1280]) {
                await page.setViewportSize({width, height: 900});
                await view.expectToolbarLayout(storage);
                await page.screenshot({path: testInfo.outputPath(`switch-off-${width}.png`)});
            }
            await view.toggleControl.click();
            await expect(view.node('disconnected')).toHaveCount(0);
            await expect(view.node('connected-yellow')).toBeVisible();
            await expect(view.node('connected-red')).toBeVisible();
            for (const width of [1440, 1280]) {
                await page.setViewportSize({width, height: 900});
                await view.expectToolbarLayout(storage);
                await page.screenshot({path: testInfo.outputPath(`switch-on-${width}.png`)});
            }
        });
    }
}
