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
    datacenter?: string;
    rack?: string;
    host?: string;
    pDiskId?: string;
    isViewerAllowed?: boolean;
    withDonors?: boolean;
    allocatedSize?: string;
    availableSize?: string;
}

function createStorageGroupsResponse({
    allocatedSize = '10000000000',
    availableSize = '186000000000',
    pDiskId = PDISK_ID,
    withDonors,
}: Pick<
    SetupVDiskPageMocksOptions,
    'allocatedSize' | 'availableSize' | 'pDiskId' | 'withDonors'
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
                State: 'ok',
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

async function setupCapabilitiesMock(page: Page) {
    await page.route('**/viewer/capabilities*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Database: DATABASE,
                Capabilities: {
                    '/storage/groups': 10,
                    '/viewer/nodes': 20,
                    '/pdisk/info': 10,
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
    }: Pick<
        SetupVDiskPageMocksOptions,
        'allocatedSize' | 'availableSize' | 'pDiskId' | 'withDonors'
    > = {},
) {
    await page.route('**/storage/groups?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
                createStorageGroupsResponse({allocatedSize, availableSize, pDiskId, withDonors}),
            ),
        });
    });
}

export async function setupPDiskInfoMock(page: Page) {
    await page.route('**/pdisk/info*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Whiteboard: {
                    PDisk: {
                        PDiskId: Number(PDISK_ID),
                        NodeId: Number(NODE_ID),
                        Path: '/dev/pdisk0',
                        Guid: '123456789',
                        Category: '1',
                        AvailableSize: '180000000000',
                        TotalSize: '200000000000',
                        State: 'Normal',
                        Device: 'Green',
                        Realtime: 'Green',
                        SystemSize: '1000000000',
                        LogUsedSize: '1000000000',
                        LogTotalSize: '5000000000',
                        EnforcedDynamicSlotSize: '20000000000',
                        ExpectedSlotCount: 4,
                        NumActiveSlots: 2,
                    },
                    VDisks: [
                        {
                            VDiskId: {
                                GroupID: Number(GROUP_ID),
                                GroupGeneration: 1,
                                Ring: 0,
                                Domain: 0,
                                VDisk: 0,
                            },
                            NodeId: Number(NODE_ID),
                            PDiskId: Number(PDISK_ID),
                            AllocatedSize: '10000000000',
                            AvailableSize: '10000000000',
                            DiskSpace: 'Green',
                            FrontQueues: 'Green',
                            StoragePoolName: STORAGE_POOL_NAME,
                        },
                    ],
                },
                BSC: {
                    PDisk: {
                        Type: 'ROT',
                        Path: '/dev/pdisk0',
                        Guid: '123456789',
                        AvailableSize: '180000000000',
                        TotalSize: '200000000000',
                        StatusV2: 'ACTIVE',
                        EnforcedDynamicSlotSize: '20000000000',
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
    await setupCapabilitiesMock(page);
    await setupNodeInfoMock(page, options);
    await setupStorageGroupsMock(page, options);
}
