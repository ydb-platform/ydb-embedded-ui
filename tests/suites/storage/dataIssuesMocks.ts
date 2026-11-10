import type {Page} from '@playwright/test';

import type {TNodesInfo} from '../../../src/types/api/nodes';
import type {StorageGroupsResponse} from '../../../src/types/api/storage';

export const DATA_ISSUES_GROUP_ID = '2181038080';

type GroupsResponseFactory = (url: URL) => StorageGroupsResponse;
type NodesResponseFactory = (url: URL) => Partial<TNodesInfo>;

interface DataIssuesMocks {
    groups?: GroupsResponseFactory;
    nodes?: NodesResponseFactory;
}

export function createGroupsResponse(
    extra: Partial<StorageGroupsResponse> = {},
): StorageGroupsResponse {
    return {
        TotalGroups: 1,
        FoundGroups: 1,
        StorageGroups: [{GroupId: DATA_ISSUES_GROUP_ID, PoolName: 'pool-ssd'}],
        ...extra,
    };
}

export function createNodesResponse(extra: Partial<TNodesInfo> = {}): Partial<TNodesInfo> {
    return {
        TotalNodes: '2',
        FoundNodes: '2',
        Nodes: [
            {NodeId: 1, SystemState: {Host: 'storage-node-1', SystemState: 'Green'}},
            {NodeId: 2, SystemState: {Host: 'storage-node-2'}},
        ] as TNodesInfo['Nodes'],
        ...extra,
    };
}

/** Mocks everything the Storage and Nodes pages request, so the specs do not depend on cluster data */
export async function setupDataIssuesMocks(
    page: Page,
    {groups = () => createGroupsResponse(), nodes = () => createNodesResponse()}: DataIssuesMocks,
) {
    const requests: URL[] = [];

    await page.addInitScript(() => {
        localStorage.setItem(
            'storageGroupsSelectedColumns',
            JSON.stringify([
                {id: 'GroupId', selected: true},
                {id: 'PoolName', selected: true},
            ]),
        );
        for (const key of ['nodesTableSelectedColumns', 'storageNodesSelectedColumns']) {
            localStorage.setItem(key, JSON.stringify(['NodeId', 'Host']));
        }
    });

    await page.route('**/storage/groups?*', async (route) => {
        const url = new URL(route.request().url());
        requests.push(url);
        await route.fulfill({json: groups(url)});
    });

    await page.route('**/viewer/**', async (route) => {
        const url = new URL(route.request().url());
        let json: unknown = {};
        if (url.pathname.endsWith('/whoami')) {
            json = {UserSID: 'data-issues-test', IsMonitoringAllowed: true, IsViewerAllowed: true};
        } else if (url.pathname.endsWith('/capabilities')) {
            json = {Capabilities: {'/viewer/nodes': 20, '/storage/groups': 10}};
        } else if (url.pathname.endsWith('/nodelist')) {
            json = [
                {Id: 1, Host: 'storage-node-1'},
                {Id: 2, Host: 'storage-node-2'},
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
            json = nodes(url);
        }
        await route.fulfill({json});
    });

    return requests;
}
