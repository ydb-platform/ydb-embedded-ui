import {expect, test} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {PageModel} from '../../models/PageModel';

class SearchPage extends PageModel {
    readonly input: Locator;
    readonly rows: Locator;

    constructor(page: Page, path: string, type?: string) {
        super(page, path, {type});
        this.input = page.locator('.ydb-search input');
        this.rows = page.locator('.ydb-paginated-table__row');
    }

    async enableAutoRefresh() {
        await this.page.getByTestId('ydb-autorefresh-select').click();
        await this.page.getByRole('option', {name: '15 sec', exact: true}).click();
    }
}

for (const scenario of [
    {name: 'Nodes', path: 'cluster/nodes', param: 'search', endpoint: '/nodes'},
    {
        name: 'Storage Nodes',
        path: 'cluster/storage',
        type: 'nodes',
        param: 'nodesSearch',
        endpoint: '/nodes',
    },
    {
        name: 'Storage Groups',
        path: 'cluster/storage',
        type: 'groups',
        param: 'groupsSearch',
        endpoint: '/groups',
    },
]) {
    test(`${scenario.name} preserves search and caret during a polling response`, async ({
        page,
    }) => {
        let releaseResponse = () => {};
        let holdResponse = false;
        const responseGate = new Promise<void>((resolve) => {
            releaseResponse = resolve;
        });
        await page.route(/\/viewer\/|\/storage\/|\/meta\//, async (route) => {
            const url = new URL(route.request().url());
            const filter = url.searchParams.get('filter') ?? '';
            const names = ['alpha-node', 'beta-node'].filter((name) => name.includes(filter));
            let json: unknown = {};
            if (url.pathname.endsWith(scenario.endpoint) && holdResponse) {
                await responseGate;
            }
            if (url.pathname.endsWith('/nodes')) {
                json = {
                    TotalNodes: '2',
                    FoundNodes: String(names.length),
                    Nodes: names.map((Host) => ({
                        NodeId: Host === 'alpha-node' ? 1 : 2,
                        SystemState: {Host, SystemState: 'Green'},
                    })),
                };
            } else if (url.pathname.endsWith('/nodelist')) {
                json = [
                    {Id: 1, Host: 'alpha-node'},
                    {Id: 2, Host: 'beta-node'},
                ];
            } else if (url.pathname.endsWith('/groups')) {
                json = {
                    TotalGroups: 2,
                    FoundGroups: names.length,
                    StorageGroups: names.map((PoolName) => ({
                        GroupId: PoolName === 'alpha-node' ? '100' : '200',
                        PoolName,
                        State: 'ok',
                        VDisks: [],
                    })),
                };
            } else if (url.pathname.endsWith('/whoami')) {
                json = {IsViewerAllowed: true, IsMonitoringAllowed: true};
            } else if (url.pathname.endsWith('/capabilities')) {
                json = {Capabilities: {}};
            } else if (url.pathname.endsWith('/cluster')) {
                json = {Name: 'search-test', Overall: 'Green', Nodes: 2};
            }
            await route.fulfill({json});
        });

        const model = new SearchPage(page, scenario.path, scenario.type);
        await model.goto();
        await expect(model.rows.filter({hasText: 'alpha-node'})).toHaveCount(1);
        await expect(model.rows.filter({hasText: 'beta-node'})).toHaveCount(1);

        await model.input.fill('alpha');
        await expect(model.rows.filter({hasText: 'alpha-node'})).toHaveCount(1);
        await expect(model.rows.filter({hasText: 'beta-node'})).toHaveCount(0);

        await page.clock.install();
        await model.enableAutoRefresh();
        holdResponse = true;
        const pollingRequest = page.waitForRequest((request) => {
            const url = new URL(request.url());
            return (
                url.pathname.endsWith(scenario.endpoint) &&
                url.searchParams.get('filter') === 'alpha'
            );
        });
        await page.clock.fastForward(15_000);
        const request = await pollingRequest;
        await model.input.pressSequentially('-node');
        await model.input.press('ArrowLeft');
        const response = page.waitForResponse((candidate) => candidate.request() === request);
        holdResponse = false;
        releaseResponse();
        await response;

        await expect(model.input).toHaveValue('alpha-node');
        await expect(model.input).toBeFocused();
        await expect(model.input).toHaveJSProperty('selectionStart', 9);
        await expect(page).toHaveURL(new RegExp(`${scenario.param}=alpha-node`));
        await expect(model.rows.filter({hasText: 'alpha-node'})).toHaveCount(1);
        await expect(model.rows.filter({hasText: 'beta-node'})).toHaveCount(0);

        await model.input.fill('');
        await expect(model.rows.filter({hasText: 'beta-node'})).toHaveCount(1);
        expect(new URL(page.url()).searchParams.has(scenario.param)).toBe(false);
    });
}
