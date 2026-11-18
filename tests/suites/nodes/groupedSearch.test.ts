import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';

import {NodesPage} from './NodesPage';

const TARGET_HOST = 'ydb-ss7.example.com';
const NODES = [
    {
        NodeId: 1,
        PileName: 'dc1',
        SystemState: {Host: 'ydb-ss1.example.com', NodeName: 'storage-dc1'},
    },
    {
        NodeId: 2,
        PileName: 'dc1',
        SystemState: {Host: 'ydb-ss1.example.com', NodeName: 'compute-dc1'},
    },
    {NodeId: 3, PileName: 'dc2', SystemState: {Host: TARGET_HOST, NodeName: 'storage-dc2'}},
    {NodeId: 4, PileName: 'dc2', SystemState: {Host: TARGET_HOST, NodeName: 'compute-dc2'}},
];

async function mockNodesSearch(page: Page, columns: string[]) {
    await page.addInitScript((selectedColumns) => {
        localStorage.setItem('nodesTableSelectedColumns', JSON.stringify(selectedColumns));
    }, columns);

    await page.route('**/viewer/**', async (route) => {
        const url = new URL(route.request().url());
        let json: unknown = {};

        if (url.pathname.endsWith('/whoami')) {
            json = {UserSID: 'nodes-search-test', IsMonitoringAllowed: true, IsViewerAllowed: true};
        } else if (url.pathname.endsWith('/capabilities')) {
            json = {
                Capabilities: {'/viewer/nodes': 20},
                Settings: {Cluster: {BridgeModeEnabled: true}},
            };
        } else if (url.pathname.endsWith('/nodelist')) {
            json = NODES.map(({NodeId, SystemState}) => ({Id: NodeId, Host: SystemState.Host}));
        } else if (url.pathname.endsWith('/nodes')) {
            const params = url.searchParams;
            const filter = params.get('filter') || '';
            const fields = params.get('fields_required')?.split(',') || [];

            // Viewer searches Host and NodeName only when those fields are requested.
            const matchingNodes = NODES.filter(
                ({NodeId, SystemState, PileName}) =>
                    (!filter ||
                        String(NodeId).includes(filter) ||
                        (fields.includes('Host') && SystemState.Host.includes(filter)) ||
                        (fields.includes('NodeName') && SystemState.NodeName.includes(filter))) &&
                    (!params.has('filter_group') || params.get('filter_group') === PileName),
            );

            if (params.has('group')) {
                const groups = new Map<string, number>();
                for (const node of matchingNodes) {
                    groups.set(node.PileName, (groups.get(node.PileName) || 0) + 1);
                }
                json = {
                    TotalNodes: String(NODES.length),
                    FoundNodes: String(matchingNodes.length),
                    NodeGroups: Array.from(groups, ([GroupName, NodeCount]) => ({
                        GroupName,
                        NodeCount,
                    })),
                };
            } else {
                const offset = Number(params.get('offset') || 0);
                const limit = Number(params.get('limit') ?? matchingNodes.length);
                json = {
                    TotalNodes: String(NODES.length),
                    FoundNodes: String(matchingNodes.length),
                    Nodes: matchingNodes.slice(offset, offset + limit),
                };
            }
        }

        await route.fulfill({json});
    });
}

for (const scenario of [
    {name: 'hostname', search: TARGET_HOST, columns: ['NodeId', 'Host'], nodeIds: [3, 4]},
    {name: 'node name', search: 'compute-dc2', columns: ['NodeId', 'NodeName'], nodeIds: [4]},
    {name: 'node ID', search: '4', columns: ['NodeId'], nodeIds: [4]},
]) {
    test(`preserves ${scenario.name} search when grouping by pile`, async ({page}) => {
        await mockNodesSearch(page, scenario.columns);
        const view = new NodesPage(page);
        await view.goto();
        await expect(view.entitiesCount).toHaveText('Nodes: 4');

        await view.searchInput.fill(scenario.search);
        await expect(view.entitiesCount).toHaveText(`Nodes: ${scenario.nodeIds.length} of 4`);
        for (const nodeId of scenario.nodeIds) {
            await expect(
                view.table.getByRole('cell', {name: String(nodeId), exact: true}),
            ).toBeVisible();
        }

        await view.selectGroupByOption('Pile Name');
        const group = view.selectTableGroup('dc2');
        await expect(group).toContainText(`Nodes: ${scenario.nodeIds.length}`);
        await expect(view.selectTableGroup('dc1')).toHaveCount(0);
        await expect(view.entitiesCount).toHaveText(`Nodes: ${scenario.nodeIds.length} of 4`);

        await view.expandTableGroup('dc2');
        for (const nodeId of scenario.nodeIds) {
            await expect(
                view.table.getByRole('cell', {name: String(nodeId), exact: true}),
            ).toBeVisible();
        }
        await expect(view.table.getByRole('row').filter({has: page.getByRole('cell')})).toHaveCount(
            scenario.nodeIds.length,
        );

        const unfilteredGroups = page.waitForResponse((response) => {
            const url = new URL(response.url());
            return (
                url.pathname.endsWith('/nodes') &&
                url.searchParams.get('group') === 'PileName' &&
                !url.searchParams.has('filter')
            );
        });
        await view.searchInput.fill('');
        const response = await unfilteredGroups;
        expect(new URL(response.url()).searchParams.has('fields_required')).toBe(false);
        await expect(view.entitiesCount).toHaveText('Nodes: 4');
        await expect(view.selectTableGroup('dc1')).toContainText('Nodes: 2');
        await expect(view.selectTableGroup('dc2')).toContainText('Nodes: 2');
    });
}
