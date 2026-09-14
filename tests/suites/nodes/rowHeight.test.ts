import {expect, test} from '@playwright/test';

import {EFlag} from '../../../src/types/api/enums';
import {TPDiskState} from '../../../src/types/api/pdisk';
import {ClusterNodesTable} from '../paginatedTable/paginatedTable';

import {NodesPage} from './NodesPage';

test('virtualized row heights follow PDisks column visibility', async ({page}) => {
    const nodes = Array.from({length: 600}, (_, index) => ({
        NodeId: index + 1,
        SystemState: {
            NodeId: index + 1,
            Host: `height-node-${index + 1}`,
            SystemState: EFlag.Green,
            Version: 'test',
        },
        PDisks: [{NodeId: index + 1, PDiskId: 1, State: TPDiskState.Normal}],
    }));
    await page.route(/\/viewer\/|\/meta\//, async (route) => {
        const url = new URL(route.request().url());
        let json: unknown = {};
        if (url.pathname.endsWith('/nodes')) {
            const offset = Number(url.searchParams.get('offset') ?? 0);
            const limit = Number(url.searchParams.get('limit') ?? nodes.length);
            json = {
                TotalNodes: String(nodes.length),
                FoundNodes: String(nodes.length),
                Nodes: nodes.slice(offset, offset + limit),
            };
        } else if (url.pathname.endsWith('/nodelist')) {
            json = nodes.map(({SystemState}) => SystemState);
        } else if (url.pathname.endsWith('/whoami')) {
            json = {UserSID: 'height-test', IsViewerAllowed: true, IsMonitoringAllowed: true};
        } else if (url.pathname.endsWith('/capabilities')) {
            json = {Capabilities: {'/viewer/json/nodes': 1}};
        } else if (url.pathname.endsWith('/cluster')) {
            json = {Name: 'height test', Overall: EFlag.Green, Nodes: nodes.length};
        } else if (url.pathname.endsWith('/tenantinfo')) {
            json = {TenantInfo: []};
        }
        await route.fulfill({json});
    });
    await page.setViewportSize({width: 1280, height: 600});
    await new NodesPage(page).goto({clusterName: 'height-test', backend: 'https://height.test'});
    const table = new ClusterNodesTable(page);
    const controls = table.getControls();
    const firstRow = page.getByText('height-node-1', {exact: true}).locator('xpath=ancestor::tr');

    for (const withDisks of [false, true, false]) {
        await table.scrollToPosition(0);
        await controls.openColumnSetup();
        if (withDisks) {
            await controls.setColumnChecked('PDisks');
        } else {
            await controls.setColumnUnchecked('PDisks');
        }
        await controls.closeColumnSetup();
        await table.waitForTableData();
        await expect(firstRow).toBeVisible();
        const height = withDisks ? 51 : 41;
        await expect
            .poll(() => firstRow.evaluate((row) => row.getBoundingClientRect().height))
            .toBe(height);

        await table.scrollToPosition(height * 300);
        await expect(page.getByText('height-node-301', {exact: true})).toBeVisible();
        const separator = page.locator('.ydb-paginated-table__separator-beginning');
        await expect(separator).toBeAttached();
        // Hidden rows must occupy exactly the same space as their rendered counterparts.
        const separatorHeight = await separator.evaluate(
            (row) => row.getBoundingClientRect().height,
        );
        expect(separatorHeight).toBeGreaterThan(0);
        expect(separatorHeight % height).toBe(0);
    }
});
