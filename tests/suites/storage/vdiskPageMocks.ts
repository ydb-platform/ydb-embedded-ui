import type {Page} from '@playwright/test';

export const VDISK_ID = '2181038080-1-0-0-0';
export const SIBLING_VDISK_ID = '2181038080-1-0-0-1';
export const ANOTHER_PDISK_VDISK_ID = '2181038080-1-0-0-2';
export const DONOR_VDISK_ID = '2181038080-1-0-1-0';
export const SECOND_DONOR_VDISK_ID = '2181038080-1-0-1-1';
export const NODE_ID = '42';
export const PDISK_ID = '1000';
export const SECOND_PDISK_ID = '1001';
export const GROUP_ID = '2181038080';
export const DATABASE = '/local';
export const VDISK_PAGE_PATH = `/vDisk?database=${DATABASE}&nodeId=${NODE_ID}&vDiskId=${VDISK_ID}&activeTab=storage&type=groups`;
export const STORAGE_POOL_NAME = 'dynamic_storage_pool:1';
export const LONG_DATACENTER = 'KALUGA Central DC 12 City Region DC 2026';
export const LONG_RACK = 'Rack-A-12-2026A-12-2026';
export const LONG_HOST = 'storage-node-1273683y-1273683y-1273683y.ydb';
export const LONG_PDISK_ID = '1000-1012';

export interface SetupVDiskPageMocksOptions {
    capacityVersions?: {storageGroups: number; viewerNodes: number};
    withCapacityMetrics?: boolean;
    datacenter?: string;
    rack?: string;
    host?: string;
    pDiskId?: string;
    isViewerAllowed?: boolean;
    withDonors?: boolean;
    allocatedSize?: string;
    availableSize?: string;
    whiteboardAllocatedSize?: string;
    whiteboardAvailableSize?: string;
    whiteboardSlotSize?: string;
    pDiskBscAvailableSize?: string;
    pDiskBscTotalSize?: string;
    pDiskWhiteboardAvailableSize?: string;
    pDiskWhiteboardTotalSize?: string;
}

const vDiskCapacityFields = {
    GroupSizeInUnits: 2,
    VDiskSlotUsage: 82.25,
    VDiskRawUsage: 64.5,
    CapacityAlert: 'LIGHT_YELLOW',
};

const pDiskCapacityFields = {
    SlotSizeInUnits: 4,
    PDiskUsage: 70.5,
    PDiskCapacityAlert: 'ORANGE',
};

function createVDiskWhiteboardData(
    withCapacityMetrics = false,
    {
        whiteboardAllocatedSize = '10000000000',
        whiteboardAvailableSize = '186000000000',
    }: Pick<SetupVDiskPageMocksOptions, 'whiteboardAllocatedSize' | 'whiteboardAvailableSize'> = {},
) {
    return {
        VDiskId: {
            GroupID: Number(GROUP_ID),
            GroupGeneration: 1,
            Ring: 0,
            Domain: 0,
            VDisk: 0,
        },
        NodeId: Number(NODE_ID),
        PDiskId: Number(PDISK_ID),
        VDiskSlotId: 1001,
        AllocatedSize: whiteboardAllocatedSize,
        AvailableSize: whiteboardAvailableSize,
        StoragePoolName: STORAGE_POOL_NAME,
        DiskSpace: 'Green',
        FrontQueues: 'Green',
        ...(withCapacityMetrics ? vDiskCapacityFields : {}),
    };
}

function createPDiskWhiteboardData(
    withCapacityMetrics = false,
    {
        whiteboardSlotSize = '20000000000',
        pDiskWhiteboardAvailableSize = '180000000000',
        pDiskWhiteboardTotalSize = '200000000000',
    }: Pick<
        SetupVDiskPageMocksOptions,
        'whiteboardSlotSize' | 'pDiskWhiteboardAvailableSize' | 'pDiskWhiteboardTotalSize'
    > = {},
) {
    return {
        PDiskId: Number(PDISK_ID),
        NodeId: Number(NODE_ID),
        Path: '/dev/pdisk0',
        Guid: '123456789',
        Category: '1',
        AvailableSize: pDiskWhiteboardAvailableSize,
        TotalSize: pDiskWhiteboardTotalSize,
        State: 'Normal',
        Device: 'Green',
        Realtime: 'Green',
        SystemSize: '1000000000',
        LogUsedSize: '1000000000',
        LogTotalSize: '5000000000',
        EnforcedDynamicSlotSize: whiteboardSlotSize,
        ExpectedSlotCount: 4,
        NumActiveSlots: 2,
        ...(withCapacityMetrics ? pDiskCapacityFields : {}),
    };
}

function createStorageGroupsResponse({
    allocatedSize = '10000000000',
    availableSize = '186000000000',
    pDiskId = PDISK_ID,
    withDonors,
    withCapacityMetrics,
    whiteboardAllocatedSize,
    whiteboardAvailableSize,
    whiteboardSlotSize,
    pDiskBscAvailableSize,
    pDiskBscTotalSize,
    pDiskWhiteboardAvailableSize,
    pDiskWhiteboardTotalSize,
}: Pick<
    SetupVDiskPageMocksOptions,
    | 'allocatedSize'
    | 'availableSize'
    | 'pDiskId'
    | 'withDonors'
    | 'withCapacityMetrics'
    | 'whiteboardAllocatedSize'
    | 'whiteboardAvailableSize'
    | 'whiteboardSlotSize'
    | 'pDiskBscAvailableSize'
    | 'pDiskBscTotalSize'
    | 'pDiskWhiteboardAvailableSize'
    | 'pDiskWhiteboardTotalSize'
> = {}) {
    return {
        StorageGroups: [
            {
                GroupId: GROUP_ID,
                PoolName: STORAGE_POOL_NAME,
                MediaType: 'SSD',
                ErasureSpecies: 'mirror-3-dc',
                Used: '10000000000',
                Limit: '196000000000',
                Available: '186000000000',
                Usage: 5.1,
                State: 'ok',
                GroupGeneration: '1',
                Encryption: false,
                AllocationUnits: '1',
                ...(withCapacityMetrics
                    ? {
                          GroupSizeInUnits: vDiskCapacityFields.GroupSizeInUnits,
                          MaxPDiskUsage: pDiskCapacityFields.PDiskUsage,
                          MaxVDiskSlotUsage: vDiskCapacityFields.VDiskSlotUsage,
                          MaxVDiskRawUsage: vDiskCapacityFields.VDiskRawUsage,
                          CapacityAlert: vDiskCapacityFields.CapacityAlert,
                      }
                    : {}),
                VDisks: [
                    {
                        VDiskId: VDISK_ID,
                        NodeId: Number(NODE_ID),
                        VDiskSlotId: 1001,
                        AllocatedSize: allocatedSize,
                        AvailableSize: availableSize,
                        StoragePoolName: STORAGE_POOL_NAME,
                        DiskSpace: 'Green',
                        FrontQueues: 'Green',
                        ...(withCapacityMetrics
                            ? {
                                  Whiteboard: createVDiskWhiteboardData(true, {
                                      whiteboardAllocatedSize,
                                      whiteboardAvailableSize,
                                  }),
                              }
                            : {}),
                        ...(withDonors ? {VDiskState: 'OK', Replicated: false} : {}),
                        SatisfactionRank: {
                            FreshRank: {
                                Flag: 'Green',
                            },
                            LevelRank: {
                                Flag: 'Green',
                            },
                        },
                        PDisk: {
                            PDiskId: `${NODE_ID}-${pDiskId}`,
                            Type: 'ROT',
                            ...(pDiskBscAvailableSize === undefined
                                ? {}
                                : {AvailableSize: pDiskBscAvailableSize}),
                            ...(pDiskBscTotalSize === undefined
                                ? {}
                                : {TotalSize: pDiskBscTotalSize}),
                            ...(withCapacityMetrics
                                ? {
                                      Whiteboard: createPDiskWhiteboardData(true, {
                                          whiteboardSlotSize,
                                          pDiskWhiteboardAvailableSize,
                                          pDiskWhiteboardTotalSize,
                                      }),
                                  }
                                : {}),
                        },
                        Donors: withDonors
                            ? [
                                  {
                                      VDiskId: DONOR_VDISK_ID,
                                      NodeId: Number(NODE_ID),
                                      VDiskSlotId: 1011,
                                      AllocatedSize: '1000000000',
                                      AvailableSize: '195000000000',
                                      StoragePoolName: STORAGE_POOL_NAME,
                                      DiskSpace: 'Green',
                                      FrontQueues: 'Green',
                                      VDiskState: 'OK',
                                      Replicated: false,
                                  },
                                  {
                                      VDiskId: SECOND_DONOR_VDISK_ID,
                                      NodeId: Number(NODE_ID),
                                      VDiskSlotId: 1012,
                                      AllocatedSize: '2000000000',
                                      AvailableSize: '194000000000',
                                      StoragePoolName: STORAGE_POOL_NAME,
                                      DiskSpace: 'Green',
                                      FrontQueues: 'Green',
                                      VDiskState: 'OK',
                                      Replicated: false,
                                  },
                              ]
                            : undefined,
                    },
                    {
                        VDiskId: SIBLING_VDISK_ID,
                        NodeId: Number(NODE_ID),
                        VDiskSlotId: 1002,
                        AllocatedSize: '9000000000',
                        AvailableSize: '187000000000',
                        StoragePoolName: STORAGE_POOL_NAME,
                        DiskSpace: 'Green',
                        FrontQueues: 'Green',
                        SatisfactionRank: {
                            FreshRank: {
                                Flag: 'Green',
                            },
                            LevelRank: {
                                Flag: 'Green',
                            },
                        },
                        PDisk: {
                            PDiskId: `${NODE_ID}-${pDiskId}`,
                            Type: 'ROT',
                        },
                    },
                    {
                        VDiskId: ANOTHER_PDISK_VDISK_ID,
                        NodeId: Number(NODE_ID),
                        VDiskSlotId: 1003,
                        AllocatedSize: '8000000000',
                        AvailableSize: '188000000000',
                        StoragePoolName: STORAGE_POOL_NAME,
                        DiskSpace: 'Green',
                        FrontQueues: 'Green',
                        SatisfactionRank: {
                            FreshRank: {
                                Flag: 'Green',
                            },
                            LevelRank: {
                                Flag: 'Green',
                            },
                        },
                        PDisk: {
                            PDiskId: `${NODE_ID}-${SECOND_PDISK_ID}`,
                            Type: 'ROT',
                        },
                    },
                ],
            },
        ],
    };
}

async function setupMonitoringUserMock(page: Page, isViewerAllowed = true) {
    await page.route('**/viewer/json/whoami*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                UserID: 'e2e-storage-popup-user',
                IsMonitoringAllowed: true,
                IsViewerAllowed: isViewerAllowed,
            }),
        });
    });
}

async function setupCapabilitiesMock(
    page: Page,
    {capacityVersions}: Pick<SetupVDiskPageMocksOptions, 'capacityVersions'> = {},
) {
    const versions = capacityVersions ?? {storageGroups: 10, viewerNodes: 20};

    await page.route('**/viewer/capabilities*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Database: DATABASE,
                Capabilities: {
                    '/storage/groups': versions.storageGroups,
                    '/viewer/nodes': versions.viewerNodes,
                    '/pdisk/info': 10,
                    '/vdisk/blobindexstat': 2,
                },
            }),
        });
    });
}

export async function setupVDiskBlobIndexStatMock(
    page: Page,
    onRequest?: (requestUrl: string) => void,
) {
    await page.route('**/vdisk/blobindexstat*', async (route) => {
        onRequest?.(route.request().url());

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                status: 'ok',
                stat: {
                    tablets: [],
                    channels: [],
                },
            }),
        });
    });
}

async function setupNodeInfoMock(
    page: Page,
    {
        datacenter = 'KLG',
        rack = 'Rack-A-12',
        host = 'storage-node-07.ydb',
    }: Omit<SetupVDiskPageMocksOptions, 'pDiskId'> = {},
) {
    await page.route('**/viewer/json/sysinfo?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                SystemStateInfo: [
                    {
                        NodeId: Number(NODE_ID),
                        Host: host,
                        Roles: ['Storage'],
                        Location: {
                            Rack: rack,
                            DataCenter: datacenter,
                        },
                    },
                ],
            }),
        });
    });
}

async function setupStorageGroupsMock(
    page: Page,
    {
        allocatedSize,
        availableSize,
        pDiskId = PDISK_ID,
        withDonors,
        withCapacityMetrics,
        whiteboardAllocatedSize,
        whiteboardAvailableSize,
        whiteboardSlotSize,
        pDiskBscAvailableSize,
        pDiskBscTotalSize,
        pDiskWhiteboardAvailableSize,
        pDiskWhiteboardTotalSize,
    }: Pick<
        SetupVDiskPageMocksOptions,
        | 'allocatedSize'
        | 'availableSize'
        | 'pDiskId'
        | 'withDonors'
        | 'withCapacityMetrics'
        | 'whiteboardAllocatedSize'
        | 'whiteboardAvailableSize'
        | 'whiteboardSlotSize'
        | 'pDiskBscAvailableSize'
        | 'pDiskBscTotalSize'
        | 'pDiskWhiteboardAvailableSize'
        | 'pDiskWhiteboardTotalSize'
    > = {},
) {
    await page.route('**/storage/groups?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
                createStorageGroupsResponse({
                    allocatedSize,
                    availableSize,
                    pDiskId,
                    withDonors,
                    withCapacityMetrics,
                    whiteboardAllocatedSize,
                    whiteboardAvailableSize,
                    whiteboardSlotSize,
                    pDiskBscAvailableSize,
                    pDiskBscTotalSize,
                    pDiskWhiteboardAvailableSize,
                    pDiskWhiteboardTotalSize,
                }),
            ),
        });
    });
}

async function setupStorageNodesMock(
    page: Page,
    {
        withCapacityMetrics = false,
        whiteboardAllocatedSize,
        whiteboardAvailableSize,
        whiteboardSlotSize,
        pDiskWhiteboardAvailableSize,
        pDiskWhiteboardTotalSize,
    }: Pick<
        SetupVDiskPageMocksOptions,
        | 'withCapacityMetrics'
        | 'whiteboardAllocatedSize'
        | 'whiteboardAvailableSize'
        | 'whiteboardSlotSize'
        | 'pDiskWhiteboardAvailableSize'
        | 'pDiskWhiteboardTotalSize'
    > = {},
) {
    await page.route('**/viewer/json/nodes?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                TotalNodes: '1',
                FoundNodes: '1',
                Nodes: [
                    {
                        NodeId: Number(NODE_ID),
                        SystemState: {
                            NodeId: Number(NODE_ID),
                            Host: 'storage-node-07.ydb',
                            Roles: ['Storage'],
                        },
                        PDisks: [
                            createPDiskWhiteboardData(withCapacityMetrics, {
                                whiteboardSlotSize,
                                pDiskWhiteboardAvailableSize,
                                pDiskWhiteboardTotalSize,
                            }),
                        ],
                        VDisks: [
                            createVDiskWhiteboardData(withCapacityMetrics, {
                                whiteboardAllocatedSize,
                                whiteboardAvailableSize,
                            }),
                        ],
                        ...(withCapacityMetrics
                            ? {
                                  MaxPDiskUsage: pDiskCapacityFields.PDiskUsage,
                                  MaxVDiskSlotUsage: vDiskCapacityFields.VDiskSlotUsage,
                                  MaxVDiskRawUsage: vDiskCapacityFields.VDiskRawUsage,
                                  CapacityAlert: vDiskCapacityFields.CapacityAlert,
                              }
                            : {}),
                    },
                ],
            }),
        });
    });
}

export async function setupPDiskInfoMock(
    page: Page,
    {
        withCapacityMetrics = false,
        whiteboardAllocatedSize,
        whiteboardAvailableSize,
        whiteboardSlotSize = '20000000000',
        pDiskBscAvailableSize = '180000000000',
        pDiskBscTotalSize = '200000000000',
        pDiskWhiteboardAvailableSize,
        pDiskWhiteboardTotalSize,
    }: Pick<
        SetupVDiskPageMocksOptions,
        | 'withCapacityMetrics'
        | 'whiteboardAllocatedSize'
        | 'whiteboardAvailableSize'
        | 'whiteboardSlotSize'
        | 'pDiskBscAvailableSize'
        | 'pDiskBscTotalSize'
        | 'pDiskWhiteboardAvailableSize'
        | 'pDiskWhiteboardTotalSize'
    > = {},
) {
    await page.route('**/pdisk/info*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Whiteboard: {
                    PDisk: createPDiskWhiteboardData(withCapacityMetrics, {
                        whiteboardSlotSize,
                        pDiskWhiteboardAvailableSize,
                        pDiskWhiteboardTotalSize,
                    }),
                    VDisks: [
                        createVDiskWhiteboardData(withCapacityMetrics, {
                            whiteboardAllocatedSize,
                            whiteboardAvailableSize,
                        }),
                    ],
                },
                BSC: {
                    PDisk: {
                        Type: 'ROT',
                        Path: '/dev/pdisk0',
                        Guid: '123456789',
                        AvailableSize: pDiskBscAvailableSize,
                        TotalSize: pDiskBscTotalSize,
                        StatusV2: 'ACTIVE',
                        EnforcedDynamicSlotSize: whiteboardSlotSize,
                        ExpectedSlotCount: 4,
                        NumActiveSlots: 2,
                    },
                },
            }),
        });
    });
}

export async function setupVDiskPageMocks(page: Page, options: SetupVDiskPageMocksOptions = {}) {
    await setupMonitoringUserMock(page, options.isViewerAllowed);
    await setupCapabilitiesMock(page, options);
    await setupNodeInfoMock(page, options);
    await setupStorageGroupsMock(page, options);
    await setupStorageNodesMock(page, options);
}
