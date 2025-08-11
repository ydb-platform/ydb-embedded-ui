import type {Page, Route} from '@playwright/test';

export const mockCapabilities = (page: Page, enabled: boolean) => {
    return page.route(`**/viewer/capabilities`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Database: '/local',
                Settings: {Cluster: {BridgeModeEnabled: enabled}},
                Capabilities: {},
            }),
        });
    });
};

export const mockNodesWithPile = (page: Page) => {
    return page.route(`**/viewer/json/nodes?*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                FoundNodes: 1,
                TotalNodes: 1,
                Nodes: [
                    {
                        NodeId: 1,
                        SystemState: {
                            Host: 'localhost',
                            Version: 'test-version',
                            LoadAverage: [0.1, 0.1, 0.1],
                            NumberOfCpus: 8,
                            StartTime: '1',
                        },
                        PileName: 'r1',
                    },
                ],
            }),
        });
    });
};

export const mockStorageGroupsWithPile = (page: Page) => {
    return page.route(`**/storage/groups?*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                FoundGroups: 1,
                TotalGroups: 1,
                StorageGroups: [{GroupId: '1', PoolName: 'p', MediaType: 'NVME', PileName: 'r1'}],
            }),
        });
    });
};
