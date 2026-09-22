import {expect, test} from '@playwright/test';

import {database} from '../../utils/constants';
import {ClusterNodesTable, DiagnosticsNodesTable} from '../paginatedTable/paginatedTable';
import {TenantPage} from '../tenant/TenantPage';

import {NodesPage} from './NodesPage';

for (const scope of ['cluster', 'database'] as const) {
    test(`IC port uses row endpoints and persists in the ${scope} nodes table`, async ({page}) => {
        const port = scope === 'database' ? 19001 : 19000;
        const endpoints = [
            [
                {Name: 'grpc', Address: ':2135'},
                {Name: 'ic', Address: `:${port}`},
            ],
            [{Name: 'ic', Address: ':19002'}],
            [{Name: 'grpc', Address: ':2135'}],
            undefined,
            [{Name: 'ic', Address: ''}],
        ];
        const nodes = endpoints.map((Endpoints, index) => ({
            NodeId: index + 1,
            SystemState: {Host: 'shared-host', SystemState: 'Green', Endpoints},
        }));
        await page.route(/\/viewer\/|\/meta\//, async (route) => {
            const url = new URL(route.request().url());
            let json: unknown = {};
            if (url.pathname.endsWith('/nodes')) {
                json = {TotalNodes: '5', FoundNodes: '5', Nodes: nodes};
            } else if (url.pathname.endsWith('/nodelist')) {
                json = nodes.map(({NodeId}) => ({Id: NodeId, Host: 'shared-host', Port: 19999}));
            } else if (url.pathname.endsWith('/whoami')) {
                json = {
                    UserSID: 'ic-port-test',
                    IsViewerAllowed: true,
                    IsMonitoringAllowed: true,
                    IsDatabaseAllowed: true,
                };
            } else if (url.pathname.endsWith('/capabilities')) {
                json = {Capabilities: {'/viewer/json/nodes': 1}};
            } else if (url.pathname.endsWith('/cluster')) {
                json = {Name: 'ic-port-test', Overall: 'Green', Nodes: nodes.length};
            } else if (url.pathname.endsWith('/tenantinfo')) {
                json = {TenantInfo: [{Name: database, Type: 'Dedicated', Overall: 'Green'}]};
            } else if (url.pathname.endsWith('/describe')) {
                json = {
                    Path: database,
                    PathDescription: {Self: {Name: 'local', PathType: 'EPathTypeSubDomain'}},
                };
            }
            await route.fulfill({json});
        });

        if (scope === 'cluster') {
            await new NodesPage(page).goto();
        } else {
            await new TenantPage(page).goto({
                schema: database,
                database,
                databasePage: 'diagnostics',
                diagnosticsTab: 'nodes',
            });
        }
        const table =
            scope === 'cluster' ? new ClusterNodesTable(page) : new DiagnosticsNodesTable(page);
        await table.waitForTableData();
        const portHeader = page.getByRole('columnheader', {name: 'IC port', exact: true});
        await expect(portHeader).toBeHidden();

        const controls = table.getControls();
        await controls.openColumnSetup();
        expect(await controls.isColumnVisible('ICPort')).toBe(false);
        await controls.setColumnChecked('ICPort');
        await controls.closeColumnSetup();
        await expect(portHeader).toBeVisible();
        const headers = await table.getHeaders();
        expect(headers[headers.indexOf('Host') + 1]).toBe('IC port');
        await expect
            .poll(() => table.getColumnValues('IC port'))
            .toEqual([String(port), '19002', '—', '—', '—']);

        await page.reload();
        await expect(portHeader).toBeVisible();
        await expect
            .poll(() => table.getColumnValues('IC port'))
            .toEqual([String(port), '19002', '—', '—', '—']);

        const requestWithoutHost = page.waitForRequest((request) => {
            const url = new URL(request.url());
            return (
                url.pathname.endsWith('/nodes') &&
                !url.searchParams.get('fields_required')?.split(',').includes('Host')
            );
        });
        await controls.openColumnSetup();
        await controls.setColumnUnchecked('Host');
        await controls.closeColumnSetup();
        const request = await requestWithoutHost;
        expect(new URL(request.url()).searchParams.get('fields_required')?.split(',')).toContain(
            'SystemState',
        );

        await controls.openColumnSetup();
        await controls.setColumnUnchecked('ICPort');
        await controls.closeColumnSetup();
        await expect(portHeader).toBeHidden();
    });
}
