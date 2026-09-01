import type {Page, Route} from '@playwright/test';

import {BridgePileGroupStatus, BridgePileState} from '../../../src/types/api/cluster';
import {SelfCheckResult, StatusFlag} from '../../../src/types/api/healthcheck';

import {bridgeVisualCluster, bridgeVisualHealthcheck} from './fixtures/bridgeVisualScenario';

export const mockCapabilities = (page: Page, enabled: boolean) => {
    return page.route(`**/viewer/capabilities`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Database: '/local',
                Settings: {Cluster: {BridgeModeEnabled: enabled}},
                Capabilities: {
                    '/viewer/cluster': 5, // > 4 to enable cluster dashboard
                },
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

export const mockBridgeHealthcheck = (page: Page, currentPileName: string | null = 'r2') => {
    return page.route(`**/viewer/json/healthcheck?*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                self_check_result: SelfCheckResult.MAINTENANCE_REQUIRED,
                location: {
                    id: 2,
                    host: 'current-pile-node',
                    pile: currentPileName === null ? {} : {name: currentPileName},
                },
                issue_log: [
                    {
                        id: 'failing-pile-root',
                        status: StatusFlag.ORANGE,
                        message: 'Pile requires maintenance',
                        type: 'STORAGE',
                        level: 1,
                        reason: ['failing-pile-leaf'],
                        location: {
                            storage: {
                                pool: {
                                    group: {
                                        pile: {name: 'all-group-statuses-pile'},
                                    },
                                },
                            },
                        },
                    },
                    {
                        id: 'failing-pile-leaf',
                        status: StatusFlag.RED,
                        message: 'Unscoped VDisk failure',
                        type: 'VDISK',
                        level: 2,
                    },
                ],
            }),
        });
    });
};

export const mockBridgeHealthcheckWithoutPileSupport = (page: Page) => {
    return page.route(`**/viewer/json/healthcheck?*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                self_check_result: SelfCheckResult.EMERGENCY,
                location: {
                    id: 2,
                    host: 'legacy-healthcheck-node',
                },
                issue_log: [
                    {
                        id: 'unscoped-red-issue',
                        status: StatusFlag.RED,
                        message: 'Healthcheck cannot attribute this issue to a pile',
                        type: 'STORAGE',
                        level: 1,
                    },
                    {
                        id: 'scoped-orange-issue',
                        status: StatusFlag.ORANGE,
                        message: 'Pile requires maintenance',
                        type: 'STORAGE',
                        level: 1,
                        location: {
                            storage: {
                                pool: {
                                    group: {
                                        pile: {name: 'all-group-statuses-pile'},
                                    },
                                },
                            },
                        },
                    },
                ],
            }),
        });
    });
};

export const mockBridgeHealthcheckUnavailable = (page: Page) => {
    return page.route(`**/viewer/json/healthcheck?*`, async (route: Route) => {
        await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({error: 'Healthcheck is not available'}),
        });
    });
};

const mockBridgeVisualCluster = (page: Page) => {
    return page.route(`**/viewer/json/cluster?*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(bridgeVisualCluster),
        });
    });
};

export const mockBridgeVisualScenario = async (page: Page) => {
    await mockBridgeVisualCluster(page);
    await page.route(`**/viewer/json/healthcheck?*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(bridgeVisualHealthcheck),
        });
    });
};

export const mockBridgeVisualLoadingScenario = async (page: Page) => {
    let releaseHealthcheck = () => {};
    const healthcheckGate = new Promise<void>((resolve) => {
        releaseHealthcheck = resolve;
    });

    await mockBridgeVisualCluster(page);
    await page.route(`**/viewer/json/healthcheck?*`, async (route: Route) => {
        await healthcheckGate;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(bridgeVisualHealthcheck),
        });
    });

    return releaseHealthcheck;
};

export const mockClusterWithBridgePiles = (page: Page) => {
    return page.route(`**/viewer/json/cluster?*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Version: 6,
                Domain: '/dev02',
                Overall: 'Green',
                NodesTotal: 28,
                NodesAlive: 28,
                NumberOfCpus: 1152,
                CoresTotal: 949,
                CoresUsed: 1.9579652512078709,
                LoadAverage: 10.42,
                PoolStats: [
                    {
                        Name: 'System',
                        Usage: 0.0031261495677549389,
                        Threads: 244,
                    },
                    {
                        Name: 'User',
                        Usage: 0.0013519195624372728,
                        Threads: 433,
                    },
                ],
                MemoryTotal: '2651615580160',
                MemoryUsed: '64894066688',
                StorageTotal: '102385812766720',
                StorageUsed: '12139909611520',
                MapStorageTotal: {
                    SSD: '102385812766720',
                },
                MapStorageUsed: {
                    SSD: '12139909611520',
                },
                DataCenters: ['FAKE', 'KLG', 'VLA'],
                MapDataCenters: {
                    FAKE: 8,
                    KLG: 1,
                    VLA: 19,
                },
                Versions: ['improve-ssl-errors-handling.d28b5d8'],
                MapVersions: {
                    'improve-ssl-errors-handling.d28b5d8': 28,
                },
                MapNodeStates: {
                    Green: 28,
                },
                MapNodeRoles: {
                    StateStorage: 8,
                    Bootstrapper: 8,
                    SchemeBoard: 8,
                    StateStorageBoard: 8,
                    Tenant: 20,
                    Storage: 8,
                },
                StorageStats: [
                    {
                        PDiskFilter: 'Type:SSD',
                        ErasureSpecies: 'block-4-2',
                        CurrentGroupsCreated: 16,
                        CurrentAllocatedSize: '9030951676583',
                        CurrentAvailableSize: '9845932905808',
                        AvailableGroupsToCreate: 47,
                        AvailableSizeToCreate: '49682593436982',
                    },
                ],
                Hosts: '9',
                Tenants: '9',
                NetworkUtilization: 0.00087389813662801838,
                NetworkWriteThroughput: '1445752',
                BridgeInfo: {
                    Piles: [
                        {
                            PileId: 1,
                            Name: 'r1',
                            State: BridgePileState.PRIMARY,
                            Nodes: 16,
                            GroupStatuses: {
                                [BridgePileGroupStatus.FULL]: 24,
                                [BridgePileGroupStatus.DEGRADED]: 2,
                            },
                        },
                        {
                            PileId: 2,
                            Name: 'r2',
                            State: BridgePileState.SYNCHRONIZED,
                            Nodes: 12,
                            GroupStatuses: {
                                [BridgePileGroupStatus.FULL]: 36,
                            },
                        },
                        {
                            PileId: 3,
                            Name: 'all-group-statuses-pile',
                            State: BridgePileState.NOT_SYNCHRONIZED,
                            Nodes: 19,
                            GroupStatuses: {
                                [BridgePileGroupStatus.UNKNOWN]: 1,
                                [BridgePileGroupStatus.DISINTEGRATED]: 1,
                                [BridgePileGroupStatus.DEGRADED]: 1,
                                [BridgePileGroupStatus.PARTIAL]: 12,
                                [BridgePileGroupStatus.FULL]: 4,
                            },
                        },
                    ],
                },
            }),
        });
    });
};
